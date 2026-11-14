import { parseColor } from '../shared/color';
import { defaultSeparation, radialSeparation, tidyLayout, type TidyInput } from './layout';
import type {
  TreeChartEvent,
  TreeChartHoverInfo,
  TreeChartLabel,
  TreeChartNode,
  TreeChartOptions,
  TreeChartOrient,
  TreeChartSpec,
  TreeChartSymbol,
  TreeChartTheme,
} from './types';

const FONT = '-apple-system, BlinkMacSystemFont, "Trebuchet MS", Roboto, Ubuntu, sans-serif';

export const treeDarkTheme: TreeChartTheme = {
  background: '#131722',
  text: '#d1d4dc',
  muted: '#787b86',
  edge: 'rgba(120, 123, 134, 0.55)',
  symbolFill: '#131722',
  tooltipBg: '#1e222d',
  tooltipText: '#d1d4dc',
  tooltipBorder: '#2a2e39',
  font: FONT,
};

export const treeLightTheme: TreeChartTheme = {
  background: '#ffffff',
  text: '#131722',
  muted: '#787b86',
  edge: '#c8ccd6',
  symbolFill: '#ffffff',
  tooltipBg: '#ffffff',
  tooltipText: '#131722',
  tooltipBorder: '#e0e3eb',
  font: FONT,
};

export const TREE_COLORS = ['#2962ff', '#ff9800', '#089981', '#f23645', '#9c27b0', '#00bcd4', '#e91e63', '#8bc34a', '#ffc107', '#607d8b'];

const esc = (s: string): string => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const clamp = (v: number, a: number, b: number): number => Math.min(b, Math.max(a, v));
const easeInOut = (t: number): number => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
const alpha = (c: string, a: number): string => {
  const [r, g, b, a0] = parseColor(c);
  return `rgba(${r}, ${g}, ${b}, ${+(a * a0).toFixed(3)})`;
};

/** A node of the model, with its animated position (world coordinates, before zoom / pan). */
interface N {
  src: TreeChartNode;
  key: string;
  tree: TreeModel;
  parent: N | null;
  children: N[];
  depth: number;
  collapsed: boolean;
  visible: boolean;
  /** from → to → now */
  fx: number;
  fy: number;
  fa: number;
  tx: number;
  ty: number;
  ta: number;
  x: number;
  y: number;
  a: number;
  /** drawn at least once */
  placed: boolean;
}

interface TreeModel {
  spec: TreeChartSpec;
  index: number;
  key: string;
  color: string;
  root: N;
  nodes: N[];
  /** center of a radial tree */
  cx: number;
  cy: number;
}

interface LabelBox {
  n: N;
  text: string;
  x: number;
  y: number;
  rot: number;
  align: CanvasTextAlign;
  baseline: CanvasTextBaseline;
  cfg: TreeChartLabel;
  /** screen box, for overlaps */
  x0: number;
  y0: number;
  x1: number;
  y1: number;
}

/**
 * Tree chart: a hierarchy as a tidy tree from left to right, right to left, top to bottom, bottom to top or
 * radial, with curved or elbow edges, nodes that open and close with a click (animated), several trees in one
 * chart, labels that avoid each other, tooltip, zoom and pan.
 */
export class TreeChart {
  readonly root: HTMLElement;
  readonly canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private titleEl: HTMLElement;
  private bodyEl: HTMLElement;
  private plotEl: HTMLElement;
  private legendEl: HTMLElement;
  private tooltipEl: HTMLElement;
  private opts: TreeChartOptions;
  private theme!: TreeChartTheme;
  private specs: TreeChartSpec[] = [];
  private trees: TreeModel[] = [];
  private hiddenKeys = new Set<string>();
  private hover: N | null = null;
  private width = 0;
  private height = 0;
  private dpr = 1;
  private view = { k: 1, x: 0, y: 0 };
  private animStart = 0;
  private raf = 0;
  private handlers = new Map<TreeChartEvent, Set<(v: unknown) => void>>();
  private ro: ResizeObserver;
  private destroyed = false;

  constructor(container: HTMLElement, options: TreeChartOptions = {}) {
    this.opts = { ...options };
    this.root = container;
    container.classList.add('tr-root');
    this.titleEl = document.createElement('div');
    this.titleEl.className = 'tr-title';
    this.bodyEl = document.createElement('div');
    this.plotEl = document.createElement('div');
    this.plotEl.className = 'tr-plot';
    this.canvas = document.createElement('canvas');
    this.canvas.className = 'tr-canvas';
    this.canvas.setAttribute('role', 'img');
    this.ctx = this.canvas.getContext('2d')!;
    this.tooltipEl = document.createElement('div');
    this.tooltipEl.className = 'tr-tooltip';
    this.legendEl = document.createElement('ul');
    this.plotEl.append(this.canvas, this.tooltipEl);
    this.bodyEl.append(this.plotEl, this.legendEl);
    container.append(this.titleEl, this.bodyEl);
    this.specs = this.specList();
    this.specs.forEach((s, i) => s.hidden && this.hiddenKeys.add(this.keyOf(s, i)));
    this.applyLook();
    this.bind();
    this.ro = new ResizeObserver(() => this.resize());
    this.ro.observe(this.plotEl);
    this.measure();
    this.rebuild(true);
  }

  // ------------------------------------------------------------------ public API

  /** Replace the data: one tree, or several trees. Nodes with the same path keep their place and state. */
  setData(data: TreeChartNode | TreeChartSpec[], animate = true): void {
    if (Array.isArray(data)) this.opts = { ...this.opts, trees: data };
    else this.opts = { ...this.opts, data, trees: undefined };
    this.specs = this.specList();
    this.rebuild(animate);
  }

  /** Change options after creation. */
  setOptions(patch: TreeChartOptions, animate = true): void {
    this.opts = { ...this.opts, ...patch };
    this.specs = this.specList();
    this.applyLook();
    this.rebuild(animate);
  }

  /** Open or close a node, given as the node object of the data or its path of names (from the root). */
  setCollapsed(target: TreeChartNode | string[], collapsed: boolean, treeIndex = 0): void {
    const n = this.find(target, treeIndex);
    if (!n || !n.children.length || n.collapsed === collapsed) return;
    n.collapsed = collapsed;
    this.emit('collapse', { node: n.src, collapsed });
    this.relayout(true);
  }

  /** Open every node (or only down to `depth`, closing the deeper ones). */
  expandAll(depth = Infinity): void {
    for (const t of this.trees) for (const n of t.nodes) if (n.children.length) n.collapsed = n.depth >= depth;
    this.relayout(true);
  }

  /** Close every node from `depth` down (default 1: only the root and its children show). */
  collapseAll(depth = 1): void {
    this.expandAll(depth);
  }

  /** Show / hide a tree (by name or index). */
  toggle(id: string | number, hidden?: boolean): void {
    const i = typeof id === 'number' ? id : this.trees.findIndex((t) => t.key === id);
    const t = this.trees[i];
    if (!t) return;
    const h = hidden ?? !this.hiddenKeys.has(t.key);
    if (h) this.hiddenKeys.add(t.key);
    else this.hiddenKeys.delete(t.key);
    this.emit('toggle', { id: t.key, index: i, hidden: h });
    this.renderLegend();
    this.draw();
  }

  /** Back to no zoom and no pan. */
  resetView(): void {
    this.view = { k: 1, x: 0, y: 0 };
    this.draw();
  }

  on(event: 'hover', handler: (info: TreeChartHoverInfo | null) => void): () => void;
  on(event: 'click', handler: (info: TreeChartHoverInfo) => void): () => void;
  on(event: 'toggle', handler: (e: { id: string; index: number; hidden: boolean }) => void): () => void;
  on(event: 'collapse', handler: (e: { node: TreeChartNode; collapsed: boolean }) => void): () => void;
  on(event: TreeChartEvent, handler: (v: never) => void): () => void {
    if (!this.handlers.has(event)) this.handlers.set(event, new Set());
    const h = handler as (v: unknown) => void;
    this.handlers.get(event)!.add(h);
    return () => this.handlers.get(event)?.delete(h);
  }

  resize(): void {
    this.measure();
    this.relayout(false);
  }

  screenshot(): string {
    this.draw();
    return this.canvas.toDataURL('image/png');
  }

  destroy(): void {
    this.destroyed = true;
    cancelAnimationFrame(this.raf);
    this.ro.disconnect();
    this.root.classList.remove('tr-root');
    this.titleEl.remove();
    this.bodyEl.remove();
  }

  // ------------------------------------------------------------------ model

  private keyOf(s: TreeChartSpec, i: number): string {
    return s.name ?? `#${i}`;
  }

  private emit(e: TreeChartEvent, v: unknown): void {
    this.handlers.get(e)?.forEach((h) => h(v));
  }

  /** The trees: `trees`, or the top-level options; the top-level look is the default of each tree. */
  private specList(): TreeChartSpec[] {
    const { trees, data, colors: _c, legend: _l, tooltip: _t, emphasis: _e, roam: _r, title: _ti, background: _b, theme: _th, animation: _a, ...base } = this.opts;
    if (trees?.length) return trees.map((t) => ({ ...base, ...t }));
    return data ? [{ ...base, data }] : [];
  }

  private find(target: TreeChartNode | string[], treeIndex: number): N | undefined {
    const t = this.trees[treeIndex];
    if (!t) return undefined;
    if (!Array.isArray(target)) return t.nodes.find((n) => n.src === target);
    let n: N | undefined = t.root;
    if (n.src.name !== target[0]) return undefined;
    for (const name of target.slice(1)) n = n?.children.find((c) => c.src.name === name);
    return n;
  }

  private applyLook(): void {
    const o = this.opts;
    const base = o.theme === 'light' ? treeLightTheme : treeDarkTheme;
    const t: TreeChartTheme = { ...base, ...(typeof o.theme === 'object' ? o.theme : {}) };
    if (o.background) t.background = o.background;
    if (t.background === 'transparent' && !(typeof o.theme === 'object' && o.theme.symbolFill)) t.symbolFill = 'rgba(255, 255, 255, 0.9)';
    this.theme = t;
    const vars: Record<string, string> = {
      '--tr-bg': t.background,
      '--tr-text': t.text,
      '--tr-muted': t.muted,
      '--tr-tt-bg': t.tooltipBg,
      '--tr-tt-text': t.tooltipText,
      '--tr-tt-border': t.tooltipBorder,
      '--tr-font': t.font,
    };
    for (const [k, v] of Object.entries(vars)) this.root.style.setProperty(k, v);
    const title = typeof o.title === 'string' ? { text: o.title } : o.title;
    this.titleEl.style.display = title ? '' : 'none';
    if (title) {
      this.titleEl.style.textAlign = title.align ?? 'center';
      this.titleEl.innerHTML = `<b>${esc(title.text)}</b>${title.subtext ? `<small>${esc(title.subtext)}</small>` : ''}`;
    }
  }

  private rebuild(animate: boolean): void {
    const palette = this.opts.colors ?? TREE_COLORS;
    const old = new Map<string, N>();
    for (const t of this.trees) for (const n of t.nodes) old.set(`${t.index}\u0001${n.key}`, n);
    this.trees = this.specs.map((spec, index) => {
      const nodes: N[] = [];
      const depth0 = spec.initialDepth ?? Infinity;
      const tree = { spec, index, key: this.keyOf(spec, index), color: spec.color ?? palette[index % palette.length], nodes, cx: 0, cy: 0 } as TreeModel;
      const make = (src: TreeChartNode, parent: N | null, key: string, depth: number): N => {
        const prev = old.get(`${index}\u0001${key}`);
        const kids = src.children ?? [];
        const n: N = {
          src,
          key,
          tree,
          parent,
          children: [],
          depth,
          collapsed: kids.length ? (prev ? prev.collapsed : (src.collapsed ?? depth >= depth0)) : false,
          visible: false,
          fx: prev?.x ?? 0,
          fy: prev?.y ?? 0,
          fa: prev?.a ?? 0,
          tx: 0,
          ty: 0,
          ta: 0,
          x: prev?.x ?? 0,
          y: prev?.y ?? 0,
          a: prev?.a ?? 0,
          placed: prev?.placed ?? false,
        };
        nodes.push(n);
        const seen = new Map<string, number>();
        n.children = kids.map((c) => {
          const k = seen.get(c.name) ?? 0;
          seen.set(c.name, k + 1);
          return make(c, n, `${key}\u0002${c.name}${k ? `#${k}` : ''}`, depth + 1);
        });
        return n;
      };
      tree.root = make(spec.data, null, spec.data.name, 0);
      return tree;
    });
    if (this.hover && !this.trees.some((t) => t.nodes.includes(this.hover!))) this.hover = null;
    this.renderLegend();
    this.relayout(animate);
  }

  private duration(): number {
    const a = this.opts.animation ?? true;
    return a === false ? 0 : typeof a === 'object' ? (a.duration ?? 600) : 600;
  }

  private loop(): void {
    cancelAnimationFrame(this.raf);
    if (this.destroyed) return;
    const now = performance.now();
    const p = this.animStart ? easeInOut(clamp((now - this.animStart) / (this.duration() || 1), 0, 1)) : 1;
    for (const t of this.trees)
      for (const n of t.nodes) {
        n.x = n.fx + (n.tx - n.fx) * p;
        n.y = n.fy + (n.ty - n.fy) * p;
        n.a = n.fa + (n.ta - n.fa) * p;
      }
    this.draw();
    if (p < 1) this.raf = requestAnimationFrame(() => this.loop());
    else this.animStart = 0;
  }

  // ------------------------------------------------------------------ legend

  private legendCfg(): { show: boolean; position: string; interactive: boolean } {
    const l = this.opts.legend;
    const o = typeof l === 'object' ? l : {};
    return { show: (typeof l === 'boolean' ? l : o.show) ?? this.trees.length > 1, position: o.position ?? 'top', interactive: o.interactive ?? true };
  }

  private renderLegend(): void {
    const L = this.legendCfg();
    this.bodyEl.className = `tr-body tr-legend-${L.position}`;
    this.legendEl.className = 'tr-legend';
    this.legendEl.style.display = L.show ? '' : 'none';
    if (!L.show) return;
    this.legendEl.innerHTML = this.trees
      .map((t) => {
        const hidden = this.hiddenKeys.has(t.key);
        const name = t.spec.name ?? t.root.src.name;
        return `<li class="tr-legend__item${L.interactive ? ' is-interactive' : ''}${hidden ? ' is-hidden' : ''}" data-key="${esc(t.key)}"><i class="tr-legend__marker" style="--c:${t.color}"></i><span>${esc(name)}</span></li>`;
      })
      .join('');
  }

  // ------------------------------------------------------------------ layout

  private measure(): void {
    const r = this.plotEl.getBoundingClientRect();
    this.dpr = window.devicePixelRatio || 1;
    this.width = Math.max(1, Math.floor(r.width));
    this.height = Math.max(1, Math.floor(r.height));
    this.canvas.width = Math.round(this.width * this.dpr);
    this.canvas.height = Math.round(this.height * this.dpr);
    this.canvas.style.width = `${this.width}px`;
    this.canvas.style.height = `${this.height}px`;
  }

  private font(size: number, weight: number | string = 400): string {
    return `${weight} ${size}px ${this.theme.font}`;
  }

  /** The label config of a node: the tree's, then the leaves', then the node's own. */
  private labelOf(n: N): TreeChartLabel {
    const s = n.tree.spec;
    return { ...s.label, ...(n.children.length ? {} : s.leaves?.label), ...n.src.label };
  }

  private labelText(n: N, cfg: TreeChartLabel): string {
    if (cfg.show === false) return '';
    return cfg.format ? cfg.format(n.src) : n.src.name;
  }

  private labelWidth(n: N): number {
    const cfg = this.labelOf(n);
    const text = this.labelText(n, cfg);
    if (!text) return 0;
    this.ctx.font = this.font(cfg.fontSize ?? 12, cfg.fontWeight ?? 400);
    return this.ctx.measureText(text).width + (cfg.distance ?? 6) + (cfg.background ? 8 : 0);
  }

  private symbolSize(n: N): number {
    return n.src.symbolSize ?? n.tree.spec.symbolSize ?? 7;
  }

  /** New targets for every node; with `animate`, they move there from where they are. */
  private relayout(animate: boolean): void {
    const pad = 10;
    const W = this.width;
    const H = this.height;
    const px = (v: number | string | undefined, total: number, def: number): number =>
      v === undefined ? def : typeof v === 'number' ? v : v.trim().endsWith('%') ? (total * parseFloat(v)) / 100 : parseFloat(v) || 0;
    for (const t of this.trees) {
      const s = t.spec;
      // which nodes show
      for (const n of t.nodes) n.visible = false;
      const shown: N[] = [];
      const walk = (n: N): void => {
        n.visible = true;
        shown.push(n);
        if (!n.collapsed) n.children.forEach(walk);
      };
      walk(t.root);
      const radial = s.layout === 'radial';
      const input = new Map<N, TidyInput & { n: N }>();
      for (const n of shown) input.set(n, { n, children: [] });
      for (const n of shown) if (n.parent) input.get(n.parent)!.children.push(input.get(n)!);
      const pos = tidyLayout(input.get(t.root)!, radial ? radialSeparation : defaultSeparation);
      let maxX = 0;
      let maxDepth = 0;
      for (const p of pos.values()) {
        maxX = Math.max(maxX, p.x);
        maxDepth = Math.max(maxDepth, p.depth);
      }
      // room for the labels: the root's on its side, the leaves' on the far side
      // (closed inner nodes keep their label on the root side, except in a radial tree)
      const leafW = Math.max(0, ...shown.filter((n) => n.depth === maxDepth && (radial || !n.children.length)).map((n) => this.labelWidth(n)));
      const rootW = this.labelWidth(t.root) + this.symbolSize(t.root) / 2;
      const sym = Math.max(...shown.map((n) => this.symbolSize(n))) / 2 + 2;
      const orient: TreeChartOrient = s.orient ?? 'LR';
      const vertical = orient === 'TB' || orient === 'BT';
      const rotated = this.labelRotation(s, vertical) !== 0;
      const fs = s.label?.fontSize ?? 12;
      let lm: number;
      let rm: number;
      let tm: number;
      let bm: number;
      if (radial) {
        const m = Math.min(leafW + sym, Math.min(W, H) * 0.25);
        lm = rm = tm = bm = m;
      } else if (!vertical) {
        const near = Math.min(rootW + sym, W * 0.35);
        const far = Math.min(leafW + sym, W * 0.35);
        lm = orient === 'LR' ? near : far;
        rm = orient === 'LR' ? far : near;
        tm = bm = fs / 2 + sym;
      } else {
        const near = rotated ? Math.min(rootW + sym, H * 0.35) : fs + sym + 6;
        const far = rotated ? Math.min(leafW + sym, H * 0.35) : fs + sym + 6;
        tm = orient === 'TB' ? near : far;
        bm = orient === 'TB' ? far : near;
        lm = rm = rotated ? fs / 2 + sym : Math.min(rootW, W * 0.2);
      }
      // the space given (or the whole chart), less the room of the labels
      const x0 = px(s.left, W, pad) + lm;
      const y0 = px(s.top, H, pad) + tm;
      const x1 = W - px(s.right, W, pad) - rm;
      const y1 = H - px(s.bottom, H, pad) - bm;
      const bw = Math.max(1, x1 - x0);
      const bh = Math.max(1, y1 - y0);
      t.cx = x0 + bw / 2;
      t.cy = y0 + bh / 2;
      const R = Math.max(10, Math.min(bw, bh) / 2);
      for (const [inp, p] of pos) {
        const n = (inp as TidyInput & { n: N }).n;
        const b = maxX ? p.x / maxX : 0.5;
        const d = maxDepth ? p.depth / maxDepth : 0;
        if (radial) {
          // the whole circle, with a gap of one unit between the last leaf and the first
          const ang = maxX ? (p.x / (maxX + 1)) * Math.PI * 2 - Math.PI / 2 : -Math.PI / 2;
          n.tx = t.cx + Math.cos(ang) * d * R;
          n.ty = t.cy + Math.sin(ang) * d * R;
        } else if (orient === 'LR' || orient === 'RL') {
          n.tx = orient === 'LR' ? x0 + d * bw : x1 - d * bw;
          n.ty = y0 + b * bh;
        } else {
          n.tx = x0 + b * bw;
          n.ty = orient === 'TB' ? y0 + d * bh : y1 - d * bh;
        }
      }
      // hidden nodes go to (or come from) their nearest shown ancestor
      for (const n of t.nodes) {
        let anc: N = n;
        while (!anc.visible) anc = anc.parent!;
        if (!n.visible) {
          n.tx = anc.tx;
          n.ty = anc.ty;
        }
        n.ta = n.visible ? 1 : 0;
        if (!n.placed && n.visible) {
          // first time: from the parent's current place (or its own on the first draw)
          let from = n.parent;
          while (from && !from.placed) from = from.parent;
          n.x = from ? from.x : n.tx;
          n.y = from ? from.y : n.ty;
          n.a = from ? 0 : animate ? 0 : 1;
          n.placed = true;
        }
        if (!n.placed && !n.visible) {
          n.x = n.tx;
          n.y = n.ty;
          n.a = 0;
        }
      }
    }
    const on = animate && this.duration() > 0;
    for (const t of this.trees)
      for (const n of t.nodes) {
        if (!on) {
          n.x = n.tx;
          n.y = n.ty;
          n.a = n.ta;
        }
        n.fx = n.x;
        n.fy = n.y;
        n.fa = n.a;
        if (!n.visible && n.a === 0) n.placed = false;
      }
    this.animStart = on ? performance.now() : 0;
    this.loop();
  }

  private labelRotation(s: TreeChartSpec, vertical: boolean): number {
    const r = s.label?.rotate ?? 'auto';
    return r === 'auto' ? (vertical ? Math.PI / 2 : 0) : (r * Math.PI) / 180;
  }

  // ------------------------------------------------------------------ drawing

  private sx(x: number): number {
    return x * this.view.k + this.view.x;
  }

  private sy(y: number): number {
    return y * this.view.k + this.view.y;
  }

  /** Nodes lit by the hover (null = no hover). */
  private lit(): Set<N> | null {
    const h = this.hover;
    const mode = this.opts.emphasis ?? 'ancestor';
    if (!h || mode === 'none') return null;
    const set = new Set<N>();
    if (mode === 'ancestor') for (let n: N | null = h; n; n = n.parent) set.add(n);
    else {
      const st = [h];
      while (st.length) {
        const n = st.pop()!;
        set.add(n);
        if (!n.collapsed) st.push(...n.children);
      }
    }
    return set;
  }

  private draw(): void {
    const ctx = this.ctx;
    const t = this.theme;
    ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
    ctx.clearRect(0, 0, this.width, this.height);
    if (t.background !== 'transparent') {
      ctx.fillStyle = t.background;
      ctx.fillRect(0, 0, this.width, this.height);
    }
    const lit = this.lit();
    for (const tree of this.trees) {
      if (this.hiddenKeys.has(tree.key)) continue;
      const drawn = tree.nodes.filter((n) => n.a > 0.002);
      for (const n of drawn) if (n.parent) this.drawEdge(n, lit);
      for (const n of drawn) this.drawSymbol(n, lit);
      this.drawLabels(tree, drawn, lit);
    }
  }

  private drawEdge(n: N, lit: Set<N> | null): void {
    const ctx = this.ctx;
    const s = n.tree.spec;
    const e = s.edge ?? {};
    const p = n.parent!;
    const on = lit?.has(n) && lit.has(p);
    ctx.globalAlpha = n.a * (lit && !on ? 0.25 : 1);
    ctx.strokeStyle = n.src.lineColor ?? e.color ?? this.theme.edge;
    ctx.lineWidth = (e.width ?? 1.5) + (on ? 1 : 0);
    ctx.setLineDash(e.dash ?? []);
    const x0 = this.sx(p.x);
    const y0 = this.sy(p.y);
    const x1 = this.sx(n.x);
    const y1 = this.sy(n.y);
    ctx.beginPath();
    ctx.moveTo(x0, y0);
    if (s.layout === 'radial') {
      const cx = this.sx(n.tree.cx);
      const cy = this.sy(n.tree.cy);
      const r0 = Math.hypot(x0 - cx, y0 - cy);
      const r1 = Math.hypot(x1 - cx, y1 - cy);
      const a1 = Math.atan2(y1 - cy, x1 - cx);
      const a0 = r0 < 0.5 ? a1 : Math.atan2(y0 - cy, x0 - cx);
      const rm = (r0 + r1) / 2;
      ctx.bezierCurveTo(cx + Math.cos(a0) * rm, cy + Math.sin(a0) * rm, cx + Math.cos(a1) * rm, cy + Math.sin(a1) * rm, x1, y1);
    } else {
      const vertical = s.orient === 'TB' || s.orient === 'BT';
      if (s.edgeShape === 'polyline') {
        if (vertical) {
          const m = (y0 + y1) / 2;
          ctx.lineTo(x0, m);
          ctx.lineTo(x1, m);
        } else {
          const m = (x0 + x1) / 2;
          ctx.lineTo(m, y0);
          ctx.lineTo(m, y1);
        }
        ctx.lineTo(x1, y1);
      } else {
        const k = clamp(e.curveness ?? 0.5, 0, 1);
        if (vertical) ctx.bezierCurveTo(x0, y0 + (y1 - y0) * k, x1, y1 - (y1 - y0) * k, x1, y1);
        else ctx.bezierCurveTo(x0 + (x1 - x0) * k, y0, x1 - (x1 - x0) * k, y1, x1, y1);
      }
    }
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.globalAlpha = 1;
  }

  private drawSymbol(n: N, lit: Set<N> | null): void {
    const sym: TreeChartSymbol = n.src.symbol ?? n.tree.spec.symbol ?? 'emptyCircle';
    if (sym === 'none') return;
    const ctx = this.ctx;
    const color = n.src.color ?? n.tree.color;
    const hovered = this.hover === n;
    const r = this.symbolSize(n) / 2 + (hovered ? 1.5 : 0);
    const x = this.sx(n.x);
    const y = this.sy(n.y);
    ctx.globalAlpha = n.a * (lit && !lit.has(n) ? 0.3 : 1);
    ctx.beginPath();
    if (sym === 'rect') ctx.rect(x - r, y - r, r * 2, r * 2);
    else if (sym === 'roundRect') ctx.roundRect(x - r, y - r, r * 2, r * 2, r * 0.4);
    else if (sym === 'diamond') {
      ctx.moveTo(x, y - r * 1.3);
      ctx.lineTo(x + r, y);
      ctx.lineTo(x, y + r * 1.3);
      ctx.lineTo(x - r, y);
      ctx.closePath();
    } else if (sym === 'triangle') {
      ctx.moveTo(x, y - r * 1.2);
      ctx.lineTo(x + r * 1.1, y + r * 0.8);
      ctx.lineTo(x - r * 1.1, y + r * 0.8);
      ctx.closePath();
    } else ctx.arc(x, y, r, 0, Math.PI * 2);
    // closed nodes with children are full, the others hollow
    const closed = n.collapsed && n.children.length > 0;
    if (sym === 'emptyCircle' && !closed) {
      ctx.fillStyle = this.theme.symbolFill;
      ctx.fill();
      ctx.strokeStyle = color;
      ctx.lineWidth = 1.5;
      ctx.stroke();
    } else {
      ctx.fillStyle = color;
      ctx.fill();
      if (sym !== 'emptyCircle' && closed) {
        ctx.strokeStyle = alpha(color, 0.45);
        ctx.lineWidth = 3;
        ctx.stroke();
      }
    }
    ctx.globalAlpha = 1;
  }

  private drawLabels(tree: TreeModel, drawn: N[], lit: Set<N> | null): void {
    const ctx = this.ctx;
    const s = tree.spec;
    const radial = s.layout === 'radial';
    const orient = s.orient ?? 'LR';
    const vertical = orient === 'TB' || orient === 'BT';
    const boxes: LabelBox[] = [];
    for (const n of drawn) {
      const cfg = this.labelOf(n);
      const text = this.labelText(n, cfg);
      if (!text) continue;
      const fs = cfg.fontSize ?? 12;
      ctx.font = this.font(fs, cfg.fontWeight ?? 400);
      const w = ctx.measureText(text).width;
      const d = (cfg.distance ?? 6) + this.symbolSize(n) / 2;
      const x = this.sx(n.x);
      const y = this.sy(n.y);
      const leaf = !n.children.length;
      let rot: number;
      let ox: number;
      let oy: number;
      if (radial && (cfg.position ?? 'auto') === 'auto' && n.depth > 0) {
        // along the radius: leaves outward, inner nodes inward, never upside down
        const a = Math.atan2(y - this.sy(tree.cy), x - this.sx(tree.cx));
        const out = leaf || n.collapsed ? 1 : -1;
        ox = Math.cos(a) * d * out;
        oy = Math.sin(a) * d * out;
        rot = typeof cfg.rotate === 'number' ? (cfg.rotate * Math.PI) / 180 : Math.cos(a) < 0 ? a + Math.PI : a;
      } else {
        let pos = cfg.position ?? 'auto';
        if (pos === 'auto') {
          const near = { LR: 'left', RL: 'right', TB: 'top', BT: 'bottom' } as const;
          const far = { LR: 'right', RL: 'left', TB: 'bottom', BT: 'top' } as const;
          pos = radial ? 'left' : leaf ? far[orient] : near[orient];
        }
        ox = pos === 'left' ? -d : pos === 'right' ? d : 0;
        oy = pos === 'top' ? -d : pos === 'bottom' ? d : 0;
        rot = radial ? 0 : cfg.rotate === undefined || cfg.rotate === 'auto' ? this.labelRotation(s, vertical) : (cfg.rotate * Math.PI) / 180;
      }
      // align so the text grows away from the node
      const ux = Math.cos(rot);
      const uy = Math.sin(rot);
      const along = (ox * ux + oy * uy) / (d || 1);
      const across = (-ox * uy + oy * ux) / (d || 1);
      const align: CanvasTextAlign = along > 0.3 ? 'left' : along < -0.3 ? 'right' : 'center';
      const baseline: CanvasTextBaseline = Math.abs(along) > 0.3 ? 'middle' : across > 0.3 ? 'top' : across < -0.3 ? 'bottom' : 'middle';
      // box in the text's frame, then its screen bounds
      const bx0 = align === 'left' ? 0 : align === 'right' ? -w : -w / 2;
      const by0 = baseline === 'top' ? 0 : baseline === 'bottom' ? -fs : -fs / 2;
      const cs = [
        [bx0, by0],
        [bx0 + w, by0],
        [bx0, by0 + fs],
        [bx0 + w, by0 + fs],
      ].map(([u, v]) => [x + ox + u * ux - v * uy, y + oy + u * uy + v * ux]);
      boxes.push({
        n,
        text,
        x: x + ox,
        y: y + oy,
        rot,
        align,
        baseline,
        cfg,
        x0: Math.min(...cs.map((c) => c[0])),
        y0: Math.min(...cs.map((c) => c[1])),
        x1: Math.max(...cs.map((c) => c[0])),
        y1: Math.max(...cs.map((c) => c[1])),
      });
    }
    // labels that would cover others hide: shallow nodes and the hovered path first
    boxes.sort((a, b) => (lit?.has(b.n) ? 1 : 0) - (lit?.has(a.n) ? 1 : 0) || a.n.depth - b.n.depth);
    const kept: LabelBox[] = [];
    for (const b of boxes) {
      if (radial && b.n.depth > 0 && (!b.n.children.length || b.n.collapsed)) {
        // along a radius the boxes are slanted: compare the gap across the radius instead
        const fs = b.cfg.fontSize ?? 12;
        const clash = kept.some((k) => (k.n.depth === b.n.depth ? Math.hypot(k.x - b.x, k.y - b.y) < fs * 0.95 : b.x0 < k.x1 - 1 && b.x1 > k.x0 + 1 && b.y0 < k.y1 - 1 && b.y1 > k.y0 + 1));
        if (!clash) kept.push(b);
        continue;
      }
      const clash = kept.some((k) => b.x0 < k.x1 - 1 && b.x1 > k.x0 + 1 && b.y0 < k.y1 - 1 && b.y1 > k.y0 + 1);
      if (!clash) kept.push(b);
    }
    for (const b of kept) {
      const fs = b.cfg.fontSize ?? 12;
      ctx.save();
      ctx.globalAlpha = b.n.a * (lit && !lit.has(b.n) ? 0.35 : 1);
      ctx.translate(b.x, b.y);
      ctx.rotate(b.rot);
      ctx.font = this.font(fs, this.hover === b.n ? 600 : (b.cfg.fontWeight ?? 400));
      ctx.textAlign = b.align;
      ctx.textBaseline = b.baseline;
      if (b.cfg.background) {
        const w = ctx.measureText(b.text).width;
        const bx = b.align === 'left' ? -4 : b.align === 'right' ? -w - 4 : -w / 2 - 4;
        const by = b.baseline === 'top' ? -2 : b.baseline === 'bottom' ? -fs - 2 : -fs / 2 - 2;
        ctx.fillStyle = b.cfg.background;
        ctx.beginPath();
        ctx.roundRect(bx, by, w + 8, fs + 4, 3);
        ctx.fill();
      }
      ctx.fillStyle = b.cfg.color ?? this.theme.text;
      ctx.fillText(b.text, 0, 0);
      ctx.restore();
    }
  }

  // ------------------------------------------------------------------ interaction

  private info(n: N): TreeChartHoverInfo {
    const path: string[] = [];
    for (let p: N | null = n; p; p = p.parent) path.unshift(p.src.name);
    return { node: n.src, name: n.src.name, value: n.src.value, path, depth: n.depth, treeIndex: n.tree.index, hasChildren: n.children.length > 0, collapsed: n.collapsed };
  }

  private hitTest(x: number, y: number): N | null {
    let best: N | null = null;
    let bestD = Infinity;
    for (const t of this.trees) {
      if (this.hiddenKeys.has(t.key)) continue;
      for (const n of t.nodes) {
        if (!n.visible) continue;
        const r = Math.max(8, this.symbolSize(n) / 2 + 4);
        const d = Math.hypot(this.sx(n.x) - x, this.sy(n.y) - y);
        if (d <= r && d < bestD) {
          bestD = d;
          best = n;
        }
      }
    }
    return best;
  }

  private bind(): void {
    const pos = (e: MouseEvent): { x: number; y: number } => {
      const r = this.canvas.getBoundingClientRect();
      return { x: e.clientX - r.left, y: e.clientY - r.top };
    };
    let drag: { x: number; y: number; vx: number; vy: number; moved: boolean } | null = null;
    this.canvas.addEventListener('pointerdown', (e) => {
      if (!this.opts.roam) return;
      const p = pos(e);
      drag = { x: p.x, y: p.y, vx: this.view.x, vy: this.view.y, moved: false };
      this.canvas.setPointerCapture(e.pointerId);
    });
    this.canvas.addEventListener('pointerup', () => {
      if (drag?.moved) this.canvas.style.cursor = '';
      // the click that follows a drag is ignored (see below)
      setTimeout(() => (drag = null), 0);
    });
    this.canvas.addEventListener('pointermove', (e) => {
      const { x, y } = pos(e);
      if (drag && e.buttons) {
        if (Math.hypot(x - drag.x, y - drag.y) > 3) drag.moved = true;
        if (drag.moved) {
          this.view.x = drag.vx + x - drag.x;
          this.view.y = drag.vy + y - drag.y;
          this.canvas.style.cursor = 'grabbing';
          this.tooltipEl.classList.remove('is-visible');
          this.draw();
          return;
        }
      }
      const h = this.hitTest(x, y);
      if (h !== this.hover) {
        this.hover = h;
        this.emit('hover', h ? this.info(h) : null);
        this.draw();
      }
      this.canvas.style.cursor = h ? 'pointer' : this.opts.roam ? 'grab' : '';
      this.showTooltip(e);
    });
    this.canvas.addEventListener('pointerleave', () => {
      if (this.hover) {
        this.hover = null;
        this.emit('hover', null);
        this.draw();
      }
      this.tooltipEl.classList.remove('is-visible');
    });
    this.canvas.addEventListener('click', (e) => {
      if (drag?.moved) return;
      const { x, y } = pos(e);
      const n = this.hitTest(x, y);
      if (!n) return;
      this.emit('click', this.info(n));
      if (n.children.length && (n.tree.spec.expandAndCollapse ?? true)) {
        n.collapsed = !n.collapsed;
        this.emit('collapse', { node: n.src, collapsed: n.collapsed });
        // the node moves away from the mouse: the hover comes back with the next move
        this.hover = null;
        this.tooltipEl.classList.remove('is-visible');
        this.relayout(true);
      }
    });
    this.canvas.addEventListener(
      'wheel',
      (e) => {
        if (!this.opts.roam) return;
        e.preventDefault();
        const { x, y } = pos(e);
        const k = clamp(this.view.k * Math.exp(-e.deltaY * 0.0015), 0.2, 8);
        const f = k / this.view.k;
        this.view.x = x - (x - this.view.x) * f;
        this.view.y = y - (y - this.view.y) * f;
        this.view.k = k;
        this.draw();
      },
      { passive: false },
    );
    this.legendEl.addEventListener('click', (e) => {
      const li = (e.target as HTMLElement).closest<HTMLElement>('.tr-legend__item');
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
      const path = info.path.length > 1 ? `<div class="tr-tooltip__sub">${info.path.slice(0, -1).map(esc).join(' › ')}</div>` : '';
      const value = info.value !== undefined ? `<div class="tr-tooltip__row"><span>Valor</span><b>${esc(typeof info.value === 'number' ? info.value.toLocaleString('pt-PT') : info.value)}</b></div>` : '';
      const kids = h.children.length
        ? `<div class="tr-tooltip__row"><span>${h.children.length} ${h.children.length === 1 ? 'filho' : 'filhos'}</span><b>${h.collapsed ? 'fechado' : 'aberto'}</b></div>`
        : '';
      el.innerHTML = `${path}<div class="tr-tooltip__head"><i class="tr-tooltip__dot" style="background:${h.src.color ?? h.tree.color}"></i>${esc(info.name)}</div>${value}${kids}`;
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

export function createTreeChart(container: HTMLElement, options: TreeChartOptions = {}): TreeChart {
  return new TreeChart(container, options);
}
