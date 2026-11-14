import { gradientAt, luminance } from '../shared/color';
import { formatCompact } from '../shared/format';
import { axisLabelPlan, bucketOrder, labelStep, buildHeatGrid, heatPieceOf, splitPieces, type HeatGrid } from './grid';
import type { HeatmapAxis, HeatmapCell, HeatmapDatum, HeatmapEvent, HeatmapLabelOptions, HeatmapOptions, HeatmapPiece, HeatmapTheme, HeatmapVisualMap } from './types';

const FONT = '-apple-system, BlinkMacSystemFont, "Trebuchet MS", Roboto, Ubuntu, sans-serif';

export const heatmapDarkTheme: HeatmapTheme = {
  background: '#131722',
  text: '#d1d4dc',
  muted: '#787b86',
  axis: '#363a45',
  cell: 'rgba(42, 46, 57, 0.55)',
  emphasis: 'rgba(19, 23, 34, 0.6)',
  tooltipBg: '#1e222d',
  tooltipText: '#d1d4dc',
  tooltipBorder: '#2a2e39',
  font: FONT,
};

export const heatmapLightTheme: HeatmapTheme = {
  background: '#ffffff',
  text: '#131722',
  muted: '#787b86',
  axis: '#d1d4dc',
  cell: '#f0f3fa',
  emphasis: 'rgba(255, 255, 255, 0.65)',
  tooltipBg: '#ffffff',
  tooltipText: '#131722',
  tooltipBorder: '#e0e3eb',
  font: FONT,
};

/** Default colors of the visualMap (low → high): blue → yellow → red. */
export const HEATMAP_COLORS = ['#313695', '#4575b4', '#74add1', '#abd9e9', '#e0f3f8', '#ffffbf', '#fee090', '#fdae61', '#f46d43', '#d73027', '#a50026'];

/** Buckets of a continuous visualMap (colors drawn per frame). */
const STEPS = 256;
const OWN = -2;

const esc = (s: string): string => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const clamp = (v: number, a: number, b: number): number => Math.min(b, Math.max(a, v));
const easeOut = (t: number): number => 1 - Math.pow(1 - t, 3);
const inkOn = (c: string): string => (luminance(c) > 0.42 ? '#131722' : '#ffffff');

interface Plan {
  rotate: number;
  step: number;
}

/**
 * Cartesian heatmap: x and y categories (or numeric bins) with a value per cell colored by a visualMap
 * (gradient with draggable range handles, or pieces that toggle), labels, row / column emphasis, tooltip,
 * zoom & pan. Drawn with one fill color per bucket, so 20 000+ cells stay fast.
 */
export class HeatmapChart {
  readonly root: HTMLElement;
  readonly canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  /** cached cells / axes; the hover is drawn on top of it */
  private layer: HTMLCanvasElement;
  private lctx: CanvasRenderingContext2D;
  private dirty = true;
  private titleEl: HTMLElement;
  private bodyEl: HTMLElement;
  private plotEl: HTMLElement;
  private vmEl: HTMLElement;
  private tooltipEl: HTMLElement;
  private opts: HeatmapOptions;
  private theme!: HeatmapTheme;
  private grid!: HeatGrid;
  // visualMap
  private vmin = 0;
  private vmax = 1;
  private range: [number, number] = [0, 1];
  private pieces: HeatmapPiece[] | null = null;
  private off = new Set<number>();
  private lut: string[] = [];
  private ink: string[] = [];
  private bucket: Int16Array = new Int16Array(0);
  private order: Uint32Array = new Uint32Array(0);
  private start: Uint32Array = new Uint32Array(1);
  // layout (px) and view (in cells)
  private plot = { x: 0, y: 0, w: 1, h: 1 };
  private view = { x0: 0, x1: 1, y0: 0, y1: 1 };
  private xPlan: Plan = { rotate: 0, step: 1 };
  private yStep = 1;
  private xMaxW = 0;
  private yMaxW = 0;
  private xLabelMax = 0;
  private hover = -1;
  private drag: { x: number; y: number; view: { x0: number; x1: number; y0: number; y1: number }; moved: boolean } | null = null;
  private justDragged = false;
  private width = 0;
  private height = 0;
  private dpr = 1;
  private animStart = 0;
  private raf = 0;
  private handlers = new Map<HeatmapEvent, Set<(v: unknown) => void>>();
  private ro: ResizeObserver;
  private destroyed = false;

  constructor(container: HTMLElement, options: HeatmapOptions = {}) {
    this.opts = { ...options };
    this.root = container;
    container.classList.add('hm-root');
    this.titleEl = document.createElement('div');
    this.titleEl.className = 'hm-title';
    this.bodyEl = document.createElement('div');
    this.bodyEl.className = 'hm-body';
    this.plotEl = document.createElement('div');
    this.plotEl.className = 'hm-plot';
    this.canvas = document.createElement('canvas');
    this.canvas.className = 'hm-canvas';
    this.canvas.setAttribute('role', 'img');
    this.ctx = this.canvas.getContext('2d')!;
    this.layer = document.createElement('canvas');
    this.lctx = this.layer.getContext('2d')!;
    this.tooltipEl = document.createElement('div');
    this.tooltipEl.className = 'hm-tooltip';
    this.vmEl = document.createElement('div');
    this.vmEl.className = 'hm-vm';
    this.plotEl.append(this.canvas, this.tooltipEl);
    this.bodyEl.append(this.plotEl, this.vmEl);
    container.append(this.titleEl, this.bodyEl);
    this.applyLook();
    this.bind();
    this.bindVisual();
    this.ro = new ResizeObserver(() => this.resize());
    this.ro.observe(this.plotEl);
    this.measure();
    this.rebuild(true, true);
  }

  // ------------------------------------------------------------------ public API

  /** Replace the cells (`[x, y, value]` or objects). */
  setData(data: HeatmapDatum[], animate = false): void {
    this.opts.data = data;
    this.opts.matrix = undefined;
    this.rebuild(animate, true);
  }

  /** Replace the cells with a matrix: `matrix[row][column]`. */
  setMatrix(matrix: (number | null)[][], animate = false): void {
    this.opts.matrix = matrix;
    this.opts.data = undefined;
    this.rebuild(animate, true);
  }

  /** Change options after creation. */
  setOptions(patch: HeatmapOptions, animate = false): void {
    const resetVm = patch.visualMap !== undefined || patch.data !== undefined || patch.matrix !== undefined;
    if (resetVm) this.off.clear();
    this.opts = { ...this.opts, ...patch };
    this.applyLook();
    this.rebuild(animate, resetVm);
  }

  /** The cell at column x and row y (box in px relative to the chart), or null. */
  cellAt(x: number, y: number): HeatmapCell | null {
    const g = this.grid;
    if (!(x >= 0 && x < g.nx && y >= 0 && y < g.ny)) return null;
    return this.info(Math.floor(y) * g.nx + Math.floor(x));
  }

  /** Color of a value on the visualMap. */
  colorOf(v: number): string {
    if (this.pieces) {
      const i = heatPieceOf(this.pieces, v, this.vmax);
      return i < 0 ? this.emptyColor() : this.pieces[i].color;
    }
    return gradientAt(this.colors(), (v - this.vmin) / (this.vmax - this.vmin || 1));
  }

  /** Back to the whole grid after zooming. */
  resetZoom(): void {
    this.view = { x0: 0, x1: this.grid.nx, y0: 0, y1: this.grid.ny };
    this.afterZoom();
  }

  on(event: 'click', handler: (cell: HeatmapCell) => void): () => void;
  on(event: 'hover', handler: (cell: HeatmapCell | null) => void): () => void;
  on(event: 'zoom', handler: (view: { x: [number, number]; y: [number, number] }) => void): () => void;
  on(event: HeatmapEvent, handler: (v: never) => void): () => void {
    if (!this.handlers.has(event)) this.handlers.set(event, new Set());
    const h = handler as (v: unknown) => void;
    this.handlers.get(event)!.add(h);
    return () => this.handlers.get(event)?.delete(h);
  }

  resize(): void {
    if (this.destroyed) return;
    this.measure();
    this.layout();
    this.dirty = true;
    this.draw();
  }

  screenshot(): string {
    const h = this.hover;
    this.hover = -1;
    this.draw();
    const url = this.canvas.toDataURL('image/png');
    this.hover = h;
    this.draw();
    return url;
  }

  destroy(): void {
    this.destroyed = true;
    cancelAnimationFrame(this.raf);
    this.ro.disconnect();
    this.root.classList.remove('hm-root');
    this.titleEl.remove();
    this.bodyEl.remove();
  }

  // ------------------------------------------------------------------ model

  private emit(e: HeatmapEvent, v: unknown): void {
    this.handlers.get(e)?.forEach((h) => h(v));
  }

  private applyLook(): void {
    const o = this.opts;
    const base = o.theme === 'light' ? heatmapLightTheme : heatmapDarkTheme;
    const t: HeatmapTheme = { ...base, ...(typeof o.theme === 'object' ? o.theme : {}) };
    if (o.background) t.background = o.background;
    this.theme = t;
    const vars: Record<string, string> = {
      '--hm-bg': t.background,
      '--hm-text': t.text,
      '--hm-muted': t.muted,
      '--hm-tt-bg': t.tooltipBg,
      '--hm-tt-text': t.tooltipText,
      '--hm-tt-border': t.tooltipBorder,
      '--hm-font': t.font,
    };
    for (const [k, v] of Object.entries(vars)) this.root.style.setProperty(k, v);
    const title = typeof o.title === 'string' ? { text: o.title } : o.title;
    this.titleEl.style.display = title ? '' : 'none';
    if (title) {
      this.titleEl.style.textAlign = title.align ?? 'center';
      this.titleEl.innerHTML = `<b>${esc(title.text)}</b>${title.subtext ? `<small>${esc(title.subtext)}</small>` : ''}`;
    }
  }

  private vm(): HeatmapVisualMap {
    return this.opts.visualMap || {};
  }

  private colors(): string[] {
    const c = this.vm().colors;
    return c && c.length ? c : HEATMAP_COLORS;
  }

  private emptyColor(): string {
    return this.opts.cell?.emptyColor ?? this.theme.cell;
  }

  private fmt(v: number): string {
    return (this.opts.valueFormatter ?? ((x: number) => formatCompact(x)))(v);
  }

  private rebuild(animate: boolean, resetRange: boolean): void {
    const o = this.opts;
    const prev = this.grid;
    this.grid = buildHeatGrid(o.data, o.matrix, o.xAxis, o.yAxis);
    const g = this.grid;
    if (!prev || prev.nx !== g.nx || prev.ny !== g.ny) this.view = { x0: 0, x1: g.nx, y0: 0, y1: g.ny };
    const vm = this.vm();
    this.vmin = vm.min ?? g.min;
    this.vmax = vm.max ?? g.max;
    if (resetRange || !prev) this.range = vm.range ? [...vm.range] : [this.vmin, this.vmax];
    this.hover = -1;
    this.recolor();
    this.renderVisual();
    this.measureLabels();
    this.layout();
    const a = o.animation ?? true;
    this.animStart = animate && a !== false ? performance.now() : 0;
    this.dirty = true;
    this.loop();
  }

  /** Color bucket of every cell, the bucket colors and the drawing order. */
  private recolor(): void {
    const vm = this.vm();
    const g = this.grid;
    const fmt = vm.format ?? ((v: number) => formatCompact(v));
    this.pieces = vm.pieces ?? (vm.splitNumber ? splitPieces(this.vmin, this.vmax, vm.splitNumber, this.colors(), fmt) : null);
    const n = g.values.length;
    if (this.bucket.length !== n) this.bucket = new Int16Array(n);
    const b = this.bucket;
    let count: number;
    if (this.pieces) {
      const pieces = this.pieces;
      this.lut = pieces.map((p) => p.color);
      for (let i = 0; i < n; i++) {
        const v = g.values[i];
        b[i] = v === v ? heatPieceOf(pieces, v, this.vmax) : -1;
      }
      count = pieces.length;
    } else {
      const colors = this.colors();
      this.lut = Array.from({ length: STEPS }, (_, k) => gradientAt(colors, k / (STEPS - 1)));
      const lo = this.vmin;
      const k = (STEPS - 1) / (this.vmax - this.vmin || 1);
      for (let i = 0; i < n; i++) {
        const v = g.values[i];
        b[i] = v === v ? clamp(Math.round((v - lo) * k), 0, STEPS - 1) : -1;
      }
      count = STEPS;
    }
    for (const [i, d] of g.datums) if (d.color) b[i] = OWN;
    this.ink = this.lut.map(inkOn);
    ({ order: this.order, start: this.start } = bucketOrder(b, count));
  }

  /** A cell switched off by the legend (piece off, or out of the handles' range). */
  private hidden(i: number): boolean {
    const b = this.bucket[i];
    if (b === OWN) return false;
    if (this.pieces) return b < 0 || this.off.has(b);
    const v = this.grid.values[i];
    return v < this.range[0] || v > this.range[1];
  }

  private fillOf(i: number): string {
    const b = this.bucket[i];
    if (b === OWN) return this.grid.datums.get(i)!.color!;
    if (b < 0 || this.hidden(i)) return this.emptyColor();
    return this.lut[b];
  }

  // ------------------------------------------------------------------ visualMap legend

  private renderVisual(): void {
    const vm = this.vm();
    const el = this.vmEl;
    const show = this.opts.visualMap !== false && vm.show !== false && (!!this.pieces || this.vmax > this.vmin);
    el.style.display = show ? '' : 'none';
    const pos = vm.position ?? 'bottom';
    const vert = pos === 'right';
    this.bodyEl.className = `hm-body hm-vm-${pos}`;
    if (!show) {
      el.innerHTML = '';
      return;
    }
    const fmt = vm.format ?? ((v: number) => formatCompact(v));
    const interactive = vm.interactive !== false;
    const title = vm.title ? `<span class="hm-vm__title">${esc(vm.title)}</span>` : '';
    if (this.pieces) {
      el.className = `hm-vm hm-vm--pieces${interactive ? ' is-interactive' : ''}`;
      el.innerHTML =
        title +
        this.pieces
          .map((p, i) => {
            const label = p.label ?? (p.value !== undefined ? fmt(p.value) : p.min === undefined ? `< ${fmt(p.max!)}` : p.max === undefined ? `≥ ${fmt(p.min)}` : `${fmt(p.min)} – ${fmt(p.max)}`);
            return `<button type="button" class="hm-vm__piece${this.off.has(i) ? ' is-off' : ''}" data-i="${i}"><i style="background:${p.color}"></i>${esc(label)}</button>`;
          })
          .join('');
      return;
    }
    const span = this.vmax - this.vmin || 1;
    const t0 = clamp((this.range[0] - this.vmin) / span, 0, 1);
    const t1 = clamp((this.range[1] - this.vmin) / span, 0, 1);
    const at = (t: number): string => (vert ? `bottom:${t * 100}%` : `left:${t * 100}%`);
    const handles = interactive
      ? `<div class="hm-vm__handle" data-h="0" style="${at(t0)}">${t0 > 0.001 ? `<span>${esc(fmt(this.range[0]))}</span>` : ''}</div>` +
        `<div class="hm-vm__handle" data-h="1" style="${at(t1)}">${t1 < 0.999 ? `<span>${esc(fmt(this.range[1]))}</span>` : ''}</div>`
      : '';
    el.className = `hm-vm${interactive ? ' is-interactive' : ''}`;
    el.innerHTML = `${title}<span class="hm-vm__end">${esc(fmt(vert ? this.vmax : this.vmin))}</span>
      <div class="hm-vm__track">
        <div class="hm-vm__bar" style="background:linear-gradient(${vert ? 'to top' : 'to right'},${this.colors().join(',')})"></div>
        <div class="hm-vm__mask" style="${vert ? `bottom:0;height:${t0 * 100}%` : `left:0;width:${t0 * 100}%`}"></div>
        <div class="hm-vm__mask" style="${vert ? `top:0;height:${(1 - t1) * 100}%` : `right:0;width:${(1 - t1) * 100}%`}"></div>
        ${handles}
      </div><span class="hm-vm__end">${esc(fmt(vert ? this.vmin : this.vmax))}</span>`;
  }

  private bindVisual(): void {
    const el = this.vmEl;
    el.addEventListener('click', (e) => {
      const b = (e.target as HTMLElement).closest<HTMLElement>('.hm-vm__piece');
      if (!b || this.vm().interactive === false) return;
      const i = Number(b.dataset.i);
      if (this.off.has(i)) this.off.delete(i);
      else this.off.add(i);
      this.renderVisual();
      this.dirty = true;
      this.draw();
    });
    el.addEventListener('pointerdown', (e) => {
      const vm = this.vm();
      if (this.pieces || vm.interactive === false) return;
      const track = el.querySelector<HTMLElement>('.hm-vm__track');
      if (!track || !(e.target as HTMLElement).closest('.hm-vm__track')) return;
      const vert = vm.position === 'right';
      const valueAt = (ev: PointerEvent): number => {
        // the legend is re-rendered while dragging: measure the current track
        const r = (el.querySelector<HTMLElement>('.hm-vm__track') ?? track).getBoundingClientRect();
        const t = vert ? 1 - (ev.clientY - r.top) / r.height : (ev.clientX - r.left) / r.width;
        return this.vmin + clamp(t, 0, 1) * (this.vmax - this.vmin);
      };
      const h = (e.target as HTMLElement).closest<HTMLElement>('.hm-vm__handle');
      const v0 = valueAt(e);
      // a handle moves its end; the bar moves the nearest end
      let which = h ? Number(h.dataset.h) : Math.abs(v0 - this.range[0]) < Math.abs(v0 - this.range[1]) ? 0 : 1;
      e.preventDefault();
      el.setPointerCapture(e.pointerId);
      const move = (ev: PointerEvent): void => {
        const r: [number, number] = [...this.range];
        r[which] = valueAt(ev);
        if (r[0] > r[1]) {
          r.reverse();
          which = 1 - which;
        }
        this.range = r;
        this.renderVisual();
        this.dirty = true;
        this.draw();
      };
      move(e);
      const up = (): void => {
        el.removeEventListener('pointermove', move);
        el.removeEventListener('pointerup', up);
        el.removeEventListener('pointercancel', up);
      };
      el.addEventListener('pointermove', move);
      el.addEventListener('pointerup', up);
      el.addEventListener('pointercancel', up);
    });
  }

  // ------------------------------------------------------------------ layout

  private measure(): void {
    const r = this.plotEl.getBoundingClientRect();
    this.dpr = window.devicePixelRatio || 1;
    this.width = Math.max(1, Math.floor(r.width));
    this.height = Math.max(1, Math.floor(r.height));
    for (const c of [this.canvas, this.layer]) {
      c.width = Math.round(this.width * this.dpr);
      c.height = Math.round(this.height * this.dpr);
    }
    this.canvas.style.width = `${this.width}px`;
    this.canvas.style.height = `${this.height}px`;
  }

  private font(size: number, weight: number | string = 400): string {
    return `${weight} ${size}px ${this.theme.font}`;
  }

  private axisText(which: 'x' | 'y', i: number): string {
    const axis = (which === 'x' ? this.opts.xAxis : this.opts.yAxis) ?? {};
    const name = (which === 'x' ? this.grid.xNames : this.grid.yNames)[i] ?? i;
    return axis.format ? axis.format(name, i) : String(name);
  }

  /** Widest label of each axis. */
  private measureLabels(): void {
    const ctx = this.lctx;
    const X = this.opts.xAxis ?? {};
    const Y = this.opts.yAxis ?? {};
    let w = 0;
    ctx.font = this.font(X.fontSize ?? 11);
    for (let i = 0; i < this.grid.nx; i++) w = Math.max(w, ctx.measureText(this.axisText('x', i)).width);
    this.xMaxW = w;
    w = 0;
    ctx.font = this.font(Y.fontSize ?? 11);
    for (let i = 0; i < this.grid.ny; i++) w = Math.max(w, ctx.measureText(this.axisText('y', i)).width);
    this.yMaxW = w;
  }

  /** Plot box, label rotation and thinning. */
  private layout(): void {
    const o = this.opts;
    const g = this.grid;
    const pad = o.padding ?? 10;
    const X: HeatmapAxis = o.xAxis ?? {};
    const Y: HeatmapAxis = o.yAxis ?? {};
    const xShow = X.show !== false && g.nx > 0;
    const yShow = Y.show !== false && g.ny > 0;
    const xfs = X.fontSize ?? 11;
    const yfs = Y.fontSize ?? 11;
    const nx = Math.max(1, g.nx);
    const ny = Math.max(1, g.ny);
    const yW = yShow ? Math.min(this.yMaxW, this.width * 0.3) + 8 : 0;
    const left0 = pad + (Y.name ? 18 : 0) + yW;
    const top = pad + (yShow ? Math.ceil(yfs / 2) : 0);
    const right = pad + (xShow ? 4 : 0);
    const xTitle = X.name ? 18 : 0;
    let left = left0;
    let plan: Plan = { rotate: 0, step: 1 };
    let xH = 0;
    let w = 1;
    let h = 1;
    let cw = 1;
    let ch = 1;
    // the label rotation changes the room under the grid, which changes the cells: settle in a few passes
    for (let pass = 0; pass < 3; pass++) {
      w = Math.max(10, this.width - left - right);
      h = Math.max(10, this.height - top - pad - xH - xTitle);
      cw = w / nx;
      ch = h / ny;
      if (o.square) cw = ch = Math.min(cw, ch);
      if (!xShow) break;
      plan = axisLabelPlan(cw, this.xMaxW, xfs, X.rotate ?? 'auto');
      const r = (plan.rotate * Math.PI) / 180;
      // long rotated labels are cut to a third of the height
      this.xLabelMax = r ? Math.min(this.xMaxW, (this.height * 0.3) / Math.sin(Math.abs(r))) : Math.max(cw * plan.step - 4, this.xMaxW);
      xH = (r ? this.xLabelMax * Math.sin(Math.abs(r)) + xfs * Math.cos(r) : xfs) + 8;
      // the first rotated label hangs to the left of its column
      left = r ? Math.max(left0, pad + this.xLabelMax * Math.cos(r) - cw / 2) : left0;
    }
    w = cw * nx;
    h = ch * ny;
    const availW = Math.max(10, this.width - left - right);
    const availH = Math.max(10, this.height - top - pad - xH - xTitle);
    this.plot = { x: left + (o.square ? (availW - w) / 2 : 0), y: top + (o.square ? (availH - h) / 2 : 0), w, h };
    this.xPlan = plan;
    this.steps();
  }

  /** Every how many categories a label is shown, at the current zoom. */
  private steps(): void {
    const X = this.opts.xAxis ?? {};
    const Y = this.opts.yAxis ?? {};
    const { cw, ch } = this.cellSize();
    this.xPlan = { rotate: this.xPlan.rotate, step: axisLabelPlan(cw, this.xMaxW, X.fontSize ?? 11, this.xPlan.rotate).step };
    this.yStep = labelStep((Y.fontSize ?? 11) + 3, ch);
  }

  private cellSize(): { cw: number; ch: number } {
    return { cw: this.plot.w / (this.view.x1 - this.view.x0 || 1), ch: this.plot.h / (this.view.y1 - this.view.y0 || 1) };
  }

  /** Left edge of column i, px. */
  private colX(i: number, cw: number): number {
    return this.opts.xAxis?.inverse ? this.plot.x + (this.view.x1 - i - 1) * cw : this.plot.x + (i - this.view.x0) * cw;
  }

  /** Top edge of row j, px (row 0 at the bottom unless inverse). */
  private rowY(j: number, ch: number): number {
    return this.opts.yAxis?.inverse ? this.plot.y + (j - this.view.y0) * ch : this.plot.y + (this.view.y1 - j - 1) * ch;
  }

  /** Cell index under a point, or -1. */
  private indexAt(x: number, y: number): number {
    const p = this.plot;
    const g = this.grid;
    if (x < p.x || x >= p.x + p.w || y < p.y || y >= p.y + p.h) return -1;
    const { cw, ch } = this.cellSize();
    const f = (x - p.x) / cw;
    const k = (y - p.y) / ch;
    const i = this.opts.xAxis?.inverse ? Math.ceil(this.view.x1 - f) - 1 : Math.floor(this.view.x0 + f);
    const j = this.opts.yAxis?.inverse ? Math.floor(this.view.y0 + k) : Math.ceil(this.view.y1 - k) - 1;
    if (i < 0 || i >= g.nx || j < 0 || j >= g.ny) return -1;
    return j * g.nx + i;
  }

  private info(idx: number): HeatmapCell {
    const g = this.grid;
    const i = idx % g.nx;
    const j = Math.floor(idx / g.nx);
    const v = g.values[idx];
    const { cw, ch } = this.cellSize();
    return {
      x: i,
      y: j,
      xName: this.axisText('x', i),
      yName: this.axisText('y', j),
      value: v === v ? v : null,
      color: this.fillOf(idx),
      datum: g.datums.get(idx) ?? null,
      box: { x: this.colX(i, cw), y: this.rowY(j, ch), w: cw, h: ch },
    };
  }

  // ------------------------------------------------------------------ drawing

  private duration(): number {
    const a = this.opts.animation ?? true;
    return a === false ? 0 : typeof a === 'object' ? (a.duration ?? 700) : 700;
  }

  private progress(now: number): number {
    if (!this.animStart) return 1;
    return clamp((now - this.animStart) / (this.duration() || 1), 0, 1);
  }

  private loop(): void {
    cancelAnimationFrame(this.raf);
    if (this.destroyed) return;
    const now = performance.now();
    const p = this.progress(now);
    // every frame of the entry, the last one included (it adds the labels)
    if (this.animStart) this.dirty = true;
    this.draw(now);
    if (p < 1) this.raf = requestAnimationFrame(() => this.loop());
    else this.animStart = 0;
  }

  private draw(now = performance.now()): void {
    if (this.dirty) {
      this.render(this.lctx, now);
      this.dirty = false;
    }
    const ctx = this.ctx;
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    ctx.drawImage(this.layer, 0, 0);
    ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
    this.drawHover(ctx);
  }

  /** Everything but the hover, on the cached layer. */
  private render(ctx: CanvasRenderingContext2D, now: number): void {
    const t = this.theme;
    ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
    ctx.clearRect(0, 0, this.width, this.height);
    if (t.background !== 'transparent') {
      ctx.fillStyle = t.background;
      ctx.fillRect(0, 0, this.width, this.height);
    }
    if (this.grid.nx && this.grid.ny) {
      ctx.save();
      ctx.beginPath();
      ctx.rect(this.plot.x, this.plot.y, this.plot.w, this.plot.h);
      ctx.clip();
      this.drawCells(ctx, this.progress(now));
      ctx.restore();
    }
    this.drawAxes(ctx);
  }

  private drawCells(ctx: CanvasRenderingContext2D, p: number): void {
    const o = this.opts;
    const g = this.grid;
    const nx = g.nx;
    const { cw, ch } = this.cellSize();
    const c = o.cell ?? {};
    const gap = Math.min(c.gap ?? 0, cw / 2, ch / 2);
    const radius = Math.min(c.radius ?? 0, (cw - gap) / 2, (ch - gap) / 2);
    const bw = c.borderWidth ?? 0;
    // visible columns / rows and their pixel-snapped edges (no seams between cells)
    const i0 = Math.max(0, Math.floor(this.view.x0));
    const i1 = Math.min(nx - 1, Math.ceil(this.view.x1) - 1);
    const j0 = Math.max(0, Math.floor(this.view.y0));
    const j1 = Math.min(g.ny - 1, Math.ceil(this.view.y1) - 1);
    if (i1 < i0 || j1 < j0) return;
    const dpr = this.dpr;
    const snap = (v: number): number => Math.round(v * dpr) / dpr;
    const xs = new Float64Array(i1 - i0 + 1);
    const xw = new Float64Array(i1 - i0 + 1);
    const ys = new Float64Array(j1 - j0 + 1);
    const yh = new Float64Array(j1 - j0 + 1);
    for (let i = i0; i <= i1; i++) {
      const a = this.colX(i, cw);
      xs[i - i0] = snap(a) + gap / 2;
      xw[i - i0] = Math.max(0, snap(a + cw) - snap(a) - gap);
    }
    for (let j = j0; j <= j1; j++) {
      const a = this.rowY(j, ch);
      ys[j - j0] = snap(a) + gap / 2;
      yh[j - j0] = Math.max(0, snap(a + ch) - snap(a) - gap);
    }
    // entry: cells grow from their center in a diagonal wave
    const span = nx + g.ny - 2 || 1;
    const grow = p >= 1 ? null : (i: number, j: number): number => easeOut(clamp(p * 1.6 - ((i + j) / span) * 0.6, 0, 1));
    const put = (idx: number, path: boolean): void => {
      const i = idx % nx;
      const j = (idx - i) / nx;
      if (i < i0 || i > i1 || j < j0 || j > j1) return;
      let x = xs[i - i0];
      let y = ys[j - j0];
      let w = xw[i - i0];
      let h = yh[j - j0];
      if (grow) {
        const e = grow(i, j);
        x += (w * (1 - e)) / 2;
        y += (h * (1 - e)) / 2;
        w *= e;
        h *= e;
      }
      if (radius > 0.5) ctx.roundRect(x, y, w, h, Math.min(radius, w / 2, h / 2));
      else if (path) ctx.rect(x, y, w, h);
      else ctx.fillRect(x, y, w, h);
    };
    const path = radius > 0.5;

    // empty and filtered cells
    const empty = this.emptyColor();
    if (empty !== 'transparent') {
      ctx.fillStyle = empty;
      ctx.beginPath();
      for (let j = j0; j <= j1; j++)
        for (let i = i0; i <= i1; i++) {
          const idx = j * nx + i;
          if (this.bucket[idx] === OWN) continue;
          if (this.bucket[idx] < 0 || this.hidden(idx)) put(idx, true);
        }
      ctx.fill();
    }
    // one fill color per bucket
    const nb = this.start.length - 1;
    for (let b = 0; b < nb; b++) {
      const s = this.start[b];
      const e = this.start[b + 1];
      if (s === e || (this.pieces && this.off.has(b))) continue;
      ctx.fillStyle = this.lut[b];
      if (path) ctx.beginPath();
      for (let k = s; k < e; k++) {
        const idx = this.order[k];
        if (!this.pieces && this.hidden(idx)) continue;
        put(idx, path);
      }
      if (path) ctx.fill();
    }
    // cells with their own color
    for (const [idx, d] of g.datums) {
      if (!d.color) continue;
      ctx.fillStyle = d.color;
      ctx.beginPath();
      put(idx, true);
      ctx.fill();
    }
    if (bw > 0) {
      ctx.strokeStyle = c.borderColor ?? this.theme.background;
      ctx.lineWidth = bw;
      ctx.beginPath();
      for (let j = j0; j <= j1; j++) for (let i = i0; i <= i1; i++) put(j * nx + i, true);
      ctx.stroke();
    }
    if (p >= 1) this.drawLabels(ctx, i0, i1, j0, j1, xs, xw, ys, yh);
  }

  private drawLabels(ctx: CanvasRenderingContext2D, i0: number, i1: number, j0: number, j1: number, xs: Float64Array, xw: Float64Array, ys: Float64Array, yh: Float64Array): void {
    const lo = this.opts.label;
    if (!lo) return;
    const L: HeatmapLabelOptions = lo === true ? {} : lo;
    if (L.show === false) return;
    const { cw, ch } = this.cellSize();
    const size = L.fontSize ?? clamp(Math.min(cw * 0.42, ch * 0.45), 8, 13);
    // too small to read: no labels at all (keeps 20K cells fast)
    if (ch < size + 2 || cw < size * 1.6) return;
    const g = this.grid;
    ctx.font = this.font(size, 600);
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    for (let j = j0; j <= j1; j++)
      for (let i = i0; i <= i1; i++) {
        const idx = j * g.nx + i;
        const v = g.values[idx];
        if (v !== v || this.hidden(idx)) continue;
        const text = L.format ? L.format(v, this.info(idx)) : this.fmt(v);
        if (!text) continue;
        const w = xw[i - i0];
        if (ctx.measureText(text).width > w - 3) continue;
        const b = this.bucket[idx];
        ctx.fillStyle = L.color ?? (b === OWN ? inkOn(g.datums.get(idx)!.color!) : this.ink[b]);
        ctx.fillText(text, xs[i - i0] + w / 2, ys[j - j0] + yh[j - j0] / 2 + 0.5);
      }
  }

  private drawAxes(ctx: CanvasRenderingContext2D): void {
    const o = this.opts;
    const t = this.theme;
    const g = this.grid;
    const p = this.plot;
    const X: HeatmapAxis = o.xAxis ?? {};
    const Y: HeatmapAxis = o.yAxis ?? {};
    const { cw, ch } = this.cellSize();
    const xfs = X.fontSize ?? 11;
    const yfs = Y.fontSize ?? 11;
    const pad = o.padding ?? 10;
    let xH = 0;
    if (X.show !== false && g.nx) {
      ctx.fillStyle = X.color ?? t.muted;
      ctx.font = this.font(xfs);
      const r = (this.xPlan.rotate * Math.PI) / 180;
      const step = this.xPlan.step;
      const y = p.y + p.h + 6;
      for (let i = Math.max(0, Math.floor(this.view.x0)); i < Math.min(g.nx, Math.ceil(this.view.x1)); i++) {
        if (i % step) continue;
        const cx = this.colX(i, cw) + cw / 2;
        if (cx < p.x - 0.5 || cx > p.x + p.w + 0.5) continue;
        const text = this.axisText('x', i);
        if (r) {
          ctx.save();
          ctx.translate(cx, y);
          ctx.rotate(-r);
          ctx.textAlign = 'right';
          ctx.textBaseline = 'middle';
          ctx.fillText(text, 0, 0, this.xLabelMax);
          ctx.restore();
        } else {
          ctx.textAlign = 'center';
          ctx.textBaseline = 'top';
          ctx.fillText(text, cx, y, this.xLabelMax);
        }
      }
      xH = (r ? this.xLabelMax * Math.sin(Math.abs(r)) + xfs * Math.cos(r) : xfs) + 8;
    }
    if (Y.show !== false && g.ny) {
      ctx.fillStyle = Y.color ?? t.muted;
      ctx.font = this.font(yfs);
      ctx.textAlign = 'right';
      ctx.textBaseline = 'middle';
      const maxW = Math.min(this.yMaxW, this.width * 0.3);
      for (let j = Math.max(0, Math.floor(this.view.y0)); j < Math.min(g.ny, Math.ceil(this.view.y1)); j++) {
        if (j % this.yStep) continue;
        const cy = this.rowY(j, ch) + ch / 2;
        if (cy < p.y - 0.5 || cy > p.y + p.h + 0.5) continue;
        ctx.fillText(this.axisText('y', j), p.x - 6, cy, maxW);
      }
    }
    // axis lines
    ctx.strokeStyle = t.axis;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(p.x, Math.round(p.y + p.h) + 0.5);
    ctx.lineTo(p.x + p.w, Math.round(p.y + p.h) + 0.5);
    ctx.moveTo(Math.round(p.x) - 0.5, p.y);
    ctx.lineTo(Math.round(p.x) - 0.5, p.y + p.h);
    ctx.stroke();
    // axis titles
    ctx.fillStyle = t.text;
    ctx.font = this.font(12, 600);
    if (X.name) {
      ctx.textAlign = 'center';
      ctx.textBaseline = 'top';
      ctx.fillText(X.name, p.x + p.w / 2, p.y + p.h + xH + 2);
    }
    if (Y.name) {
      ctx.save();
      ctx.translate(pad + 7, p.y + p.h / 2);
      ctx.rotate(-Math.PI / 2);
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(Y.name, 0, 0);
      ctx.restore();
    }
  }

  /** Hovered cell, and its row / column with `emphasis`. */
  private drawHover(ctx: CanvasRenderingContext2D): void {
    const idx = this.hover;
    if (idx < 0 || this.drag) return;
    const g = this.grid;
    const i = idx % g.nx;
    const j = Math.floor(idx / g.nx);
    const { cw, ch } = this.cellSize();
    const p = this.plot;
    const x = this.colX(i, cw);
    const y = this.rowY(j, ch);
    const em = this.opts.emphasis ?? 'cell';
    if (em === false) return;
    ctx.save();
    ctx.beginPath();
    ctx.rect(p.x, p.y, p.w, p.h);
    ctx.clip();
    // veil over everything but the row / column: a 3 × 3 split of the plot around the cell
    if (em !== 'cell') {
      const row = em === 'row' || em === 'cross';
      const col = em === 'column' || em === 'cross';
      const xs = [p.x, x, x + cw, p.x + p.w];
      const ys = [p.y, y, y + ch, p.y + p.h];
      ctx.fillStyle = this.theme.emphasis;
      for (let a = 0; a < 3; a++)
        for (let b = 0; b < 3; b++) {
          if ((a === 1 && b === 1) || (row && b === 1) || (col && a === 1)) continue;
          ctx.fillRect(xs[a], ys[b], xs[a + 1] - xs[a], ys[b + 1] - ys[b]);
        }
    }
    const gap = Math.min(this.opts.cell?.gap ?? 0, cw / 2, ch / 2);
    const lw = cw - gap > 6 && ch - gap > 6 ? 2 : 1;
    // outline in the color that reads on the cell
    const fill = this.fillOf(idx);
    ctx.strokeStyle = fill === this.emptyColor() ? this.theme.text : inkOn(fill);
    ctx.lineWidth = lw;
    const r = Math.min(this.opts.cell?.radius ?? 0, (cw - gap) / 2, (ch - gap) / 2);
    ctx.beginPath();
    const bx = x + gap / 2 + lw / 2;
    const by = y + gap / 2 + lw / 2;
    const bw = Math.max(1, cw - gap - lw);
    const bh = Math.max(1, ch - gap - lw);
    if (r > 0.5) ctx.roundRect(bx, by, bw, bh, r);
    else ctx.rect(bx, by, bw, bh);
    ctx.stroke();
    ctx.restore();
  }

  // ------------------------------------------------------------------ interaction

  private zoomable(which: 'x' | 'y'): boolean {
    const z = this.opts.zoom;
    return z === true || z === which;
  }

  /** Keep the view inside the grid, at least one cell wide. */
  private clampView(): void {
    const v = this.view;
    const fix = (a: number, b: number, n: number): [number, number] => {
      const span = clamp(b - a, Math.min(1, n), n);
      const lo = clamp(a, 0, n - span);
      return [lo, lo + span];
    };
    [v.x0, v.x1] = fix(v.x0, v.x1, this.grid.nx);
    [v.y0, v.y1] = fix(v.y0, v.y1, this.grid.ny);
  }

  private afterZoom(): void {
    this.clampView();
    this.steps();
    this.dirty = true;
    this.draw();
    const v = this.view;
    this.emit('zoom', { x: [v.x0, v.x1], y: [v.y0, v.y1] });
  }

  private bind(): void {
    const c = this.canvas;
    const pos = (e: MouseEvent): { x: number; y: number } => {
      const r = c.getBoundingClientRect();
      return { x: e.clientX - r.left, y: e.clientY - r.top };
    };
    const setHover = (idx: number, e: PointerEvent | null): void => {
      if (idx !== this.hover) {
        this.hover = idx;
        this.emit('hover', idx < 0 ? null : this.info(idx));
        this.draw();
      }
      if (e && idx >= 0) this.showTooltip(idx, e);
      else this.tooltipEl.classList.remove('is-visible');
    };
    c.addEventListener('pointermove', (e) => {
      const { x, y } = pos(e);
      const d = this.drag;
      if (d) {
        const dx = x - d.x;
        const dy = y - d.y;
        if (Math.abs(dx) + Math.abs(dy) > 3) d.moved = true;
        if (!d.moved) return;
        const { cw, ch } = this.cellSize();
        const v = { ...d.view };
        if (this.zoomable('x')) {
          const k = (dx / cw) * (this.opts.xAxis?.inverse ? -1 : 1);
          v.x0 = d.view.x0 - k;
          v.x1 = d.view.x1 - k;
        }
        if (this.zoomable('y')) {
          const k = (dy / ch) * (this.opts.yAxis?.inverse ? -1 : 1);
          v.y0 = d.view.y0 + k;
          v.y1 = d.view.y1 + k;
        }
        this.view = v;
        c.style.cursor = 'grabbing';
        this.tooltipEl.classList.remove('is-visible');
        this.afterZoom();
        return;
      }
      if (this.progress(performance.now()) < 1) return;
      const idx = this.indexAt(x, y);
      const shown = idx >= 0 && this.grid.values[idx] === this.grid.values[idx] && !this.hidden(idx) ? idx : -1;
      c.style.cursor = shown >= 0 ? 'pointer' : this.opts.zoom && idx >= 0 ? 'grab' : '';
      setHover(shown, e);
    });
    c.addEventListener('pointerleave', () => {
      if (!this.drag) setHover(-1, null);
    });
    c.addEventListener('pointerdown', (e) => {
      if (!this.opts.zoom) return;
      const { x, y } = pos(e);
      if (this.indexAt(x, y) < 0) return;
      this.drag = { x, y, view: { ...this.view }, moved: false };
      c.setPointerCapture(e.pointerId);
    });
    const end = (): void => {
      if (!this.drag) return;
      this.justDragged = this.drag.moved;
      this.drag = null;
      c.style.cursor = '';
      this.draw();
    };
    c.addEventListener('pointerup', end);
    c.addEventListener('pointercancel', end);
    c.addEventListener('click', (e) => {
      if (this.justDragged) {
        this.justDragged = false;
        return;
      }
      const { x, y } = pos(e);
      const idx = this.indexAt(x, y);
      if (idx >= 0 && this.grid.values[idx] === this.grid.values[idx] && !this.hidden(idx)) this.emit('click', this.info(idx));
    });
    c.addEventListener(
      'wheel',
      (e) => {
        if (!this.opts.zoom) return;
        const { x, y } = pos(e);
        const p = this.plot;
        if (x < p.x || x > p.x + p.w || y < p.y || y > p.y + p.h) return;
        e.preventDefault();
        const k = Math.exp(e.deltaY * 0.0015);
        const v = this.view;
        if (this.zoomable('x')) {
          let f = (x - p.x) / p.w;
          if (this.opts.xAxis?.inverse) f = 1 - f;
          const m = v.x0 + f * (v.x1 - v.x0);
          const span = clamp((v.x1 - v.x0) * k, Math.min(1, this.grid.nx), this.grid.nx);
          v.x0 = m - f * span;
          v.x1 = v.x0 + span;
        }
        if (this.zoomable('y')) {
          let f = (p.y + p.h - y) / p.h;
          if (this.opts.yAxis?.inverse) f = 1 - f;
          const m = v.y0 + f * (v.y1 - v.y0);
          const span = clamp((v.y1 - v.y0) * k, Math.min(1, this.grid.ny), this.grid.ny);
          v.y0 = m - f * span;
          v.y1 = v.y0 + span;
        }
        this.hover = -1;
        this.tooltipEl.classList.remove('is-visible');
        this.afterZoom();
      },
      { passive: false },
    );
    c.addEventListener('dblclick', () => {
      const v = this.view;
      if (this.opts.zoom && (v.x0 > 0 || v.x1 < this.grid.nx || v.y0 > 0 || v.y1 < this.grid.ny)) this.resetZoom();
    });
  }

  private showTooltip(idx: number, e: PointerEvent): void {
    const tt = this.opts.tooltip ?? true;
    const el = this.tooltipEl;
    if (tt === false || (typeof tt === 'object' && tt.show === false)) {
      el.classList.remove('is-visible');
      return;
    }
    const cell = this.info(idx);
    if (typeof tt === 'object' && tt.formatter) el.innerHTML = tt.formatter(cell);
    else {
      const X = this.opts.xAxis ?? {};
      const Y = this.opts.yAxis ?? {};
      const fmt = this.opts.valueFormatter ?? ((v: number) => v.toLocaleString('pt-PT', { maximumFractionDigits: 4 }));
      el.innerHTML =
        `<div class="hm-tooltip__row"><span>${esc(X.name ?? 'X')}</span><b>${esc(cell.xName)}</b></div>` +
        `<div class="hm-tooltip__row"><span>${esc(Y.name ?? 'Y')}</span><b>${esc(cell.yName)}</b></div>` +
        `<div class="hm-tooltip__row"><span><i class="hm-tooltip__dot" style="background:${cell.color}"></i>Valor</span><b>${esc(cell.value === null ? '–' : fmt(cell.value))}</b></div>` +
        (cell.datum?.label ? `<div class="hm-tooltip__row"><span>${esc(cell.datum.label)}</span></div>` : '');
    }
    el.classList.add('is-visible');
    const r = this.plotEl.getBoundingClientRect();
    const x = e.clientX - r.left;
    const y = e.clientY - r.top;
    const w = el.offsetWidth;
    const h = el.offsetHeight;
    const left = x + 14 + w > this.width ? x - 14 - w : x + 14;
    const top = clamp(y + 14 + h > this.height ? y - 14 - h : y + 14, 0, Math.max(0, this.height - h));
    el.style.transform = `translate(${Math.max(0, left)}px, ${top}px)`;
  }
}

export function createHeatmapChart(container: HTMLElement, options: HeatmapOptions = {}): HeatmapChart {
  return new HeatmapChart(container, options);
}
