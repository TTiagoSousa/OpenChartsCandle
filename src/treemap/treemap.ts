import { formatCompact } from '../shared/format';
import { adjust, gradientAt, luminance, parseColor, shade } from '../shared/color';
import { inset, squarify, type Box } from './layout';
import { collapse, contains, lerpShape, mapShape, tracePath, type RectShape, type Shape } from './shape';
import { sectorTextRoom, sunburstRings, sunLength, traceRoundSector, uprightAngle } from './sunburst';
import { buildTree, findNode, isAncestor, walk, type TNode } from './tree';
import type {
  TreeNode,
  TreemapEvent,
  TreemapItemStyle,
  TreemapLabelOptions,
  TreemapLevel,
  TreemapNodeInfo,
  TreemapOptions,
  TreemapTheme,
  TreemapType,
  TreemapUpperLabelOptions,
} from './types';

const FONT = '-apple-system, BlinkMacSystemFont, "Trebuchet MS", Roboto, Ubuntu, sans-serif';

export const treemapDarkTheme: TreemapTheme = {
  background: '#131722',
  text: '#d1d4dc',
  muted: '#787b86',
  labelDark: '#131722',
  labelLight: '#ffffff',
  tooltipBg: '#1e222d',
  tooltipText: '#d1d4dc',
  tooltipBorder: '#2a2e39',
  font: FONT,
};

export const treemapLightTheme: TreemapTheme = {
  background: '#ffffff',
  text: '#131722',
  muted: '#787b86',
  labelDark: '#131722',
  labelLight: '#ffffff',
  tooltipBg: '#ffffff',
  tooltipText: '#131722',
  tooltipBorder: '#e0e3eb',
  font: FONT,
};

export const TREEMAP_COLORS = ['#2962ff', '#089981', '#ff9800', '#f23645', '#9c27b0', '#00bcd4', '#e91e63', '#8bc34a', '#ffc107', '#607d8b'];

/** Diverging red → grey → green, for changes (e.g. a market map colored by % change). */
export const CHANGE_COLORS = ['#f23645', '#5d606b', '#089981'];

const esc = (s: string): string => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const easeInOut = (t: number): number => (t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2);
const CRUMB_H = 28;
// room taken by the visualMap's color bar: at the side, or below
const VM_W = 64;
const VM_H = 34;

/** A node as laid out: its final shape and how it is painted. */
interface Item {
  n: TNode;
  shape: Shape;
  /** children not shown (painted with its own color and label) */
  leaf: boolean;
  /** height of the header with the name (treemap parents) */
  header: number;
  fill: string;
  /** the center disc of a zoomed sunburst */
  hub?: boolean;
  /** rounded corners: `[inner, outer]` on a sector, `[_, r]` on a rectangle */
  radius?: [number, number];
  /** outline `[width, color]` */
  stroke?: [number, string];
  /** own opacity (itemStyle) */
  opacity?: number;
}

interface Track {
  it: Item;
  from: Shape;
  to: Shape;
  a0: number;
  a1: number;
}

/**
 * Treemap and sunburst of a tree: squarified rectangles or rings of sectors, colors by level
 * (palette, saturation / lightness or a gradient by value), labels and parent headers,
 * click to zoom in with breadcrumb, tooltip and animated transitions (zoom, data, treemap ↔ sunburst).
 */
export class TreemapChart {
  readonly root: HTMLElement;
  readonly canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private tooltipEl: HTMLElement;
  private crumbsEl: HTMLElement;
  private vmEl: HTMLElement;
  /** value range of the visualMap */
  private vmRange: [number, number] = [0, 1];
  /** center and hole of the sunburst as laid out */
  private hole = { cx: 0, cy: 0, r: 0 };
  private opts: TreemapOptions;
  private theme!: TreemapTheme;
  private tree!: TNode;
  private zoom!: TNode;
  private items: Item[] = [];
  private tracks: Track[] | null = null;
  private animStart = 0;
  private animDur = 0;
  private raf = 0;
  private hovered: TNode | null = null;
  private width = 0;
  private height = 0;
  private dpr = 1;
  private area: Box = { x: 0, y: 0, w: 0, h: 0 };
  private handlers = new Map<TreemapEvent, Set<(v: unknown) => void>>();
  private ro: ResizeObserver;

  constructor(container: HTMLElement, options: TreemapOptions) {
    this.opts = { ...options };
    this.root = container;
    container.classList.add('tm-root');
    this.canvas = document.createElement('canvas');
    this.canvas.className = 'tm-canvas';
    this.canvas.setAttribute('role', 'img');
    this.ctx = this.canvas.getContext('2d')!;
    this.tooltipEl = document.createElement('div');
    this.tooltipEl.className = 'tm-tooltip';
    this.crumbsEl = document.createElement('div');
    this.crumbsEl.className = 'tm-crumbs';
    this.vmEl = document.createElement('div');
    this.vmEl.className = 'tm-vmap';
    container.append(this.canvas, this.crumbsEl, this.vmEl, this.tooltipEl);
    this.applyLook();
    this.rebuild();
    this.bind();
    this.ro = new ResizeObserver(() => this.resize());
    this.ro.observe(container);
    this.resize(true);
  }

  // ------------------------------------------------------------------ public API

  get type(): TreemapType {
    return this.opts.type ?? 'treemap';
  }

  /** The node the chart is zoomed into (null = everything). */
  get zoomed(): TreemapNodeInfo | null {
    return this.zoom === this.tree ? null : this.info(this.zoom);
  }

  /** New data: nodes with the same id move to their new place. */
  setData(data: TreeNode[], animate = true): void {
    this.opts.data = data;
    this.rebuild();
    this.relayout(animate);
  }

  /** Change options after creation (sizes, colors and shapes animate). */
  setOptions(patch: Partial<TreemapOptions>, animate = true): void {
    this.opts = { ...this.opts, ...patch };
    this.applyLook();
    this.rebuild();
    this.relayout(animate);
  }

  /** Switch between treemap and sunburst; every node morphs into its new shape. */
  setType(type: TreemapType, animate = true): void {
    if (type === this.type) return;
    this.opts.type = type;
    this.relayout(animate);
  }

  /** Zoom into a node by id (the path of names joined by '/' unless the data gives ids); null = everything. */
  zoomTo(id: string | null, animate = true): void {
    const n = id === null ? this.tree : findNode(this.tree, id);
    if (n) this.zoomNode(n.children.length ? n : (n.parent ?? this.tree), animate);
  }

  /** One level up. */
  zoomOut(animate = true): void {
    if (this.zoom.parent) this.zoomNode(this.zoom.parent, animate);
  }

  /** Info about a node by id. */
  node(id: string): TreemapNodeInfo | null {
    const n = findNode(this.tree, id);
    return n ? this.info(n) : null;
  }

  on(event: 'click', handler: (info: TreemapNodeInfo) => void): () => void;
  on(event: 'hover', handler: (info: TreemapNodeInfo | null) => void): () => void;
  on(event: 'zoom', handler: (info: TreemapNodeInfo | null) => void): () => void;
  on(event: TreemapEvent, handler: (v: never) => void): () => void {
    if (!this.handlers.has(event)) this.handlers.set(event, new Set());
    const h = handler as (v: unknown) => void;
    this.handlers.get(event)!.add(h);
    return () => this.handlers.get(event)?.delete(h);
  }

  screenshot(): string {
    this.draw();
    return this.canvas.toDataURL('image/png');
  }

  destroy(): void {
    cancelAnimationFrame(this.raf);
    this.ro.disconnect();
    this.root.classList.remove('tm-root');
    this.canvas.remove();
    this.tooltipEl.remove();
    this.crumbsEl.remove();
    this.vmEl.remove();
  }

  // ------------------------------------------------------------------ model

  private emit(e: TreemapEvent, v: unknown): void {
    this.handlers.get(e)?.forEach((h) => h(v));
  }

  private applyLook(): void {
    const o = this.opts;
    const base = o.theme === 'light' ? treemapLightTheme : treemapDarkTheme;
    this.theme = { ...base, ...(typeof o.theme === 'object' ? o.theme : {}) };
    if (o.background !== undefined) this.theme.background = o.background;
    const t = this.theme;
    const vars: Record<string, string> = {
      '--tm-bg': t.background,
      '--tm-text': t.text,
      '--tm-muted': t.muted,
      '--tm-tt-bg': t.tooltipBg,
      '--tm-tt-text': t.tooltipText,
      '--tm-tt-border': t.tooltipBorder,
      '--tm-font': t.font,
    };
    for (const [k, v] of Object.entries(vars)) this.root.style.setProperty(k, v);
  }

  private level(depth: number): TreemapLevel {
    return this.opts.levels?.[depth] ?? {};
  }

  private rebuild(): void {
    const o = this.opts;
    const prevZoom = this.zoom?.id;
    this.tree = buildTree(o.data ?? [], { sizeDimension: o.sizeDimension, sort: o.sort, rootName: o.rootName });
    this.colorize();
    this.renderVisual();
    this.zoom = (prevZoom !== undefined && findNode(this.tree, prevZoom)) || this.tree;
    if (!this.zoom.children.length) this.zoom = this.tree;
    this.hovered = null;
  }

  /** Colors: palette for the top level, inherited below, then each level's mapping. */
  private colorize(): void {
    const palette = this.opts.colors?.length ? this.opts.colors : TREEMAP_COLORS;
    const sd = this.opts.sizeDimension ?? 0;
    const vm = this.opts.visualMap?.colors.length ? this.opts.visualMap : null;
    const vd = vm?.dimension ?? sd;
    if (vm) {
      let lo = Infinity;
      let hi = -Infinity;
      walk(this.tree, (n) => {
        const v = n.values[vd];
        if (v === undefined || !Number.isFinite(v)) return;
        lo = Math.min(lo, v);
        hi = Math.max(hi, v);
      });
      if (!Number.isFinite(lo)) [lo, hi] = [0, 1];
      this.vmRange = [vm.min ?? lo, vm.max ?? hi];
    }
    const paint = (parent: TNode): void => {
      const kids = parent.children;
      if (!kids.length) return;
      const lv = this.level(kids[0].depth);
      const dim = lv.visualDimension ?? sd;
      const vis = kids.map((k) => k.values[dim] ?? 0);
      const lo = lv.visualMin ?? Math.min(...vis);
      const hi = lv.visualMax ?? Math.max(...vis);
      const by = lv.colorMappingBy ?? (lv.color ? 'value' : 'index');
      kids.forEach((k, i) => {
        // position of the node among its siblings, 0–1
        const t =
          by === 'index'
            ? kids.length > 1
              ? i / (kids.length - 1)
              : 0.5
            : by === 'id'
              ? ([...k.id].reduce((h, c) => (h * 31 + c.charCodeAt(0)) >>> 0, 7) % 1000) / 999
              : hi > lo
                ? Math.min(1, Math.max(0, (vis[i] - lo) / (hi - lo)))
                : 0.5;
        let c: string;
        const own = k.src?.itemStyle?.color ?? k.src?.color;
        const [vlo, vhi] = this.vmRange;
        if (own) c = own;
        else if (lv.itemStyle?.color) c = lv.itemStyle.color;
        else if (vm) c = gradientAt(vm.colors, vhi > vlo ? ((k.values[vd] ?? vlo) - vlo) / (vhi - vlo) : 0.5);
        else if (lv.color?.length) c = by === 'index' ? lv.color[i % lv.color.length] : gradientAt(lv.color, t);
        else if (k.depth === 0) c = palette[i % palette.length];
        else c = parent.color;
        if (!own && !vm && (lv.colorSaturation || lv.colorLightness || lv.colorAlpha)) {
          const f = (r?: [number, number]): number | undefined => (r ? r[0] + (r[1] - r[0]) * t : undefined);
          c = adjust(c, f(lv.colorSaturation), f(lv.colorLightness), f(lv.colorAlpha));
        }
        k.color = c;
        paint(k);
      });
    };
    this.tree.color = this.theme.muted;
    paint(this.tree);
  }

  private info(n: TNode): TreemapNodeInfo {
    return {
      id: n.id,
      name: n.name,
      path: n.path,
      depth: n.depth,
      value: n.size,
      values: n.values,
      percent: n.parent && n.parent.size ? n.size / n.parent.size : 1,
      totalPercent: this.tree.size ? n.size / this.tree.size : 1,
      color: n.color,
      isLeaf: !n.children.length,
      node: n.src,
    };
  }

  private fmt(v: number, dim = this.opts.sizeDimension ?? 0): string {
    if (this.opts.valueFormatter) return this.opts.valueFormatter(v, dim);
    return Math.abs(v) >= 1e4 ? formatCompact(v, 1) : String(+v.toFixed(Math.abs(v) >= 100 ? 0 : 2));
  }

  /** Label options of a node: global, then its level, then its own. */
  private labelFor(n: TNode): TreemapLabelOptions & { show: boolean } {
    const norm = (l: boolean | TreemapLabelOptions | undefined): TreemapLabelOptions =>
      l === undefined ? {} : l === false ? { show: false } : l === true ? { show: true } : l;
    const m = { ...norm(this.opts.label), ...norm(this.level(n.depth).label), ...norm(n.src?.label) };
    return { ...m, show: m.show !== false };
  }

  /** itemStyle of a node: its level's, then its own. */
  private styleFor(n: TNode): TreemapItemStyle {
    return { ...this.level(n.depth).itemStyle, ...n.src?.itemStyle };
  }

  /** Corners, outline and opacity of a node as an Item. */
  private decorate(n: TNode, corner?: number | [number, number]): Pick<Item, 'radius' | 'stroke' | 'opacity'> {
    const st = this.styleFor(n);
    const r = st.borderRadius ?? corner;
    const bg = this.theme.background;
    return {
      radius: r === undefined ? undefined : typeof r === 'number' ? [r, r] : r,
      stroke: st.borderWidth ? [st.borderWidth, st.borderColor ?? (bg === 'transparent' ? this.theme.muted : bg)] : undefined,
      opacity: st.opacity,
    };
  }

  private upperOpts(depth: number): (TreemapUpperLabelOptions & { height: number }) | null {
    const l = this.level(depth).upperLabel ?? this.opts.upperLabel;
    if (!l || (typeof l === 'object' && l.show === false)) return null;
    return { height: 20, ...(typeof l === 'object' ? l : {}) };
  }

  // ------------------------------------------------------------------ layout

  private get showCrumbs(): boolean {
    const b = this.opts.breadcrumb;
    return b !== false && this.opts.drilldown !== false && this.tree.height > 1;
  }

  private resize(first = false): void {
    const r = this.root.getBoundingClientRect();
    this.dpr = window.devicePixelRatio || 1;
    this.width = Math.max(1, Math.floor(r.width));
    this.height = Math.max(1, Math.floor(r.height));
    this.canvas.width = Math.round(this.width * this.dpr);
    this.canvas.height = Math.round(this.height * this.dpr);
    this.canvas.style.width = `${this.width}px`;
    this.canvas.style.height = `${this.height}px`;
    this.relayout(first);
  }

  private computeArea(): void {
    const top = typeof this.opts.breadcrumb === 'object' && this.opts.breadcrumb.position === 'top';
    const crumbs = this.showCrumbs;
    this.crumbsEl.style.display = crumbs ? '' : 'none';
    this.crumbsEl.classList.toggle('tm-crumbs--top', top);
    const ch = crumbs ? CRUMB_H : 0;
    this.area = { x: 0, y: top ? ch : 0, w: this.width, h: Math.max(0, this.height - ch) };
    // room for the color bar of the visualMap
    const vm = this.vmShown();
    if (!vm) return;
    const a = this.area;
    if (vm === 'bottom') {
      a.h = Math.max(0, a.h - VM_H);
      this.vmEl.style.bottom = `${(top ? 0 : ch) + 8}px`;
      this.vmEl.style.setProperty('--tm-vm-len', `${Math.round(Math.min(180, Math.max(50, a.w * 0.4)))}px`);
    } else {
      a.w = Math.max(0, a.w - VM_W);
      if (vm === 'left') a.x += VM_W;
      this.vmEl.style.top = `${a.y + a.h / 2}px`;
      this.vmEl.style.setProperty('--tm-vm-len', `${Math.round(Math.min(180, Math.max(40, a.h - 70)))}px`);
    }
  }

  /** Where the visualMap's color bar is, or null when there is none. */
  private vmShown(): 'left' | 'right' | 'bottom' | null {
    const vm = this.opts.visualMap;
    if (!vm?.colors.length || vm.show === false) return null;
    return vm.position ?? 'left';
  }

  private renderVisual(): void {
    const pos = this.vmShown();
    const el = this.vmEl;
    el.style.display = pos ? '' : 'none';
    if (!pos) return;
    const vm = this.opts.visualMap!;
    const dim = vm.dimension ?? this.opts.sizeDimension ?? 0;
    const [lo, hi] = this.vmRange;
    const [tHi, tLo] = vm.text ?? [this.fmt(hi, dim), this.fmt(lo, dim)];
    const vertical = pos !== 'bottom';
    el.className = `tm-vmap tm-vmap--${pos}`;
    el.style.top = el.style.bottom = '';
    const bar = `<span class="tm-vmap__bar" style="background:linear-gradient(to ${vertical ? 'top' : 'right'},${vm.colors.join(',')})"><i class="tm-vmap__mark"></i></span>`;
    el.innerHTML = vertical
      ? `<span>${esc(tHi)}</span>${bar}<span>${esc(tLo)}</span>`
      : `<span>${esc(tLo)}</span>${bar}<span>${esc(tHi)}</span>`;
  }

  /** Marker on the color bar at the hovered node's value. */
  private markVisual(n: TNode | null): void {
    const mark = this.vmEl.querySelector<HTMLElement>('.tm-vmap__mark');
    if (!mark) return;
    const vm = this.opts.visualMap!;
    const v = n?.values[vm.dimension ?? this.opts.sizeDimension ?? 0];
    const [lo, hi] = this.vmRange;
    mark.style.display = v === undefined ? 'none' : 'block';
    if (v === undefined) return;
    const t = Math.min(1, Math.max(0, hi > lo ? (v - lo) / (hi - lo) : 0.5));
    mark.style.setProperty('--t', `${t * 100}%`);
  }

  private layoutTreemap(): Item[] {
    const o = this.opts;
    const out: Item[] = [];
    const minArea = o.visibleMin ?? 4;
    const lay = (parent: TNode, box: Box, rd: number): void => {
      const kids = parent.children;
      const boxes = squarify(
        kids.map((k) => k.size),
        box,
      );
      kids.forEach((k, i) => {
        const lv = this.level(k.depth);
        const gap = lv.gap ?? o.gap ?? (k.depth === 0 ? 2 : 1);
        const b = inset(boxes[i], gap / 2);
        if (b.w * b.h < minArea || b.w < 0.5 || b.h < 0.5) return;
        const open = k.children.length > 0 && (o.leafDepth === undefined || rd < o.leafDepth);
        const bw = lv.borderWidth ?? 0;
        const ul = open ? this.upperOpts(k.depth) : null;
        const header = ul && b.h > ul.height * 2 && b.w > 30 ? ul.height : 0;
        const inner = { x: b.x + bw, y: b.y + bw + header, w: b.w - 2 * bw, h: b.h - 2 * bw - header };
        const shape: RectShape = { k: 'r', ...b };
        if (open && inner.w > 2 && inner.h > 2) {
          // the frame and the gaps between the children: the level's border color or a darker shade of the node
          const fill = lv.borderColor ?? shade(k.color, -0.14);
          out.push({ n: k, shape, leaf: false, header, fill, ...this.decorate(k) });
          lay(k, inner, rd + 1);
        } else out.push({ n: k, shape, leaf: true, header: 0, fill: k.color, ...this.decorate(k) });
      });
    };
    lay(this.zoom, this.area, 1);
    return out;
  }

  private layoutSunburst(): Item[] {
    const o = this.opts.sunburst ?? {};
    const a = this.area;
    const half = Math.min(a.w, a.h) / 2;
    const cx = a.x + (sunLength(o.center?.[0], a.w) ?? a.w / 2);
    const cy = a.y + (sunLength(o.center?.[1], a.h) ?? a.h / 2);
    const R = typeof o.radius === 'string' ? (sunLength(o.radius, half) ?? half * 0.95) : half * (o.radius ?? 0.95);
    const r0 = typeof o.innerRadius === 'string' ? (sunLength(o.innerRadius, half) ?? 0) : R * (o.innerRadius ?? 0.15);
    const gap = o.gap ?? 1;
    const padAngle = ((o.padAngle ?? 0) * Math.PI) / 180 / 2;
    const depth = Math.max(1, Math.min(this.opts.leafDepth ?? Infinity, this.zoom.height));
    // rings by position from the center (levels[i].r0 / r), the rest share the room evenly
    const specs = Array.from({ length: depth }, (_, i) => {
      const lv = this.level(i);
      return { r0: sunLength(lv.r0, half), r: sunLength(lv.r, half) };
    });
    const rings = sunburstRings(depth, r0, R, specs);
    const hole = rings[0][0];
    this.hole = { cx, cy, r: hole };
    const start = ((o.startAngle ?? 0) * Math.PI) / 180 - Math.PI / 2;
    const out: Item[] = [];
    if (this.zoom !== this.tree && hole > 4)
      out.push({ n: this.zoom, shape: { k: 's', cx, cy, r0: 0, r1: hole - gap, a0: 0, a1: Math.PI * 2 }, leaf: false, header: 0, fill: this.zoom.color, hub: true });
    const lay = (parent: TNode, a0: number, a1: number, rd: number): void => {
      let ang = a0;
      const [ri, ro] = rings[rd - 1];
      for (const k of parent.children) {
        const span = ((a1 - a0) * k.size) / parent.size;
        if (span * ro >= 0.5 && ro > ri) {
          const rm = (ri + ro) / 2;
          const pad = Math.min(span / 4, gap / 2 / Math.max(1, rm) + padAngle);
          const open = k.children.length > 0 && rd < depth;
          out.push({
            n: k,
            shape: { k: 's', cx, cy, r0: ri + (ri > 0 ? gap / 2 : 0), r1: ro - gap / 2, a0: ang + pad, a1: ang + span - pad },
            leaf: !open,
            header: 0,
            fill: k.color,
            ...this.decorate(k, o.borderRadius),
          });
        }
        // children follow the parent's angles even when its ring is hidden (zero thickness)
        if (k.children.length > 0 && rd < depth && span * ro >= 0.5) {
          const pad = ro > ri ? Math.min(span / 4, gap / 2 / Math.max(1, (ri + ro) / 2) + padAngle) : 0;
          lay(k, ang + pad, ang + span - pad, rd + 1);
        }
        ang += span;
      }
    };
    lay(this.zoom, start, start + Math.PI * 2, 1);
    return out;
  }

  /**
   * New layout. With `animate`, every node goes from where it is now to its new shape;
   * `pivot` (zoom) makes the nodes that leave or appear fly out of / into the zoomed node.
   */
  private relayout(animate: boolean, pivot?: { from: TNode; to: TNode }): void {
    this.computeArea();
    this.renderCrumbs();
    const prev = this.currentShapes();
    const items = this.type === 'sunburst' ? this.layoutSunburst() : this.layoutTreemap();
    this.items = items;
    cancelAnimationFrame(this.raf);
    this.tracks = null;
    const a = this.opts.animation ?? true;
    const dur = a === false ? 0 : typeof a === 'object' ? (a.duration ?? 750) : 750;
    if (!animate || !dur || !prev.size) {
      this.draw();
      return;
    }
    const next = new Map(items.map((it) => [it.n.id, it]));
    // zoom transform between the old and the new space (treemap only)
    let M: { from: RectShape; to: RectShape } | null = null;
    const full: RectShape = { k: 'r', ...this.area };
    if (pivot && this.type === 'treemap') {
      if (isAncestor(pivot.from, pivot.to)) {
        const s = prev.get(pivot.to.id)?.shape;
        if (s?.k === 'r') M = { from: s, to: full };
      } else {
        let n: TNode | null = pivot.from;
        while (n && !next.has(n.id)) n = n.parent;
        const s = n ? next.get(n.id)!.shape : null;
        if (s?.k === 'r') M = { from: full, to: s };
      }
    }
    const tracks: Track[] = [];
    // nodes that leave: fly out with the zoom, or shrink and fade
    for (const [id, p] of prev) {
      if (next.has(id)) continue;
      tracks.push({ it: p.it, from: p.shape, to: M ? mapShape(p.shape, M.from, M.to) : collapse(p.shape), a0: p.alpha, a1: 0 });
    }
    for (const it of items) {
      const p = prev.get(it.n.id);
      if (p) {
        tracks.push({ it, from: p.shape, to: it.shape, a0: p.alpha, a1: 1 });
        continue;
      }
      // new nodes come out of the zoomed node, or of their nearest visible ancestor, or grow in place
      let from: Shape;
      if (M) from = mapShape(it.shape, M.to, M.from);
      else {
        let n = it.n.parent;
        while (n && !prev.has(n.id)) n = n.parent;
        const anc = n ? prev.get(n.id)!.shape : null;
        from = anc && anc.k === it.shape.k && it.shape.k === 'r' ? collapse(anc) : collapse(it.shape);
      }
      tracks.push({ it, from, to: it.shape, a0: 0, a1: 1 });
    }
    this.tracks = tracks;
    this.animStart = performance.now();
    this.animDur = dur;
    this.hideTooltip();
    const step = (now: number): void => {
      const done = now - this.animStart >= this.animDur;
      if (done) this.tracks = null;
      this.draw();
      if (!done) this.raf = requestAnimationFrame(step);
    };
    this.raf = requestAnimationFrame(step);
  }

  private progress(): number {
    return easeInOut(Math.min(1, (performance.now() - this.animStart) / Math.max(1, this.animDur)));
  }

  /** What is on screen right now (mid-animation included). */
  private currentShapes(): Map<string, { it: Item; shape: Shape; alpha: number }> {
    const m = new Map<string, { it: Item; shape: Shape; alpha: number }>();
    if (this.tracks) {
      const t = this.progress();
      for (const tr of this.tracks) {
        const alpha = tr.a0 + (tr.a1 - tr.a0) * t;
        if (tr.a1 > 0) m.set(tr.it.n.id, { it: tr.it, shape: lerpShape(tr.from, tr.to, t), alpha });
      }
    } else for (const it of this.items) m.set(it.n.id, { it, shape: it.shape, alpha: 1 });
    return m;
  }

  private zoomNode(n: TNode, animate = true): void {
    if (n === this.zoom || (n !== this.tree && !n.children.length)) return;
    const from = this.zoom;
    this.zoom = n;
    this.hovered = null;
    this.relayout(animate, { from, to: n });
    this.emit('zoom', n === this.tree ? null : this.info(n));
  }

  private renderCrumbs(): void {
    if (!this.showCrumbs) return;
    const chain: TNode[] = [];
    for (let n: TNode | null = this.zoom; n; n = n.parent) chain.unshift(n);
    this.crumbsEl.innerHTML = '';
    chain.forEach((n, i) => {
      const last = i === chain.length - 1;
      const b = document.createElement(last ? 'span' : 'button');
      b.className = `tm-crumb${last ? ' is-current' : ''}`;
      b.textContent = n.name;
      if (!last) {
        (b as HTMLButtonElement).type = 'button';
        b.addEventListener('click', () => this.zoomNode(n));
      }
      b.style.setProperty('--tm-crumb', n === this.tree ? this.theme.muted : n.color);
      this.crumbsEl.append(b);
    });
  }

  // ------------------------------------------------------------------ drawing

  private draw(): void {
    const ctx = this.ctx;
    const t = this.theme;
    ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
    ctx.clearRect(0, 0, this.width, this.height);
    if (t.background !== 'transparent') {
      ctx.fillStyle = t.background;
      ctx.fillRect(0, 0, this.width, this.height);
    }
    ctx.save();
    ctx.beginPath();
    ctx.rect(this.area.x, this.area.y, this.area.w, this.area.h);
    ctx.clip();
    if (this.tracks) {
      const k = this.progress();
      for (const tr of this.tracks) {
        const s = lerpShape(tr.from, tr.to, k);
        const alpha = tr.a0 + (tr.a1 - tr.a0) * k;
        // labels only while the shape keeps its kind (no text on a morphing polygon)
        this.drawItem(tr.it, s, alpha, s.k !== 'p');
      }
    } else {
      for (const it of this.items) this.drawItem(it, it.shape, this.dimFor(it), true);
      this.drawHover();
      this.drawCenter();
    }
    ctx.restore();
  }

  /** Hovering a node fades what is outside its focus (sunburst: its ancestors and descendants by default). */
  private dimFor(it: Item): number {
    const h = this.hovered;
    if (!h || it.hub) return 1;
    const e = this.opts.emphasis ?? {};
    const focus = e.focus ?? (this.type === 'sunburst' ? 'relative' : 'none');
    if (focus === 'none') return 1;
    const n = it.n;
    const lit = n === h || (focus !== 'self' && ((focus !== 'descendant' && isAncestor(n, h)) || (focus !== 'ancestor' && isAncestor(h, n))));
    return lit ? 1 : (e.blurOpacity ?? 0.35);
  }

  /** Outline of an item: rounded when its style asks for it. */
  private trace(it: Item, s: Shape): void {
    const r = it.radius;
    if (r && s.k === 's' && (r[0] > 0 || r[1] > 0)) traceRoundSector(this.ctx, s, r);
    else if (r && s.k === 'r' && r[1] > 0 && s.w > 0 && s.h > 0) {
      this.ctx.beginPath();
      this.ctx.roundRect(s.x, s.y, s.w, s.h, Math.min(r[1], s.w / 2, s.h / 2));
    } else tracePath(this.ctx, s);
  }

  private drawItem(it: Item, s: Shape, alpha: number, labels: boolean): void {
    if (alpha <= 0.01) return;
    const ctx = this.ctx;
    ctx.globalAlpha = Math.min(1, alpha) * (it.opacity ?? 1);
    this.trace(it, s);
    ctx.fillStyle = it.fill;
    ctx.fill();
    // the item's own opacity is the fill's; the outline and the label stay solid
    ctx.globalAlpha = Math.min(1, alpha);
    if (it.stroke) {
      ctx.lineWidth = it.stroke[0];
      ctx.strokeStyle = it.stroke[1];
      ctx.lineJoin = 'round';
      ctx.stroke();
    }
    if (labels) {
      if (s.k === 'r') {
        if (it.header) this.drawHeader(it, s);
        else if (it.leaf) this.drawLeafLabel(it, s);
      } else if (s.k === 's') this.drawSectorLabel(it, s);
    }
    ctx.globalAlpha = 1;
  }

  private textColor(fill: string, own?: string): string {
    if (own) return own;
    // see-through tiles show the background: use the normal text color
    if (parseColor(fill)[3] < 0.5) return this.theme.text;
    return luminance(fill) > 0.42 ? this.theme.labelDark : this.theme.labelLight;
  }

  private fit(text: string, max: number): string {
    const ctx = this.ctx;
    if (ctx.measureText(text).width <= max) return text;
    let lo = 0;
    let hi = text.length;
    while (lo < hi) {
      const mid = (lo + hi + 1) >> 1;
      if (ctx.measureText(text.slice(0, mid) + '…').width <= max) lo = mid;
      else hi = mid - 1;
    }
    return lo ? text.slice(0, lo) + '…' : '';
  }

  private labelText(it: Item, lo: TreemapLabelOptions): string[] {
    const info = this.info(it.n);
    if (lo.formatter) return lo.formatter(info).split('\n');
    return lo.showValue ? [it.n.name, this.fmt(it.n.size)] : [it.n.name];
  }

  private drawHeader(it: Item, s: RectShape): void {
    const ul = this.upperOpts(it.n.depth);
    if (!ul || s.w < 24) return;
    const ctx = this.ctx;
    ctx.font = `600 12px ${this.theme.font}`;
    ctx.fillStyle = this.textColor(it.fill, ul.color);
    ctx.textBaseline = 'middle';
    ctx.textAlign = 'left';
    const text = ul.formatter ? ul.formatter(this.info(it.n)) : it.n.name;
    ctx.fillText(this.fit(text, s.w - 10), s.x + 5, s.y + it.header / 2 + 0.5);
  }

  private drawLeafLabel(it: Item, s: RectShape): void {
    const lo = this.labelFor(it.n);
    if (!lo.show) return;
    const fs = lo.fontSize ?? 12;
    if (s.w < 22 || s.h < fs + 6) return;
    const ctx = this.ctx;
    const lines = this.labelText(it, lo);
    const lh = fs * 1.25;
    const room = Math.max(1, Math.floor((s.h - 6) / lh));
    const shown = lines.slice(0, room);
    ctx.fillStyle = this.textColor(it.fill, lo.color);
    ctx.textBaseline = 'top';
    ctx.save();
    ctx.beginPath();
    ctx.rect(s.x, s.y, s.w, s.h);
    ctx.clip();
    const centered = lo.position === 'center';
    ctx.textAlign = centered ? 'center' : 'left';
    // centered: the first line (the name) grows with the tile
    const big = centered ? Math.min(fs * 2.4, Math.max(fs, Math.min(s.w / 7, (s.h - (shown.length - 1) * lh) / 1.6))) : fs;
    let y = centered ? s.y + (s.h - (big * 1.2 + (shown.length - 1) * lh)) / 2 : s.y + 5;
    shown.forEach((line, i) => {
      const size = i === 0 ? big : fs;
      ctx.font = `${i === 0 ? 600 : 400} ${size}px ${this.theme.font}`;
      const text = this.fit(line, s.w - 10);
      if (text) ctx.fillText(text, centered ? s.x + s.w / 2 : s.x + 5, y);
      y += i === 0 ? size * 1.2 : lh;
    });
    ctx.restore();
  }

  private drawSectorLabel(it: Item, s: Extract<Shape, { k: 's' }>): void {
    const lo = this.labelFor(it.n);
    if (!lo.show) return;
    const ctx = this.ctx;
    const fs = lo.fontSize ?? 11;
    ctx.font = `${lo.fontWeight ?? (it.hub ? 600 : 400)} ${fs}px ${this.theme.font}`;
    ctx.textBaseline = 'middle';
    if (it.hub) {
      ctx.fillStyle = this.textColor(it.fill, lo.color);
      ctx.textAlign = 'center';
      ctx.fillText(this.fit(it.n.name, s.r1 * 1.7), s.cx, s.cy);
      return;
    }
    const span = s.a1 - s.a0;
    if (lo.minAngle !== undefined && (span * 180) / Math.PI < lo.minAngle) return;
    const lines = this.labelText(it, lo).filter((l) => l !== '');
    if (!lines.length) return;
    const lh = fs * 1.2;
    const mid = (s.a0 + s.a1) / 2;
    const dist = lo.distance ?? 4;
    if (lo.position === 'outside') {
      // radial text just past the outer edge, reading outwards
      if (span * s.r1 < fs * 0.7) return;
      // as long as the text can be before it leaves the chart area
      const r = s.r1 + dist;
      const [px, py] = [s.cx + r * Math.cos(mid), s.cy + r * Math.sin(mid)];
      const [dx, dy] = [Math.cos(mid), Math.sin(mid)];
      const A = this.area;
      const room = Math.min(
        dx > 1e-6 ? (A.x + A.w - px) / dx : dx < -1e-6 ? (A.x - px) / dx : Infinity,
        dy > 1e-6 ? (A.y + A.h - py) / dy : dy < -1e-6 ? (A.y - py) / dy : Infinity,
      ) - 2;
      if (room < 14) return;
      const up = uprightAngle(mid);
      ctx.fillStyle = lo.color ?? this.theme.text;
      ctx.textAlign = up.flipped ? 'right' : 'left';
      ctx.save();
      ctx.translate(px, py);
      ctx.rotate(up.angle);
      lines.forEach((l, i) => {
        const text = this.fit(l, room);
        if (text) ctx.fillText(text, 0, (i - (lines.length - 1) / 2) * lh);
      });
      ctx.restore();
      return;
    }
    const rot = lo.rotate ?? this.opts.sunburst?.labelRotate ?? 'radial';
    const dir = rot === 'radial' ? mid : rot === 'tangential' ? mid + Math.PI / 2 : rot === 'none' ? 0 : (-rot * Math.PI) / 180;
    // radial and tangential text turn half a turn rather than read upside down; fixed angles stay as given
    const up = typeof rot === 'number' || rot === 'none' ? { angle: dir, flipped: false } : uprightAngle(dir);
    const { along, across } = sectorTextRoom(s, dir);
    const n = Math.min(lines.length, Math.floor((across - 2) / lh));
    if (n < 1 || along - 2 * dist < 12) return;
    const rm = (s.r0 + s.r1) / 2;
    ctx.fillStyle = this.textColor(it.fill, lo.color);
    // radial text can hug the inner (left) or outer (right) edge
    let x = 0;
    let align: CanvasTextAlign = 'center';
    if (rot === 'radial' && lo.align && lo.align !== 'center') {
      const edge = ((s.r1 - s.r0) / 2 - dist) * (lo.align === 'left' ? -1 : 1) * (up.flipped ? -1 : 1);
      x = edge;
      align = (lo.align === 'left') !== up.flipped ? 'left' : 'right';
    }
    ctx.textAlign = align;
    ctx.save();
    ctx.translate(s.cx + rm * Math.cos(mid), s.cy + rm * Math.sin(mid));
    ctx.rotate(up.angle);
    for (let i = 0; i < n; i++) {
      const text = this.fit(lines[i], along - 2 * dist);
      if (text) ctx.fillText(text, x, (i - (n - 1) / 2) * lh);
    }
    ctx.restore();
  }

  private drawHover(): void {
    const h = this.hovered;
    if (!h) return;
    const it = this.items.find((i) => i.n === h);
    if (!it) return;
    const ctx = this.ctx;
    const s = it.shape;
    if (s.k === 'r' && it.header && !it.leaf) {
      ctx.fillStyle = 'rgba(255,255,255,0.12)';
      ctx.fillRect(s.x, s.y, s.w, it.header);
      ctx.strokeStyle = 'rgba(255,255,255,0.55)';
      ctx.lineWidth = 1;
      ctx.strokeRect(s.x + 0.5, s.y + 0.5, s.w - 1, s.h - 1);
      return;
    }
    this.trace(it, s);
    ctx.fillStyle = 'rgba(255,255,255,0.12)';
    ctx.fill();
    if (s.k === 'r') {
      ctx.strokeStyle = 'rgba(255,255,255,0.75)';
      ctx.lineWidth = 1.5;
      ctx.strokeRect(s.x + 0.75, s.y + 0.75, s.w - 1.5, s.h - 1.5);
    }
  }

  /** Sunburst not zoomed: total in the hole. */
  private drawCenter(): void {
    if (this.type !== 'sunburst' || this.zoom !== this.tree || this.opts.sunburst?.centerLabel === false) return;
    const { cx, cy, r: r0 } = this.hole;
    if (r0 < 34) return;
    const ctx = this.ctx;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = this.theme.muted;
    ctx.font = `11px ${this.theme.font}`;
    ctx.fillText(this.fit(this.tree.name, r0 * 1.7), cx, cy - 9);
    ctx.fillStyle = this.theme.text;
    ctx.font = `700 ${Math.min(20, r0 / 3)}px ${this.theme.font}`;
    ctx.fillText(this.fit(this.fmt(this.tree.size), r0 * 1.7), cx, cy + 8);
  }

  // ------------------------------------------------------------------ interaction

  /** Deepest node under the point; `header` when it is a parent's header. */
  private hit(x: number, y: number): { it: Item; header: boolean } | null {
    if (this.tracks) return null;
    for (let i = this.items.length - 1; i >= 0; i--) {
      const it = this.items[i];
      if (!contains(it.shape, x, y)) continue;
      const s = it.shape;
      return { it, header: s.k === 'r' && it.header > 0 && y <= s.y + it.header };
    }
    return null;
  }

  private bind(): void {
    const c = this.canvas;
    const pos = (e: PointerEvent | MouseEvent): [number, number] => {
      const r = c.getBoundingClientRect();
      return [e.clientX - r.left, e.clientY - r.top];
    };
    c.addEventListener('pointermove', (e) => {
      const [x, y] = pos(e);
      const h = this.hit(x, y);
      const n = h?.it.n ?? null;
      if (n !== this.hovered) {
        this.hovered = n;
        if (!this.tracks) this.draw();
        if (this.vmShown()) this.markVisual(n);
        this.emit('hover', n ? this.info(n) : null);
      }
      c.style.cursor = h && this.target(h) ? 'pointer' : '';
      if (h) this.showTooltip(n!, x, y);
      else this.hideTooltip();
    });
    c.addEventListener('pointerleave', () => {
      this.hovered = null;
      if (this.vmShown()) this.markVisual(null);
      this.hideTooltip();
      if (!this.tracks) this.draw();
      this.emit('hover', null);
    });
    c.addEventListener('click', (e) => {
      const [x, y] = pos(e);
      const h = this.hit(x, y);
      if (!h) return;
      this.emit('click', this.info(h.it.n));
      const t = this.target(h);
      if (t) this.zoomNode(t);
    });
  }

  /** Where a click zooms to: a header → that parent; the hub → one level up; a tile → its branch under the current root. */
  private target(h: { it: Item; header: boolean }): TNode | null {
    if (this.opts.drilldown === false) return null;
    const n = h.it.n;
    if (h.it.hub) return this.zoom.parent;
    if (h.header || this.type === 'sunburst') return n.children.length && n !== this.zoom ? n : null;
    let b: TNode = n;
    while (b.parent && b.parent !== this.zoom) b = b.parent;
    return b.children.length && b !== this.zoom ? b : null;
  }

  private hideTooltip(): void {
    this.tooltipEl.classList.remove('is-visible');
  }

  private showTooltip(n: TNode, x: number, y: number): void {
    const o = this.opts.tooltip;
    if (o === false || (typeof o === 'object' && o.show === false)) return;
    const tt = this.tooltipEl;
    const info = this.info(n);
    if (typeof o === 'object' && o.formatter) tt.innerHTML = o.formatter(info);
    else {
      const dims = this.opts.dimensions;
      const rows = dims?.length
        ? dims.map((d, i) => [d, n.values[i] === undefined ? '–' : this.fmt(n.values[i], i)])
        : [['Valor', this.fmt(n.size)]];
      const pct = (v: number): string => `${+(v * 100).toFixed(v < 0.001 ? 3 : v < 0.1 ? 2 : 1)}%`;
      if (n.depth > 0) rows.push([`% de ${n.parent!.name}`, pct(info.percent)]);
      if (n.depth >= 0) rows.push(['% do total', pct(info.totalPercent)]);
      tt.innerHTML =
        `<div class="tm-tooltip__head"><span class="tm-tooltip__dot" style="background:${n.color}"></span>${esc(n.path.join(' / ') || n.name)}</div>` +
        rows.map(([k, v]) => `<div class="tm-tooltip__row"><span>${esc(k)}</span><b>${esc(v)}</b></div>`).join('');
    }
    tt.classList.add('is-visible');
    const w = tt.offsetWidth;
    const h = tt.offsetHeight;
    let left = x + 14;
    let top = y + 14;
    if (left + w > this.width - 4) left = x - w - 14;
    if (top + h > this.height - 4) top = y - h - 14;
    tt.style.transform = `translate(${Math.max(4, left)}px, ${Math.max(4, top)}px)`;
  }
}

/** Create a treemap (or sunburst with `type: 'sunburst'`) inside `container`. */
export function createTreemap(container: HTMLElement, options: TreemapOptions): TreemapChart {
  return new TreemapChart(container, options);
}
