import { gradientAt, luminance, parseColor } from '../shared/color';
import {
  matrixGridCells,
  matrixHeader,
  matrixIndexAt,
  matrixIsGrid,
  matrixMedia,
  matrixOffsets,
  matrixPlace,
  matrixResolve,
  matrixSizes,
  type MatrixHeaderModel,
  type MatrixHeaderNode,
} from './layout';
import type {
  MatrixCell,
  MatrixCellInfo,
  MatrixCellStyle,
  MatrixCoordPart,
  MatrixDimension,
  MatrixDrawApi,
  MatrixEvent,
  MatrixLabel,
  MatrixMountCell,
  MatrixOptions,
  MatrixRect,
  MatrixRenderCell,
  MatrixTheme,
  MatrixVisualMap,
  MatrixVisualPiece,
} from './types';

const FONT = '-apple-system, BlinkMacSystemFont, "Trebuchet MS", Roboto, Ubuntu, sans-serif';

export const matrixDarkTheme: MatrixTheme = {
  background: '#131722',
  text: '#d1d4dc',
  muted: '#787b86',
  border: '#2a2e39',
  cellBg: 'transparent',
  headerBg: '#1a1e2b',
  headerText: '#b2b5be',
  cornerBg: '#1a1e2b',
  hover: 'rgba(255, 255, 255, 0.07)',
  select: '#2962ff',
  tooltipBg: '#1e222d',
  tooltipText: '#d1d4dc',
  tooltipBorder: '#2a2e39',
  font: FONT,
};

export const matrixLightTheme: MatrixTheme = {
  background: '#ffffff',
  text: '#131722',
  muted: '#787b86',
  border: '#e0e3eb',
  cellBg: 'transparent',
  headerBg: '#f4f5f8',
  headerText: '#434651',
  cornerBg: '#f4f5f8',
  hover: 'rgba(19, 23, 34, 0.06)',
  select: '#2962ff',
  tooltipBg: '#ffffff',
  tooltipText: '#131722',
  tooltipBorder: '#e0e3eb',
  font: FONT,
};

/** Palette for categories (visualMap pieces, legends). */
export const MATRIX_COLORS = ['#2962ff', '#00bcd4', '#089981', '#8bc34a', '#ffc107', '#ff9800', '#f23645', '#e91e63', '#9c27b0', '#607d8b'];

/** Default continuous visualMap: blue (low) → pale → red (high). */
export const MATRIX_VISUAL_COLORS = ['#1848cc', '#5b8def', '#c9d6f0', '#f3c3bd', '#ef5350', '#b71c1c'];

const esc = (s: string): string => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const clamp = (v: number, a: number, b: number): number => Math.min(b, Math.max(a, v));
const easeOut = (t: number): number => 1 - Math.pow(1 - t, 3);
const none = (c: string | undefined): boolean => !c || c === 'transparent' || c === 'none';

/** Something drawn: a body cell, a header cell or the corner. */
interface Item {
  info: MatrixCellInfo;
  style: Required<Pick<MatrixCellStyle, 'borderWidth' | 'radius' | 'opacity'>> & { color: string; borderColor: string };
  label: MatrixLabel & { show: boolean };
  defaultTextColor: string;
  render?: MatrixRenderCell;
  mount?: MatrixMountCell | null;
  silent: boolean;
  /** Entry animation delay, ms */
  delay: number;
  /** visualMap piece index (-1 none) */
  piece: number;
  /** Header node (headers only) */
  node?: MatrixHeaderNode;
  /** Leaf ranges */
  x0: number;
  x1: number;
  y0: number;
  y1: number;
  /** Not drawn (MatrixCell.hidden) */
  hidden?: boolean;
  /** An empty leaf drawn as a blank cell */
  blank?: boolean;
  /** Background set on the cell itself (the visualMap does not repaint it) */
  explicitColor?: boolean;
}

interface Host {
  el: HTMLElement;
  cleanup: (() => void) | void;
  mount: MatrixMountCell;
  value: unknown;
  data: unknown;
  item: Item;
}

/**
 * Matrix: a table-grid with multi-level headers on both sides whose cells hold values, colors, custom canvas
 * drawings or whole embedded charts. Merged cells, visualMap, cross highlight, selection, responsive `media`
 * rules (a dashboard layout that re-flows) and an overlay drawn over the cells.
 */
export class MatrixChart {
  readonly root: HTMLElement;
  readonly canvas: HTMLCanvasElement;
  private overlay: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private octx: CanvasRenderingContext2D;
  private titleEl: HTMLElement;
  private bodyEl: HTMLElement;
  private plotEl: HTMLElement;
  private hostsEl: HTMLElement;
  private tooltipEl: HTMLElement;
  private visualEl: HTMLElement;
  private base: MatrixOptions;
  private opts: MatrixOptions = {};
  private mediaKey = '';
  private theme!: MatrixTheme;
  private xh!: MatrixHeaderModel;
  private yh!: MatrixHeaderModel;
  private cols = { offsets: [0], sizes: [] as number[] };
  private rows = { offsets: [0], sizes: [] as number[] };
  /** x header level tops / heights and y header level lefts / widths */
  private xLevels = { offsets: [0], sizes: [] as number[] };
  private yLevels = { offsets: [0], sizes: [] as number[] };
  private bodyRect: MatrixRect = { x: 0, y: 0, w: 0, h: 0 };
  private bodyItems: Item[] = [];
  private headerItems: Item[] = [];
  private cornerItem: Item | null = null;
  private grid: Int32Array = new Int32Array(0);
  private nx = 0;
  private ny = 0;
  private vm: { map: MatrixVisualMap; min: number; max: number; pieces: MatrixVisualPiece[] | null } | null = null;
  private hiddenPieces = new Set<number>();
  private hover: Item | null = null;
  private selected = new Set<string>();
  private hosts = new Map<string, Host>();
  private textColors = new Map<string, string>();
  private width = 0;
  private height = 0;
  private dpr = 1;
  private animStart = 0;
  private progress = 1;
  private raf = 0;
  private reflowTimer = 0;
  private handlers = new Map<MatrixEvent, Set<(v: unknown) => void>>();
  private ro: ResizeObserver;
  private destroyed = false;

  constructor(container: HTMLElement, options: MatrixOptions = {}) {
    this.base = { ...options };
    this.root = container;
    container.classList.add('mx-root');
    this.titleEl = document.createElement('div');
    this.titleEl.className = 'mx-title';
    this.bodyEl = document.createElement('div');
    this.plotEl = document.createElement('div');
    this.plotEl.className = 'mx-plot';
    this.canvas = document.createElement('canvas');
    this.canvas.className = 'mx-canvas';
    this.canvas.setAttribute('role', 'img');
    this.overlay = document.createElement('canvas');
    this.overlay.className = 'mx-canvas mx-overlay';
    this.ctx = this.canvas.getContext('2d')!;
    this.octx = this.overlay.getContext('2d')!;
    this.hostsEl = document.createElement('div');
    this.hostsEl.className = 'mx-hosts';
    this.tooltipEl = document.createElement('div');
    this.tooltipEl.className = 'mx-tooltip';
    this.visualEl = document.createElement('div');
    this.visualEl.className = 'mx-visual';
    this.plotEl.append(this.canvas, this.overlay, this.hostsEl, this.tooltipEl);
    this.bodyEl.append(this.plotEl, this.visualEl);
    container.append(this.titleEl, this.bodyEl);
    this.bind();
    this.ro = new ResizeObserver(() => this.resize());
    this.ro.observe(this.plotEl);
    this.measure();
    this.mediaKey = this.activeMedia();
    this.rebuild(true);
  }

  // ------------------------------------------------------------------ public API

  /** Replace the body cells (a list of cells or values by row). */
  setData(data: MatrixCell[] | unknown[][], animate = true): void {
    this.base = { ...this.base, data };
    this.rebuild(animate);
  }

  /** Change options after creation (merged over the current ones). */
  setOptions(patch: MatrixOptions, animate = true): void {
    this.base = { ...this.base, ...patch };
    this.rebuild(animate);
  }

  /** The options in effect (after the `media` rules). */
  getOptions(): MatrixOptions {
    return this.opts;
  }

  /** A body cell by coord (names or leaf indices), or null. */
  getCell(x: MatrixCoordPart, y: MatrixCoordPart): MatrixCellInfo | null {
    const xr = matrixResolve(x, this.xh);
    const yr = matrixResolve(y, this.yh);
    if (!xr || !yr) return null;
    const k = this.grid[yr[0] * this.nx + xr[0]];
    return k >= 0 ? this.bodyItems[k].info : null;
  }

  /** Rect (px, inside the plot) of a body cell / range by coord, or null. */
  cellRect(x: MatrixCoordPart, y: MatrixCoordPart): MatrixRect | null {
    const xr = matrixResolve(x, this.xh);
    const yr = matrixResolve(y, this.yh);
    if (!xr || !yr) return null;
    return this.rangeRect(xr[0], xr[1], yr[0], yr[1]);
  }

  /** Every body cell. */
  getCells(): MatrixCellInfo[] {
    return this.bodyItems.map((i) => i.info);
  }

  getSelection(): MatrixCellInfo[] {
    return this.bodyItems.filter((i) => this.selected.has(i.info.id)).map((i) => i.info);
  }

  /** Select body cells by coord (replaces the selection). */
  setSelection(coords: [MatrixCoordPart, MatrixCoordPart][]): void {
    this.selected.clear();
    for (const [x, y] of coords) {
      const c = this.getCell(x, y);
      if (c) this.selected.add(c.id);
    }
    this.drawOverlay();
    this.emit('select', this.getSelection());
  }

  clearSelection(): void {
    this.setSelection([]);
  }

  /** Show / hide a visualMap piece (cells in it fade out). */
  togglePiece(index: number, hidden?: boolean): void {
    const h = hidden ?? !this.hiddenPieces.has(index);
    if (h) this.hiddenPieces.add(index);
    else this.hiddenPieces.delete(index);
    this.renderVisual();
    this.draw();
  }

  /** Redraw (e.g. after state used by `renderCell` / `graphic` changed). */
  refresh(): void {
    this.draw();
    this.drawOverlay();
  }

  on(event: 'hover', handler: (cell: MatrixCellInfo | null) => void): () => void;
  on(event: 'click', handler: (cell: MatrixCellInfo) => void): () => void;
  on(event: 'select', handler: (cells: MatrixCellInfo[]) => void): () => void;
  on(event: 'media', handler: (e: { rules: number[] }) => void): () => void;
  on(event: MatrixEvent, handler: (v: never) => void): () => void {
    if (!this.handlers.has(event)) this.handlers.set(event, new Set());
    const h = handler as (v: unknown) => void;
    this.handlers.get(event)!.add(h);
    return () => this.handlers.get(event)?.delete(h);
  }

  resize(): void {
    if (this.destroyed) return;
    this.measure();
    const key = this.activeMedia();
    if (key !== this.mediaKey) {
      this.mediaKey = key;
      this.hostsEl.classList.add('mx-hosts--reflow');
      clearTimeout(this.reflowTimer);
      this.reflowTimer = window.setTimeout(() => this.hostsEl.classList.remove('mx-hosts--reflow'), 450);
      this.rebuild(false);
      this.emit('media', { rules: key ? key.split(',').map(Number) : [] });
      return;
    }
    this.layout();
    this.placeHosts();
    this.draw();
    this.drawOverlay();
  }

  /** PNG of the matrix, embedded canvases included. */
  screenshot(): string {
    this.draw();
    const out = document.createElement('canvas');
    out.width = this.canvas.width;
    out.height = this.canvas.height;
    const c = out.getContext('2d')!;
    c.drawImage(this.canvas, 0, 0);
    const pr = this.plotEl.getBoundingClientRect();
    this.hostsEl.querySelectorAll('canvas').forEach((cv) => {
      const r = cv.getBoundingClientRect();
      if (r.width && r.height) c.drawImage(cv, (r.left - pr.left) * this.dpr, (r.top - pr.top) * this.dpr, r.width * this.dpr, r.height * this.dpr);
    });
    return out.toDataURL('image/png');
  }

  destroy(): void {
    if (this.destroyed) return;
    this.destroyed = true;
    cancelAnimationFrame(this.raf);
    clearTimeout(this.reflowTimer);
    this.ro.disconnect();
    for (const h of this.hosts.values()) this.unmount(h);
    this.hosts.clear();
    this.root.classList.remove('mx-root');
    for (const k of ['--mx-bg', '--mx-text', '--mx-muted', '--mx-border', '--mx-tt-bg', '--mx-tt-text', '--mx-tt-border', '--mx-font']) this.root.style.removeProperty(k);
    this.titleEl.remove();
    this.bodyEl.remove();
  }

  // ------------------------------------------------------------------ options / model

  private emit(e: MatrixEvent, v: unknown): void {
    this.handlers.get(e)?.forEach((h) => h(v));
  }

  /** Media rules are matched on the container (not the plot), so a rule that hides the legend cannot flip-flop. */
  private activeMedia(): string {
    if (!this.base.media?.length) return '';
    const r = this.root.getBoundingClientRect();
    return matrixMedia(this.base.media, Math.floor(r.width), Math.floor(r.height)).join(',');
  }

  private effective(): MatrixOptions {
    let o: MatrixOptions = { ...this.base };
    const rules = this.base.media ?? [];
    for (const i of this.mediaKey ? this.mediaKey.split(',').map(Number) : []) if (rules[i]) o = { ...o, ...rules[i].option };
    return o;
  }

  private applyLook(): void {
    const o = this.opts;
    const base = o.theme === 'light' ? matrixLightTheme : matrixDarkTheme;
    const custom = typeof o.theme === 'object' ? o.theme : {};
    const t: MatrixTheme = { ...base, ...custom };
    if (o.background) t.background = o.background;
    if (t.background === 'transparent') {
      const dark = o.theme !== 'light';
      const veil = dark ? 'rgba(255, 255, 255, 0.06)' : 'rgba(19, 23, 34, 0.04)';
      if (!custom.headerBg) t.headerBg = veil;
      if (!custom.cornerBg) t.cornerBg = veil;
      if (!custom.border) t.border = dark ? 'rgba(255, 255, 255, 0.16)' : 'rgba(19, 23, 34, 0.12)';
    }
    this.theme = t;
    this.textColors.clear();
    const vars: Record<string, string> = {
      '--mx-bg': t.background,
      '--mx-text': t.text,
      '--mx-muted': t.muted,
      '--mx-border': t.border,
      '--mx-tt-bg': t.tooltipBg,
      '--mx-tt-text': t.tooltipText,
      '--mx-tt-border': t.tooltipBorder,
      '--mx-font': t.font,
    };
    for (const [k, v] of Object.entries(vars)) this.root.style.setProperty(k, v);
    const title = typeof o.title === 'string' ? { text: o.title } : o.title;
    this.titleEl.style.display = title ? '' : 'none';
    if (title) {
      this.titleEl.style.textAlign = title.align ?? 'center';
      this.titleEl.innerHTML = `<b>${esc(title.text)}</b>${title.subtext ? `<small>${esc(title.subtext)}</small>` : ''}`;
    }
  }

  private duration(): number {
    const a = this.opts.animation ?? true;
    return a === false ? 0 : typeof a === 'object' ? (a.duration ?? 600) : 600;
  }

  private stagger(): number {
    const a = this.opts.animation;
    const d = this.duration();
    return typeof a === 'object' && a.stagger !== undefined ? a.stagger : Math.min(450, d * 0.7);
  }

  /** Header model from a dimension; without one, the count comes from the data. */
  private headerOf(dim: MatrixDimension | undefined, axis: 0 | 1, cells: MatrixCell[]): MatrixHeaderModel {
    if (dim) return matrixHeader(dim.data);
    let n = 0;
    for (const c of cells) {
      const p = c.coord?.[axis];
      const vals = Array.isArray(p) ? p : [p];
      for (const v of vals) if (typeof v === 'number') n = Math.max(n, v + 1 + (axis === 0 ? (c.colSpan ?? 1) - 1 : (c.rowSpan ?? 1) - 1));
    }
    return matrixHeader(n);
  }

  private headerShown(dim: MatrixDimension | undefined): boolean {
    if (!dim) return false;
    return dim.show ?? typeof dim.data !== 'number';
  }

  private rebuild(animate: boolean): void {
    if (this.destroyed) return;
    this.opts = this.effective();
    this.applyLook();
    const o = this.opts;
    const raw = o.data ?? [];
    const cells: MatrixCell[] = matrixIsGrid(raw as unknown[]) ? matrixGridCells(raw as unknown[][]) : (raw as MatrixCell[]);
    this.xh = this.headerOf(o.x, 0, cells);
    this.yh = this.headerOf(o.y, 1, cells);
    const placed = matrixPlace(cells, this.xh, this.yh);
    this.nx = placed.nx;
    this.ny = placed.ny;
    this.grid = placed.grid;
    const t = this.theme;
    const gap = o.gap ?? 0;
    const dur = this.duration();
    const stagger = this.stagger();
    const on = animate && dur > 0;
    const span = Math.max(1, this.nx + this.ny - 2);

    // visualMap range
    const vmOpt = o.visualMap || null;
    this.vm = null;
    if (vmOpt) {
      this.vm = { map: vmOpt, min: 0, max: 1, pieces: vmOpt.pieces?.length ? vmOpt.pieces : null };
    }

    const baseStyle = (s: MatrixCellStyle | undefined, ...more: (MatrixCellStyle | undefined)[]): MatrixCellStyle => Object.assign({}, s, ...more);
    const mkStyle = (s: MatrixCellStyle, fallbackBg: string): Item['style'] => ({
      color: s.color ?? fallbackBg,
      borderColor: s.borderColor ?? t.border,
      borderWidth: s.borderWidth ?? (gap > 0 ? 0 : 1),
      radius: s.radius ?? (gap > 0 ? 3 : 0),
      opacity: s.opacity ?? 1,
    });
    const mkLabel = (...ls: (MatrixLabel | undefined)[]): Item['label'] => {
      const l: MatrixLabel = Object.assign({}, ...ls);
      return { ...l, show: l.show ?? true };
    };

    // ---- body
    const xInfo = (x0: number, x1: number, h: MatrixHeaderModel): { name: string; path: string[] } => {
      if (!h.leaves.length) return { name: '', path: [] };
      if (x0 === x1) return { name: h.leaves[x0].name, path: h.leaves[x0].path };
      const node = h.nodes.find((n) => n.start === x0 && n.span === x1 - x0 + 1);
      if (node) return { name: node.name, path: node.path };
      return { name: `${h.leaves[x0].name}–${h.leaves[x1].name}`, path: [`${h.leaves[x0].name}–${h.leaves[x1].name}`] };
    };
    this.bodyItems = placed.cells.map((p) => {
      const c = p.cell;
      const xi = xInfo(p.x0, p.x1, this.xh);
      const yi = xInfo(p.y0, p.y1, this.yh);
      const info: MatrixCellInfo = {
        kind: 'body',
        id: c.id ?? `${p.x0},${p.y0}`,
        x: p.x0,
        y: p.y0,
        xSpan: p.x1 - p.x0 + 1,
        ySpan: p.y1 - p.y0 + 1,
        xName: xi.name,
        yName: yi.name,
        xPath: xi.path,
        yPath: yi.path,
        value: c.value,
        text: '',
        color: '',
        level: -1,
        rect: { x: 0, y: 0, w: 0, h: 0 },
        data: c,
      };
      const style = baseStyle(o.itemStyle, c.itemStyle, c.color ? { color: c.color } : undefined);
      return {
        info,
        style: mkStyle(style, t.cellBg),
        label: mkLabel(o.label, c.label),
        defaultTextColor: t.text,
        render: c.render ?? o.renderCell,
        mount: c.mount === null ? null : (c.mount ?? o.mount),
        silent: !!c.silent,
        delay: on ? ((p.x0 + p.y0) / span) * stagger : 0,
        piece: -1,
        x0: p.x0,
        x1: p.x1,
        y0: p.y0,
        y1: p.y1,
        hidden: !!c.hidden,
        explicitColor: !!(c.color || c.itemStyle?.color),
      };
    });
    // visualMap colors
    if (this.vm) {
      const dim = this.vm.map.dimension ?? ((cell: MatrixCellInfo) => cell.value as number | string);
      const nums: number[] = [];
      const vals = this.bodyItems.map((it) => {
        const v = dim(it.info);
        if (typeof v === 'number' && Number.isFinite(v)) nums.push(v);
        return v;
      });
      this.vm.min = this.vm.map.min ?? (nums.length ? Math.min(...nums) : 0);
      this.vm.max = this.vm.map.max ?? (nums.length ? Math.max(...nums) : 1);
      this.bodyItems.forEach((it, i) => {
        const v = vals[i];
        if (v === null || v === undefined || (typeof v === 'number' && !Number.isFinite(v))) return;
        const { color, piece } = this.visualColor(v);
        it.piece = piece;
        if (color && !it.explicitColor) it.style.color = color;
      });
    }
    for (const it of this.bodyItems) {
      it.info.color = none(it.style.color) ? '' : it.style.color;
      it.info.text = this.textOf(it);
    }
    // hidden cells disappear; empty leaves can be shown as blank cells
    const emptyShown = (o.emptyCells ?? 'show') === 'show';
    const hiddenSet = new Set(this.bodyItems.filter((it) => it.hidden));
    if (emptyShown) {
      const blanks: Item[] = [];
      for (let y = 0; y < this.ny; y++)
        for (let x = 0; x < this.nx; x++) {
          if (this.grid[y * this.nx + x] >= 0) continue;
          const xi = xInfo(x, x, this.xh);
          const yi = xInfo(y, y, this.yh);
          blanks.push({
            info: { kind: 'body', id: `${x},${y}`, x, y, xSpan: 1, ySpan: 1, xName: xi.name, yName: yi.name, xPath: xi.path, yPath: yi.path, value: undefined, text: '', color: '', level: -1, rect: { x: 0, y: 0, w: 0, h: 0 }, data: undefined },
            style: mkStyle(baseStyle(o.itemStyle), t.cellBg),
            label: { show: false },
            defaultTextColor: t.text,
            silent: true,
            delay: on ? ((x + y) / span) * stagger : 0,
            piece: -1,
            x0: x,
            x1: x,
            y0: y,
            y1: y,
            blank: true,
          });
        }
      // blanks are drawn but not hit: keep them out of the grid
      this.bodyItems = [...this.bodyItems, ...blanks];
    }
    if (hiddenSet.size) {
      for (let i = 0; i < this.grid.length; i++) if (this.grid[i] >= 0 && hiddenSet.has(this.bodyItems[this.grid[i]])) this.grid[i] = -1;
    }

    // ---- headers
    this.headerItems = [];
    const head = (dim: MatrixDimension | undefined, h: MatrixHeaderModel, kind: 'x' | 'y'): void => {
      if (!this.headerShown(dim)) return;
      for (const n of h.nodes) {
        const lv = dim?.levels?.[n.level];
        const it = n.item;
        const style = baseStyle(dim?.itemStyle, lv?.itemStyle, it.itemStyle, it.color ? { color: it.color } : undefined);
        const info: MatrixCellInfo = {
          kind,
          id: `${kind}:${n.path.join('/')}:${n.start}`,
          x: kind === 'x' ? n.start : -1,
          y: kind === 'y' ? n.start : -1,
          xSpan: kind === 'x' ? n.span : 0,
          ySpan: kind === 'y' ? n.span : 0,
          xName: kind === 'x' ? n.name : '',
          yName: kind === 'y' ? n.name : '',
          xPath: kind === 'x' ? n.path : [],
          yPath: kind === 'y' ? n.path : [],
          value: it.value,
          text: '',
          color: '',
          level: n.level,
          rect: { x: 0, y: 0, w: 0, h: 0 },
          data: it,
        };
        const item: Item = {
          info,
          style: mkStyle(style, t.headerBg),
          label: mkLabel({ align: kind === 'y' ? 'left' : 'center', fontWeight: n.leaf ? 500 : 600 }, dim?.label, lv?.label, it.label),
          defaultTextColor: t.headerText,
          silent: false,
          delay: 0,
          piece: -1,
          node: n,
          x0: kind === 'x' ? n.start : -1,
          x1: kind === 'x' ? n.start + n.span - 1 : -1,
          y0: kind === 'y' ? n.start : -1,
          y1: kind === 'y' ? n.start + n.span - 1 : -1,
        };
        info.color = none(item.style.color) ? '' : item.style.color;
        info.text = item.label.formatter ? item.label.formatter(info) : n.name;
        this.headerItems.push(item);
      }
    };
    head(o.x, this.xh, 'x');
    head(o.y, this.yh, 'y');
    this.cornerItem = null;
    if (this.headerShown(o.x) && this.headerShown(o.y)) {
      const c = o.corner ?? {};
      const style = baseStyle(c.itemStyle, c.color ? { color: c.color } : undefined);
      const info: MatrixCellInfo = { kind: 'corner', id: 'corner', x: -1, y: -1, xSpan: 0, ySpan: 0, xName: '', yName: '', xPath: [], yPath: [], value: c.text, text: c.text ?? '', color: '', level: 0, rect: { x: 0, y: 0, w: 0, h: 0 }, data: undefined };
      this.cornerItem = { info, style: mkStyle(style, t.cornerBg), label: mkLabel({ fontWeight: 600 }, c.label), defaultTextColor: t.muted, silent: true, delay: 0, piece: -1, x0: -1, x1: -1, y0: -1, y1: -1 };
      info.color = none(this.cornerItem.style.color) ? '' : this.cornerItem.style.color;
    }

    // keep the hover / selection on cells that still exist
    const ids = new Set(this.bodyItems.map((i) => i.info.id));
    for (const id of [...this.selected]) if (!ids.has(id)) this.selected.delete(id);
    if (this.hover) this.hover = [...this.bodyItems, ...this.headerItems].find((i) => i.info.id === this.hover!.info.id) ?? null;
    if (this.hiddenPieces.size && !this.vm?.pieces) this.hiddenPieces.clear();

    this.renderVisual();
    this.layout();
    this.syncHosts(on);
    this.animStart = on ? performance.now() : 0;
    this.progress = on ? 0 : 1;
    this.loop();
  }

  private visualColor(v: number | string): { color: string; piece: number } {
    const vm = this.vm!;
    if (vm.pieces) {
      const i = vm.pieces.findIndex((p) =>
        p.value !== undefined ? p.value === v : typeof v === 'number' && (p.min === undefined || v >= p.min) && (p.max === undefined || v < p.max || (v === p.max && p === vm.pieces![vm.pieces!.length - 1])),
      );
      return i >= 0 ? { color: vm.pieces[i].color, piece: i } : { color: vm.map.outOfRange ?? '', piece: -1 };
    }
    if (typeof v !== 'number') return { color: '', piece: -1 };
    const span = vm.max - vm.min;
    if ((v < vm.min || v > vm.max) && vm.map.outOfRange) return { color: vm.map.outOfRange, piece: -1 };
    return { color: gradientAt(vm.map.colors ?? MATRIX_VISUAL_COLORS, span ? (v - vm.min) / span : 0.5), piece: -1 };
  }

  private fmt(v: number): string {
    return this.opts.valueFormatter ? this.opts.valueFormatter(v) : v.toLocaleString('pt-PT', { maximumFractionDigits: 2 });
  }

  private textOf(it: Item): string {
    const c = it.info.data as MatrixCell | undefined;
    if (c?.text !== undefined) return c.text;
    if (it.label.formatter) return it.label.formatter(it.info);
    const v = it.info.value;
    if (typeof v === 'number') return Number.isFinite(v) ? this.fmt(v) : '';
    if (typeof v === 'string') return v;
    return '';
  }

  // ------------------------------------------------------------------ visualMap (DOM)

  private renderVisual(): void {
    const vm = this.vm;
    const show = !!vm && vm.map.show !== false;
    const pos = vm?.map.position ?? 'right';
    this.bodyEl.className = `mx-body mx-visual-${pos}`;
    this.visualEl.style.display = show ? '' : 'none';
    if (!show || !vm) {
      this.visualEl.innerHTML = '';
      return;
    }
    const f = (v: number): string => (vm.map.formatter ? vm.map.formatter(v) : this.fmt(v));
    if (vm.pieces) {
      this.visualEl.innerHTML = `<ul class="mx-visual__pieces">${vm.pieces
        .map((p, i) => {
          const text = p.label ?? (p.value !== undefined ? String(p.value) : `${p.min !== undefined ? f(p.min) : '…'} – ${p.max !== undefined ? f(p.max) : '…'}`);
          return `<li class="mx-visual__piece${this.hiddenPieces.has(i) ? ' is-hidden' : ''}" data-i="${i}"><i style="background:${p.color}"></i><span>${esc(text)}</span></li>`;
        })
        .join('')}</ul>`;
      return;
    }
    const colors = vm.map.colors ?? MATRIX_VISUAL_COLORS;
    const dir = pos === 'right' ? 'to top' : 'to right';
    const [hi, lo] = vm.map.text ?? [f(vm.max), f(vm.min)];
    this.visualEl.innerHTML =
      pos === 'right'
        ? `<span class="mx-visual__end">${esc(hi)}</span><i class="mx-visual__bar" style="background:linear-gradient(${dir}, ${colors.join(', ')})"></i><span class="mx-visual__end">${esc(lo)}</span>`
        : `<span class="mx-visual__end">${esc(lo)}</span><i class="mx-visual__bar" style="background:linear-gradient(${dir}, ${colors.join(', ')})"></i><span class="mx-visual__end">${esc(hi)}</span>`;
  }

  // ------------------------------------------------------------------ layout

  private measure(): void {
    const r = this.plotEl.getBoundingClientRect();
    this.dpr = window.devicePixelRatio || 1;
    this.width = Math.max(1, Math.floor(r.width));
    this.height = Math.max(1, Math.floor(r.height));
    for (const c of [this.canvas, this.overlay]) {
      c.width = Math.round(this.width * this.dpr);
      c.height = Math.round(this.height * this.dpr);
      c.style.width = `${this.width}px`;
      c.style.height = `${this.height}px`;
    }
  }

  private font(size: number, weight: number | string = 400): string {
    return `${weight} ${size}px ${this.theme.font}`;
  }

  private padding(): [number, number, number, number] {
    const p = this.opts.padding ?? 8;
    return typeof p === 'number' ? [p, p, p, p] : p;
  }

  private layout(): void {
    const o = this.opts;
    const [pt, pr, pb, pl] = this.padding();
    const W = Math.max(1, this.width - pl - pr);
    const H = Math.max(1, this.height - pt - pb);
    // x header: one row per level
    const xShown = this.headerShown(o.x) ? this.xh.levels : 0;
    const yShown = this.headerShown(o.y) ? this.yh.levels : 0;
    const xFs = o.x?.label?.fontSize ?? 12;
    const lvSize = (dim: MatrixDimension | undefined, i: number): number | undefined => {
      const ls = dim?.levelSize;
      return dim?.levels?.[i]?.size ?? (Array.isArray(ls) ? ls[i] : ls);
    };
    let xl = Array.from({ length: xShown }, (_, i) => lvSize(o.x, i) ?? Math.round(xFs * 2 + 2));
    const xSum = xl.reduce((a, b) => a + b, 0);
    if (xSum > H * 0.4) xl = xl.map((v) => (v * H * 0.4) / xSum);
    // y header: one column per level, as wide as its widest text
    const yFs = o.y?.label?.fontSize ?? 12;
    let yl = Array.from({ length: yShown }, (_, i) => {
      const fixed = lvSize(o.y, i);
      if (fixed !== undefined) return fixed;
      let w = 0;
      for (const it of this.headerItems) {
        if (it.info.kind !== 'y' || it.node!.level !== i) continue;
        this.ctx.font = this.font(it.label.fontSize ?? yFs, it.label.fontWeight ?? 500);
        for (const line of it.info.text.split('\n')) w = Math.max(w, this.ctx.measureText(line).width);
      }
      return Math.ceil(w + 2 * (o.y?.label?.padding ?? 6) + 4);
    });
    const ySum = yl.reduce((a, b) => a + b, 0);
    if (ySum > W * 0.4) yl = yl.map((v) => (v * W * 0.4) / ySum);
    const headW = yl.reduce((a, b) => a + b, 0);
    const headH = xl.reduce((a, b) => a + b, 0);
    let bw = Math.max(1, W - headW);
    let bh = Math.max(1, H - headH);
    if (o.cellAspect && this.nx && this.ny) {
      const a = o.cellAspect;
      if (bw / this.nx > (a * bh) / this.ny) bw = (a * bh * this.nx) / this.ny;
      else bh = (bw * this.ny) / (this.nx * a);
    }
    const ox = pl + (W - headW - bw) / 2;
    const oy = pt + (H - headH - bh) / 2;
    const lengths = (dim: MatrixDimension | undefined, h: MatrixHeaderModel) =>
      h.leaves.map((leaf, i) => leaf.item.size ?? (Array.isArray(dim?.cellSize) ? dim!.cellSize[i] : (dim?.cellSize as string | number | undefined)));
    this.yLevels = matrixOffsets(yl, ox);
    this.xLevels = matrixOffsets(xl, oy);
    this.cols = matrixOffsets(matrixSizes(lengths(o.x, this.xh), bw, o.x?.minCellSize ?? 0), ox + headW);
    this.rows = matrixOffsets(matrixSizes(lengths(o.y, this.yh), bh, o.y?.minCellSize ?? 0), oy + headH);
    const bx = this.cols.offsets[0];
    const by = this.rows.offsets[0];
    this.bodyRect = { x: bx, y: by, w: this.cols.offsets[this.nx] - bx, h: this.rows.offsets[this.ny] - by };
    for (const it of this.bodyItems) it.info.rect = this.rangeRect(it.x0, it.x1, it.y0, it.y1);
    for (const it of this.headerItems) {
      const n = it.node!;
      if (it.info.kind === 'x') {
        const r = this.rangeRect(n.start, n.start + n.span - 1, 0, 0);
        it.info.rect = { x: r.x, y: this.xLevels.offsets[n.level], w: r.w, h: this.xLevels.offsets[n.level + n.depth] - this.xLevels.offsets[n.level] };
      } else {
        const r = this.rangeRect(0, 0, n.start, n.start + n.span - 1);
        it.info.rect = { x: this.yLevels.offsets[n.level], y: r.y, w: this.yLevels.offsets[n.level + n.depth] - this.yLevels.offsets[n.level], h: r.h };
      }
    }
    if (this.cornerItem) this.cornerItem.info.rect = { x: this.yLevels.offsets[0], y: this.xLevels.offsets[0], w: headW, h: headH };
  }

  private rangeRect(x0: number, x1: number, y0: number, y1: number): MatrixRect {
    const c = this.cols.offsets;
    const r = this.rows.offsets;
    const X0 = c[clamp(x0, 0, this.nx)] ?? 0;
    const X1 = c[clamp(x1 + 1, 0, this.nx)] ?? X0;
    const Y0 = r[clamp(y0, 0, this.ny)] ?? 0;
    const Y1 = r[clamp(y1 + 1, 0, this.ny)] ?? Y0;
    return { x: X0, y: Y0, w: X1 - X0, h: Y1 - Y0 };
  }

  /** Rect actually painted (inset by half the gap). */
  private paintRect(r: MatrixRect): MatrixRect {
    const g = (this.opts.gap ?? 0) / 2;
    return { x: r.x + g, y: r.y + g, w: Math.max(0, r.w - 2 * g), h: Math.max(0, r.h - 2 * g) };
  }

  // ------------------------------------------------------------------ embedded elements

  private syncHosts(animate: boolean): void {
    const keep = new Map<string, Host>();
    const pad = this.opts.mountPadding ?? 2;
    for (const it of this.bodyItems) {
      if (it.blank || it.hidden || !it.mount) continue;
      const id = it.info.id;
      const payload = (it.info.data as MatrixCell | undefined)?.data;
      const old = this.hosts.get(id);
      if (old && old.mount === it.mount && Object.is(old.value, it.info.value) && old.data === payload) {
        old.item = it;
        keep.set(id, old);
        this.hosts.delete(id);
        continue;
      }
      const el = document.createElement('div');
      el.className = 'mx-cell-host';
      el.style.setProperty('--mx-pad', `${pad}px`);
      const host: Host = { el, cleanup: undefined, mount: it.mount, value: it.info.value, data: payload, item: it };
      el.addEventListener('pointerenter', () => this.setHover(host.item, null));
      el.addEventListener('pointerleave', (e) => {
        if (e.relatedTarget !== this.overlay && this.hover === host.item) this.setHover(null, null);
      });
      el.addEventListener('click', () => this.clickItem(host.item));
      this.hostsEl.append(el);
      keep.set(id, host);
      if (animate) {
        el.style.opacity = '0';
        el.style.transitionDelay = `${Math.round(it.delay)}ms`;
      }
    }
    for (const h of this.hosts.values()) this.unmount(h);
    this.hosts = keep;
    this.placeHosts();
    // mount after placing so the element already has its size
    for (const h of this.hosts.values()) {
      if (h.cleanup !== undefined || h.el.dataset.mounted) continue;
      h.el.dataset.mounted = '1';
      try {
        h.cleanup = h.mount(h.el, h.item.info);
      } catch (err) {
        console.error('[matrix] mount failed', err);
      }
    }
    if (animate)
      requestAnimationFrame(() =>
        requestAnimationFrame(() => {
          for (const h of this.hosts.values()) h.el.style.opacity = '';
        }),
      );
  }

  private placeHosts(): void {
    const pad = this.opts.mountPadding ?? 2;
    for (const h of this.hosts.values()) {
      const r = this.paintRect(h.item.info.rect);
      const s = h.el.style;
      s.left = `${r.x + pad}px`;
      s.top = `${r.y + pad}px`;
      s.width = `${Math.max(0, r.w - 2 * pad)}px`;
      s.height = `${Math.max(0, r.h - 2 * pad)}px`;
      s.display = r.w - 2 * pad < 2 || r.h - 2 * pad < 2 ? 'none' : '';
    }
  }

  private unmount(h: Host): void {
    try {
      if (typeof h.cleanup === 'function') h.cleanup();
    } catch (err) {
      console.error('[matrix] cleanup failed', err);
    }
    h.el.remove();
  }

  // ------------------------------------------------------------------ drawing

  private loop(): void {
    cancelAnimationFrame(this.raf);
    if (this.destroyed) return;
    const total = this.duration() + this.stagger();
    this.progress = this.animStart ? clamp((performance.now() - this.animStart) / (total || 1), 0, 1) : 1;
    this.draw();
    this.drawOverlay();
    if (this.progress < 1) this.raf = requestAnimationFrame(() => this.loop());
    else this.animStart = 0;
  }

  /** Animation state of an item: [opacity, scale]. */
  private anim(it: Item): [number, number] {
    if (!this.animStart) return [1, 1];
    const t = clamp((performance.now() - this.animStart - it.delay) / (this.duration() || 1), 0, 1);
    const e = easeOut(t);
    return [e, 0.6 + 0.4 * e];
  }

  private api(): MatrixDrawApi {
    return {
      cellRect: (x, y) => this.cellRect(x, y),
      column: (x) => ({ x: this.cols.offsets[x] ?? 0, w: this.cols.sizes[x] ?? 0 }),
      row: (y) => ({ y: this.rows.offsets[y] ?? 0, h: this.rows.sizes[y] ?? 0 }),
      body: { ...this.bodyRect },
      width: this.width,
      height: this.height,
      theme: this.theme,
      hover: this.hover?.info ?? null,
      progress: this.animStart ? easeOut(this.progress) : 1,
      cells: this.bodyItems.filter((i) => !i.blank).map((i) => i.info),
      colorOf: (v) => (this.vm ? this.visualColor(v).color : ''),
    };
  }

  private draw(): void {
    if (this.destroyed) return;
    const ctx = this.ctx;
    const t = this.theme;
    ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
    ctx.clearRect(0, 0, this.width, this.height);
    if (!none(t.background)) {
      ctx.fillStyle = t.background;
      ctx.fillRect(0, 0, this.width, this.height);
    }
    const api = this.api();
    const emptyHidden = (this.opts.emptyCells ?? 'show') === 'hide';
    for (const it of this.bodyItems) {
      if (it.hidden) continue;
      if (emptyHidden && it.blank) continue;
      this.drawItem(it, api);
    }
    for (const it of this.headerItems) this.drawItem(it, api);
    if (this.cornerItem) this.drawItem(this.cornerItem, api);
    if (this.opts.graphic) {
      ctx.save();
      try {
        this.opts.graphic(ctx, api);
      } catch (err) {
        console.error('[matrix] graphic failed', err);
      }
      ctx.restore();
    }
  }

  private drawItem(it: Item, api: MatrixDrawApi): void {
    const ctx = this.ctx;
    const r0 = this.paintRect(it.info.rect);
    if (r0.w <= 0 || r0.h <= 0) return;
    const [a, sc] = this.anim(it);
    if (a <= 0.001) return;
    const dimmed = it.piece >= 0 && this.hiddenPieces.has(it.piece);
    const alpha = a * it.style.opacity * (dimmed ? 0.12 : 1);
    const r = sc === 1 ? r0 : { x: r0.x + (r0.w * (1 - sc)) / 2, y: r0.y + (r0.h * (1 - sc)) / 2, w: r0.w * sc, h: r0.h * sc };
    ctx.globalAlpha = alpha;
    const s = it.style;
    const rad = Math.min(s.radius, r.w / 2, r.h / 2);
    const path = (): void => {
      ctx.beginPath();
      if (rad > 0) ctx.roundRect(r.x, r.y, r.w, r.h, rad);
      else ctx.rect(r.x, r.y, r.w, r.h);
    };
    if (!none(s.color)) {
      ctx.fillStyle = s.color;
      path();
      ctx.fill();
    }
    if (it.render) {
      ctx.save();
      path();
      ctx.clip();
      try {
        it.render(ctx, r, it.info, api);
      } catch (err) {
        console.error('[matrix] renderCell failed', err);
      }
      ctx.restore();
      ctx.globalAlpha = alpha;
    }
    if (s.borderWidth > 0 && !none(s.borderColor)) {
      ctx.strokeStyle = s.borderColor;
      ctx.lineWidth = s.borderWidth;
      const h = s.borderWidth % 2 ? 0.5 : 0;
      ctx.beginPath();
      if (rad > 0) ctx.roundRect(r.x + h, r.y + h, r.w, r.h, rad);
      else ctx.rect(r.x + h, r.y + h, r.w, r.h);
      ctx.stroke();
    }
    if (it.label.show && it.info.text && !dimmed) this.drawLabel(it, r);
    ctx.globalAlpha = 1;
  }

  private contrast(bg: string): string {
    let c = this.textColors.get(bg);
    if (!c) {
      const [, , , al] = parseColor(bg);
      c = al < 0.45 ? '' : luminance(bg) > 0.42 ? '#131722' : '#ffffff';
      this.textColors.set(bg, c);
    }
    return c;
  }

  private drawLabel(it: Item, r: MatrixRect): void {
    const ctx = this.ctx;
    const l = it.label;
    const pad = l.padding ?? (it.info.kind === 'y' ? 6 : 4);
    const lines = it.info.text.split('\n');
    const kind = it.info.kind;
    const baseFs = l.fontSize ?? (kind === 'body' ? 12 : kind === 'corner' ? 11 : 12);
    let fs = Math.min(baseFs, (r.h - 2) / (lines.length * 1.2));
    if (fs < 6) return;
    const maxW = r.w - 2 * pad;
    const weight = l.fontWeight ?? (kind === 'body' ? 400 : 500);
    ctx.font = this.font(fs, weight);
    // too wide: shrink the font (down to 7 px) before cutting the text
    const widest = Math.max(...lines.map((s) => ctx.measureText(s).width));
    if (widest > maxW && fs > 7) {
      fs = Math.max(7, (fs * maxW) / widest);
      ctx.font = this.font(fs, weight);
    }
    if (maxW < fs) return;
    const bg = it.style.color;
    ctx.fillStyle = l.color ?? ((!none(bg) && kind === 'body' && this.contrast(bg)) || it.defaultTextColor);
    const align = l.align ?? 'center';
    ctx.textAlign = align;
    ctx.textBaseline = 'middle';
    const x = align === 'left' ? r.x + pad : align === 'right' ? r.x + r.w - pad : r.x + r.w / 2;
    const lh = fs * 1.2;
    const va = l.verticalAlign ?? 'middle';
    const y0 = va === 'top' ? r.y + pad + lh / 2 : va === 'bottom' ? r.y + r.h - pad - (lines.length - 0.5) * lh : r.y + r.h / 2 - ((lines.length - 1) * lh) / 2;
    // a cut number would read as another number: numbers that do not fit are left out
    const exact = kind === 'body' && typeof it.info.value === 'number';
    lines.forEach((line, i) => {
      const s = exact ? (ctx.measureText(line).width <= maxW + 0.5 ? line : '') : this.fit(line, maxW);
      if (s) ctx.fillText(s, x, y0 + i * lh);
    });
  }

  /** Truncate with an ellipsis to fit `w`. */
  private fit(s: string, w: number): string {
    const ctx = this.ctx;
    if (ctx.measureText(s).width <= w) return s;
    let lo = 0;
    let hi = s.length;
    while (lo < hi) {
      const mid = (lo + hi + 1) >> 1;
      if (ctx.measureText(`${s.slice(0, mid)}…`).width <= w) lo = mid;
      else hi = mid - 1;
    }
    return lo ? `${s.slice(0, lo)}…` : '';
  }

  /** Hover highlight and selection (second canvas, cheap to redraw). */
  private drawOverlay(): void {
    if (this.destroyed) return;
    const ctx = this.octx;
    ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
    ctx.clearRect(0, 0, this.width, this.height);
    const t = this.theme;
    const h = this.hover;
    const mode = this.opts.emphasis ?? 'cross';
    if (h && mode && (!this.animStart || this.progress >= 1)) {
      const b = this.bodyRect;
      const left = this.yLevels.offsets[0];
      const top = this.xLevels.offsets[0];
      ctx.fillStyle = t.hover;
      const k = h.info.kind;
      const rowBand = (y0: number, y1: number): void => {
        const r = this.rangeRect(0, 0, y0, y1);
        ctx.fillRect(left, r.y, b.x + b.w - left, r.h);
      };
      const colBand = (x0: number, x1: number): void => {
        const r = this.rangeRect(x0, x1, 0, 0);
        ctx.fillRect(r.x, top, r.w, b.y + b.h - top);
      };
      if (k === 'body') {
        if (mode === 'cross' || mode === 'row') rowBand(h.y0, h.y1);
        if (mode === 'cross' || mode === 'column') colBand(h.x0, h.x1);
        if (mode === 'cross') {
          // the crossing is lit twice: undo it
          const r = h.info.rect;
          ctx.clearRect(r.x, r.y, r.w, r.h);
        }
        const r = this.paintRect(h.info.rect);
        if (!h.mount) {
          ctx.strokeStyle = t.text;
          ctx.globalAlpha = 0.85;
          ctx.lineWidth = 1.5;
          ctx.strokeRect(r.x + 0.75, r.y + 0.75, Math.max(0, r.w - 1.5), Math.max(0, r.h - 1.5));
          ctx.globalAlpha = 1;
        }
      } else if (k === 'x') colBand(h.x0, h.x1);
      else if (k === 'y') rowBand(h.y0, h.y1);
    }
    if (this.selected.size) {
      ctx.strokeStyle = t.select;
      ctx.lineWidth = 2;
      ctx.fillStyle = t.select;
      for (const it of this.bodyItems) {
        if (!this.selected.has(it.info.id)) continue;
        const r = this.paintRect(it.info.rect);
        ctx.globalAlpha = 0.14;
        ctx.fillRect(r.x, r.y, r.w, r.h);
        ctx.globalAlpha = 1;
        ctx.strokeRect(r.x + 1, r.y + 1, Math.max(0, r.w - 2), Math.max(0, r.h - 2));
      }
    }
  }

  // ------------------------------------------------------------------ interaction

  private hitTest(x: number, y: number): Item | null {
    const col = matrixIndexAt(this.cols.offsets, x);
    const row = matrixIndexAt(this.rows.offsets, y);
    if (col >= 0 && row >= 0) {
      const k = this.grid[row * this.nx + col];
      const it = k >= 0 ? this.bodyItems[k] : null;
      return it && !it.silent ? it : null;
    }
    const xl = matrixIndexAt(this.xLevels.offsets, y);
    if (col >= 0 && xl >= 0) return this.headerItems.find((it) => it.info.kind === 'x' && it.node!.level <= xl && xl < it.node!.level + it.node!.depth && it.x0 <= col && col <= it.x1) ?? null;
    const yl = matrixIndexAt(this.yLevels.offsets, x);
    if (row >= 0 && yl >= 0) return this.headerItems.find((it) => it.info.kind === 'y' && it.node!.level <= yl && yl < it.node!.level + it.node!.depth && it.y0 <= row && row <= it.y1) ?? null;
    return null;
  }

  private setHover(it: Item | null, e: PointerEvent | null): void {
    if (it !== this.hover) {
      this.hover = it;
      this.emit('hover', it ? it.info : null);
      if (this.opts.graphic) this.draw();
      this.drawOverlay();
    }
    this.canvas.style.cursor = '';
    this.overlay.style.cursor = it && (this.handlers.get('click')?.size || this.opts.select) ? 'pointer' : '';
    this.showTooltip(e);
  }

  private clickItem(it: Item | null): void {
    const sel = this.opts.select ?? false;
    if (it) this.emit('click', it.info);
    if (!sel) return;
    const multi = sel === 'multiple';
    const k = it?.info.kind;
    let targets: Item[] = [];
    if (k === 'body') targets = [it!];
    else if (k === 'x') targets = this.bodyItems.filter((b) => !b.blank && b.x0 >= it!.x0 && b.x1 <= it!.x1);
    else if (k === 'y') targets = this.bodyItems.filter((b) => !b.blank && b.y0 >= it!.y0 && b.y1 <= it!.y1);
    const ids = targets.map((b) => b.info.id);
    const allOn = ids.length > 0 && ids.every((id) => this.selected.has(id));
    if (!multi) {
      const same = allOn && this.selected.size === ids.length;
      this.selected.clear();
      if (!same) ids.forEach((id) => this.selected.add(id));
    } else if (allOn) ids.forEach((id) => this.selected.delete(id));
    else ids.forEach((id) => this.selected.add(id));
    this.drawOverlay();
    this.emit('select', this.getSelection());
  }

  private bind(): void {
    const pos = (e: MouseEvent): { x: number; y: number } => {
      const r = this.overlay.getBoundingClientRect();
      return { x: e.clientX - r.left, y: e.clientY - r.top };
    };
    this.overlay.addEventListener('pointermove', (e) => {
      const { x, y } = pos(e);
      this.setHover(this.hitTest(x, y), e);
    });
    this.overlay.addEventListener('pointerleave', (e) => {
      if ((e.relatedTarget as HTMLElement | null)?.closest?.('.mx-cell-host')) return;
      this.setHover(null, null);
    });
    this.overlay.addEventListener('click', (e) => {
      const { x, y } = pos(e);
      this.clickItem(this.hitTest(x, y));
    });
    this.visualEl.addEventListener('click', (e) => {
      const li = (e.target as HTMLElement).closest<HTMLElement>('.mx-visual__piece');
      if (li) this.togglePiece(Number(li.dataset.i));
    });
  }

  private showTooltip(e: PointerEvent | null): void {
    const tt = this.opts.tooltip ?? true;
    const el = this.tooltipEl;
    const h = this.hover;
    const cfg = typeof tt === 'object' ? tt : {};
    const off = !h || !e || tt === false || cfg.show === false || h.mount || (h.info.kind !== 'body' && !cfg.headers) || h.info.kind === 'corner';
    if (off) {
      el.classList.remove('is-visible');
      return;
    }
    const i = h.info;
    if (cfg.formatter) el.innerHTML = cfg.formatter(i);
    else if (i.kind === 'body') {
      const v = i.value;
      const valueText = i.text || (typeof v === 'number' ? this.fmt(v) : typeof v === 'string' ? v : '');
      el.innerHTML =
        (i.xPath.length ? `<div class="mx-tooltip__sub">${esc(i.xPath.join(' › '))}</div>` : '') +
        `<div class="mx-tooltip__head">${i.color ? `<i class="mx-tooltip__dot" style="background:${i.color}"></i>` : ''}${esc(i.yPath.join(' › ') || i.xName)}</div>` +
        (valueText ? `<div class="mx-tooltip__row"><span>Valor</span><b>${esc(valueText.replace(/\n/g, ' '))}</b></div>` : '');
    } else {
      el.innerHTML = `<div class="mx-tooltip__head">${esc((i.kind === 'x' ? i.xPath : i.yPath).join(' › '))}</div>`;
    }
    if (!el.innerHTML) {
      el.classList.remove('is-visible');
      return;
    }
    el.classList.add('is-visible');
    const r = this.plotEl.getBoundingClientRect();
    const x = e.clientX - r.left;
    const y = e.clientY - r.top;
    const w = el.offsetWidth;
    const hh = el.offsetHeight;
    const left = x + 14 + w > this.width ? x - 14 - w : x + 14;
    const top = clamp(y + 14 + hh > this.height ? y - 14 - hh : y + 14, 0, Math.max(0, this.height - hh));
    el.style.transform = `translate(${Math.max(0, left)}px, ${top}px)`;
  }
}

export function createMatrixChart(container: HTMLElement, options: MatrixOptions = {}): MatrixChart {
  return new MatrixChart(container, options);
}
