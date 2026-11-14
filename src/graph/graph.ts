import { niceScale, formatCompact } from '../shared/format';
import {
  curveControl,
  definedOnly,
  distToQuad,
  distToSegment,
  edgeLengths,
  fitBox,
  ForceSimulation,
  graphCircularLayout,
  hideOverlaps,
  logTicks,
  quadAt,
  sizeByValue,
  spiralPosition,
  type Fit,
  type Rect,
  type SimNode,
} from './layout';
import type {
  GraphAxis,
  GraphCategory,
  GraphData,
  GraphEvent,
  GraphGraphicApi,
  GraphHoverInfo,
  GraphLabelOptions,
  GraphLink,
  GraphNode,
  GraphOptions,
  GraphSymbol,
  GraphTheme,
} from './types';

const FONT = '-apple-system, BlinkMacSystemFont, "Trebuchet MS", Roboto, Ubuntu, sans-serif';

export const graphDarkTheme: GraphTheme = {
  background: '#131722',
  text: '#d1d4dc',
  muted: '#787b86',
  grid: 'rgba(120, 123, 134, 0.18)',
  edge: 'rgba(120, 123, 134, 0.45)',
  nodeBorder: 'rgba(19, 23, 34, 0.85)',
  tooltipBg: '#1e222d',
  tooltipText: '#d1d4dc',
  tooltipBorder: '#2a2e39',
  font: FONT,
};

export const graphLightTheme: GraphTheme = {
  background: '#ffffff',
  text: '#131722',
  muted: '#787b86',
  grid: 'rgba(42, 46, 57, 0.1)',
  edge: 'rgba(42, 46, 57, 0.28)',
  nodeBorder: '#ffffff',
  tooltipBg: '#ffffff',
  tooltipText: '#131722',
  tooltipBorder: '#e0e3eb',
  font: FONT,
};

export const GRAPH_COLORS = ['#2962ff', '#ff9800', '#089981', '#f23645', '#9c27b0', '#00bcd4', '#e91e63', '#8bc34a', '#ffc107', '#607d8b'];

const esc = (s: string): string => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const clamp = (v: number, a: number, b: number): number => Math.min(b, Math.max(a, v));
const easeOut = (t: number): number => 1 - Math.pow(1 - t, 3);

interface NodeModel extends SimNode {
  src: GraphNode;
  id: string;
  index: number;
  name: string;
  /** category index, -1 = none */
  cat: number;
  color: string;
  /** diameter px */
  size: number;
  symbol: GraphSymbol;
  /** tween of layouts 'none' / 'circular' (coordinates) */
  from: { x: number; y: number } | null;
  to: { x: number; y: number };
  /** circular layout angle */
  angle: number;
  /** grow-in start (0 = done) */
  born: number;
  degree: number;
  // last drawn, px
  sx: number;
  sy: number;
  r: number;
  grow: number;
  visible: boolean;
  /** measured label (cache) */
  lText: string;
  lFont: string;
  lW: number;
}

interface LinkModel {
  src: GraphLink;
  index: number;
  s: NodeModel;
  t: NodeModel;
  color: string;
  width: number;
  curveness: number;
}

interface CatModel {
  name: string;
  color: string;
  symbol?: GraphSymbol;
}

type Hover = { type: 'node'; n: NodeModel } | { type: 'link'; l: LinkModel };

interface Drag {
  mode: 'node' | 'pan';
  x: number;
  y: number;
  moved: boolean;
  node?: NodeModel;
  px: number;
  py: number;
}

interface AxisModel {
  cfg: GraphAxis;
  log: boolean;
  /** range in axis space (log10 for log axes) */
  lo: number;
  hi: number;
}

/**
 * Graph (network) chart: nodes and links with force, circular or fixed layouts, categories with a
 * legend, curved edges with arrows and labels, adjacency highlight, tooltip, node dragging, zoom & pan,
 * numeric axes, drawing hooks and animated updates.
 */
export class GraphChart {
  readonly root: HTMLElement;
  readonly canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private titleEl: HTMLElement;
  private bodyEl: HTMLElement;
  private plotEl: HTMLElement;
  private legendEl: HTMLElement;
  private tooltipEl: HTMLElement;
  private opts: GraphOptions;
  private theme!: GraphTheme;
  private data: GraphData = { nodes: [] };
  private cats: CatModel[] = [];
  private hiddenCats = new Set<string>();
  private nodeList: NodeModel[] = [];
  private linkList: LinkModel[] = [];
  private byId = new Map<string, NodeModel>();
  private adj: LinkModel[][] = [];
  private sim: ForceSimulation<NodeModel> | null = null;
  private mode: 'none' | 'force' | 'circular' = 'force';
  private ax: AxisModel | null = null;
  private ay: AxisModel | null = null;
  private fit: Fit | null = null;
  private zoom = 1;
  private panX = 0;
  private panY = 0;
  /** the user zoomed or panned: the force layout stops fitting itself to the box */
  private userMoved = false;
  private plot = { x: 0, y: 0, w: 1, h: 1 };
  private hover: Hover | null = null;
  private drag: Drag | null = null;
  private suppressClick = false;
  private width = 0;
  private height = 0;
  private dpr = 1;
  private animStart = 0;
  private growUntil = 0;
  private raf = 0;
  private handlers = new Map<GraphEvent, Set<(v: unknown) => void>>();
  private ro: ResizeObserver;
  private destroyed = false;

  constructor(container: HTMLElement, options: GraphOptions = {}) {
    this.opts = { ...options };
    this.root = container;
    container.classList.add('gr-root');
    this.titleEl = document.createElement('div');
    this.titleEl.className = 'gr-title';
    this.bodyEl = document.createElement('div');
    this.plotEl = document.createElement('div');
    this.plotEl.className = 'gr-plot';
    this.canvas = document.createElement('canvas');
    this.canvas.className = 'gr-canvas';
    this.canvas.setAttribute('role', 'img');
    this.ctx = this.canvas.getContext('2d')!;
    this.tooltipEl = document.createElement('div');
    this.tooltipEl.className = 'gr-tooltip';
    this.legendEl = document.createElement('ul');
    this.plotEl.append(this.canvas, this.tooltipEl);
    this.bodyEl.append(this.plotEl, this.legendEl);
    container.append(this.titleEl, this.bodyEl);
    this.data = { nodes: options.nodes ?? [], links: options.links ?? [], categories: options.categories ?? [] };
    this.applyLook();
    this.bind();
    this.ro = new ResizeObserver(() => this.resize());
    this.ro.observe(this.plotEl);
    this.measure();
    this.rebuild(true);
  }

  // ------------------------------------------------------------------ public API

  get nodes(): GraphNode[] {
    return this.nodeList.map((n) => ({ ...n.src, x: n.x, y: n.y }));
  }

  get links(): GraphLink[] {
    return this.linkList.map((l) => ({ ...l.src }));
  }

  /**
   * Replace nodes and links (and categories). Nodes keep their place by id: with the force layout new
   * nodes start next to a neighbour and the layout warms up again; other layouts move to the new spots.
   */
  setData(data: GraphData, animate = true): void {
    this.data = { nodes: data.nodes, links: data.links ?? [], categories: data.categories ?? this.data.categories };
    this.rebuild(animate);
  }

  /** Change options after creation. */
  setOptions(patch: GraphOptions, animate = true): void {
    this.opts = { ...this.opts, ...patch };
    if (patch.nodes || patch.links || patch.categories)
      this.data = { nodes: patch.nodes ?? this.data.nodes, links: patch.links ?? this.data.links, categories: patch.categories ?? this.data.categories };
    this.applyLook();
    this.rebuild(animate);
  }

  /** Show / hide a category (by name). */
  toggle(category: string, hidden?: boolean): void {
    const h = hidden ?? !this.hiddenCats.has(category);
    if (h) this.hiddenCats.add(category);
    else this.hiddenCats.delete(category);
    if (this.hover && !this.hoverVisible()) this.hover = null;
    this.emit('toggle', { category, hidden: h });
    this.renderLegend();
    this.schedule();
  }

  /** Back to the fitted view (no zoom or pan). */
  resetView(): void {
    this.zoom = 1;
    this.panX = this.panY = 0;
    this.userMoved = false;
    this.fit = this.fitTarget();
    this.schedule();
  }

  /** Warm the force layout up again (alpha 0–1). */
  reheat(alpha = 0.6): void {
    if (!this.sim) return;
    this.sim.alpha = Math.max(this.sim.alpha, alpha);
    this.schedule();
  }

  /** Where a node is now, in node coordinates (data values with `axes`). */
  nodePosition(id: string): { x: number; y: number } | null {
    const n = this.byId.get(id);
    if (!n) return null;
    return { x: this.fromAxis(this.ax, n.x), y: this.fromAxis(this.ay, n.y) };
  }

  on(event: 'hover', handler: (info: GraphHoverInfo | null) => void): () => void;
  on(event: 'click', handler: (info: GraphHoverInfo) => void): () => void;
  on(event: 'toggle', handler: (e: { category: string; hidden: boolean }) => void): () => void;
  on(event: GraphEvent, handler: (v: never) => void): () => void {
    if (!this.handlers.has(event)) this.handlers.set(event, new Set());
    const h = handler as (v: unknown) => void;
    this.handlers.get(event)!.add(h);
    return () => this.handlers.get(event)?.delete(h);
  }

  resize(): void {
    this.measure();
    this.layoutPlot();
    this.fit = this.fitTarget();
    this.draw();
  }

  screenshot(): string {
    this.draw();
    return this.canvas.toDataURL('image/png');
  }

  destroy(): void {
    this.destroyed = true;
    cancelAnimationFrame(this.raf);
    this.ro.disconnect();
    this.root.classList.remove('gr-root');
    this.titleEl.remove();
    this.bodyEl.remove();
  }

  // ------------------------------------------------------------------ model

  private emit(e: GraphEvent, v: unknown): void {
    this.handlers.get(e)?.forEach((h) => h(v));
  }

  private applyLook(): void {
    const o = this.opts;
    const base = o.theme === 'light' ? graphLightTheme : graphDarkTheme;
    const t: GraphTheme = { ...base, ...(typeof o.theme === 'object' ? o.theme : {}) };
    if (o.background) t.background = o.background;
    this.theme = t;
    const vars: Record<string, string> = {
      '--gr-bg': t.background,
      '--gr-text': t.text,
      '--gr-muted': t.muted,
      '--gr-tt-bg': t.tooltipBg,
      '--gr-tt-text': t.tooltipText,
      '--gr-tt-border': t.tooltipBorder,
      '--gr-font': t.font,
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

  /** Axis value → coordinate used for drawing (log10 on log axes). */
  private toAxis(a: AxisModel | null, v: number): number {
    return a?.log ? Math.log10(Math.max(v, 1e-12)) : v;
  }

  private fromAxis(a: AxisModel | null, v: number): number {
    return a?.log ? 10 ** v : v;
  }

  private rebuild(animate: boolean): void {
    const o = this.opts;
    const now = performance.now();
    const on = animate && this.duration() > 0;
    const palette = o.colors ?? GRAPH_COLORS;
    // categories: given, plus names used by the nodes
    const cats: CatModel[] = (this.data.categories ?? []).map((c, i) => {
      const g: GraphCategory = typeof c === 'string' ? { name: c } : c;
      if (g.hidden) this.hiddenCats.add(g.name);
      return { name: g.name, color: g.color ?? palette[i % palette.length], symbol: g.symbol };
    });
    for (const n of this.data.nodes)
      if (typeof n.category === 'string' && !cats.some((c) => c.name === n.category)) cats.push({ name: n.category, color: palette[cats.length % palette.length] });
    this.cats = cats;
    const old = new Map(this.nodeList.map((n) => [n.id, n]));
    const hadGraph = this.nodeList.length > 0;
    const oldLinks = new Set(this.linkList.map((l) => `${l.s.id}|${l.t.id}`));
    // axes
    const axes = o.axes;
    const axisModel = (cfg: GraphAxis | undefined): AxisModel | null => (axes ? { cfg: cfg ?? {}, log: cfg?.type === 'log', lo: 0, hi: 1 } : null);
    this.ax = axisModel(axes?.x);
    this.ay = axisModel(axes?.y);
    const oldMode = this.mode;
    const allXY = this.data.nodes.length > 0 && this.data.nodes.every((n) => n.x !== undefined && n.y !== undefined);
    this.mode = axes ? 'none' : (o.layout ?? (allXY ? 'none' : 'force'));
    // sizes
    const values = this.data.nodes.map((n) => n.value).filter((v): v is number => v !== undefined && isFinite(v));
    const vMin = Math.min(...values);
    const vMax = Math.max(...values);
    const ss = o.symbolSize ?? 10;
    const sizeOf = (n: GraphNode): number =>
      n.size ?? (typeof ss === 'function' ? ss(n) : Array.isArray(ss) ? sizeByValue(n.value, vMin, vMax, ss) : ss);
    const seen = new Set<string>();
    this.nodeList = [];
    for (const src of this.data.nodes) {
      if (seen.has(src.id)) continue;
      seen.add(src.id);
      const cat = typeof src.category === 'number' ? (src.category < cats.length ? src.category : -1) : typeof src.category === 'string' ? cats.findIndex((c) => c.name === src.category) : -1;
      const prev = old.get(src.id);
      const m: NodeModel = {
        src,
        id: src.id,
        index: this.nodeList.length,
        name: src.name ?? src.id,
        cat,
        color: src.color ?? cats[cat]?.color ?? palette[0],
        size: Math.max(0, sizeOf(src)),
        symbol: src.symbol ?? cats[cat]?.symbol ?? o.symbol ?? 'circle',
        x: prev?.x ?? NaN,
        y: prev?.y ?? NaN,
        vx: prev?.vx ?? 0,
        vy: prev?.vy ?? 0,
        fx: null,
        fy: null,
        from: null,
        to: { x: 0, y: 0 },
        angle: 0,
        born: prev ? prev.born : on ? now : 0,
        degree: 0,
        sx: prev?.sx ?? 0,
        sy: prev?.sy ?? 0,
        r: 0,
        grow: 1,
        visible: true,
        lText: '',
        lFont: '',
        lW: 0,
      };
      this.nodeList.push(m);
    }
    this.byId = new Map(this.nodeList.map((n) => [n.id, n]));
    // links
    const eo = o.edge ?? {};
    this.linkList = [];
    this.adj = this.nodeList.map(() => []);
    for (const src of this.data.links ?? []) {
      const s = this.byId.get(src.source);
      const t = this.byId.get(src.target);
      if (!s || !t) continue;
      const color = src.color ?? (eo.color === 'source' ? s.color : eo.color === 'target' ? t.color : (eo.color ?? this.theme.edge));
      const l: LinkModel = { src, index: this.linkList.length, s, t, color, width: src.width ?? eo.width ?? 1, curveness: src.curveness ?? eo.curveness ?? 0 };
      this.linkList.push(l);
      if (s !== t) {
        this.adj[s.index].push(l);
        this.adj[t.index].push(l);
      }
    }
    for (const n of this.nodeList) n.degree = this.adj[n.index].length;
    // positions
    if (this.mode === 'force') this.placeForce(old, hadGraph, oldLinks);
    else {
      this.sim = null;
      if (this.mode === 'circular') {
        const c = o.circular ?? {};
        const pos = graphCircularLayout(
          this.nodeList.map((n) => ({ category: n.cat, value: n.src.value })),
          { sort: c.sort, startAngle: c.startAngle, clockwise: c.clockwise },
        );
        this.nodeList.forEach((n, i) => {
          n.to = { x: pos[i].x, y: pos[i].y };
          n.angle = pos[i].angle;
        });
      } else for (const n of this.nodeList) n.to = { x: this.toAxis(this.ax, n.src.x ?? 0), y: this.toAxis(this.ay, n.src.y ?? 0) };
      for (const n of this.nodeList) {
        const prev = old.get(n.id);
        n.from = prev && on && isFinite(prev.x) ? { x: prev.x, y: prev.y } : null;
        n.x = n.from?.x ?? n.to.x;
        n.y = n.from?.y ?? n.to.y;
      }
      // positions from another layout are in another space: no tween then
      if (!hadGraph || oldMode !== this.mode) for (const n of this.nodeList) n.from = null;
    }
    this.growUntil = on ? now + this.duration() : 0;
    this.animStart = on ? now : 0;
    this.hover = null;
    this.renderLegend();
    this.measure();
    this.layoutAxes();
    this.layoutPlot();
    const target = this.fitTarget();
    // the force layout eases into its box while it moves; the others snap
    if (!this.fit || this.mode !== 'force' || !hadGraph) this.fit = target;
    this.schedule();
  }

  private placeForce(old: Map<string, NodeModel>, hadGraph: boolean, oldLinks: Set<string>): void {
    const o = this.opts;
    const f = o.force ?? {};
    // an update that keeps most nodes and links only warms the layout up a little; new data starts afresh
    const kept = this.nodeList.filter((n) => isFinite(old.get(n.id)?.x ?? NaN)).length;
    const keptLinks = this.linkList.filter((l) => oldLinks.has(`${l.s.id}|${l.t.id}`)).length;
    const similar = hadGraph && kept > this.nodeList.length / 2 && keptLinks >= this.linkList.length / 2;
    if (!similar) for (const n of this.nodeList) n.x = n.y = NaN;
    this.nodeList.forEach((n, i) => {
      if (isFinite(n.x)) return;
      if (n.src.x !== undefined && n.src.y !== undefined) {
        n.x = n.src.x;
        n.y = n.src.y;
        return;
      }
      // next to a neighbour that already has a place
      const nb = this.adj[i].map((l) => (l.s === n ? l.t : l.s)).find((m) => isFinite(m.x));
      if (nb) {
        const a = (i * 2.399963) % (Math.PI * 2);
        n.x = nb.x + Math.cos(a) * 12;
        n.y = nb.y + Math.sin(a) * 12;
      } else {
        const p = spiralPosition(i, 12);
        n.x = p.x;
        n.y = p.y;
      }
    });
    for (const n of this.nodeList) {
      n.fx = n.src.fixed ? n.x : null;
      n.fy = n.src.fixed ? n.y : null;
    }
    const lengths = edgeLengths(
      this.linkList.map((l) => l.src.value),
      f.edgeLength ?? 40,
    );
    const collide = f.collide;
    const prevAlpha = this.sim?.alpha ?? 0;
    this.sim = new ForceSimulation(
      this.nodeList,
      this.linkList.map((l, k) => ({ source: l.s.index, target: l.t.index, distance: lengths[k] })),
      definedOnly({
        repulsion: f.repulsion,
        gravity: f.gravity,
        friction: f.friction,
        theta: f.theta,
        edgeStrength: f.edgeStrength,
        alphaDecay: f.alphaDecay,
        radius: collide ? this.nodeList.map((n) => n.size / 2 + (typeof collide === 'number' ? collide : 2)) : undefined,
      }),
    );
    this.sim.alpha = similar ? Math.max(prevAlpha, 0.3) : 1;
    for (let k = 0; k < (f.warmup ?? 0); k++) this.sim.tick();
    if (f.layoutAnimation === false) this.sim.run(400);
  }

  private hoverVisible(): boolean {
    const h = this.hover;
    if (!h) return false;
    return h.type === 'node' ? this.isVisible(h.n) : this.isVisible(h.l.s) && this.isVisible(h.l.t);
  }

  private isVisible(n: NodeModel): boolean {
    return n.cat < 0 || !this.hiddenCats.has(this.cats[n.cat].name);
  }

  // ------------------------------------------------------------------ legend

  private legendCfg(): { show: boolean; position: string; interactive: boolean } {
    const l = this.opts.legend;
    const o = typeof l === 'object' ? l : {};
    return { show: ((typeof l === 'boolean' ? l : o.show) ?? true) && this.cats.length > 0, position: o.position ?? 'bottom', interactive: o.interactive ?? true };
  }

  private renderLegend(): void {
    const L = this.legendCfg();
    this.bodyEl.className = `gr-body gr-legend-${L.position}`;
    this.legendEl.className = 'gr-legend';
    this.legendEl.style.display = L.show ? '' : 'none';
    if (!L.show) return;
    this.legendEl.innerHTML = this.cats
      .map((c) => {
        const hidden = this.hiddenCats.has(c.name);
        return `<li class="gr-legend__item${L.interactive ? ' is-interactive' : ''}${hidden ? ' is-hidden' : ''}" data-key="${esc(c.name)}"><i class="gr-legend__marker" style="--c:${c.color}"></i><span>${esc(c.name)}</span></li>`;
      })
      .join('');
  }

  // ------------------------------------------------------------------ layout & view

  private measure(): void {
    const r = this.plotEl.getBoundingClientRect();
    this.dpr = window.devicePixelRatio || 1;
    const w = Math.max(1, Math.floor(r.width));
    const h = Math.max(1, Math.floor(r.height));
    if (w === this.width && h === this.height && this.canvas.width === Math.round(w * this.dpr)) return;
    this.width = w;
    this.height = h;
    this.canvas.width = Math.round(w * this.dpr);
    this.canvas.height = Math.round(h * this.dpr);
    this.canvas.style.width = `${w}px`;
    this.canvas.style.height = `${h}px`;
  }

  /** Range of each axis: given, or the data rounded to nice values. */
  private layoutAxes(): void {
    for (const [a, key] of [
      [this.ax, 'x'],
      [this.ay, 'y'],
    ] as const) {
      if (!a) continue;
      const vs = this.nodeList.map((n) => (key === 'x' ? n.to.x : n.to.y)).filter((v) => isFinite(v));
      let lo = vs.length ? Math.min(...vs) : 0;
      let hi = vs.length ? Math.max(...vs) : 1;
      if (a.log) {
        lo = a.cfg.min !== undefined ? Math.log10(a.cfg.min) : Math.floor(lo);
        hi = a.cfg.max !== undefined ? Math.log10(a.cfg.max) : Math.ceil(hi === lo ? hi + 1 : hi);
      } else {
        const s = niceScale(lo, hi, 5);
        lo = a.cfg.min ?? s.min;
        hi = a.cfg.max ?? s.max;
      }
      a.lo = lo;
      a.hi = hi === lo ? lo + 1 : hi;
    }
  }

  private axisShown(a: AxisModel | null): boolean {
    return !!a && a.cfg.show !== false;
  }

  private axisLabel(a: AxisModel, v: number): string {
    // 10 ** log10(500) is 499.99…: round away the float noise
    const val = +this.fromAxis(a, v).toPrecision(12);
    return a.cfg.format ? a.cfg.format(val) : formatCompact(val);
  }

  /** The drawing area: inside the padding, and the axis labels when there are axes. */
  private layoutPlot(): void {
    const pad = this.opts.padding ?? 10;
    let left = pad;
    let right = pad;
    let top = pad;
    let bottom = pad;
    if (this.axisShown(this.ay)) {
      const a = this.ay!;
      this.ctx.font = this.font(11);
      const ticks = this.ticks(a, a.lo, a.hi, 6);
      const w = Math.max(0, ...ticks.map((t) => this.ctx.measureText(this.axisLabel(a, t)).width));
      left += w + 10;
      if (a.cfg.name) top += 18;
      right += 8;
    }
    if (this.axisShown(this.ax)) {
      bottom += 22;
      if (this.ax!.cfg.name) bottom += 16;
      right += 8;
    }
    this.plot = { x: left, y: top, w: Math.max(1, this.width - left - right), h: Math.max(1, this.height - top - bottom) };
  }

  private ticks(a: AxisModel, lo: number, hi: number, count: number): number[] {
    if (a.log) return logTicks(10 ** lo, 10 ** hi).map((v) => Math.log10(v));
    const min = Math.min(lo, hi);
    const max = Math.max(lo, hi);
    return niceScale(min, max, count).ticks.filter((t) => t >= min - 1e-9 && t <= max + 1e-9);
  }

  private maxRadius(): number {
    let r = 0;
    for (const n of this.nodeList) if (this.isVisible(n)) r = Math.max(r, n.size / 2);
    return r;
  }

  /** The fit of the coordinates into the drawing area. */
  private fitTarget(): Fit {
    const o = this.opts;
    const p = this.plot;
    if (this.ax && this.ay) return fitBox([this.ax.lo, this.ay.lo, this.ax.hi, this.ay.hi], p, { flipY: true, aspect: o.aspect });
    const inset = (m: number): { x: number; y: number; w: number; h: number } => {
      const k = Math.min(m, p.w / 3, p.h / 3);
      return { x: p.x + k, y: p.y + k, w: p.w - 2 * k, h: p.h - 2 * k };
    };
    if (this.mode === 'circular') {
      const c = o.circular ?? {};
      const r = (c.radius ?? (c.rotateLabel ? 65 : 75)) / 100;
      return fitBox([-1 / r, -1 / r, 1 / r, 1 / r], p, { aspect: 1 });
    }
    const vis = this.nodeList.filter((n) => this.isVisible(n));
    const pts = vis.length ? vis : this.nodeList;
    let x0 = Infinity;
    let y0 = Infinity;
    let x1 = -Infinity;
    let y1 = -Infinity;
    for (const n of pts) {
      const x = this.mode === 'force' ? n.x : n.to.x;
      const y = this.mode === 'force' ? n.y : n.to.y;
      if (!isFinite(x) || !isFinite(y)) continue;
      x0 = Math.min(x0, x);
      y0 = Math.min(y0, y);
      x1 = Math.max(x1, x);
      y1 = Math.max(y1, y);
    }
    if (!isFinite(x0)) [x0, y0, x1, y1] = [-1, -1, 1, 1];
    if (this.mode === 'none' && o.extent) [x0, y0, x1, y1] = o.extent;
    // a single node (or a line) still gets some room
    if (x1 - x0 < 1e-9) [x0, x1] = [x0 - 1, x1 + 1];
    if (y1 - y0 < 1e-9) [y0, y1] = [y0 - 1, y1 + 1];
    const m = o.extent && this.mode === 'none' ? 0 : this.maxRadius() + 6;
    return fitBox([x0, y0, x1, y1], inset(m), { aspect: o.aspect ?? 1, maxScale: this.mode === 'force' ? 1.6 : undefined });
  }

  private easeFit(): boolean {
    const t = this.fitTarget();
    const f = this.fit;
    if (!f) {
      this.fit = t;
      return false;
    }
    // shrink fast (nothing leaves the box), grow gently
    const k = Math.abs(t.ax) < Math.abs(f.ax) ? 0.3 : 0.12;
    f.ax += (t.ax - f.ax) * k;
    f.ay += (t.ay - f.ay) * k;
    f.bx += (t.bx - f.bx) * k;
    f.by += (t.by - f.by) * k;
    return Math.abs(t.ax - f.ax) / Math.abs(t.ax) > 0.002 || Math.abs(t.bx - f.bx) > 0.5 || Math.abs(t.by - f.by) > 0.5;
  }

  private X(x: number): number {
    const f = this.fit!;
    return this.zoom * (f.ax * x + f.bx) + this.panX;
  }

  private Y(y: number): number {
    const f = this.fit!;
    return this.zoom * (f.ay * y + f.by) + this.panY;
  }

  private invX(px: number): number {
    const f = this.fit!;
    return ((px - this.panX) / this.zoom - f.bx) / f.ax;
  }

  private invY(py: number): number {
    const f = this.fit!;
    return ((py - this.panY) / this.zoom - f.by) / f.ay;
  }

  private nodeScale(): number {
    return Math.pow(this.zoom, this.opts.nodeScaleRatio ?? 0.5);
  }

  // ------------------------------------------------------------------ frames

  private schedule(): void {
    if (!this.raf && !this.destroyed) this.raf = requestAnimationFrame(() => this.frame());
  }

  private frame(): void {
    this.raf = 0;
    if (this.destroyed) return;
    const now = performance.now();
    let more = false;
    if (this.sim && this.sim.running) {
      this.sim.tick();
      more = true;
    }
    if (this.mode === 'force' && !this.userMoved && !this.drag) more = this.easeFit() || more;
    if (this.animStart) {
      const p = easeOut(clamp((now - this.animStart) / (this.duration() || 1), 0, 1));
      for (const n of this.nodeList)
        if (n.from) {
          n.x = n.from.x + (n.to.x - n.from.x) * p;
          n.y = n.from.y + (n.to.y - n.from.y) * p;
        }
      if (p >= 1) {
        this.animStart = 0;
        for (const n of this.nodeList) n.from = null;
      } else more = true;
    }
    if (this.growUntil && now < this.growUntil) more = true;
    this.draw(now);
    if (more) this.schedule();
    else if (this.growUntil) {
      this.growUntil = 0;
      for (const n of this.nodeList) n.born = 0;
      this.draw(now);
    }
  }

  // ------------------------------------------------------------------ drawing

  private font(size: number, weight: number | string = 400): string {
    return `${weight} ${size}px ${this.theme.font}`;
  }

  private api(now: number): GraphGraphicApi {
    return {
      width: this.width,
      height: this.height,
      plot: { ...this.plot },
      theme: this.theme,
      toPixel: (x, y) => ({ x: this.X(this.toAxis(this.ax, x)), y: this.Y(this.toAxis(this.ay, y)) }),
      fromPixel: (x, y) => ({ x: this.fromAxis(this.ax, this.invX(x)), y: this.fromAxis(this.ay, this.invY(y)) }),
      nodePosition: (id) => {
        const n = this.byId.get(id);
        return n && this.isVisible(n) ? { x: this.X(n.x), y: this.Y(n.y), r: n.r } : null;
      },
      zoom: this.zoom,
      progress: this.growUntil ? easeOut(clamp(1 - (this.growUntil - now) / (this.duration() || 1), 0, 1)) : 1,
      time: now,
    };
  }

  private draw(now = performance.now()): void {
    const ctx = this.ctx;
    const t = this.theme;
    if (!this.fit) this.fit = this.fitTarget();
    ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
    ctx.clearRect(0, 0, this.width, this.height);
    if (t.background !== 'transparent') {
      ctx.fillStyle = t.background;
      ctx.fillRect(0, 0, this.width, this.height);
    }
    const api = this.api(now);
    const axes = !!(this.ax && this.ay);
    if (axes) this.drawGrid();
    ctx.save();
    if (axes) {
      ctx.beginPath();
      ctx.rect(this.plot.x, this.plot.y, this.plot.w, this.plot.h);
      ctx.clip();
    }
    if (this.opts.underlay) {
      ctx.save();
      this.opts.underlay(ctx, api);
      ctx.restore();
    }
    // where each node is this frame
    const ns = this.nodeScale();
    const dur = this.duration() || 1;
    for (const n of this.nodeList) {
      n.visible = this.isVisible(n) && isFinite(n.x) && isFinite(n.y);
      n.sx = this.X(n.x);
      n.sy = this.Y(n.y);
      n.grow = n.born ? easeOut(clamp((now - n.born) / dur, 0, 1)) : 1;
      n.r = (n.size / 2) * ns * n.grow;
    }
    // what stays lit while hovering
    let litN: Set<NodeModel> | null = null;
    let litL: Set<LinkModel> | null = null;
    const focus = this.opts.focus ?? 'adjacency';
    const h = this.hover;
    if (h && focus !== 'none') {
      litN = new Set();
      litL = new Set();
      if (h.type === 'node') {
        litN.add(h.n);
        if (focus === 'adjacency')
          for (const l of this.adj[h.n.index]) {
            litL.add(l);
            litN.add(l.s);
            litN.add(l.t);
          }
      } else {
        litL.add(h.l);
        litN.add(h.l.s);
        litN.add(h.l.t);
      }
    }
    this.drawEdges(litL);
    this.drawNodes(litN);
    this.drawLabels(litN);
    this.drawEdgeLabels(litL);
    ctx.restore();
    if (axes) this.drawAxisLabels();
    if (this.opts.graphic) {
      ctx.save();
      this.opts.graphic(ctx, api);
      ctx.restore();
    }
  }

  private drawGrid(): void {
    const ctx = this.ctx;
    const p = this.plot;
    ctx.lineWidth = 1;
    ctx.strokeStyle = this.theme.grid;
    ctx.beginPath();
    if (this.axisShown(this.ax) && this.ax!.cfg.splitLine !== false)
      for (const v of this.ticks(this.ax!, this.invX(p.x), this.invX(p.x + p.w), Math.max(2, Math.floor(p.w / 90)))) {
        const x = Math.round(this.X(v)) + 0.5;
        ctx.moveTo(x, p.y);
        ctx.lineTo(x, p.y + p.h);
      }
    if (this.axisShown(this.ay) && this.ay!.cfg.splitLine !== false)
      for (const v of this.ticks(this.ay!, this.invY(p.y + p.h), this.invY(p.y), Math.max(2, Math.floor(p.h / 60)))) {
        const y = Math.round(this.Y(v)) + 0.5;
        ctx.moveTo(p.x, y);
        ctx.lineTo(p.x + p.w, y);
      }
    ctx.stroke();
  }

  private drawAxisLabels(): void {
    const ctx = this.ctx;
    const p = this.plot;
    const t = this.theme;
    ctx.font = this.font(11);
    ctx.fillStyle = t.muted;
    ctx.strokeStyle = t.muted;
    ctx.globalAlpha = 1;
    if (this.axisShown(this.ax)) {
      const a = this.ax!;
      ctx.beginPath();
      ctx.moveTo(p.x, Math.round(p.y + p.h) + 0.5);
      ctx.lineTo(p.x + p.w, Math.round(p.y + p.h) + 0.5);
      ctx.globalAlpha = 0.5;
      ctx.stroke();
      ctx.globalAlpha = 1;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'top';
      for (const v of this.ticks(a, this.invX(p.x), this.invX(p.x + p.w), Math.max(2, Math.floor(p.w / 90)))) ctx.fillText(this.axisLabel(a, v), this.X(v), p.y + p.h + 6);
      if (a.cfg.name) {
        ctx.textAlign = 'right';
        ctx.fillStyle = t.text;
        ctx.fillText(a.cfg.name, p.x + p.w, p.y + p.h + 22);
        ctx.fillStyle = t.muted;
      }
    }
    if (this.axisShown(this.ay)) {
      const a = this.ay!;
      ctx.beginPath();
      ctx.moveTo(Math.round(p.x) - 0.5, p.y);
      ctx.lineTo(Math.round(p.x) - 0.5, p.y + p.h);
      ctx.globalAlpha = 0.5;
      ctx.stroke();
      ctx.globalAlpha = 1;
      ctx.textAlign = 'right';
      ctx.textBaseline = 'middle';
      for (const v of this.ticks(a, this.invY(p.y + p.h), this.invY(p.y), Math.max(2, Math.floor(p.h / 60)))) ctx.fillText(this.axisLabel(a, v), p.x - 6, this.Y(v));
      if (a.cfg.name) {
        ctx.textAlign = 'left';
        ctx.textBaseline = 'bottom';
        ctx.fillStyle = t.text;
        ctx.fillText(a.cfg.name, Math.max(2, p.x - 30), p.y - 6);
      }
    }
  }

  private edgeOpacity(l: LinkModel): number {
    const eo = this.opts.edge ?? {};
    return eo.opacity ?? (!l.src.color && (eo.color === 'source' || eo.color === 'target') ? 0.5 : 1);
  }

  private arrowMode(): 'none' | 'end' | 'both' {
    const a = this.opts.edge?.arrow;
    return a === true || a === 'end' ? 'end' : a === 'both' ? 'both' : 'none';
  }

  /** Ends of an edge (pulled back to the node borders when there are arrows) and its control point. */
  private edgeGeom(l: LinkModel, arrows: 'none' | 'end' | 'both'): { x1: number; y1: number; x2: number; y2: number; c: { x: number; y: number } | null } {
    let x1 = l.s.sx;
    let y1 = l.s.sy;
    let x2 = l.t.sx;
    let y2 = l.t.sy;
    const c = l.curveness ? curveControl(x1, y1, x2, y2, l.curveness) : null;
    if (arrows !== 'none') {
      const back = (x: number, y: number, fx: number, fy: number, r: number): [number, number] => {
        const d = Math.hypot(x - fx, y - fy) || 1;
        return [x - ((x - fx) / d) * r, y - ((y - fy) / d) * r];
      };
      const cx = c ? c.x : x1;
      const cy = c ? c.y : y1;
      [x2, y2] = back(x2, y2, cx, cy, l.t.r + 2);
      if (arrows === 'both') [x1, y1] = back(x1, y1, c ? c.x : l.t.sx, c ? c.y : l.t.sy, l.s.r + 2);
    }
    return { x1, y1, x2, y2, c };
  }

  private drawEdges(litL: Set<LinkModel> | null): void {
    const ctx = this.ctx;
    const dim = this.opts.hoverDim ?? 0.12;
    const arrows = this.arrowMode();
    const aSize = this.opts.edge?.arrowSize ?? 7;
    type Batch = { color: string; width: number; alpha: number; dash?: number[]; path: Path2D; heads: Path2D | null };
    const batches = new Map<string, Batch>();
    const lit: LinkModel[] = [];
    for (const l of this.linkList) {
      if (!l.s.visible || !l.t.visible) continue;
      if (litL && litL.has(l)) {
        lit.push(l);
        continue;
      }
      this.addEdge(batches, l, (litL ? dim : 1) * this.edgeOpacity(l), arrows, aSize);
    }
    const draw = (): void => {
      for (const b of batches.values()) {
        ctx.globalAlpha = b.alpha;
        ctx.strokeStyle = b.color;
        ctx.lineWidth = b.width;
        ctx.setLineDash(b.dash ?? []);
        ctx.stroke(b.path);
        if (b.heads) {
          ctx.fillStyle = b.color;
          ctx.fill(b.heads);
        }
      }
      ctx.setLineDash([]);
      batches.clear();
    };
    draw();
    // lit edges on top, a bit stronger
    for (const l of lit) this.addEdge(batches, l, Math.min(1, this.edgeOpacity(l) + 0.3), arrows, aSize, 0.5);
    draw();
    ctx.globalAlpha = 1;
  }

  private addEdge(
    batches: Map<string, { color: string; width: number; alpha: number; dash?: number[]; path: Path2D; heads: Path2D | null }>,
    l: LinkModel,
    opacity: number,
    arrows: 'none' | 'end' | 'both',
    aSize: number,
    extraWidth = 0,
  ): void {
    const a = opacity * Math.min(l.s.grow, l.t.grow);
    if (a < 0.01) return;
    const width = l.width + extraWidth;
    const key = `${l.color}|${width}|${a.toFixed(2)}|${l.src.dash?.join(',') ?? ''}`;
    let b = batches.get(key);
    if (!b) {
      b = { color: l.color, width, alpha: a, dash: l.src.dash, path: new Path2D(), heads: arrows === 'none' ? null : new Path2D() };
      batches.set(key, b);
    }
    if (l.s === l.t) {
      // a loop: a small circle above the node
      const r = Math.max(6, l.s.r);
      b.path.moveTo(l.s.sx + r * 0.7, l.s.sy - r * 0.7);
      b.path.arc(l.s.sx, l.s.sy - r * 1.4, r * 0.75, 0.25 * Math.PI, 2.25 * Math.PI);
      return;
    }
    const g = this.edgeGeom(l, arrows);
    b.path.moveTo(g.x1, g.y1);
    if (g.c) b.path.quadraticCurveTo(g.c.x, g.c.y, g.x2, g.y2);
    else b.path.lineTo(g.x2, g.y2);
    if (b.heads) {
      const s = aSize + width * 0.5;
      const head = (tx: number, ty: number, fx: number, fy: number): void => {
        const d = Math.hypot(tx - fx, ty - fy) || 1;
        const ux = (tx - fx) / d;
        const uy = (ty - fy) / d;
        b!.heads!.moveTo(tx, ty);
        b!.heads!.lineTo(tx - ux * s - uy * s * 0.45, ty - uy * s + ux * s * 0.45);
        b!.heads!.lineTo(tx - ux * s + uy * s * 0.45, ty - uy * s - ux * s * 0.45);
        b!.heads!.closePath();
      };
      head(g.x2, g.y2, g.c ? g.c.x : g.x1, g.c ? g.c.y : g.y1);
      if (arrows === 'both') head(g.x1, g.y1, g.c ? g.c.x : g.x2, g.c ? g.c.y : g.y2);
    }
  }

  private addSymbol(path: Path2D, sym: GraphSymbol, x: number, y: number, r: number): void {
    if (sym === 'rect') path.rect(x - r, y - r, r * 2, r * 2);
    else if (sym === 'roundRect') {
      path.moveTo(x + r, y);
      path.roundRect(x - r, y - r, r * 2, r * 2, r * 0.35);
    } else if (sym === 'diamond') {
      path.moveTo(x, y - r * 1.25);
      path.lineTo(x + r, y);
      path.lineTo(x, y + r * 1.25);
      path.lineTo(x - r, y);
      path.closePath();
    } else if (sym === 'triangle') {
      path.moveTo(x, y - r * 1.2);
      path.lineTo(x + r * 1.1, y + r * 0.8);
      path.lineTo(x - r * 1.1, y + r * 0.8);
      path.closePath();
    } else {
      path.moveTo(x + r, y);
      path.arc(x, y, r, 0, Math.PI * 2);
    }
  }

  private drawNodes(litN: Set<NodeModel> | null): void {
    const ctx = this.ctx;
    const ns = this.opts.nodeStyle ?? {};
    const bw = ns.borderWidth ?? 1;
    const bc = ns.borderColor ?? this.theme.nodeBorder;
    const op = ns.opacity ?? 1;
    const dim = this.opts.hoverDim ?? 0.12;
    const W = this.width;
    const H = this.height;
    for (const pass of [0, 1]) {
      const batches = new Map<string, { color: string; alpha: number; path: Path2D }>();
      for (const n of this.nodeList) {
        if (!n.visible || n.symbol === 'none' || n.r <= 0.05) continue;
        const lit = !litN || litN.has(n);
        if ((pass === 1) !== (!!litN && lit)) continue;
        if (n.sx < -n.r || n.sy < -n.r || n.sx > W + n.r || n.sy > H + n.r) continue;
        const a = op * (lit ? 1 : dim);
        const key = `${n.color}|${a}`;
        let b = batches.get(key);
        if (!b) batches.set(key, (b = { color: n.color, alpha: a, path: new Path2D() }));
        const r = this.hover?.type === 'node' && this.hover.n === n ? n.r + 1.5 : n.r;
        this.addSymbol(b.path, n.symbol, n.sx, n.sy, r);
      }
      for (const b of batches.values()) {
        ctx.globalAlpha = b.alpha;
        ctx.fillStyle = b.color;
        ctx.fill(b.path);
        if (bw > 0) {
          ctx.lineWidth = bw;
          ctx.strokeStyle = bc;
          ctx.stroke(b.path);
        }
      }
    }
    ctx.globalAlpha = 1;
  }

  private labelCfg(n: NodeModel): (GraphLabelOptions & { hideOverlap?: boolean }) | null {
    const g = this.opts.label;
    const base = typeof g === 'object' ? g : { show: g === true };
    const own = n.src.label;
    if (own === false) return null;
    if (own === true) return { ...base, show: true };
    if (typeof own === 'object') return { ...base, ...own, show: own.show ?? true };
    return base.show ? base : null;
  }

  private drawLabels(litN: Set<NodeModel> | null): void {
    const ctx = this.ctx;
    const t = this.theme;
    const g = this.opts.label;
    const hideOverlap = typeof g === 'object' && !!g.hideOverlap;
    const rotate = this.mode === 'circular' && !!this.opts.circular?.rotateLabel;
    const hovered = this.hover?.type === 'node' ? this.hover.n : null;
    const dim = this.opts.hoverDim ?? 0.12;
    type Item = { n: NodeModel; cfg: GraphLabelOptions; rect: Rect; x: number; y: number; align: CanvasTextAlign; rot: number; fs: number };
    const items: Item[] = [];
    for (const n of this.nodeList) {
      if (!n.visible || n.grow < 0.6) continue;
      let cfg = this.labelCfg(n);
      if (!cfg && n === hovered) cfg = typeof g === 'object' ? { ...g, show: true } : { show: true };
      if (!cfg) continue;
      if (n.sx < -200 || n.sy < -50 || n.sx > this.width + 200 || n.sy > this.height + 50) continue;
      const fs = cfg.fontSize ?? 11;
      const font = this.font(fs, cfg.fontWeight ?? 400);
      const text = cfg.format ? cfg.format(n.src) : n.name;
      if (!text) continue;
      if (text !== n.lText || font !== n.lFont) {
        ctx.font = font;
        n.lText = text;
        n.lFont = font;
        n.lW = ctx.measureText(text).width;
      }
      const w = n.lW;
      const h = fs * 1.2;
      const gap = 4;
      let x = n.sx;
      let y = n.sy;
      let align: CanvasTextAlign = 'left';
      let rot = 0;
      let rect: Rect;
      if (rotate) {
        // along the radius, outside the circle, never upside down
        const dx = Math.cos(n.angle);
        const dy = -Math.sin(n.angle);
        x = n.sx + dx * (n.r + gap);
        y = n.sy + dy * (n.r + gap);
        rot = Math.atan2(dy, dx);
        align = 'left';
        if (dx < 0) {
          rot += Math.PI;
          align = 'right';
        }
        const ex = x + dx * w;
        const ey = y + dy * w;
        rect = { x: Math.min(x, ex) - h / 2, y: Math.min(y, ey) - h / 2, w: Math.abs(ex - x) + h, h: Math.abs(ey - y) + h };
      } else {
        const pos = cfg.position ?? 'right';
        if (pos === 'right') x = n.sx + n.r + gap;
        else if (pos === 'left') {
          x = n.sx - n.r - gap;
          align = 'right';
        } else {
          align = 'center';
          if (pos === 'top') y = n.sy - n.r - gap - h / 2;
          else if (pos === 'bottom') y = n.sy + n.r + gap + h / 2;
        }
        const x0 = align === 'left' ? x : align === 'right' ? x - w : x - w / 2;
        rect = { x: x0, y: y - h / 2, w, h };
      }
      items.push({ n, cfg, rect, x, y, align, rot, fs });
    }
    // most important first: the hovered node, the lit ones, then the biggest
    items.sort((a, b) => +(b.n === hovered) - +(a.n === hovered) || +(!!litN?.has(b.n)) - +(!!litN?.has(a.n)) || b.n.size - a.n.size);
    const keep = hideOverlap ? hideOverlaps(items.map((i) => i.rect)) : null;
    ctx.textBaseline = 'middle';
    ctx.lineJoin = 'round';
    items.forEach((it, k) => {
      if (keep && !keep[k] && it.n !== hovered) return;
      const c = it.cfg;
      ctx.globalAlpha = (litN && !litN.has(it.n) ? dim : 1) * it.n.grow;
      ctx.font = it.n.lFont;
      ctx.textAlign = it.align;
      const inside = (c.position ?? 'right') === 'inside' && !it.rot && this.mode !== 'circular';
      ctx.save();
      ctx.translate(it.x, it.y);
      if (it.rot) ctx.rotate(it.rot);
      if ((c.halo ?? true) && !inside && t.background !== 'transparent') {
        ctx.strokeStyle = t.background;
        ctx.lineWidth = 3;
        ctx.strokeText(it.n.lText, 0, 0);
      }
      ctx.fillStyle = c.color ?? (inside ? '#ffffff' : t.text);
      ctx.fillText(it.n.lText, 0, 0);
      ctx.restore();
    });
    ctx.globalAlpha = 1;
  }

  private edgeLabelText(l: LinkModel): string | null {
    const eo = this.opts.edge?.label;
    const cfg = typeof eo === 'object' ? eo : { show: eo === true };
    const own = l.src.label;
    if (own === false) return null;
    if (typeof own === 'string') return own;
    if (own !== true && !cfg.show) return null;
    if (cfg.format) return cfg.format(l.src);
    return l.src.value !== undefined ? this.fmt(l.src.value) : null;
  }

  private drawEdgeLabels(litL: Set<LinkModel> | null): void {
    const ctx = this.ctx;
    const t = this.theme;
    const eo = this.opts.edge?.label;
    const cfg = typeof eo === 'object' ? eo : {};
    const dim = this.opts.hoverDim ?? 0.12;
    const arrows = this.arrowMode();
    ctx.font = this.font(cfg.fontSize ?? 10);
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.lineJoin = 'round';
    for (const l of this.linkList) {
      if (!l.s.visible || !l.t.visible || l.s === l.t) continue;
      const text = this.edgeLabelText(l);
      if (!text) continue;
      const g = this.edgeGeom(l, arrows);
      const m = g.c ? quadAt(g.x1, g.y1, g.c.x, g.c.y, g.x2, g.y2, 0.5) : { x: (g.x1 + g.x2) / 2, y: (g.y1 + g.y2) / 2 };
      ctx.globalAlpha = (litL && !litL.has(l) ? dim : 1) * Math.min(l.s.grow, l.t.grow);
      if (t.background !== 'transparent') {
        ctx.strokeStyle = t.background;
        ctx.lineWidth = 3;
        ctx.strokeText(text, m.x, m.y);
      }
      ctx.fillStyle = cfg.color ?? t.muted;
      ctx.fillText(text, m.x, m.y);
    }
    ctx.globalAlpha = 1;
  }

  private fmt(v: number): string {
    return this.opts.valueFormatter ? this.opts.valueFormatter(v) : v.toLocaleString('pt-PT');
  }

  // ------------------------------------------------------------------ interaction

  private info(h: Hover): GraphHoverInfo {
    if (h.type === 'node') {
      const n = h.n;
      return { type: 'node', index: n.index, name: n.name, value: n.src.value, color: n.color, node: n.src, category: this.cats[n.cat]?.name, degree: n.degree };
    }
    const l = h.l;
    const sep = this.arrowMode() === 'none' ? ' — ' : ' → ';
    return { type: 'link', index: l.index, name: `${l.s.name}${sep}${l.t.name}`, value: l.src.value, color: l.color, link: l.src, source: l.s.src, target: l.t.src };
  }

  private hitTest(x: number, y: number): Hover | null {
    let best: NodeModel | null = null;
    let bestD = Infinity;
    for (const n of this.nodeList) {
      if (!n.visible) continue;
      const r = Math.max(n.r, 3) + 2;
      const d = (n.sx - x) ** 2 + (n.sy - y) ** 2;
      if (d <= r * r && d < bestD) {
        bestD = d;
        best = n;
      }
    }
    if (best) return { type: 'node', n: best };
    const arrows = this.arrowMode();
    let bl: LinkModel | null = null;
    let bd = Infinity;
    for (const l of this.linkList) {
      if (!l.s.visible || !l.t.visible || l.s === l.t) continue;
      const tol = Math.max(4, l.width / 2 + 2);
      // cheap box test first
      if (x < Math.min(l.s.sx, l.t.sx) - 60 || x > Math.max(l.s.sx, l.t.sx) + 60 || y < Math.min(l.s.sy, l.t.sy) - 60 || y > Math.max(l.s.sy, l.t.sy) + 60) continue;
      const g = this.edgeGeom(l, arrows);
      const d = g.c ? distToQuad(x, y, g.x1, g.y1, g.c.x, g.c.y, g.x2, g.y2) : distToSegment(x, y, g.x1, g.y1, g.x2, g.y2);
      if (d <= tol && d < bd) {
        bd = d;
        bl = l;
      }
    }
    return bl ? { type: 'link', l: bl } : null;
  }

  private sameHover(a: Hover | null, b: Hover | null): boolean {
    if (!a || !b) return a === b;
    return a.type === 'node' ? b.type === 'node' && a.n === b.n : b.type === 'link' && a.l === b.l;
  }

  private roam(kind: 'zoom' | 'move'): boolean {
    const r = this.opts.roam ?? true;
    return r === true || r === kind;
  }

  private draggable(): boolean {
    return this.opts.draggable ?? !this.opts.axes;
  }

  private bind(): void {
    const c = this.canvas;
    const pos = (e: MouseEvent): { x: number; y: number } => {
      const r = c.getBoundingClientRect();
      return { x: e.clientX - r.left, y: e.clientY - r.top };
    };
    c.addEventListener('pointerdown', (e) => {
      if (e.button !== 0) return;
      const { x, y } = pos(e);
      const h = this.hitTest(x, y);
      if (h?.type === 'node' && this.draggable()) {
        this.drag = { mode: 'node', x, y, moved: false, node: h.n, px: 0, py: 0 };
      } else if (this.roam('move')) this.drag = { mode: 'pan', x, y, moved: false, px: this.panX, py: this.panY };
      else return;
      c.setPointerCapture(e.pointerId);
    });
    c.addEventListener('pointermove', (e) => {
      const { x, y } = pos(e);
      const d = this.drag;
      if (d) {
        if (!d.moved && Math.hypot(x - d.x, y - d.y) < 3) return;
        if (!d.moved) {
          d.moved = true;
          this.tooltipEl.classList.remove('is-visible');
          c.style.cursor = 'grabbing';
          if (d.mode === 'node' && this.sim) this.sim.alphaTarget = 0.3;
        }
        if (d.mode === 'pan') {
          this.userMoved = true;
          this.panX = d.px + (x - d.x);
          this.panY = d.py + (y - d.y);
        } else {
          const n = d.node!;
          const wx = this.invX(x);
          const wy = this.invY(y);
          if (this.sim) {
            n.fx = wx;
            n.fy = wy;
          } else {
            n.from = null;
            n.x = n.to.x = wx;
            n.y = n.to.y = wy;
          }
        }
        this.schedule();
        return;
      }
      const h = this.hitTest(x, y);
      if (!this.sameHover(h, this.hover)) {
        this.hover = h;
        this.emit('hover', h ? this.info(h) : null);
        this.schedule();
      }
      c.style.cursor = h ? (h.type === 'node' && this.draggable() ? 'grab' : 'pointer') : this.roam('move') ? 'default' : '';
      this.showTooltip(e);
    });
    const end = (): void => {
      const d = this.drag;
      if (!d) return;
      this.drag = null;
      c.style.cursor = '';
      if (d.moved) this.suppressClick = true;
      if (d.mode === 'node' && this.sim) {
        this.sim.alphaTarget = 0;
        const n = d.node!;
        if (!n.src.fixed) n.fx = n.fy = null;
        else {
          n.fx = n.x;
          n.fy = n.y;
        }
      }
      this.schedule();
    };
    c.addEventListener('pointerup', end);
    c.addEventListener('pointercancel', end);
    c.addEventListener('pointerleave', () => {
      if (this.drag) return;
      if (this.hover) {
        this.hover = null;
        this.emit('hover', null);
        this.schedule();
      }
      this.tooltipEl.classList.remove('is-visible');
    });
    c.addEventListener('click', (e) => {
      if (this.suppressClick) {
        this.suppressClick = false;
        return;
      }
      const { x, y } = pos(e);
      const h = this.hitTest(x, y);
      if (h) this.emit('click', this.info(h));
    });
    c.addEventListener(
      'wheel',
      (e) => {
        if (!this.roam('zoom')) return;
        e.preventDefault();
        const { x, y } = pos(e);
        const [lo, hi] = this.opts.scaleLimit ?? [0.2, 12];
        const z = clamp(this.zoom * Math.exp(-e.deltaY * 0.0015), lo, hi);
        const f = z / this.zoom;
        this.panX = x - (x - this.panX) * f;
        this.panY = y - (y - this.panY) * f;
        this.zoom = z;
        this.userMoved = true;
        this.hover = null;
        this.tooltipEl.classList.remove('is-visible');
        this.schedule();
      },
      { passive: false },
    );
    c.addEventListener('dblclick', (e) => {
      const { x, y } = pos(e);
      if (!this.hitTest(x, y) && (this.zoom !== 1 || this.panX || this.panY)) this.resetView();
    });
    this.legendEl.addEventListener('click', (e) => {
      const li = (e.target as HTMLElement).closest<HTMLElement>('.gr-legend__item');
      if (!li || !this.legendCfg().interactive) return;
      this.toggle(li.dataset.key!);
    });
  }

  private showTooltip(e: PointerEvent): void {
    const tt = this.opts.tooltip ?? true;
    const el = this.tooltipEl;
    const h = this.hover;
    if (!h || tt === false || (typeof tt === 'object' && tt.show === false)) {
      el.classList.remove('is-visible');
      return;
    }
    const info = this.info(h);
    if (typeof tt === 'object' && tt.formatter) el.innerHTML = tt.formatter(info);
    else {
      const row = (k: string, v: string): string => `<div class="gr-tooltip__row"><span>${esc(k)}</span><b>${esc(v)}</b></div>`;
      let html = `<div class="gr-tooltip__head"><i class="gr-tooltip__dot" style="background:${info.color}"></i>${esc(info.name)}</div>`;
      if (info.type === 'node') {
        if (info.category) html += `<div class="gr-tooltip__sub">${esc(info.category)}</div>`;
        if (info.value !== undefined) html += row('Valor', this.fmt(info.value));
        html += row('Ligações', String(info.degree ?? 0));
      } else if (info.value !== undefined) html += row('Valor', this.fmt(info.value));
      el.innerHTML = html;
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

export function createGraphChart(container: HTMLElement, options: GraphOptions = {}): GraphChart {
  return new GraphChart(container, options);
}
