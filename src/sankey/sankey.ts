import { parseColor } from '../shared/color';
import { sankeyLayout, sankeyLinkBreadths, type SankeyLayoutLink, type SankeyLayoutNode, type SankeyLayoutResult } from './layout';
import type {
  SankeyEvent,
  SankeyInfo,
  SankeyItemStyle,
  SankeyLabel,
  SankeyLink,
  SankeyLinkColor,
  SankeyLinkInfo,
  SankeyNode,
  SankeyNodeInfo,
  SankeyOptions,
  SankeyTheme,
} from './types';

const FONT = '-apple-system, BlinkMacSystemFont, "Trebuchet MS", Roboto, Ubuntu, sans-serif';

export const sankeyDarkTheme: SankeyTheme = {
  background: '#131722',
  text: '#d1d4dc',
  muted: '#787b86',
  nodeBorder: 'transparent',
  tooltipBg: '#1e222d',
  tooltipText: '#d1d4dc',
  tooltipBorder: '#2a2e39',
  font: FONT,
};

export const sankeyLightTheme: SankeyTheme = {
  background: '#ffffff',
  text: '#131722',
  muted: '#787b86',
  nodeBorder: 'transparent',
  tooltipBg: '#ffffff',
  tooltipText: '#131722',
  tooltipBorder: '#e0e3eb',
  font: FONT,
};

export const SANKEY_COLORS = ['#2962ff', '#ff9800', '#089981', '#f23645', '#9c27b0', '#00bcd4', '#e91e63', '#8bc34a', '#ffc107', '#607d8b', '#3f51b5', '#ff5722'];

const esc = (s: string): string => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const clamp = (v: number, a: number, b: number): number => Math.min(b, Math.max(a, v));
const easeInOut = (t: number): number => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
const lerp = (a: number, b: number, t: number): number => a + (b - a) * t;
const alpha = (c: string, a: number): string => {
  const [r, g, b, a0] = parseColor(c);
  return `rgba(${r}, ${g}, ${b}, ${+(a * a0).toFixed(3)})`;
};
const luminance = (c: string): number => {
  const [r, g, b] = parseColor(c);
  return (0.299 * r + 0.587 * g + 0.114 * b) / 255;
};

type Pos = 'left' | 'right' | 'top' | 'bottom' | 'inside';
type Focus = 'adjacency' | 'trajectory' | 'self' | 'none';

interface Box {
  x0: number;
  x1: number;
  y0: number;
  y1: number;
}

/** A node as drawn: its layout (target) and its animated box, in the flow frame. */
interface VNode {
  L: SankeyLayoutNode;
  src: SankeyNode;
  color: string;
  style: SankeyItemStyle;
  label: SankeyLabel;
  pos: Pos;
  info: SankeyNodeInfo;
  from: Box | null;
  cur: Box;
  /** fade (new nodes) */
  a: number;
}

interface VLink {
  L: SankeyLayoutLink;
  src: SankeyLink;
  key: string;
  color: SankeyLinkColor;
  opacity: number;
  curveness: number;
  info: SankeyLinkInfo;
  from: { y0: number; y1: number; w: number } | null;
  y0: number;
  y1: number;
  w: number;
  a: number;
  path: Path2D | null;
}

interface LabelBox {
  v: VNode;
  lines: string[];
  fs: number;
  lh: number;
  align: CanvasTextAlign;
  x0: number;
  y0: number;
  w: number;
  h: number;
}

/**
 * Sankey chart: flows between nodes, in columns from left to right (or rows from top to bottom), with node
 * heights proportional to their value, links colored by source, target or a gradient, adjacency highlight,
 * draggable nodes, tooltip and animated updates.
 */
export class SankeyChart {
  readonly root: HTMLElement;
  readonly canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private titleEl: HTMLElement;
  private bodyEl: HTMLElement;
  private plotEl: HTMLElement;
  private tooltipEl: HTMLElement;
  private opts: SankeyOptions;
  private theme!: SankeyTheme;
  private res: SankeyLayoutResult | null = null;
  private vnodes: VNode[] = [];
  private vlinks: VLink[] = [];
  private byLayoutNode = new Map<SankeyLayoutNode, VNode>();
  private byLayoutLink = new Map<SankeyLayoutLink, VLink>();
  private hover: VNode | VLink | null = null;
  /** nodes moved by hand: name → top as a fraction of the column height */
  private manual = new Map<string, number>();
  private width = 0;
  private height = 0;
  private dpr = 1;
  /** area of the nodes in the canvas (screen) and its extent in the flow frame */
  private area = { x: 0, y: 0, w: 0, h: 0 };
  private horiz = true;
  private mode: 'reveal' | 'morph' | 'none' = 'none';
  private progress = 1;
  private animStart = 0;
  private raf = 0;
  private handlers = new Map<SankeyEvent, Set<(v: unknown) => void>>();
  private ro: ResizeObserver;
  private destroyed = false;

  constructor(container: HTMLElement, options: SankeyOptions = {}) {
    this.opts = { ...options };
    this.root = container;
    container.classList.add('sk-root');
    this.titleEl = document.createElement('div');
    this.titleEl.className = 'sk-title';
    this.bodyEl = document.createElement('div');
    this.bodyEl.className = 'sk-body';
    this.plotEl = document.createElement('div');
    this.plotEl.className = 'sk-plot';
    this.canvas = document.createElement('canvas');
    this.canvas.className = 'sk-canvas';
    this.canvas.setAttribute('role', 'img');
    this.ctx = this.canvas.getContext('2d')!;
    this.tooltipEl = document.createElement('div');
    this.tooltipEl.className = 'sk-tooltip';
    this.plotEl.append(this.canvas, this.tooltipEl);
    this.bodyEl.append(this.plotEl);
    container.append(this.titleEl, this.bodyEl);
    this.applyLook();
    this.bind();
    this.ro = new ResizeObserver(() => this.resize());
    this.ro.observe(this.plotEl);
    this.measure();
    this.relayout(this.duration() > 0 ? 'reveal' : 'none');
  }

  // ------------------------------------------------------------------ public API

  /** Replace the nodes and links. Nodes with the same name (and links between the same nodes) move to their new place. */
  setData(data: { nodes: SankeyNode[]; links: SankeyLink[] }, animate = true): void {
    this.opts = { ...this.opts, nodes: data.nodes, links: data.links };
    this.manual.clear();
    this.relayout(animate && this.duration() > 0 ? 'morph' : 'none');
  }

  /** Change options after creation (a new orientation plays the entry animation again). */
  setOptions(patch: SankeyOptions, animate = true): void {
    const orient = this.opts.orient;
    this.opts = { ...this.opts, ...patch };
    if (patch.nodes || patch.links || patch.nodeAlign || patch.orient || patch.levels) this.manual.clear();
    this.applyLook();
    const on = animate && this.duration() > 0;
    this.relayout(!on ? 'none' : (patch.orient ?? orient ?? 'horizontal') !== (orient ?? 'horizontal') ? 'reveal' : 'morph');
  }

  /** Links left out of the layout: self-links and links that would close a cycle. */
  getIgnoredLinks(): { index: number; source: string; target: string; reason: 'cycle' | 'self' }[] {
    return this.res ? this.res.ignored.map((l) => ({ ...l })) : [];
  }

  /** Put back the nodes moved by hand. */
  resetLayout(): void {
    this.manual.clear();
    this.relayout(this.duration() > 0 ? 'morph' : 'none');
  }

  on(event: 'hover', handler: (info: SankeyInfo | null) => void): () => void;
  on(event: 'click', handler: (info: SankeyInfo) => void): () => void;
  on(event: 'drag', handler: (info: SankeyNodeInfo) => void): () => void;
  on(event: SankeyEvent, handler: (v: never) => void): () => void {
    if (!this.handlers.has(event)) this.handlers.set(event, new Set());
    const h = handler as (v: unknown) => void;
    this.handlers.get(event)!.add(h);
    return () => this.handlers.get(event)?.delete(h);
  }

  resize(): void {
    this.measure();
    this.relayout('none');
  }

  screenshot(): string {
    this.draw();
    return this.canvas.toDataURL('image/png');
  }

  destroy(): void {
    this.destroyed = true;
    cancelAnimationFrame(this.raf);
    this.ro.disconnect();
    this.root.classList.remove('sk-root');
    this.titleEl.remove();
    this.bodyEl.remove();
  }

  // ------------------------------------------------------------------ look

  private emit(e: SankeyEvent, v: unknown): void {
    this.handlers.get(e)?.forEach((h) => h(v));
  }

  private applyLook(): void {
    const o = this.opts;
    const base = o.theme === 'light' ? sankeyLightTheme : sankeyDarkTheme;
    const t: SankeyTheme = { ...base, ...(typeof o.theme === 'object' ? o.theme : {}) };
    if (o.background) t.background = o.background;
    this.theme = t;
    const vars: Record<string, string> = {
      '--sk-bg': t.background,
      '--sk-text': t.text,
      '--sk-muted': t.muted,
      '--sk-tt-bg': t.tooltipBg,
      '--sk-tt-text': t.tooltipText,
      '--sk-tt-border': t.tooltipBorder,
      '--sk-font': t.font,
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
    return a === false ? 0 : typeof a === 'object' ? (a.duration ?? 700) : 700;
  }

  private focus(): Focus {
    const e = this.opts.emphasis;
    return (typeof e === 'object' ? e.focus : e) ?? 'adjacency';
  }

  private fmt(v: number): string {
    return this.opts.valueFormat ? this.opts.valueFormat(v) : v.toLocaleString('pt-PT', { maximumFractionDigits: 2 });
  }

  private font(size: number, weight: number | string = 400): string {
    return `${weight} ${size}px ${this.theme.font}`;
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

  private layoutOpts(width: number, height: number, iterations?: number): Parameters<typeof sankeyLayout>[2] {
    const o = this.opts;
    return { width, height, nodeWidth: o.nodeWidth ?? 20, nodeGap: o.nodeGap ?? 8, nodeAlign: o.nodeAlign ?? 'justify', iterations: iterations ?? o.layoutIterations ?? 32 };
  }

  /** Style, label and info of every node, from the layout (columns are known before the sizes). */
  private decorate(res: SankeyLayoutResult, nodes: SankeyNode[]): { color: string; style: SankeyItemStyle; label: SankeyLabel; pos: Pos; text: string[] }[] {
    const o = this.opts;
    const palette = o.colors?.length ? o.colors : SANKEY_COLORS;
    return res.nodes.map((L) => {
      const src = nodes[L.index];
      const level = o.levels?.find((l) => l.depth === L.layer);
      const style: SankeyItemStyle = { ...o.itemStyle, ...level?.itemStyle, ...src.itemStyle };
      const color = style.color ?? palette[L.index % palette.length];
      const label: SankeyLabel = { ...o.label, ...level?.label, ...src.label };
      let pos = label.position ?? 'auto';
      // 'auto': after the node, along the flow (the room for the last column's labels is kept free)
      if (pos === 'auto') pos = this.horiz ? 'right' : 'bottom';
      const info = this.nodeInfo(L, src, color);
      const text = label.show === false ? [] : (label.formatter ? label.formatter(info) : L.name).split('\n').filter(Boolean);
      return { color, style, label, pos, text };
    });
  }

  private nodeInfo(L: SankeyLayoutNode, src: SankeyNode, color: string): SankeyNodeInfo {
    return { dataType: 'node', node: src, name: L.name, index: L.index, value: L.value, inValue: L.inValue, outValue: L.outValue, depth: L.layer, color };
  }

  private textWidth(lines: string[], label: SankeyLabel): number {
    if (!lines.length) return 0;
    this.ctx.font = this.font(label.fontSize ?? 12, label.fontWeight ?? 400);
    return Math.max(...lines.map((l) => this.ctx.measureText(l).width));
  }

  /** New layout. `mode`: how the change shows (entry animation, move from the old places, or at once). */
  private relayout(mode: 'reveal' | 'morph' | 'none'): void {
    const o = this.opts;
    const nodes = o.nodes ?? [];
    const links = o.links ?? [];
    this.horiz = (o.orient ?? 'horizontal') !== 'vertical';
    const W = this.width;
    const H = this.height;
    // columns first (they don't depend on the size), to know where the labels go and the room they need
    const pre = sankeyLayout(nodes, links, this.layoutOpts(1000, 1000, 0));
    if (pre.ignored.length && pre.ignored.some((l) => !this.res?.ignored.some((k) => k.index === l.index)))
      console.warn(`sankey: ${pre.ignored.length} link(s) left out (self-links or cycles)`, pre.ignored);
    const deco = this.decorate(pre, nodes);
    const px = (v: number | string | undefined, total: number, def: number): number =>
      v === undefined ? def : typeof v === 'number' ? v : v.trim().endsWith('%') ? (total * parseFloat(v)) / 100 : parseFloat(v) || 0;
    let lm = 0;
    let rm = 0;
    let tm = 0;
    let bm = 0;
    const last = pre.columns - 1;
    pre.nodes.forEach((L, i) => {
      const d = deco[i];
      if (!d.text.length) return;
      const fs = d.label.fontSize ?? 12;
      const dist = d.label.distance ?? 5;
      const w = this.textWidth(d.text, d.label) + dist + 2;
      const h = d.text.length * fs * 1.25 + dist;
      const first = L.layer === 0;
      const end = L.layer === last;
      if (this.horiz) {
        if (d.pos === 'left' && first) lm = Math.max(lm, w);
        if (d.pos === 'right' && end) rm = Math.max(rm, w);
        if (d.pos === 'top') tm = Math.max(tm, h);
        if (d.pos === 'bottom') bm = Math.max(bm, h);
        tm = Math.max(tm, fs * 0.6);
        bm = Math.max(bm, fs * 0.6);
      } else {
        if (d.pos === 'top' && first) tm = Math.max(tm, h);
        if (d.pos === 'bottom' && end) bm = Math.max(bm, h);
        if (d.pos === 'left') lm = Math.max(lm, w);
        if (d.pos === 'right') rm = Math.max(rm, w);
      }
    });
    const cap = (v: number, total: number): number => Math.min(v, total * 0.3);
    const x0 = px(o.left, W, 12) + cap(lm, W);
    const x1 = W - px(o.right, W, 12) - cap(rm, W);
    const y0 = px(o.top, H, 10) + cap(tm, H);
    const y1 = H - px(o.bottom, H, 10) - cap(bm, H);
    this.area = { x: x0, y: y0, w: Math.max(1, x1 - x0), h: Math.max(1, y1 - y0) };
    const flow = this.horiz ? this.area.w : this.area.h;
    const stack = this.horiz ? this.area.h : this.area.w;
    const res = sankeyLayout(nodes, links, this.layoutOpts(flow, stack));
    // nodes moved by hand keep their place
    if (this.manual.size) {
      for (const L of res.nodes) {
        const f = this.manual.get(L.name);
        if (f === undefined) continue;
        const h = L.y1 - L.y0;
        L.y0 = clamp(f * stack, 0, Math.max(0, stack - h));
        L.y1 = L.y0 + h;
      }
      sankeyLinkBreadths(res.nodes);
    }

    // where things are now (for the morph)
    const oldNodes = new Map<string, Box>();
    const oldLinks = new Map<string, { y0: number; y1: number; w: number }>();
    if (mode === 'morph') {
      for (const v of this.vnodes) oldNodes.set(v.L.name, { ...v.cur });
      for (const l of this.vlinks) oldLinks.set(l.key, { y0: l.y0, y1: l.y1, w: l.w });
    }
    this.res = res;
    this.byLayoutNode.clear();
    this.byLayoutLink.clear();
    this.vnodes = res.nodes.map((L, i) => {
      const d = deco[i];
      const target: Box = { x0: L.x0, x1: L.x1, y0: L.y0, y1: L.y1 };
      const from = oldNodes.get(L.name) ?? null;
      const v: VNode = { L, src: nodes[L.index], color: d.color, style: d.style, label: d.label, pos: d.pos, info: this.nodeInfo(L, nodes[L.index], d.color), from, cur: from ? { ...from } : target, a: 1 };
      this.byLayoutNode.set(L, v);
      return v;
    });
    const seen = new Map<string, number>();
    this.vlinks = res.links.map((L) => {
      const src = links[L.index];
      const lvl = o.levels?.find((l) => l.depth === L.source.layer);
      const ls = { ...o.lineStyle, ...lvl?.lineStyle, ...src.lineStyle };
      const base = `${L.source.name}\u0001${L.target.name}`;
      const k = seen.get(base) ?? 0;
      seen.set(base, k + 1);
      const key = `${base}\u0001${k}`;
      const from = oldLinks.get(key) ?? null;
      const v: VLink = {
        L,
        src,
        key,
        color: ls.color ?? 'source',
        opacity: clamp(ls.opacity ?? 0.35, 0, 1),
        curveness: clamp(ls.curveness ?? 0.5, 0, 1),
        info: { dataType: 'link', link: src, index: L.index, source: L.source.name, target: L.target.name, value: L.value },
        from,
        y0: from ? from.y0 : L.y0,
        y1: from ? from.y1 : L.y1,
        w: from ? from.w : L.width,
        a: 1,
        path: null,
      };
      this.byLayoutLink.set(L, v);
      return v;
    });
    if (this.hover) {
      const h = this.hover;
      this.hover = 'cur' in h ? (this.vnodes.find((v) => v.L.name === h.L.name) ?? null) : (this.vlinks.find((l) => l.key === h.key) ?? null);
    }
    this.mode = mode;
    this.animStart = mode === 'none' ? 0 : performance.now();
    this.loop();
  }

  private loop(): void {
    cancelAnimationFrame(this.raf);
    if (this.destroyed) return;
    const p = this.animStart ? clamp((performance.now() - this.animStart) / (this.duration() || 1), 0, 1) : 1;
    this.progress = p;
    const e = easeInOut(p);
    const morph = this.mode === 'morph' && p < 1;
    for (const v of this.vnodes) {
      const L = v.L;
      if (morph && v.from) v.cur = { x0: lerp(v.from.x0, L.x0, e), x1: lerp(v.from.x1, L.x1, e), y0: lerp(v.from.y0, L.y0, e), y1: lerp(v.from.y1, L.y1, e) };
      else v.cur = { x0: L.x0, x1: L.x1, y0: L.y0, y1: L.y1 };
      v.a = morph && !v.from ? e : 1;
    }
    for (const l of this.vlinks) {
      const L = l.L;
      if (morph && l.from) {
        l.y0 = lerp(l.from.y0, L.y0, e);
        l.y1 = lerp(l.from.y1, L.y1, e);
        l.w = lerp(l.from.w, L.width, e);
      } else {
        l.y0 = L.y0;
        l.y1 = L.y1;
        l.w = L.width;
      }
      l.a = morph && !l.from ? e : 1;
    }
    this.draw();
    if (p < 1) this.raf = requestAnimationFrame(() => this.loop());
    else {
      this.animStart = 0;
      this.mode = 'none';
    }
  }

  // ------------------------------------------------------------------ drawing

  /** Screen rectangle of a node. */
  private rect(b: Box): { x: number; y: number; w: number; h: number } {
    const a = this.area;
    return this.horiz ? { x: a.x + b.x0, y: a.y + b.y0, w: b.x1 - b.x0, h: b.y1 - b.y0 } : { x: a.x + b.y0, y: a.y + b.x0, w: b.y1 - b.y0, h: b.x1 - b.x0 };
  }

  /** Screen point of a (flow, stack) point. */
  private pt(f: number, s: number): [number, number] {
    const a = this.area;
    return this.horiz ? [a.x + f, a.y + s] : [a.x + s, a.y + f];
  }

  private linkPath(l: VLink): Path2D {
    const s = this.byLayoutNode.get(l.L.source)!;
    const t = this.byLayoutNode.get(l.L.target)!;
    const f0 = s.cur.x1;
    const f1 = t.cur.x0;
    const k = l.curveness;
    const fa = f0 + (f1 - f0) * k;
    const fb = f1 - (f1 - f0) * k;
    const p = new Path2D();
    p.moveTo(...this.pt(f0, l.y0));
    p.bezierCurveTo(...this.pt(fa, l.y0), ...this.pt(fb, l.y1), ...this.pt(f1, l.y1));
    return p;
  }

  /** What lights up with the hover (null = nothing hovered). */
  private lit(): { nodes: Set<VNode>; links: Set<VLink> } | null {
    const h = this.hover;
    const focus = this.focus();
    if (!h || focus === 'none') return null;
    const nodes = new Set<VNode>();
    const links = new Set<VLink>();
    const N = (L: SankeyLayoutNode): VNode => this.byLayoutNode.get(L)!;
    const K = (L: SankeyLayoutLink): VLink => this.byLayoutLink.get(L)!;
    const up = (L: SankeyLayoutNode): void => {
      for (const l of L.targetLinks)
        if (!links.has(K(l))) {
          links.add(K(l));
          nodes.add(N(l.source));
          up(l.source);
        }
    };
    const down = (L: SankeyLayoutNode): void => {
      for (const l of L.sourceLinks)
        if (!links.has(K(l))) {
          links.add(K(l));
          nodes.add(N(l.target));
          down(l.target);
        }
    };
    if ('cur' in h) {
      nodes.add(h);
      if (focus === 'adjacency')
        for (const l of [...h.L.sourceLinks, ...h.L.targetLinks]) {
          links.add(K(l));
          nodes.add(N(l.source));
          nodes.add(N(l.target));
        }
      else if (focus === 'trajectory') {
        up(h.L);
        down(h.L);
      }
    } else {
      links.add(h);
      if (focus !== 'self') {
        nodes.add(N(h.L.source));
        nodes.add(N(h.L.target));
      }
      if (focus === 'trajectory') {
        up(h.L.source);
        down(h.L.target);
      }
    }
    return { nodes, links };
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
    ctx.save();
    if (this.mode === 'reveal' && this.progress < 1) {
      // entry: the flow is revealed along its direction
      const e = easeInOut(this.progress);
      ctx.beginPath();
      if (this.horiz) ctx.rect(0, 0, this.width * e, this.height);
      else ctx.rect(0, 0, this.width, this.height * e);
      ctx.clip();
    }
    const lit = this.lit();
    // big links first, so the thin ones stay on top (and are easy to hover)
    const order = [...this.vlinks].sort((a, b) => b.L.width - a.L.width);
    for (const l of order) this.drawLink(l, lit);
    for (const v of this.vnodes) this.drawNode(v, lit);
    this.drawLabels(lit);
    ctx.restore();
  }

  private drawLink(l: VLink, lit: { nodes: Set<VNode>; links: Set<VLink> } | null): void {
    l.path = this.linkPath(l);
    if (l.w <= 0.01 || l.a <= 0.002) return;
    const ctx = this.ctx;
    const s = this.byLayoutNode.get(l.L.source)!;
    const t = this.byLayoutNode.get(l.L.target)!;
    const on = lit?.links.has(l);
    const op = lit ? (on ? Math.min(1, l.opacity + 0.3) : l.opacity * 0.3) : l.opacity;
    ctx.globalAlpha = l.a * op;
    if (l.color === 'gradient') {
      const [ax, ay] = this.pt(s.cur.x1, l.y0);
      const [bx, by] = this.pt(t.cur.x0, l.y1);
      const g = ctx.createLinearGradient(ax, ay, bx, by);
      g.addColorStop(0, s.color);
      g.addColorStop(1, t.color);
      ctx.strokeStyle = g;
    } else ctx.strokeStyle = l.color === 'source' ? s.color : l.color === 'target' ? t.color : l.color;
    ctx.lineWidth = Math.max(1, l.w);
    ctx.lineCap = 'butt';
    ctx.stroke(l.path);
    ctx.globalAlpha = 1;
  }

  private drawNode(v: VNode, lit: { nodes: Set<VNode>; links: Set<VLink> } | null): void {
    const ctx = this.ctx;
    const r = this.rect(v.cur);
    // never thinner than a pixel
    if (this.horiz && r.h < 1) {
      r.y -= (1 - r.h) / 2;
      r.h = 1;
    }
    if (!this.horiz && r.w < 1) {
      r.x -= (1 - r.w) / 2;
      r.w = 1;
    }
    const st = v.style;
    ctx.globalAlpha = v.a * (st.opacity ?? 1) * (lit && !lit.nodes.has(v) ? 0.3 : 1);
    ctx.beginPath();
    const rad = Math.min(st.borderRadius ?? 0, r.w / 2, r.h / 2);
    if (rad > 0) ctx.roundRect(r.x, r.y, r.w, r.h, rad);
    else ctx.rect(r.x, r.y, r.w, r.h);
    ctx.fillStyle = v.color;
    ctx.fill();
    const bw = st.borderWidth ?? 0;
    const bc = st.borderColor ?? this.theme.nodeBorder;
    if (bw > 0 && bc !== 'transparent') {
      ctx.strokeStyle = bc;
      ctx.lineWidth = bw;
      ctx.stroke();
    }
    if (this.hover === v) {
      ctx.strokeStyle = alpha(this.theme.text, 0.7);
      ctx.lineWidth = 1.5;
      ctx.stroke();
    }
    ctx.globalAlpha = 1;
  }

  private drawLabels(lit: { nodes: Set<VNode>; links: Set<VLink> } | null): void {
    const ctx = this.ctx;
    const boxes: LabelBox[] = [];
    for (const v of this.vnodes) {
      const cfg = v.label;
      if (cfg.show === false) continue;
      const text = cfg.formatter ? cfg.formatter(v.info) : v.L.name;
      const lines = text.split('\n');
      if (!text) continue;
      const fs = cfg.fontSize ?? 12;
      const lh = fs * 1.25;
      ctx.font = this.font(fs, cfg.fontWeight ?? 400);
      const w = Math.max(...lines.map((s) => ctx.measureText(s).width));
      const h = lines.length * lh;
      const d = cfg.distance ?? 5;
      const r = this.rect(v.cur);
      let x0: number;
      let y0: number;
      let align: CanvasTextAlign;
      if (v.pos === 'right' || v.pos === 'left') {
        align = v.pos === 'right' ? 'left' : 'right';
        x0 = v.pos === 'right' ? r.x + r.w + d : r.x - d - w;
        y0 = r.y + r.h / 2 - h / 2;
      } else {
        align = 'center';
        x0 = r.x + r.w / 2 - w / 2;
        y0 = v.pos === 'top' ? r.y - d - h : v.pos === 'bottom' ? r.y + r.h + d : r.y + r.h / 2 - h / 2;
      }
      // inside the canvas
      x0 = clamp(x0, 2, Math.max(2, this.width - w - 2));
      y0 = clamp(y0, 1, Math.max(1, this.height - h - 1));
      boxes.push({ v, lines, fs, lh, align, x0, y0, w, h });
    }
    // labels that would cover others hide: the lit ones and the big nodes win
    boxes.sort((a, b) => (lit?.nodes.has(b.v) ? 1 : 0) - (lit?.nodes.has(a.v) ? 1 : 0) || b.v.L.value - a.v.L.value);
    const kept: LabelBox[] = [];
    // (with a few px of air between labels)
    for (const b of boxes) if (!kept.some((k) => b.x0 < k.x0 + k.w + 4 && b.x0 + b.w > k.x0 - 4 && b.y0 < k.y0 + k.h - 1 && b.y0 + b.h > k.y0 + 1)) kept.push(b);
    const bg = this.theme.background;
    const halo = bg !== 'transparent' && parseColor(bg)[3] > 0;
    for (const b of kept) {
      const cfg = b.v.label;
      ctx.globalAlpha = b.v.a * (lit && !lit.nodes.has(b.v) ? 0.35 : 1);
      ctx.font = this.font(b.fs, this.hover === b.v ? 600 : (cfg.fontWeight ?? 400));
      ctx.textAlign = b.align;
      ctx.textBaseline = 'middle';
      const color = cfg.color ?? (b.v.pos === 'inside' ? (luminance(b.v.color) > 0.6 ? '#131722' : '#ffffff') : this.theme.text);
      const x = b.align === 'left' ? b.x0 : b.align === 'right' ? b.x0 + b.w : b.x0 + b.w / 2;
      b.lines.forEach((line, i) => {
        const y = b.y0 + b.lh * (i + 0.5);
        if (halo && b.v.pos !== 'inside') {
          ctx.strokeStyle = alpha(bg, 0.7);
          ctx.lineWidth = 3;
          ctx.lineJoin = 'round';
          ctx.strokeText(line, x, y);
        }
        ctx.fillStyle = color;
        ctx.fillText(line, x, y);
      });
    }
    ctx.globalAlpha = 1;
  }

  // ------------------------------------------------------------------ interaction

  private infoOf(h: VNode | VLink): SankeyInfo {
    return h.info;
  }

  private hitTest(x: number, y: number): VNode | VLink | null {
    for (let i = this.vnodes.length - 1; i >= 0; i--) {
      const v = this.vnodes[i];
      const r = this.rect(v.cur);
      const px = Math.max(0, (6 - r.w) / 2);
      const py = Math.max(0, (6 - r.h) / 2);
      if (x >= r.x - px && x <= r.x + r.w + px && y >= r.y - py && y <= r.y + r.h + py) return v;
    }
    const ctx = this.ctx;
    ctx.save();
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    const order = [...this.vlinks].sort((a, b) => a.L.width - b.L.width);
    let hit: VLink | null = null;
    for (const l of order) {
      if (!l.path || l.w <= 0.01) continue;
      ctx.lineWidth = Math.max(4, l.w);
      if (ctx.isPointInStroke(l.path, x, y)) {
        hit = l;
        break;
      }
    }
    ctx.restore();
    return hit;
  }

  private setHover(h: VNode | VLink | null): void {
    if (h === this.hover) return;
    this.hover = h;
    this.emit('hover', h ? this.infoOf(h) : null);
    this.draw();
  }

  private bind(): void {
    const pos = (e: MouseEvent): { x: number; y: number } => {
      const r = this.canvas.getBoundingClientRect();
      return { x: e.clientX - r.left, y: e.clientY - r.top };
    };
    let drag: { v: VNode; start: number; y0: number; moved: boolean } | null = null;
    let justDragged = false;
    this.canvas.addEventListener('pointerdown', (e) => {
      if (this.opts.draggable === false || e.button !== 0) return;
      const p = pos(e);
      const h = this.hitTest(p.x, p.y);
      if (!h || !('cur' in h)) return;
      drag = { v: h, start: this.horiz ? p.y : p.x, y0: h.L.y0, moved: false };
      this.canvas.setPointerCapture(e.pointerId);
    });
    const end = (): void => {
      if (drag?.moved) {
        justDragged = true;
        setTimeout(() => (justDragged = false), 0);
        this.emit('drag', drag.v.info);
        this.canvas.style.cursor = 'grab';
      }
      drag = null;
    };
    this.canvas.addEventListener('pointerup', end);
    this.canvas.addEventListener('pointercancel', end);
    this.canvas.addEventListener('pointermove', (e) => {
      const { x, y } = pos(e);
      if (drag && e.buttons) {
        const d = (this.horiz ? y : x) - drag.start;
        if (Math.abs(d) > 2) drag.moved = true;
        if (drag.moved) {
          const L = drag.v.L;
          const stack = this.horiz ? this.area.h : this.area.w;
          const hgt = L.y1 - L.y0;
          L.y0 = clamp(drag.y0 + d, 0, Math.max(0, stack - hgt));
          L.y1 = L.y0 + hgt;
          this.manual.set(L.name, stack > 0 ? L.y0 / stack : 0);
          sankeyLinkBreadths(this.res!.nodes);
          // stop any animation: the drag shows at once
          this.animStart = 0;
          this.mode = 'none';
          cancelAnimationFrame(this.raf);
          this.loop();
          this.canvas.style.cursor = 'grabbing';
          this.showTooltip(e);
          return;
        }
      }
      const h = this.hitTest(x, y);
      this.setHover(h);
      this.canvas.style.cursor = h ? ('cur' in h && this.opts.draggable !== false ? 'grab' : 'pointer') : '';
      this.showTooltip(e);
    });
    this.canvas.addEventListener('pointerleave', () => {
      if (drag) return;
      this.setHover(null);
      this.tooltipEl.classList.remove('is-visible');
    });
    this.canvas.addEventListener('click', (e) => {
      if (justDragged) return;
      const { x, y } = pos(e);
      const h = this.hitTest(x, y);
      if (h) this.emit('click', this.infoOf(h));
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
    const info = this.infoOf(h);
    if (typeof tt === 'object' && tt.formatter) el.innerHTML = tt.formatter(info);
    else if (info.dataType === 'link') {
      const s = this.byLayoutNode.get((h as VLink).L.source)!;
      const t = this.byLayoutNode.get((h as VLink).L.target)!;
      const share = s.L.outValue > 0 ? `<div class="sk-tooltip__sub">${((info.value / s.L.outValue) * 100).toLocaleString('pt-PT', { maximumFractionDigits: 1 })}% do que sai de ${esc(info.source)}</div>` : '';
      el.innerHTML =
        `<div class="sk-tooltip__head"><i class="sk-tooltip__dot" style="background:linear-gradient(90deg, ${s.color}, ${t.color})"></i>${esc(info.source)} → ${esc(info.target)}</div>` +
        `<div class="sk-tooltip__row"><span>Valor</span><b>${esc(this.fmt(info.value))}</b></div>${share}`;
    } else {
      const L = (h as VNode).L;
      const rows: string[] = [];
      const row = (k: string, v: number): number => rows.push(`<div class="sk-tooltip__row"><span>${k}</span><b>${esc(this.fmt(v))}</b></div>`);
      if (L.targetLinks.length) row('Entrada', L.inValue);
      if (L.sourceLinks.length) row('Saída', L.outValue);
      if (!rows.length || (L.value > L.inValue && L.value > L.outValue)) row('Valor', L.value);
      el.innerHTML = `<div class="sk-tooltip__head"><i class="sk-tooltip__dot" style="background:${info.color}"></i>${esc(info.name)}</div>${rows.join('')}`;
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

export function createSankeyChart(container: HTMLElement, options: SankeyOptions = {}): SankeyChart {
  return new SankeyChart(container, options);
}
