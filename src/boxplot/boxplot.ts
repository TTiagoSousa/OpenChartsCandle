import { parseColor } from '../shared/color';
import { formatCompact, niceScale } from '../shared/format';
import { boxplotStats } from './stats';
import type {
  BoxplotBox,
  BoxplotEvent,
  BoxplotHoverInfo,
  BoxplotItem,
  BoxplotOptions,
  BoxplotPointsOptions,
  BoxplotSeries,
  BoxplotSymbol,
  BoxplotTheme,
  BoxplotValue,
} from './types';

const FONT = '-apple-system, BlinkMacSystemFont, "Trebuchet MS", Roboto, Ubuntu, sans-serif';

export const boxplotDarkTheme: BoxplotTheme = {
  background: '#131722',
  text: '#d1d4dc',
  muted: '#787b86',
  grid: 'rgba(42, 46, 57, 0.7)',
  axis: '#363a45',
  tooltipBg: '#1e222d',
  tooltipText: '#d1d4dc',
  tooltipBorder: '#2a2e39',
  font: FONT,
};

export const boxplotLightTheme: BoxplotTheme = {
  background: '#ffffff',
  text: '#131722',
  muted: '#787b86',
  grid: 'rgba(42, 46, 57, 0.08)',
  axis: '#d1d4dc',
  tooltipBg: '#ffffff',
  tooltipText: '#131722',
  tooltipBorder: '#e0e3eb',
  font: FONT,
};

export const BOXPLOT_COLORS = ['#2962ff', '#ff9800', '#089981', '#f23645', '#9c27b0', '#00bcd4', '#e91e63', '#8bc34a', '#ffc107', '#607d8b'];

const esc = (s: string): string => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const clamp = (v: number, a: number, b: number): number => Math.min(b, Math.max(a, v));
const easeOut = (t: number): number => 1 - Math.pow(1 - t, 3);
const alpha = (c: string, a: number): string => {
  const [r, g, b, a0] = parseColor(c);
  return `rgba(${r}, ${g}, ${b}, ${+(a * a0).toFixed(3)})`;
};
/** Stable pseudo-random number in [-0.5, 0.5) for the jitter of a point (same place on every redraw). */
const jitterOf = (n: number): number => {
  const x = Math.sin(n * 12.9898 + 78.233) * 43758.5453;
  return x - Math.floor(x) - 0.5;
};

/** A point drawn at this frame (outlier or raw value), for the hit test. */
interface DrawnPoint {
  x: number;
  y: number;
  r: number;
  v: number;
  kind: 'outlier' | 'point';
}

interface BoxModel {
  cat: number;
  name: string;
  color: string;
  stats: BoxplotBox;
  /** target [min, q1, median, q3, max, mean] */
  t: number[];
  /** start of the animation */
  from: number[] | null;
  /** values drawn at this frame */
  v: number[];
  /** raw values (computed boxes) and their jitter */
  samples: number[];
  jit: number[];
  /** px along the category axis: center of the box, its width, center of the points */
  c: number;
  w: number;
  pc: number;
  hits: DrawnPoint[];
}

interface SModel {
  key: string;
  src: BoxplotSeries;
  index: number;
  color: string;
  boxes: BoxModel[];
}

type Hit = { m: SModel; b: BoxModel; kind: 'box' | 'outlier' | 'point'; point?: number };

/**
 * Box-and-whisker chart: one box per category and series (precomputed or computed from raw values), grouped side
 * by side, vertical or horizontal, with outliers, mean marker, jittered raw points, legend, tooltip and animations.
 */
export class BoxplotChart {
  readonly root: HTMLElement;
  readonly canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private titleEl: HTMLElement;
  private bodyEl: HTMLElement;
  private plotEl: HTMLElement;
  private legendEl: HTMLElement;
  private tooltipEl: HTMLElement;
  private opts: BoxplotOptions;
  private theme!: BoxplotTheme;
  private list: BoxplotSeries[] = [];
  private hiddenKeys = new Set<string>();
  private models: SModel[] = [];
  private categories: string[] = [];
  private hover: Hit | null = null;
  private plot = { x: 0, y: 0, w: 1, h: 1 };
  private scale = { lo: 0, hi: 1, ticks: [0, 1] };
  private catRot = 0;
  private catStep = 1;
  private width = 0;
  private height = 0;
  private dpr = 1;
  private animStart = 0;
  private raf = 0;
  private handlers = new Map<BoxplotEvent, Set<(v: unknown) => void>>();
  private ro: ResizeObserver;
  private destroyed = false;

  constructor(container: HTMLElement, options: BoxplotOptions = {}) {
    this.opts = { ...options };
    this.root = container;
    container.classList.add('bx-root');
    this.titleEl = document.createElement('div');
    this.titleEl.className = 'bx-title';
    this.bodyEl = document.createElement('div');
    this.plotEl = document.createElement('div');
    this.plotEl.className = 'bx-plot';
    this.canvas = document.createElement('canvas');
    this.canvas.className = 'bx-canvas';
    this.canvas.setAttribute('role', 'img');
    this.ctx = this.canvas.getContext('2d')!;
    this.tooltipEl = document.createElement('div');
    this.tooltipEl.className = 'bx-tooltip';
    this.legendEl = document.createElement('ul');
    this.plotEl.append(this.canvas, this.tooltipEl);
    this.bodyEl.append(this.plotEl, this.legendEl);
    container.append(this.titleEl, this.bodyEl);
    this.list = (options.series ?? []).map((s) => ({ ...s }));
    for (const s of this.list) if (s.hidden) this.hiddenKeys.add(this.keyOf(s));
    this.applyLook();
    this.bind();
    this.ro = new ResizeObserver(() => this.resize());
    this.ro.observe(this.plotEl);
    this.measure();
    this.rebuild(true);
  }

  // ------------------------------------------------------------------ public API

  get series(): BoxplotSeries[] {
    return this.list.map((s) => ({ ...s }));
  }

  /** Replace every series; boxes with the same series key and category move to their new values. */
  setSeries(series: BoxplotSeries[], animate = true): void {
    this.list = series.map((s) => ({ ...s }));
    for (const s of this.list) if (s.hidden) this.hiddenKeys.add(this.keyOf(s));
    this.rebuild(animate);
  }

  /** Change options after creation. */
  setOptions(patch: BoxplotOptions, animate = true): void {
    if (patch.series) this.list = patch.series.map((s) => ({ ...s }));
    this.opts = { ...this.opts, ...patch };
    this.applyLook();
    this.rebuild(animate);
  }

  /** Show / hide a series. */
  toggle(id: string, hidden?: boolean): void {
    const h = hidden ?? !this.hiddenKeys.has(id);
    if (h) this.hiddenKeys.add(id);
    else this.hiddenKeys.delete(id);
    if (this.hover && this.hover.m.key === id) this.hover = null;
    this.emit('toggle', { id, hidden: h });
    this.renderLegend();
    this.draw();
  }

  on(event: 'hover', handler: (info: BoxplotHoverInfo | null) => void): () => void;
  on(event: 'click', handler: (info: BoxplotHoverInfo) => void): () => void;
  on(event: 'toggle', handler: (e: { id: string; hidden: boolean }) => void): () => void;
  on(event: BoxplotEvent, handler: (v: never) => void): () => void {
    if (!this.handlers.has(event)) this.handlers.set(event, new Set());
    const h = handler as (v: unknown) => void;
    this.handlers.get(event)!.add(h);
    return () => this.handlers.get(event)?.delete(h);
  }

  resize(): void {
    this.measure();
    this.layout();
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
    this.root.classList.remove('bx-root');
    this.titleEl.remove();
    this.bodyEl.remove();
  }

  // ------------------------------------------------------------------ model

  private keyOf(s: BoxplotSeries): string {
    return s.id ?? s.name;
  }

  private emit(e: BoxplotEvent, v: unknown): void {
    this.handlers.get(e)?.forEach((h) => h(v));
  }

  private get horizontal(): boolean {
    return this.opts.orient === 'horizontal';
  }

  private applyLook(): void {
    const o = this.opts;
    const base = o.theme === 'light' ? boxplotLightTheme : boxplotDarkTheme;
    const t: BoxplotTheme = { ...base, ...(typeof o.theme === 'object' ? o.theme : {}) };
    if (o.background) t.background = o.background;
    this.theme = t;
    const vars: Record<string, string> = {
      '--bx-bg': t.background,
      '--bx-text': t.text,
      '--bx-muted': t.muted,
      '--bx-tt-bg': t.tooltipBg,
      '--bx-tt-text': t.tooltipText,
      '--bx-tt-border': t.tooltipBorder,
      '--bx-font': t.font,
    };
    for (const [k, v] of Object.entries(vars)) this.root.style.setProperty(k, v);
    const title = typeof o.title === 'string' ? { text: o.title } : o.title;
    this.titleEl.style.display = title ? '' : 'none';
    if (title) {
      this.titleEl.style.textAlign = title.align ?? 'center';
      this.titleEl.innerHTML = `<b>${esc(title.text)}</b>${title.subtext ? `<small>${esc(title.subtext)}</small>` : ''}`;
    }
  }

  /** The items of a series, one per category: `data`, or `samples` as items. */
  private items(s: BoxplotSeries): (BoxplotValue | BoxplotItem | null)[] {
    return s.data ?? (s.samples ?? []).map((v) => (v ? { samples: v } : null));
  }

  /** The numbers of one item (null = no box). */
  private boxOf(it: BoxplotValue | BoxplotItem | null | undefined): { stats: BoxplotBox; samples: number[] } | null {
    if (!it) return null;
    if (Array.isArray(it)) return { stats: { min: it[0], q1: it[1], median: it[2], q3: it[3], max: it[4], outliers: [] }, samples: [] };
    if (it.samples) {
      const s = boxplotStats(it.samples, { whisker: this.opts.whisker });
      if (!s) return null;
      const samples = it.samples.filter((x) => typeof x === 'number' && Number.isFinite(x));
      return { stats: { min: s.low, q1: s.q1, median: s.median, q3: s.q3, max: s.high, mean: it.mean ?? s.mean, count: s.count, outliers: s.outliers }, samples };
    }
    if (it.value) {
      const v = it.value;
      return { stats: { min: v[0], q1: v[1], median: v[2], q3: v[3], max: v[4], mean: it.mean, outliers: it.outliers ?? [] }, samples: [] };
    }
    return null;
  }

  private rebuild(animate: boolean): void {
    const palette = this.opts.colors ?? BOXPLOT_COLORS;
    const old = new Map<string, BoxModel>();
    for (const m of this.models) for (const b of m.boxes) old.set(`${m.key}\u0000${b.cat}`, b);
    const a = this.opts.animation ?? true;
    const on = animate && a !== false;
    // categories: given, or the item names of the first series, or 1, 2, 3…
    const n = Math.max(0, ...this.list.map((s) => this.items(s).length));
    const firstItems = this.list[0] ? this.items(this.list[0]) : [];
    this.categories =
      this.opts.categories ?? Array.from({ length: n }, (_, i) => {
        const it = firstItems[i];
        return it && !Array.isArray(it) && it.name ? it.name : String(i + 1);
      });
    this.models = this.list.map((s, index) => {
      const key = this.keyOf(s);
      const color = s.color ?? palette[index % palette.length];
      const boxes: BoxModel[] = [];
      this.items(s).forEach((it, cat) => {
        if (cat >= this.categories.length) return;
        const box = this.boxOf(it);
        if (!box) return;
        const st = box.stats;
        const t = [st.min, st.q1, st.median, st.q3, st.max, st.mean ?? st.median];
        const prev = old.get(`${key}\u0000${cat}`);
        boxes.push({
          cat,
          name: (it && !Array.isArray(it) && it.name) || this.categories[cat],
          color: (it && !Array.isArray(it) && it.color) || color,
          stats: st,
          t,
          // first draw: the boxes open from the median; later they move from where they were
          from: on ? (prev ? [...prev.v] : t.map(() => st.median)) : null,
          v: [...t],
          samples: box.samples,
          jit: box.samples.map((_, k) => jitterOf(index * 7919 + cat * 104729 + k * 31 + 1)),
          c: 0,
          w: 0,
          pc: 0,
          hits: [],
        });
      });
      return { key, src: s, index, color, boxes };
    });
    if (this.hover) this.hover = null;
    this.animStart = on ? performance.now() : 0;
    this.renderLegend();
    this.layout();
    this.loop();
  }

  private duration(): number {
    const a = this.opts.animation ?? true;
    return a === false ? 0 : typeof a === 'object' ? (a.duration ?? 700) : 700;
  }

  private progress(now: number): number {
    if (!this.animStart) return 1;
    return easeOut(clamp((now - this.animStart) / (this.duration() || 1), 0, 1));
  }

  private loop(): void {
    cancelAnimationFrame(this.raf);
    if (this.destroyed) return;
    const now = performance.now();
    this.draw(now);
    if (this.animStart && now - this.animStart < this.duration()) this.raf = requestAnimationFrame(() => this.loop());
    else {
      this.animStart = 0;
      for (const m of this.models) for (const b of m.boxes) b.from = null;
      this.draw();
    }
  }

  private pointsCfg(m: SModel): BoxplotPointsOptions | null {
    const p = m.src.points ?? this.opts.points;
    return p ? (typeof p === 'object' ? p : {}) : null;
  }

  // ------------------------------------------------------------------ legend

  private legendCfg(): { show: boolean; position: string; interactive: boolean } {
    const l = this.opts.legend;
    const o = typeof l === 'object' ? l : {};
    return { show: (typeof l === 'boolean' ? l : o.show) ?? this.list.length > 1, position: o.position ?? 'top', interactive: o.interactive ?? true };
  }

  private renderLegend(): void {
    const L = this.legendCfg();
    this.bodyEl.className = `bx-body bx-legend-${L.position}`;
    this.legendEl.className = 'bx-legend';
    this.legendEl.style.display = L.show ? '' : 'none';
    if (!L.show) return;
    this.legendEl.innerHTML = this.models
      .map((m) => {
        const hidden = this.hiddenKeys.has(m.key);
        return `<li class="bx-legend__item${L.interactive ? ' is-interactive' : ''}${hidden ? ' is-hidden' : ''}" data-key="${esc(m.key)}"><i class="bx-legend__marker" style="--c:${m.color}"></i><span>${esc(m.src.name)}</span></li>`;
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

  /** Smallest and biggest value of every box (hidden series too, so toggling does not rescale). */
  private extent(): [number, number] {
    let lo = Infinity;
    let hi = -Infinity;
    for (const m of this.models)
      for (const b of m.boxes) {
        for (const v of [b.stats.min, b.stats.max, b.stats.mean ?? b.stats.median, ...b.stats.outliers]) {
          if (!Number.isFinite(v)) continue;
          lo = Math.min(lo, v);
          hi = Math.max(hi, v);
        }
        if (this.pointsCfg(m)) for (const v of b.samples) (lo = Math.min(lo, v)), (hi = Math.max(hi, v));
      }
    return lo <= hi ? [lo, hi] : [0, 1];
  }

  private valueScale(len: number): { lo: number; hi: number; ticks: number[] } {
    const va = this.opts.valueAxis ?? {};
    let [lo, hi] = this.extent();
    if (va.beginAtZero) {
      lo = Math.min(lo, 0);
      hi = Math.max(hi, 0);
    }
    if (va.min !== undefined) lo = va.min;
    if (va.max !== undefined) hi = va.max;
    const count = va.ticks ?? Math.max(2, Math.round(len / (this.horizontal ? 90 : 48)));
    const s = niceScale(lo, hi, count);
    const L = va.min ?? s.min;
    const H = va.max ?? s.max;
    return { lo: L, hi: H, ticks: s.ticks.filter((t) => t >= L - 1e-9 && t <= H + 1e-9) };
  }

  private fmtTick(v: number): string {
    const f = this.opts.valueAxis?.format;
    return f ? f(v) : formatCompact(v);
  }

  private catLabel(i: number): string {
    const f = this.opts.categoryAxis?.format;
    return f ? f(this.categories[i], i) : this.categories[i];
  }

  private layout(): void {
    const o = this.opts;
    const ctx = this.ctx;
    const pad = o.padding ?? 10;
    const ca = o.categoryAxis ?? {};
    const va = o.valueAxis ?? {};
    const fs = 11;
    const nCat = Math.max(1, this.categories.length);
    ctx.font = this.font(fs);
    const catWidths = ca.show === false ? [] : this.categories.map((_, i) => ctx.measureText(this.catLabel(i)).width);
    const catW = Math.max(0, ...catWidths);
    const catTitle = ca.title ? 18 : 0;
    const valTitle = va.title ? 18 : 0;
    const tickW = (ticks: number[]): number => (va.show === false ? 0 : Math.max(0, ...ticks.map((v) => ctx.measureText(this.fmtTick(v)).width)));
    this.catRot = 0;
    this.catStep = 1;
    if (!this.horizontal) {
      const top = pad + 6;
      let h = this.height - top - pad - (ca.show === false ? 0 : fs + 8) - catTitle;
      let sc = this.valueScale(h);
      let left = pad + valTitle + (va.show === false ? 0 : tickW(sc.ticks) + 8);
      const right = pad + 4;
      let w = this.width - left - right;
      let band = w / nCat;
      let rot = ca.rotate ?? (catW + 8 > band ? 40 : 0);
      if (ca.show !== false && rot) {
        // the first rotated label reaches left of its tick
        const extra = Math.cos((rot * Math.PI) / 180) * (catWidths[0] ?? 0) - band / 2 - (left - pad);
        if (extra > 0) {
          left += extra;
          w = this.width - left - right;
          band = w / nCat;
        }
      }
      const a = (rot * Math.PI) / 180;
      const labelH = ca.show === false ? 0 : rot ? Math.min(this.height * 0.35, Math.sin(Math.abs(a)) * catW + Math.cos(a) * fs + 10) : fs + 8;
      h = Math.max(10, this.height - top - pad - labelH - catTitle);
      sc = this.valueScale(h);
      this.catRot = rot;
      // rotated labels overlap when the bands get thinner than a line of text: show one in every few
      this.catStep = rot ? Math.max(1, Math.ceil((fs + 2) / Math.max(1, band))) : 1;
      this.plot = { x: left, y: top, w: Math.max(10, w), h };
      this.scale = sc;
    } else {
      const top = pad + 4;
      const bottom = pad + valTitle + (va.show === false ? 0 : fs + 8);
      const left = pad + catTitle + (ca.show === false ? 0 : catW + 10);
      let right = pad + 4;
      let w = this.width - left - right;
      let sc = this.valueScale(w);
      // the last value label is centered on the edge
      const last = sc.ticks.length ? ctx.measureText(this.fmtTick(sc.ticks[sc.ticks.length - 1])).width : 0;
      right = Math.max(right, pad + last / 2);
      w = Math.max(10, this.width - left - right);
      sc = this.valueScale(w);
      const h = Math.max(10, this.height - top - bottom);
      this.catStep = Math.max(1, Math.ceil((fs + 2) / Math.max(1, h / nCat)));
      this.plot = { x: left, y: top, w, h };
      this.scale = sc;
    }
    this.placeBoxes();
  }

  /** Where each box sits along the category axis. */
  private placeBoxes(): void {
    const o = this.opts;
    const p = this.plot;
    const nCat = Math.max(1, this.categories.length);
    const start = this.horizontal ? p.y : p.x;
    const band = (this.horizontal ? p.h : p.w) / nCat;
    const group = band * clamp(o.bandWidth ?? 0.7, 0.05, 1);
    const slot = group / Math.max(1, this.models.length);
    const [bmin, bmax] = o.boxWidth ?? [7, 50];
    for (const m of this.models) {
      const pc = this.pointsCfg(m);
      for (const b of m.boxes) {
        const center = start + band * (b.cat + 0.5) - group / 2 + slot * (m.index + 0.5);
        if (pc?.position === 'beside' && b.samples.length) {
          // box and point strip side by side, centered together in the slot
          const jit = pc.jitter ?? 0.8;
          b.w = clamp(slot * 0.45, Math.min(bmin, slot * 0.45), bmax);
          const total = b.w * (1 + jit) + 6;
          b.c = center - total / 2 + b.w / 2;
          b.pc = b.c + b.w / 2 + 6 + (b.w * jit) / 2;
        } else {
          b.w = clamp(slot * 0.8, Math.min(bmin, slot * 0.9), bmax);
          b.c = b.pc = center;
        }
      }
    }
  }

  // ------------------------------------------------------------------ drawing

  private font(size: number, weight: number | string = 400): string {
    return `${weight} ${size}px ${this.theme.font}`;
  }

  /** px of a value along the value axis. */
  private vpos(v: number): number {
    const p = this.plot;
    const { lo, hi } = this.scale;
    const k = (v - lo) / (hi - lo || 1);
    return this.horizontal ? p.x + k * p.w : p.y + p.h - k * p.h;
  }

  /** Canvas point of (position along the category axis, value). */
  private xy(c: number, v: number): [number, number] {
    const q = this.vpos(v);
    return this.horizontal ? [q, c] : [c, q];
  }

  private seg(c1: number, v1: number, c2: number, v2: number): void {
    const [x1, y1] = this.xy(c1, v1);
    const [x2, y2] = this.xy(c2, v2);
    this.ctx.moveTo(x1, y1);
    this.ctx.lineTo(x2, y2);
  }

  private draw(now = performance.now()): void {
    const ctx = this.ctx;
    const t = this.theme;
    ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
    ctx.clearRect(0, 0, this.width, this.height);
    if (t.background !== 'transparent') {
      ctx.fillStyle = t.background;
      ctx.fillRect(0, 0, this.width, this.height);
    }
    this.drawGrid();
    const p = this.progress(now);
    for (const m of this.models)
      for (const b of m.boxes) {
        b.v = b.t.map((v, k) => (b.from ? b.from[k] + (v - b.from[k]) * p : v));
        b.hits = [];
      }
    const visible = this.models.filter((m) => !this.hiddenKeys.has(m.key));
    const dim = this.opts.hoverDim ?? 0.4;
    const pa = this.animStart ? p : 1;
    ctx.save();
    ctx.beginPath();
    ctx.rect(this.plot.x - 8, this.plot.y - 8, this.plot.w + 16, this.plot.h + 16);
    ctx.clip();
    for (const m of visible)
      for (const b of m.boxes) {
        const hovered = this.hover?.m === m && this.hover.b === b;
        if (!hovered) this.drawBox(m, b, this.hover && this.hover.m !== m ? dim : 1, false, pa);
      }
    if (this.hover && visible.includes(this.hover.m)) this.drawBox(this.hover.m, this.hover.b, 1, true, pa);
    ctx.restore();
    this.drawAxes();
  }

  private drawGrid(): void {
    const ctx = this.ctx;
    const p = this.plot;
    const t = this.theme;
    const va = this.opts.valueAxis ?? {};
    const ca = this.opts.categoryAxis ?? {};
    ctx.lineWidth = 1;
    ctx.strokeStyle = t.grid;
    if (va.grid ?? va.show !== false) {
      ctx.setLineDash(va.gridDash ?? []);
      ctx.beginPath();
      for (const v of this.scale.ticks) {
        const q = Math.round(this.vpos(v)) + 0.5;
        if (this.horizontal) {
          ctx.moveTo(q, p.y);
          ctx.lineTo(q, p.y + p.h);
        } else {
          ctx.moveTo(p.x, q);
          ctx.lineTo(p.x + p.w, q);
        }
      }
      ctx.stroke();
      ctx.setLineDash([]);
    }
    if (ca.grid) {
      const n = Math.max(1, this.categories.length);
      ctx.beginPath();
      for (let i = 1; i < n; i++) {
        if (this.horizontal) {
          const y = Math.round(p.y + (p.h * i) / n) + 0.5;
          ctx.moveTo(p.x, y);
          ctx.lineTo(p.x + p.w, y);
        } else {
          const x = Math.round(p.x + (p.w * i) / n) + 0.5;
          ctx.moveTo(x, p.y);
          ctx.lineTo(x, p.y + p.h);
        }
      }
      ctx.stroke();
    }
  }

  private drawAxes(): void {
    const ctx = this.ctx;
    const p = this.plot;
    const t = this.theme;
    const o = this.opts;
    const ca = o.categoryAxis ?? {};
    const va = o.valueAxis ?? {};
    const pad = o.padding ?? 10;
    const n = Math.max(1, this.categories.length);
    const fs = 11;
    // category axis line
    if (ca.show !== false) {
      ctx.strokeStyle = t.axis;
      ctx.lineWidth = 1;
      ctx.beginPath();
      if (this.horizontal) {
        ctx.moveTo(Math.round(p.x) + 0.5, p.y);
        ctx.lineTo(Math.round(p.x) + 0.5, p.y + p.h);
      } else {
        ctx.moveTo(p.x, Math.round(p.y + p.h) + 0.5);
        ctx.lineTo(p.x + p.w, Math.round(p.y + p.h) + 0.5);
      }
      ctx.stroke();
    }
    ctx.font = this.font(fs);
    // value labels
    if (va.show !== false) {
      ctx.fillStyle = va.color ?? t.muted;
      if (this.horizontal) {
        ctx.textAlign = 'center';
        ctx.textBaseline = 'top';
        const widths = this.scale.ticks.map((v) => ctx.measureText(this.fmtTick(v)).width);
        const space = this.scale.ticks.length > 1 ? Math.abs(this.vpos(this.scale.ticks[1]) - this.vpos(this.scale.ticks[0])) : p.w;
        const step = Math.max(1, Math.ceil((Math.max(0, ...widths) + 8) / Math.max(1, space)));
        this.scale.ticks.forEach((v, i) => {
          if (i % step) return;
          ctx.fillText(this.fmtTick(v), clamp(this.vpos(v), widths[i] / 2 + 2, this.width - widths[i] / 2 - 2), p.y + p.h + 6);
        });
      } else {
        ctx.textAlign = 'right';
        ctx.textBaseline = 'middle';
        const space = this.scale.ticks.length > 1 ? Math.abs(this.vpos(this.scale.ticks[1]) - this.vpos(this.scale.ticks[0])) : p.h;
        const step = Math.max(1, Math.ceil(13 / Math.max(1, space)));
        this.scale.ticks.forEach((v, i) => {
          if (i % step) return;
          ctx.fillText(this.fmtTick(v), p.x - 6, this.vpos(v));
        });
      }
    }
    // category labels
    if (ca.show !== false) {
      ctx.fillStyle = ca.color ?? t.muted;
      for (let i = 0; i < this.categories.length; i += this.catStep) {
        const label = this.catLabel(i);
        if (this.horizontal) {
          ctx.textAlign = 'right';
          ctx.textBaseline = 'middle';
          ctx.fillText(label, p.x - 8, p.y + (p.h * (i + 0.5)) / n);
        } else {
          const x = p.x + (p.w * (i + 0.5)) / n;
          const y = p.y + p.h + 6;
          if (this.catRot) {
            ctx.save();
            ctx.translate(x, y + 2);
            ctx.rotate((-this.catRot * Math.PI) / 180);
            ctx.textAlign = 'right';
            ctx.textBaseline = 'middle';
            ctx.fillText(label, 0, 0);
            ctx.restore();
          } else {
            ctx.textAlign = 'center';
            ctx.textBaseline = 'top';
            ctx.fillText(label, x, y);
          }
        }
      }
    }
    // axis titles
    ctx.font = this.font(fs, 600);
    ctx.fillStyle = t.muted;
    const bottomTitle = this.horizontal ? va.title : ca.title;
    const sideTitle = this.horizontal ? ca.title : va.title;
    if (bottomTitle) {
      ctx.textAlign = 'center';
      ctx.textBaseline = 'bottom';
      ctx.fillText(bottomTitle, p.x + p.w / 2, this.height - pad);
    }
    if (sideTitle) {
      ctx.save();
      ctx.translate(pad + 7, p.y + p.h / 2);
      ctx.rotate(-Math.PI / 2);
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(sideTitle, 0, 0);
      ctx.restore();
    }
  }

  private drawBox(m: SModel, b: BoxModel, a: number, hovered: boolean, pa: number): void {
    const ctx = this.ctx;
    const s = m.src;
    const [lo, q1, med, q3, hi, mean] = b.v;
    const c = b.c;
    const w = b.w;
    const lw = (s.width ?? 1.5) + (hovered ? 0.8 : 0);
    ctx.globalAlpha = a;
    // raw points under the box
    const pc = this.pointsCfg(m);
    if (pc && b.samples.length) {
      const r = pc.size ?? 2.5;
      const spread = b.w * (pc.jitter ?? 0.8);
      ctx.globalAlpha = a * pa * (pc.opacity ?? 0.55);
      ctx.fillStyle = pc.color ?? b.color;
      b.samples.forEach((v, k) => {
        const [x, y] = this.xy(b.pc + b.jit[k] * spread, v);
        ctx.beginPath();
        ctx.arc(x, y, r, 0, Math.PI * 2);
        ctx.fill();
        b.hits.push({ x, y, r, v, kind: 'point' });
      });
      ctx.globalAlpha = a;
    }
    ctx.strokeStyle = b.color;
    ctx.lineWidth = lw;
    ctx.lineJoin = 'miter';
    // whiskers and their caps
    ctx.beginPath();
    this.seg(c, lo, c, q1);
    this.seg(c, q3, c, hi);
    this.seg(c - w / 4, lo, c + w / 4, lo);
    this.seg(c - w / 4, hi, c + w / 4, hi);
    ctx.stroke();
    // box
    const [x1, y1] = this.xy(c - w / 2, q1);
    const [x2, y2] = this.xy(c + w / 2, q3);
    const rx = Math.min(x1, x2);
    const ry = Math.min(y1, y2);
    const rw = Math.abs(x2 - x1);
    const rh = Math.abs(y2 - y1);
    const f = s.fill ?? 0.2;
    ctx.fillStyle = typeof f === 'string' ? f : alpha(b.color, clamp(f + (hovered ? 0.15 : 0), 0, 1));
    ctx.fillRect(rx, ry, rw, rh);
    if (hovered && typeof f === 'string') {
      // a color fill is lifted with a veil of the series color
      ctx.fillStyle = alpha(b.color, 0.15);
      ctx.fillRect(rx, ry, rw, rh);
    }
    ctx.strokeRect(rx, ry, rw, rh);
    // median
    ctx.lineWidth = lw + 0.8;
    ctx.beginPath();
    this.seg(c - w / 2, med, c + w / 2, med);
    ctx.stroke();
    // mean
    const mc = s.mean ?? this.opts.mean;
    if (mc && b.stats.mean !== undefined) {
      const cfg = typeof mc === 'object' ? mc : {};
      const [x, y] = this.xy(c, mean);
      this.symbol(cfg.symbol ?? 'diamond', x, y, cfg.size ?? Math.max(3, Math.min(5, w / 6)), cfg.color ?? b.color, false, 1.5);
    }
    // outliers
    const oc = s.outliers ?? true;
    if (oc && b.stats.outliers.length) {
      const cfg = typeof oc === 'object' ? oc : {};
      const r = cfg.size ?? 3.5;
      ctx.globalAlpha = a * pa;
      for (const v of b.stats.outliers) {
        const [x, y] = this.xy(c, v);
        const big = hovered && this.hover?.kind === 'outlier' && this.hover.point === v;
        this.symbol(cfg.symbol ?? 'circle', x, y, r + (big ? 1.5 : 0), cfg.color ?? b.color, true, 1.5);
        b.hits.push({ x, y, r, v, kind: 'outlier' });
      }
    }
    ctx.globalAlpha = 1;
  }

  private symbol(sym: BoxplotSymbol, x: number, y: number, r: number, color: string, hollow: boolean, lw: number): void {
    const ctx = this.ctx;
    ctx.beginPath();
    if (sym === 'cross') {
      ctx.moveTo(x - r, y - r);
      ctx.lineTo(x + r, y + r);
      ctx.moveTo(x + r, y - r);
      ctx.lineTo(x - r, y + r);
      ctx.strokeStyle = color;
      ctx.lineWidth = lw;
      ctx.stroke();
      return;
    }
    if (sym === 'square') ctx.rect(x - r, y - r, r * 2, r * 2);
    else if (sym === 'diamond') {
      ctx.moveTo(x, y - r * 1.3);
      ctx.lineTo(x + r, y);
      ctx.lineTo(x, y + r * 1.3);
      ctx.lineTo(x - r, y);
      ctx.closePath();
    } else ctx.arc(x, y, r, 0, Math.PI * 2);
    if (hollow) {
      ctx.fillStyle = alpha(color, 0.25);
      ctx.fill();
      ctx.strokeStyle = color;
      ctx.lineWidth = lw;
      ctx.stroke();
    } else {
      ctx.fillStyle = color;
      ctx.fill();
      ctx.strokeStyle = this.theme.background === 'transparent' ? 'rgba(255,255,255,0.8)' : this.theme.background;
      ctx.lineWidth = 1;
      ctx.stroke();
    }
  }

  private fmt(v: number): string {
    return this.opts.valueFormatter ? this.opts.valueFormatter(v) : v.toLocaleString('pt-PT', { maximumFractionDigits: 2 });
  }

  // ------------------------------------------------------------------ interaction

  private info(h: Hit): BoxplotHoverInfo {
    const st = h.b.stats;
    return {
      series: h.m.src,
      seriesIndex: h.m.index,
      category: this.categories[h.b.cat],
      categoryIndex: h.b.cat,
      name: h.b.name,
      color: h.b.color,
      kind: h.kind,
      value: [st.min, st.q1, st.median, st.q3, st.max],
      stats: st,
      point: h.point,
    };
  }

  /** What is under the mouse: the closest outlier or point, else a box (whiskers included). */
  private hitTest(x: number, y: number): Hit | null {
    const visible = this.models.filter((m) => !this.hiddenKeys.has(m.key));
    let best: Hit | null = null;
    let bestD = Infinity;
    for (const m of visible)
      for (const b of m.boxes)
        for (const q of b.hits) {
          const d = (q.x - x) ** 2 + (q.y - y) ** 2;
          if (d <= (q.r + 3) ** 2 && d < bestD) {
            bestD = d;
            best = { m, b, kind: q.kind, point: q.v };
          }
        }
    if (best) return best;
    const along = this.horizontal ? y : x;
    const val = this.horizontal ? x : y;
    for (const m of visible)
      for (const b of m.boxes) {
        const half = Math.max(b.w / 2, 5);
        const a = this.vpos(b.v[0]);
        const z = this.vpos(b.v[4]);
        if (Math.abs(along - b.c) <= half && val >= Math.min(a, z) - 4 && val <= Math.max(a, z) + 4) return { m, b, kind: 'box' };
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
      const same = h && this.hover && h.m === this.hover.m && h.b === this.hover.b && h.kind === this.hover.kind && h.point === this.hover.point;
      if (!same && (h || this.hover)) {
        this.hover = h;
        this.emit('hover', h ? this.info(h) : null);
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
      if (h) this.emit('click', this.info(h));
    });
    this.legendEl.addEventListener('click', (e) => {
      const li = (e.target as HTMLElement).closest<HTMLElement>('.bx-legend__item');
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
      const row = (k: string, v: string): string => `<div class="bx-tooltip__row"><span>${k}</span><b>${esc(v)}</b></div>`;
      const st = info.stats;
      const sub = info.name !== h.m.src.name ? `<div class="bx-tooltip__sub">${esc(h.m.src.name)}</div>` : '';
      let body: string;
      if (h.kind !== 'box') body = row(h.kind === 'outlier' ? 'Outlier' : 'Valor', this.fmt(info.point!));
      else {
        body =
          row('Máximo', this.fmt(st.max)) +
          row('Q3', this.fmt(st.q3)) +
          row('Mediana', this.fmt(st.median)) +
          row('Q1', this.fmt(st.q1)) +
          row('Mínimo', this.fmt(st.min)) +
          (st.mean !== undefined && (h.m.src.mean ?? this.opts.mean) ? row('Média', this.fmt(st.mean)) : '') +
          (st.count !== undefined ? row('Amostras', st.count.toLocaleString('pt-PT')) : '') +
          (st.outliers.length ? row('Outliers', String(st.outliers.length)) : '');
      }
      el.innerHTML = `<div class="bx-tooltip__head"><i class="bx-tooltip__dot" style="background:${info.color}"></i>${esc(info.name)}</div>${sub}${body}`;
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

export function createBoxplotChart(container: HTMLElement, options: BoxplotOptions = {}): BoxplotChart {
  return new BoxplotChart(container, options);
}
