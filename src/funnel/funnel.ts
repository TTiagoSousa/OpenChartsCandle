import { parseColor, luminance } from '../shared/color';
import { funnelLength, funnelOrder, funnelShapes, pointInPolygon } from './geometry';
import type { FunnelEvent, FunnelHoverInfo, FunnelItem, FunnelItemStyle, FunnelLabel, FunnelLabelPosition, FunnelOptions, FunnelSpec, FunnelTheme } from './types';

const FONT = '-apple-system, BlinkMacSystemFont, "Trebuchet MS", Roboto, Ubuntu, sans-serif';

export const funnelDarkTheme: FunnelTheme = {
  background: '#131722',
  text: '#d1d4dc',
  muted: '#787b86',
  border: '#131722',
  tooltipBg: '#1e222d',
  tooltipText: '#d1d4dc',
  tooltipBorder: '#2a2e39',
  font: FONT,
};

export const funnelLightTheme: FunnelTheme = {
  background: '#ffffff',
  text: '#131722',
  muted: '#787b86',
  border: '#ffffff',
  tooltipBg: '#ffffff',
  tooltipText: '#131722',
  tooltipBorder: '#e0e3eb',
  font: FONT,
};

export const FUNNEL_COLORS = ['#2962ff', '#00bcd4', '#089981', '#8bc34a', '#ffc107', '#ff9800', '#f23645', '#e91e63', '#9c27b0', '#607d8b'];

const esc = (s: string): string => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const clamp = (v: number, a: number, b: number): number => Math.min(b, Math.max(a, v));
const easeOut = (t: number): number => 1 - Math.pow(1 - t, 3);
const alpha = (c: string, a: number): string => {
  const [r, g, b, a0] = parseColor(c);
  return `rgba(${r}, ${g}, ${b}, ${+(a * a0).toFixed(3)})`;
};
const empty = (c: string | undefined): boolean => c === 'transparent' || c === 'none';

/** A stage, with its animated shape (a0, a1 along the flow; w0, w1 widths; o = offset of the box across). */
interface Stage {
  item: FunnelItem;
  name: string;
  color: string;
  index: number;
  info: FunnelHoverInfo;
  visible: boolean;
  from: { a0: number; a1: number; w0: number; w1: number; op: number };
  to: { a0: number; a1: number; w0: number; w1: number; op: number };
  now: { a0: number; a1: number; w0: number; w1: number; op: number };
  pts: { x: number; y: number }[];
}

interface FunnelModel {
  spec: FunnelSpec;
  index: number;
  stages: Stage[];
  /** box of the funnel itself (labels outside) */
  x: number;
  y: number;
  w: number;
  h: number;
  vertical: boolean;
  labelPos: FunnelLabelPosition;
}

/**
 * Funnel chart: stages from the biggest to the smallest (or a pyramid), with gaps, outside or inside labels
 * with lines, several funnels in one chart (side by side or one over the other), legend that hides stages,
 * tooltip with the conversion from the first and the previous stage, and animations.
 */
export class FunnelChart {
  readonly root: HTMLElement;
  readonly canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private titleEl: HTMLElement;
  private bodyEl: HTMLElement;
  private plotEl: HTMLElement;
  private legendEl: HTMLElement;
  private tooltipEl: HTMLElement;
  private opts: FunnelOptions;
  private theme!: FunnelTheme;
  private funnels: FunnelModel[] = [];
  private names: string[] = [];
  private hidden = new Set<string>();
  private hover: Stage | null = null;
  private width = 0;
  private height = 0;
  private dpr = 1;
  private animStart = 0;
  private raf = 0;
  private handlers = new Map<FunnelEvent, Set<(v: unknown) => void>>();
  private ro: ResizeObserver;
  private destroyed = false;

  constructor(container: HTMLElement, options: FunnelOptions = {}) {
    this.opts = { ...options };
    this.root = container;
    container.classList.add('fn-root');
    this.titleEl = document.createElement('div');
    this.titleEl.className = 'fn-title';
    this.bodyEl = document.createElement('div');
    this.plotEl = document.createElement('div');
    this.plotEl.className = 'fn-plot';
    this.canvas = document.createElement('canvas');
    this.canvas.className = 'fn-canvas';
    this.canvas.setAttribute('role', 'img');
    this.ctx = this.canvas.getContext('2d')!;
    this.tooltipEl = document.createElement('div');
    this.tooltipEl.className = 'fn-tooltip';
    this.legendEl = document.createElement('ul');
    this.plotEl.append(this.canvas, this.tooltipEl);
    this.bodyEl.append(this.plotEl, this.legendEl);
    container.append(this.titleEl, this.bodyEl);
    this.applyLook();
    this.bind();
    this.ro = new ResizeObserver(() => this.resize());
    this.ro.observe(this.plotEl);
    this.measure();
    this.rebuild(true);
  }

  // ------------------------------------------------------------------ public API

  /** Replace the stages (one funnel) or the funnels; stages with the same name morph to their new size. */
  setData(data: FunnelItem[] | FunnelSpec[], animate = true): void {
    const many = data.length > 0 && 'data' in data[0];
    if (many) this.opts = { ...this.opts, funnels: data as FunnelSpec[] };
    else this.opts = { ...this.opts, data: data as FunnelItem[], funnels: undefined };
    this.rebuild(animate);
  }

  /** Change options after creation. */
  setOptions(patch: FunnelOptions, animate = true): void {
    this.opts = { ...this.opts, ...patch };
    this.applyLook();
    this.rebuild(animate);
  }

  /** Show / hide a stage (by name) in every funnel. */
  toggle(name: string, hidden?: boolean): void {
    const h = hidden ?? !this.hidden.has(name);
    if (h) this.hidden.add(name);
    else this.hidden.delete(name);
    this.emit('toggle', { name, hidden: h });
    this.rebuild(true);
  }

  on(event: 'hover', handler: (info: FunnelHoverInfo | null) => void): () => void;
  on(event: 'click', handler: (info: FunnelHoverInfo) => void): () => void;
  on(event: 'toggle', handler: (e: { name: string; hidden: boolean }) => void): () => void;
  on(event: FunnelEvent, handler: (v: never) => void): () => void {
    if (!this.handlers.has(event)) this.handlers.set(event, new Set());
    const h = handler as (v: unknown) => void;
    this.handlers.get(event)!.add(h);
    return () => this.handlers.get(event)?.delete(h);
  }

  resize(): void {
    this.measure();
    this.rebuild(false);
  }

  screenshot(): string {
    this.draw();
    return this.canvas.toDataURL('image/png');
  }

  destroy(): void {
    this.destroyed = true;
    cancelAnimationFrame(this.raf);
    this.ro.disconnect();
    this.root.classList.remove('fn-root');
    this.titleEl.remove();
    this.bodyEl.remove();
  }

  // ------------------------------------------------------------------ model

  private emit(e: FunnelEvent, v: unknown): void {
    this.handlers.get(e)?.forEach((h) => h(v));
  }

  private specList(): FunnelSpec[] {
    const { funnels, data, colors: _c, legend: _l, tooltip: _t, valueFormatter: _v, hoverDim: _h, title: _ti, background: _b, theme: _th, animation: _a, ...base } = this.opts;
    if (funnels?.length) return funnels.map((f) => ({ ...base, ...f }));
    return data ? [{ ...base, data }] : [];
  }

  private applyLook(): void {
    const o = this.opts;
    const base = o.theme === 'light' ? funnelLightTheme : funnelDarkTheme;
    const t: FunnelTheme = { ...base, ...(typeof o.theme === 'object' ? o.theme : {}) };
    if (o.background) t.background = o.background;
    if (t.background === 'transparent' && !(typeof o.theme === 'object' && o.theme.border)) t.border = 'rgba(255, 255, 255, 0.35)';
    else if (!(typeof o.theme === 'object' && o.theme.border)) t.border = t.background;
    this.theme = t;
    const vars: Record<string, string> = {
      '--fn-bg': t.background,
      '--fn-text': t.text,
      '--fn-muted': t.muted,
      '--fn-tt-bg': t.tooltipBg,
      '--fn-tt-text': t.tooltipText,
      '--fn-tt-border': t.tooltipBorder,
      '--fn-font': t.font,
    };
    for (const [k, v] of Object.entries(vars)) this.root.style.setProperty(k, v);
    const title = typeof o.title === 'string' ? { text: o.title } : o.title;
    this.titleEl.style.display = title ? '' : 'none';
    if (title) {
      this.titleEl.style.textAlign = title.align ?? 'center';
      this.titleEl.innerHTML = `<b>${esc(title.text)}</b>${title.subtext ? `<small>${esc(title.subtext)}</small>` : ''}`;
    }
  }

  private colorOf(name: string, item: FunnelItem): string {
    const palette = this.opts.colors ?? FUNNEL_COLORS;
    return item.color ?? palette[Math.max(0, this.names.indexOf(name)) % palette.length];
  }

  private rebuild(animate: boolean): void {
    const specs = this.specList();
    this.names = [];
    for (const s of specs) for (const it of s.data) if (!this.names.includes(it.name)) this.names.push(it.name);
    const old = new Map<string, Stage>();
    for (const f of this.funnels) for (const s of f.stages) old.set(`${f.index}\u0001${s.name}`, s);
    this.renderLegend();
    const on = animate && this.duration() > 0;
    this.funnels = specs.map((spec, index) => {
      const vertical = (spec.orient ?? 'vertical') === 'vertical';
      const f: FunnelModel = { spec, index, stages: [], x: 0, y: 0, w: 0, h: 0, vertical, labelPos: this.labelPosition(spec.label?.position, vertical) };
      const shown = spec.data.filter((it) => !this.hidden.has(it.name));
      const order = funnelOrder(
        shown.map((it) => it.value),
        spec.sort ?? 'descending',
      ).map((i) => shown[i]);
      const max = spec.max ?? Math.max(0, ...spec.data.map((d) => d.value));
      const first = order[0]?.value ?? 0;
      // the stages in their order, then the hidden ones (they shrink away where they were)
      const all = [...order, ...spec.data.filter((it) => this.hidden.has(it.name))];
      f.stages = all.map((item, k) => {
        const visible = k < order.length;
        const prevValue = visible && k > 0 ? order[k - 1].value : item.value;
        const color = this.colorOf(item.name, item);
        const info: FunnelHoverInfo = {
          item,
          name: item.name,
          value: item.value,
          color,
          funnelIndex: index,
          funnelName: spec.name,
          index: visible ? k : -1,
          percentOfFirst: first ? (item.value / first) * 100 : 0,
          percentOfPrevious: prevValue ? (item.value / prevValue) * 100 : 0,
          percent: max ? (item.value / max) * 100 : 0,
        };
        const prev = old.get(`${index}\u0001${item.name}`);
        const zero = { a0: 0, a1: 0, w0: 0, w1: 0, op: 0 };
        const now = prev ? { ...prev.now } : { ...zero };
        return { item, name: item.name, color, index: k, info, visible, from: now, to: { ...zero }, now: { ...now }, pts: [] };
      });
      return f;
    });
    this.layout();
    for (const f of this.funnels)
      for (const s of f.stages) {
        const fresh = s.from.op === 0 && s.from.a1 === 0 && s.from.w0 === 0;
        if (fresh && s.visible) {
          // first time: grows from the top / the start, with its final widths
          s.from = { a0: 0, a1: 0, w0: s.to.w0 * 0.6, w1: s.to.w1 * 0.6, op: 0 };
          if (s.index > 0) {
            const p = f.stages[s.index - 1];
            s.from.a0 = s.from.a1 = p.from.a1;
          }
        }
        if (!on) s.from = { ...s.to };
        s.now = { ...s.from };
      }
    if (this.hover && !this.funnels.some((f) => f.stages.includes(this.hover!))) this.hover = null;
    this.animStart = on ? performance.now() : 0;
    this.loop();
  }

  private labelPosition(p: FunnelLabelPosition | undefined, vertical: boolean): FunnelLabelPosition {
    const pos = p ?? 'outside';
    if (pos === 'outside') return vertical ? 'right' : 'bottom';
    return pos;
  }

  private labelOf(f: FunnelModel, s: Stage): FunnelLabel {
    return { ...f.spec.label, ...s.item.label };
  }

  private labelText(f: FunnelModel, s: Stage, cfg: FunnelLabel): string {
    if (cfg.show === false || (cfg.position ?? f.labelPos) === 'none') return '';
    return cfg.format ? cfg.format(s.info) : s.name;
  }

  private duration(): number {
    const a = this.opts.animation ?? true;
    return a === false ? 0 : typeof a === 'object' ? (a.duration ?? 650) : 650;
  }

  private loop(): void {
    cancelAnimationFrame(this.raf);
    if (this.destroyed) return;
    const now = performance.now();
    const p = this.animStart ? easeOut(clamp((now - this.animStart) / (this.duration() || 1), 0, 1)) : 1;
    for (const f of this.funnels)
      for (const s of f.stages) {
        const a = s.from;
        const b = s.to;
        s.now = { a0: a.a0 + (b.a0 - a.a0) * p, a1: a.a1 + (b.a1 - a.a1) * p, w0: a.w0 + (b.w0 - a.w0) * p, w1: a.w1 + (b.w1 - a.w1) * p, op: a.op + (b.op - a.op) * p };
      }
    this.draw();
    if (p < 1) this.raf = requestAnimationFrame(() => this.loop());
    else this.animStart = 0;
  }

  // ------------------------------------------------------------------ legend

  private legendCfg(): { show: boolean; position: string; interactive: boolean } {
    const l = this.opts.legend;
    const o = typeof l === 'object' ? l : {};
    return { show: (typeof l === 'boolean' ? l : o.show) ?? true, position: o.position ?? 'top', interactive: o.interactive ?? true };
  }

  private renderLegend(): void {
    const L = this.legendCfg();
    this.bodyEl.className = `fn-body fn-legend-${L.position}`;
    this.legendEl.className = 'fn-legend';
    this.legendEl.style.display = L.show ? '' : 'none';
    if (!L.show) return;
    const items = new Map<string, FunnelItem>();
    for (const s of this.specList()) for (const it of s.data) if (!items.has(it.name)) items.set(it.name, it);
    this.legendEl.innerHTML = this.names
      .map((name) => {
        const h = this.hidden.has(name);
        return `<li class="fn-legend__item${L.interactive ? ' is-interactive' : ''}${h ? ' is-hidden' : ''}" data-name="${esc(name)}"><i class="fn-legend__marker" style="--c:${this.colorOf(name, items.get(name)!)}"></i><span>${esc(name)}</span></li>`;
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

  private lineLength(f: FunnelModel): number {
    const l = f.spec.labelLine ?? true;
    if (l === false) return 6;
    return typeof l === 'object' ? (l.length ?? 18) : 18;
  }

  private layout(): void {
    const W = this.width;
    const H = this.height;
    const pad = 10;
    const boxKey = (s: FunnelSpec): string => [s.left, s.right, s.top, s.bottom].join('|');
    const room = new Map<string, { l: number; r: number; t: number; b: number }>();
    // pass 1: room for the outside labels, shared by funnels drawn in the same box (e.g. target and actual)
    for (const f of this.funnels) {
      const s = f.spec;
      const x0 = funnelLength(s.left, W, pad);
      const y0 = funnelLength(s.top, H, pad) + (s.showName && s.name ? 20 : 0);
      const x1 = W - funnelLength(s.right, W, pad);
      const y1 = H - funnelLength(s.bottom, H, pad);
      let lw = 0;
      let lh = 0;
      for (const st of f.stages) {
        const cfg = this.labelOf(f, st);
        const pos = this.labelPosition(cfg.position, f.vertical) ?? f.labelPos;
        if (!['left', 'right', 'top', 'bottom'].includes(pos)) continue;
        const text = this.labelText(f, st, cfg);
        if (!text) continue;
        const fs = cfg.fontSize ?? 12;
        this.ctx.font = this.font(fs, cfg.fontWeight ?? 400);
        lw = Math.max(lw, ...text.split('\n').map((l) => this.ctx.measureText(l).width));
        lh = Math.max(lh, text.split('\n').length * fs * 1.25);
      }
      const ll = this.lineLength(f);
      const m = room.get(boxKey(s)) ?? { l: 0, r: 0, t: 0, b: 0 };
      if (lw) {
        if (f.labelPos === 'right') m.r = Math.max(m.r, Math.min(lw + ll + 6, (x1 - x0) * 0.45));
        if (f.labelPos === 'left') m.l = Math.max(m.l, Math.min(lw + ll + 6, (x1 - x0) * 0.45));
        if (f.labelPos === 'bottom') m.b = Math.max(m.b, Math.min(lh + ll + 4, (y1 - y0) * 0.45));
        if (f.labelPos === 'top') m.t = Math.max(m.t, Math.min(lh + ll + 4, (y1 - y0) * 0.45));
      }
      room.set(boxKey(s), m);
    }
    // pass 2: boxes and shapes
    for (const f of this.funnels) {
      const s = f.spec;
      const m = room.get(boxKey(s))!;
      const x0 = funnelLength(s.left, W, pad) + m.l;
      const y0 = funnelLength(s.top, H, pad) + (s.showName && s.name ? 20 : 0) + m.t;
      const x1 = W - funnelLength(s.right, W, pad) - m.r;
      const y1 = H - funnelLength(s.bottom, H, pad) - m.b;
      f.x = x0;
      f.y = y0;
      f.w = Math.max(1, x1 - x0);
      f.h = Math.max(1, y1 - y0);
      const length = f.vertical ? f.h : f.w;
      const across = f.vertical ? f.w : f.h;
      const visible = f.stages.filter((st) => st.visible);
      const max = s.max ?? Math.max(0, ...s.data.map((d) => d.value));
      const shapes = funnelShapes(
        visible.map((st) => st.item.value),
        {
          length,
          gap: s.gap ?? 2,
          min: s.min ?? 0,
          max,
          minPx: funnelLength(s.minSize, across, 0),
          maxPx: funnelLength(s.maxSize, across, across),
          ascending: s.sort === 'ascending',
        },
      );
      visible.forEach((st, k) => (st.to = { ...shapes[k], op: 1 }));
      // hidden stages shrink to a line where they were
      for (const st of f.stages)
        if (!st.visible) {
          const m = (st.now.a0 + st.now.a1) / 2;
          st.to = { a0: m, a1: m, w0: st.now.w0, w1: st.now.w1, op: 0 };
        }
    }
  }

  /** Offset across of a width, by the alignment. */
  private offset(f: FunnelModel, w: number): number {
    const across = f.vertical ? f.w : f.h;
    const a = f.spec.funnelAlign ?? 'center';
    if (a === 'left' || a === 'top') return 0;
    if (a === 'right' || a === 'bottom') return across - w;
    return (across - w) / 2;
  }

  private toXY(f: FunnelModel, a: number, b: number): { x: number; y: number } {
    return f.vertical ? { x: f.x + b, y: f.y + a } : { x: f.x + a, y: f.y + b };
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
    const dim = this.opts.hoverDim ?? 0.35;
    for (const f of this.funnels) {
      for (const s of f.stages) {
        const n = s.now;
        s.pts = [this.toXY(f, n.a0, this.offset(f, n.w0)), this.toXY(f, n.a0, this.offset(f, n.w0) + n.w0), this.toXY(f, n.a1, this.offset(f, n.w1) + n.w1), this.toXY(f, n.a1, this.offset(f, n.w1))];
      }
      for (const s of f.stages) {
        if (s.now.op < 0.01 || s.now.a1 - s.now.a0 < 0.3) continue;
        const a = s.now.op * (this.hover && this.hover !== s && !f.spec.silent ? dim : 1);
        this.drawStage(f, s, a);
      }
      if (f.spec.showName && f.spec.name) {
        ctx.font = this.font(13, 600);
        ctx.fillStyle = t.text;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'bottom';
        ctx.fillText(f.spec.name, f.x + f.w / 2, f.y - 6);
      }
    }
    for (const f of this.funnels)
      for (const s of f.stages) {
        if (s.now.op < 0.05 || !s.visible) continue;
        this.drawLabel(f, s, s.now.op * (this.hover && this.hover !== s && this.hover.info.funnelIndex === f.index ? 0.6 : 1));
      }
  }

  private styleOf(f: FunnelModel, s: Stage): FunnelItemStyle {
    return { ...f.spec.itemStyle, ...s.item.itemStyle };
  }

  private drawStage(f: FunnelModel, s: Stage, a: number): void {
    const ctx = this.ctx;
    const st = this.styleOf(f, s);
    const hovered = this.hover === s;
    ctx.beginPath();
    s.pts.forEach((p, i) => (i ? ctx.lineTo(p.x, p.y) : ctx.moveTo(p.x, p.y)));
    ctx.closePath();
    const fill = st.color ?? s.color;
    if (!empty(fill)) {
      ctx.globalAlpha = a * (st.opacity ?? 1) * (hovered ? 1 : 0.92);
      ctx.fillStyle = fill;
      ctx.fill();
    }
    const bw = st.borderWidth ?? (empty(fill) ? 1.5 : 1);
    if (bw > 0) {
      ctx.globalAlpha = a;
      ctx.strokeStyle = st.borderColor ?? (empty(fill) ? s.color : this.theme.border);
      ctx.lineWidth = bw;
      ctx.lineJoin = 'round';
      ctx.setLineDash(st.borderDash ?? []);
      ctx.stroke();
      ctx.setLineDash([]);
    }
    if (hovered && !empty(fill)) {
      ctx.globalAlpha = 0.18;
      ctx.fillStyle = '#ffffff';
      ctx.fill();
    }
    ctx.globalAlpha = 1;
  }

  private drawLabel(f: FunnelModel, s: Stage, a: number): void {
    const ctx = this.ctx;
    const cfg = this.labelOf(f, s);
    const text = this.labelText(f, s, cfg);
    if (!text) return;
    const pos = cfg.position ? this.labelPosition(cfg.position, f.vertical) : f.labelPos;
    const fs = cfg.fontSize ?? 12;
    const n = s.now;
    const am = (n.a0 + n.a1) / 2;
    const wm = (n.w0 + n.w1) / 2;
    const om = (this.offset(f, n.w0) + this.offset(f, n.w1)) / 2;
    const lines = text.split('\n');
    ctx.font = this.font(fs, cfg.fontWeight ?? (pos.startsWith('inside') ? 600 : 400));
    ctx.globalAlpha = a;
    let x: number;
    let y: number;
    let align: CanvasTextAlign = 'center';
    const ll = this.lineLength(f);
    const lineCfg = f.spec.labelLine ?? true;
    const line = (x0: number, y0: number, x1: number, y1: number): void => {
      if (lineCfg === false) return;
      ctx.strokeStyle = (typeof lineCfg === 'object' && lineCfg.color) || alpha(s.color, 0.8);
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(x0, y0);
      ctx.lineTo(x1, y1);
      ctx.stroke();
    };
    const across = f.vertical ? f.w : f.h;
    if (pos === 'inside' || pos === 'insideLeft' || pos === 'insideRight') {
      // only where the text fits in the stage
      const tw = Math.max(...lines.map((l) => ctx.measureText(l).width));
      const th = lines.length * fs * 1.25;
      const room = f.vertical ? [Math.min(n.w0, n.w1) + (Math.max(n.w0, n.w1) - Math.min(n.w0, n.w1)) * 0.5 - 8, n.a1 - n.a0] : [n.a1 - n.a0 - 6, Math.min(n.w0, n.w1)];
      if (tw > room[0] || th > room[1] + 2) {
        ctx.globalAlpha = 1;
        return;
      }
      const b = pos === 'inside' ? om + wm / 2 : pos === 'insideLeft' ? om + 8 : om + wm - 8;
      ({ x, y } = this.toXY(f, am, b));
      align = f.vertical ? (pos === 'insideLeft' ? 'left' : pos === 'insideRight' ? 'right' : 'center') : 'center';
      const fill = this.styleOf(f, s).color ?? s.color;
      ctx.fillStyle = cfg.color ?? (empty(fill) ? this.theme.text : luminance(fill) > 0.4 ? '#131722' : '#ffffff');
    } else if (f.vertical) {
      const right = pos !== 'left';
      const edge = this.toXY(f, am, right ? om + wm : om);
      x = right ? f.x + across + ll : f.x - ll;
      y = edge.y;
      line(edge.x, edge.y, right ? x - 4 : x + 4, y);
      align = right ? 'left' : 'right';
      ctx.fillStyle = cfg.color ?? this.theme.text;
    } else {
      const below = pos !== 'top';
      const edge = this.toXY(f, am, below ? om + wm : om);
      x = edge.x;
      y = below ? f.y + across + ll : f.y - ll;
      line(edge.x, edge.y, x, below ? y - 2 : y + 2);
      ctx.fillStyle = cfg.color ?? this.theme.text;
    }
    ctx.textAlign = align;
    ctx.textBaseline = 'middle';
    const lh = fs * 1.25;
    const top = !f.vertical && !pos.startsWith('inside') ? (pos === 'top' ? y - (lines.length - 0.5) * lh : y + lh / 2) : y - ((lines.length - 1) * lh) / 2;
    lines.forEach((l, i) => ctx.fillText(l, x, top + i * lh));
    ctx.globalAlpha = 1;
  }

  // ------------------------------------------------------------------ interaction

  private hitTest(x: number, y: number): Stage | null {
    for (let k = this.funnels.length - 1; k >= 0; k--) {
      const f = this.funnels[k];
      if (f.spec.silent) continue;
      for (const s of f.stages) if (s.visible && pointInPolygon(x, y, s.pts)) return s;
    }
    return null;
  }

  private bind(): void {
    const pos = (e: MouseEvent): { x: number; y: number } => {
      const r = this.canvas.getBoundingClientRect();
      return { x: e.clientX - r.left, y: e.clientY - r.top };
    };
    this.canvas.addEventListener('pointermove', (e) => {
      const { x, y } = pos(e);
      const h = this.hitTest(x, y);
      if (h !== this.hover) {
        this.hover = h;
        this.emit('hover', h ? h.info : null);
        this.draw();
      }
      this.canvas.style.cursor = h ? 'pointer' : '';
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
      const { x, y } = pos(e);
      const h = this.hitTest(x, y);
      if (h) this.emit('click', h.info);
    });
    this.legendEl.addEventListener('click', (e) => {
      const li = (e.target as HTMLElement).closest<HTMLElement>('.fn-legend__item');
      if (!li || !this.legendCfg().interactive) return;
      this.toggle(li.dataset.name!);
    });
  }

  private fmt(v: number): string {
    return this.opts.valueFormatter ? this.opts.valueFormatter(v) : v.toLocaleString('pt-PT');
  }

  private showTooltip(e: PointerEvent): void {
    const tt = this.opts.tooltip ?? true;
    const el = this.tooltipEl;
    const h = this.hover;
    if (!h || tt === false || (typeof tt === 'object' && tt.show === false)) {
      el.classList.remove('is-visible');
      return;
    }
    const i = h.info;
    if (typeof tt === 'object' && tt.formatter) el.innerHTML = tt.formatter(i);
    else {
      const pct = (v: number): string => `${v.toLocaleString('pt-PT', { maximumFractionDigits: 1 })}%`;
      el.innerHTML =
        (i.funnelName ? `<div class="fn-tooltip__sub">${esc(i.funnelName)}</div>` : '') +
        `<div class="fn-tooltip__head"><i class="fn-tooltip__dot" style="background:${i.color}"></i>${esc(i.name)}</div>` +
        `<div class="fn-tooltip__row"><span>Valor</span><b>${esc(this.fmt(i.value))}</b></div>` +
        (i.index > 0
          ? `<div class="fn-tooltip__row"><span>Do primeiro</span><b>${pct(i.percentOfFirst)}</b></div><div class="fn-tooltip__row"><span>Do anterior</span><b>${pct(i.percentOfPrevious)}</b></div>`
          : '');
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

export function createFunnelChart(container: HTMLElement, options: FunnelOptions = {}): FunnelChart {
  return new FunnelChart(container, options);
}
