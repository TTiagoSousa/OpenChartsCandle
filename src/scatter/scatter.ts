import { gradientAt, parseColor, type RGBA } from '../shared/color';
import { formatCompact, niceScale } from '../shared/format';
import { beeswarm, convexHull, regression } from './stats';
import { traceMorph, traceSymbol } from './symbols';
import type {
  ScatterAxisOptions,
  ScatterDatum,
  ScatterEffect,
  ScatterEvent,
  ScatterGraphicApi,
  ScatterLabelOptions,
  ScatterOptions,
  ScatterPoint,
  ScatterPointInfo,
  ScatterRegressionOptions,
  ScatterSeries,
  ScatterSymbol,
  ScatterTheme,
  ScatterValue,
  ScatterVisualMap,
} from './types';

const FONT = '-apple-system, BlinkMacSystemFont, "Trebuchet MS", Roboto, Ubuntu, sans-serif';

export const scatterDarkTheme: ScatterTheme = {
  background: '#131722',
  text: '#d1d4dc',
  muted: '#787b86',
  grid: 'rgba(42, 46, 57, 0.7)',
  axis: '#2a2e39',
  tooltipBg: '#1e222d',
  tooltipText: '#d1d4dc',
  tooltipBorder: '#2a2e39',
  font: FONT,
};

export const scatterLightTheme: ScatterTheme = {
  background: '#ffffff',
  text: '#131722',
  muted: '#787b86',
  grid: 'rgba(42, 46, 57, 0.08)',
  axis: '#e0e3eb',
  tooltipBg: '#ffffff',
  tooltipText: '#131722',
  tooltipBorder: '#e0e3eb',
  font: FONT,
};

export const SCATTER_COLORS = ['#2962ff', '#ff9800', '#089981', '#f23645', '#9c27b0', '#00bcd4', '#e91e63', '#8bc34a', '#ffc107', '#607d8b'];

/** Default colors of a continuous visualMap (low → high). */
export const VISUAL_COLORS = ['#50a3ba', '#eac736', '#d94e5d'];

const esc = (s: string): string => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const easeOutCubic = (t: number): number => 1 - Math.pow(1 - t, 3);
const clamp = (v: number, a: number, b: number): number => Math.min(b, Math.max(a, v));
/** above this many points: fast drawing, no per-point animation */
const LARGE = 4000;
const TAU = Math.PI * 2;

/** What is drawn for a point: position and size in px, shape and color. */
interface Snap {
  x: number;
  y: number;
  w: number;
  h: number;
  sym: ScatterSymbol;
  c: RGBA;
  a: number;
}

interface Item {
  key: string;
  s: SModel;
  i: number;
  vals: ScatterValue[];
  xv: number;
  yv: number;
  y0?: number;
  bw?: number;
  name?: string;
  label?: string;
  data?: unknown;
  color: string;
  size: number;
  symbol: ScatterSymbol;
  opacity: number;
  effect: boolean;
  /** inside the visualMap ranges */
  inRange: boolean;
  /** sideways offset (jitter) px */
  jit: number;
  to: Snap;
  from: Snap | null;
  delay: number;
}

interface NLabels {
  content?: number | ((p: ScatterPointInfo) => string);
  position: 'top' | 'right' | 'bottom' | 'left' | 'inside';
  layout?: 'top' | 'right';
  hideOverlap: boolean;
  color?: string;
  fontSize: number;
  fontWeight: number | string;
}

interface SModel {
  src: ScatterSeries;
  key: string;
  index: number;
  color: string;
  items: Item[];
  hidden: boolean;
  large: boolean;
  labels: NLabels | null;
  effect: Required<ScatterEffect>;
}

interface Axis {
  type: 'value' | 'log' | 'category';
  cats: string[];
  /** domain in axis units (log: exponents; category: index) */
  min: number;
  max: number;
  ticks: number[];
  base: number;
  inverse: boolean;
  gap: boolean;
  opts: ScatterAxisOptions;
}

interface Rect {
  x: number;
  y: number;
  w: number;
  h: number;
}

interface VM {
  o: ScatterVisualMap;
  dim: number;
  min: number;
  max: number;
  range: [number, number];
  /** pieces switched off */
  off: Set<number>;
  el: HTMLElement | null;
  palette: string[];
}

interface PlacedLabel {
  text: string;
  x: number;
  y: number;
  w: number;
  h: number;
  color: string;
  font: string;
  /** leader line from the point */
  line?: [number, number, number, number, number, number];
}

const rgba = (c: RGBA, a = c[3]): string => `rgba(${Math.round(c[0])},${Math.round(c[1])},${Math.round(c[2])},${+a.toFixed(3)})`;

function labelsCfg(v: ScatterSeries['labels']): NLabels | null {
  if (!v || (typeof v === 'object' && v.show === false)) return null;
  const o: ScatterLabelOptions = typeof v === 'object' ? v : {};
  return { position: 'top', hideOverlap: true, fontSize: 11, fontWeight: 500, ...o } as NLabels;
}

/**
 * Scatter and bubble charts: value, log or category axes (or polar), symbols that morph, color /
 * size by value (visualMap with filters), jitter, regressions, marks, ripples, large datasets,
 * zoom & pan, brush selection, tooltip, legend and animated updates.
 */
export class ScatterChart {
  readonly root: HTMLElement;
  readonly canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private bodyEl: HTMLElement;
  private plotEl: HTMLElement;
  private legendEl: HTMLElement;
  private tooltipEl: HTMLElement;
  private titleEl: HTMLElement;
  private opts: ScatterOptions;
  private theme!: ScatterTheme;
  private list: ScatterSeries[] = [];
  private hiddenKeys = new Set<string>();
  private models: SModel[] = [];
  /** points of the visible series */
  private items: Item[] = [];
  /** removed points shrinking away */
  private ghosts: Item[] = [];
  private ax!: Axis;
  private ay!: Axis;
  private viewX: [number, number] | null = null;
  private viewY: [number, number] | null = null;
  private plot: Rect = { x: 0, y: 0, w: 1, h: 1 };
  private width = 0;
  private height = 0;
  private dpr = 1;
  private vms: VM[] = [];
  private hover: Item | null = null;
  private highlighted: string | null = null;
  private selection: Set<Item> | null = null;
  private brushRect: [number, number, number, number] | null = null;
  private labelsCache: PlacedLabel[] = [];
  private grid: Map<number, Item[]> | null = null;
  private animStart = 0;
  private animEnd = 0;
  private raf = 0;
  private handlers = new Map<ScatterEvent, Set<(v: unknown) => void>>();
  private ro: ResizeObserver;
  private colorCache = new Map<string, RGBA>();
  private drag: { x: number; y: number; vx: [number, number] | null; vy: [number, number] | null; mode: 'pan' | 'brush' } | null = null;
  private destroyed = false;

  constructor(container: HTMLElement, options: ScatterOptions = {}) {
    this.opts = { ...options };
    this.root = container;
    container.classList.add('sc-root');
    this.titleEl = document.createElement('div');
    this.titleEl.className = 'sc-title';
    this.bodyEl = document.createElement('div');
    this.bodyEl.className = 'sc-body';
    this.plotEl = document.createElement('div');
    this.plotEl.className = 'sc-plot';
    this.canvas = document.createElement('canvas');
    this.canvas.className = 'sc-canvas';
    this.canvas.setAttribute('role', 'img');
    this.ctx = this.canvas.getContext('2d')!;
    this.tooltipEl = document.createElement('div');
    this.tooltipEl.className = 'sc-tooltip';
    this.legendEl = document.createElement('ul');
    this.legendEl.className = 'sc-legend';
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
    this.rebuild('enter');
  }

  // ------------------------------------------------------------------ public API

  get series(): ScatterSeries[] {
    return this.list.map((s) => ({ ...s }));
  }

  /** Replace every series; points with the same key (id, name or index) move to their new place. */
  setSeries(series: ScatterSeries[], animate = true): void {
    this.list = series.map((s) => ({ ...s }));
    this.hiddenKeys = new Set([...this.hiddenKeys].filter((k) => this.list.some((s) => this.keyOf(s) === k)));
    for (const s of this.list) if (s.hidden) this.hiddenKeys.add(this.keyOf(s));
    this.rebuild(animate ? 'morph' : null);
  }

  /** Change options after creation (animated unless `animate` is false). */
  setOptions(patch: ScatterOptions, animate = true): void {
    if (patch.series) this.list = patch.series.map((s) => ({ ...s }));
    if (patch.visualMap !== undefined) this.vms = [];
    this.opts = { ...this.opts, ...patch };
    this.applyLook();
    this.rebuild(animate ? 'morph' : null);
  }

  /** Add points to a series without animation (streams, progressive loading). */
  appendData(id: string, data: ScatterDatum[]): void {
    const s = this.list.find((x) => this.keyOf(x) === id);
    if (!s) return;
    s.data = s.data.concat(data);
    this.rebuild(null);
  }

  /** Show / hide a series. */
  toggle(id: string, hidden?: boolean): void {
    const h = hidden ?? !this.hiddenKeys.has(id);
    if (h) this.hiddenKeys.add(id);
    else this.hiddenKeys.delete(id);
    this.emit('toggle', { id, hidden: h });
    this.rebuild('morph');
  }

  /** Bring one series forward and fade the others (null clears). */
  highlight(id: string | null): void {
    this.highlighted = id;
    this.renderLegend();
    this.draw();
  }

  /** Keep only the points that pass the filter in full color (null clears the selection). */
  select(filter: ((p: ScatterPointInfo) => boolean) | null): void {
    this.selection = filter ? new Set(this.items.filter((it) => filter(this.info(it)))) : null;
    this.draw();
  }

  /** Range [low, high] of a continuous visualMap (index in `visualMap`). */
  setVisualRange(index: number, range: [number, number]): void {
    const vm = this.vms[index];
    if (!vm) return;
    vm.range = [Math.min(...range), Math.max(...range)];
    this.applyRanges();
    this.renderVisual();
    this.draw();
  }

  /** Visible range of the value axes (data units); omit an axis to keep it. */
  setZoom(z: { x?: [number, number]; y?: [number, number] }): void {
    if (z.x) this.viewX = [this.T(this.ax, z.x[0]), this.T(this.ax, z.x[1])];
    if (z.y) this.viewY = [this.T(this.ay, z.y[0]), this.T(this.ay, z.y[1])];
    this.afterZoom();
  }

  resetZoom(): void {
    this.viewX = this.viewY = null;
    this.afterZoom();
  }

  /** Data → px (relative to the plot element). */
  toPixel(x: number | string, y: number | string): { x: number; y: number } {
    return this.pt(this.num(this.ax, x), this.num(this.ay, y));
  }

  /** px → data. */
  toData(px: number, py: number): { x: number; y: number } {
    const [x0, x1] = this.domX();
    const [y0, y1] = this.domY();
    let tx = (px - this.plot.x) / this.plot.w;
    let ty = (this.plot.y + this.plot.h - py) / this.plot.h;
    if (this.ax.inverse) tx = 1 - tx;
    if (this.ay.inverse) ty = 1 - ty;
    return { x: this.U(this.ax, x0 + tx * (x1 - x0)), y: this.U(this.ay, y0 + ty * (y1 - y0)) };
  }

  on(event: 'hover', handler: (p: ScatterPointInfo | null) => void): () => void;
  on(event: 'click', handler: (p: ScatterPointInfo) => void): () => void;
  on(event: 'toggle', handler: (e: { id: string; hidden: boolean }) => void): () => void;
  on(event: 'brush', handler: (points: ScatterPointInfo[]) => void): () => void;
  on(event: 'zoom', handler: (e: { x: [number, number]; y: [number, number] }) => void): () => void;
  on(event: ScatterEvent, handler: (v: never) => void): () => void {
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
    this.destroyed = true;
    cancelAnimationFrame(this.raf);
    this.ro.disconnect();
    this.root.classList.remove('sc-root');
    this.titleEl.remove();
    this.bodyEl.remove();
  }

  // ------------------------------------------------------------------ model

  private keyOf(s: ScatterSeries): string {
    return s.id ?? s.name;
  }

  private emit(e: ScatterEvent, v: unknown): void {
    this.handlers.get(e)?.forEach((h) => h(v));
  }

  private rgbaOf(c: string): RGBA {
    let v = this.colorCache.get(c);
    if (!v) {
      v = parseColor(c);
      if (this.colorCache.size > 5000) this.colorCache.clear();
      this.colorCache.set(c, v);
    }
    return v;
  }

  private applyLook(): void {
    const o = this.opts;
    const base = o.theme === 'light' ? scatterLightTheme : scatterDarkTheme;
    this.theme = { ...base, ...(typeof o.theme === 'object' ? o.theme : {}) };
    if (o.background !== undefined) this.theme.background = o.background;
    const t = this.theme;
    const vars: Record<string, string> = {
      '--sc-bg': t.background,
      '--sc-text': t.text,
      '--sc-muted': t.muted,
      '--sc-tt-bg': t.tooltipBg,
      '--sc-tt-text': t.tooltipText,
      '--sc-tt-border': t.tooltipBorder,
      '--sc-font': t.font,
    };
    for (const [k, v] of Object.entries(vars)) this.root.style.setProperty(k, v);
    const lg = { position: 'top', align: 'center', ...(o.legend ?? {}) };
    this.bodyEl.className = `sc-body sc-legend-${lg.position}`;
    this.legendEl.className = `sc-legend sc-legend--align-${lg.align}`;
    const title = typeof o.title === 'string' ? { text: o.title } : o.title;
    this.titleEl.style.display = title ? '' : 'none';
    if (title) {
      this.titleEl.style.textAlign = title.align ?? 'center';
      this.titleEl.innerHTML = `<b>${esc(title.text)}</b>${title.subtext ? `<small>${esc(title.subtext)}</small>` : ''}`;
    }
  }

  /** Category list of an axis: given, or in order of appearance. */
  private categories(which: 'x' | 'y'): string[] {
    const ao = (which === 'x' ? this.opts.xAxis : this.opts.yAxis) ?? {};
    if (ao.categories) return ao.categories;
    const seen = new Set<string>();
    for (const s of this.list)
      for (const d of s.data) {
        const v = Array.isArray(d) ? d[which === 'x' ? 0 : 1] : which === 'x' ? d.x : d.y;
        if (typeof v === 'string') seen.add(v);
      }
    return [...seen];
  }

  private axisType(which: 'x' | 'y', cats: string[]): Axis['type'] {
    const ao = (which === 'x' ? this.opts.xAxis : this.opts.yAxis) ?? {};
    return ao.type ?? (cats.length ? 'category' : 'value');
  }

  /** value of the user → number on the axis (category index, or the value) */
  private num(a: Axis, v: ScatterValue | undefined): number {
    if (v === null || v === undefined || v === '') return NaN;
    if (a.type === 'category') {
      if (typeof v === 'number') return v;
      const i = a.cats.indexOf(v);
      return i < 0 ? NaN : i;
    }
    return typeof v === 'number' ? v : parseFloat(v);
  }

  /** axis transform (log) */
  private T(a: Axis, v: number): number {
    return a.type === 'log' ? Math.log(v) / Math.log(a.base) : v;
  }

  private U(a: Axis, t: number): number {
    return a.type === 'log' ? Math.pow(a.base, t) : t;
  }

  private normalize(): void {
    const o = this.opts;
    const palette = o.colors ?? SCATTER_COLORS;
    const cx = this.categories('x');
    const cy = this.categories('y');
    const mk = (which: 'x' | 'y', cats: string[]): Axis => {
      const ao = (which === 'x' ? o.xAxis : o.yAxis) ?? {};
      const type = this.axisType(which, cats);
      return { type, cats, min: 0, max: 1, ticks: [], base: ao.logBase ?? 10, inverse: !!ao.inverse, gap: ao.boundaryGap ?? true, opts: ao };
    };
    this.ax = mk('x', cx);
    this.ay = mk('y', cy);
    this.models = this.list.map((s, index) => {
      const key = this.keyOf(s);
      const m: SModel = {
        src: s,
        key,
        index,
        color: s.color ?? palette[index % palette.length],
        items: [],
        hidden: this.hiddenKeys.has(key),
        large: s.large ?? s.data.length > LARGE,
        labels: labelsCfg(s.labels),
        effect: { period: 3, scale: 2.5, count: 3, type: 'stroke', ...(typeof s.effect === 'object' ? s.effect : {}) },
      };
      const used = new Map<string, number>();
      const defSize = m.large ? 4 : 10;
      // with `effect: true` on some points, only those ripple
      const perPoint = s.data.some((x) => !Array.isArray(x) && x.effect !== undefined);
      m.items = s.data.map((d, i) => {
        const obj: ScatterPoint | null = Array.isArray(d) ? null : d;
        const vals: ScatterValue[] = obj ? [obj.x, obj.y ?? null, ...(obj.values ?? [])] : (d as ScatterValue[]);
        // an own id is a key of the whole chart: the point can move to another series
        let k = obj?.id !== undefined ? `#${obj.id}` : `${key}|${obj?.name ?? i}`;
        const n = used.get(k) ?? 0;
        used.set(k, n + 1);
        if (n) k += `#${n}`;
        const size = obj?.size ?? (typeof s.symbolSize === 'function' ? s.symbolSize(vals, i) : (s.symbolSize ?? defSize));
        const sym = obj?.symbol ?? (typeof s.symbol === 'function' ? s.symbol(vals, i) : (s.symbol ?? 'circle'));
        const it: Item = {
          key: k,
          s: m,
          i,
          vals,
          xv: this.num(this.ax, vals[0]),
          yv: this.num(this.ay, vals[1]),
          y0: obj?.y0,
          bw: obj?.width,
          name: obj?.name,
          label: obj?.label,
          data: obj?.data,
          color: obj?.color ?? m.color,
          size: Math.max(0, size),
          symbol: sym,
          opacity: obj?.opacity ?? s.opacity ?? (m.large ? 0.8 : 0.85),
          effect: perPoint ? !!obj?.effect : !!s.effect,
          inRange: true,
          jit: 0,
          to: { x: 0, y: 0, w: 0, h: 0, sym, c: [0, 0, 0, 1], a: 1 },
          from: null,
          delay: 0,
        };
        if (it.y0 !== undefined) it.symbol = 'rect';
        return it;
      });
      return m;
    });
    this.items = this.models.filter((m) => !m.hidden).flatMap((m) => m.items);
    this.selection = null;
    this.applyVisual();
  }

  // ------------------------------------------------------------------ visual map

  private visualMaps(): ScatterVisualMap[] {
    const v = this.opts.visualMap;
    return !v ? [] : Array.isArray(v) ? v : [v];
  }

  private applyVisual(): void {
    const list = this.visualMaps();
    const old = this.vms;
    this.vms = list.map((o, j) => {
      const targets = this.models.filter((m) => !o.series || o.series.includes(m.index)).flatMap((m) => m.items);
      const dim = o.dimension ?? (targets.some((it) => it.vals.length > 2) ? 2 : 1);
      let lo = Infinity;
      let hi = -Infinity;
      for (const it of targets) {
        const v = this.dimValue(it, dim);
        if (Number.isFinite(v)) {
          if (v < lo) lo = v;
          if (v > hi) hi = v;
        }
      }
      const min = o.min ?? (Number.isFinite(lo) ? lo : 0);
      const max = o.max ?? (Number.isFinite(hi) ? hi : 1);
      const prev = old[j];
      const colors = o.colors ?? (o.sizes || o.opacity ? null : VISUAL_COLORS);
      return {
        o,
        dim,
        min,
        max,
        range: prev && prev.o === o ? prev.range : (o.range ?? [min, max]),
        off: prev && prev.o === o ? prev.off : new Set<number>(),
        el: prev?.el ?? null,
        palette: colors ? Array.from({ length: 64 }, (_, i) => gradientAt(colors, i / 63)) : [],
      };
    });
    for (let j = this.vms.length; j < old.length; j++) old[j].el?.remove();
    for (const vm of this.vms) {
      const o = vm.o;
      const span = vm.max - vm.min || 1;
      for (const m of this.models) {
        if (o.series && !o.series.includes(m.index)) continue;
        for (const it of m.items) {
          const v = this.dimValue(it, vm.dim);
          if (!Number.isFinite(v)) continue;
          const src = m.src.data[it.i];
          const own = !Array.isArray(src) ? src : null;
          if (o.pieces) {
            const p = o.pieces[this.pieceOf(o, v)];
            if (!p) continue;
            if (p.color && !own?.color) it.color = p.color;
            if (p.size !== undefined && own?.size === undefined) it.size = p.size;
            continue;
          }
          const t = clamp((v - vm.min) / span, 0, 1);
          if (vm.palette.length && !own?.color) it.color = vm.palette[Math.round(t * 63)];
          if (o.sizes && own?.size === undefined) it.size = o.sizes[0] + (o.sizes[1] - o.sizes[0]) * t;
          if (o.opacity) it.opacity = o.opacity[0] + (o.opacity[1] - o.opacity[0]) * t;
        }
      }
    }
    this.applyRanges();
    this.renderVisual();
  }

  private dimValue(it: Item, d: number): number {
    if (d === 0) return it.xv;
    if (d === 1) return it.yv;
    const v = it.vals[d];
    return typeof v === 'number' ? v : v === null || v === undefined ? NaN : parseFloat(v);
  }

  private pieceOf(o: ScatterVisualMap, v: number): number {
    return (o.pieces ?? []).findIndex((p) => (p.value !== undefined ? p.value === v : (p.min === undefined || v >= p.min) && (p.max === undefined || v < p.max)));
  }

  private applyRanges(): void {
    for (const it of this.items) it.inRange = true;
    for (const vm of this.vms) {
      const o = vm.o;
      const [lo, hi] = vm.range;
      const full = lo <= vm.min && hi >= vm.max;
      if (!o.pieces && full) continue;
      for (const it of this.items) {
        if (o.series && !o.series.includes(it.s.index)) continue;
        const v = this.dimValue(it, vm.dim);
        if (!Number.isFinite(v)) continue;
        if (o.pieces) {
          if (vm.off.has(this.pieceOf(o, v))) it.inRange = false;
        } else if (v < lo || v > hi) it.inRange = false;
      }
    }
  }

  private renderVisual(): void {
    for (const vm of this.vms) {
      const o = vm.o;
      if (o.show === false) {
        vm.el?.remove();
        vm.el = null;
        continue;
      }
      if (!vm.el) {
        vm.el = document.createElement('div');
        this.plotEl.append(vm.el);
        this.bindVisual(vm);
      }
      const pos = o.position ?? 'right';
      const vert = pos === 'right' || pos === 'left';
      const fmt = o.format ?? ((v: number) => formatCompact(v));
      const el = vm.el;
      if (o.pieces) {
        el.className = `sc-vm sc-vm--pieces sc-vm--${vert ? 'v' : 'h'}`;
        el.innerHTML =
          (o.title ? `<div class="sc-vm__title">${esc(o.title)}</div>` : '') +
          o.pieces
            .map((p, i) => {
              const label = p.label ?? (p.value !== undefined ? fmt(p.value) : p.min === undefined ? `< ${fmt(p.max!)}` : p.max === undefined ? `≥ ${fmt(p.min)}` : `${fmt(p.min)} – ${fmt(p.max)}`);
              const d = p.size ? Math.min(18, Math.max(6, p.size)) : 10;
              return `<button type="button" class="sc-vm__piece${vm.off.has(i) ? ' is-off' : ''}" data-i="${i}"><i style="background:${p.color ?? this.theme.muted};width:${d}px;height:${d}px"></i>${esc(label)}</button>`;
            })
            .join('');
        continue;
      }
      const span = vm.max - vm.min || 1;
      const t0 = clamp((vm.range[0] - vm.min) / span, 0, 1);
      const t1 = clamp((vm.range[1] - vm.min) / span, 0, 1);
      const dir = vert ? 'to top' : 'to right';
      const bar = vm.palette.length
        ? `background:linear-gradient(${dir},${vm.palette.filter((_, i) => i % 9 === 0 || i === 63).join(',')})`
        : `background:${this.theme.muted};clip-path:${vert ? 'polygon(35% 100%, 65% 100%, 100% 0, 0 0)' : 'polygon(0 35%, 0 65%, 100% 100%, 100% 0)'}`;
      el.className = `sc-vm sc-vm--${vert ? 'v' : 'h'}${o.interactive === false ? '' : ' is-interactive'}`;
      const at = (t: number): string => (vert ? `bottom:${t * 100}%` : `left:${t * 100}%`);
      el.innerHTML = `
        ${o.title ? `<div class="sc-vm__title">${esc(o.title)}</div>` : ''}
        <div class="sc-vm__end">${esc(fmt(vert ? vm.max : vm.min))}</div>
        <div class="sc-vm__track">
          <div class="sc-vm__bar" style="${bar}"></div>
          <div class="sc-vm__mask" style="${vert ? `bottom:0;height:${t0 * 100}%` : `left:0;width:${t0 * 100}%`}"></div>
          <div class="sc-vm__mask" style="${vert ? `top:0;height:${(1 - t1) * 100}%` : `right:0;width:${(1 - t1) * 100}%`}"></div>
          ${o.interactive === false ? '' : `<div class="sc-vm__handle" data-h="0" style="${at(t0)}">${t0 > 0.001 ? `<span>${esc(fmt(vm.range[0]))}</span>` : ''}</div><div class="sc-vm__handle" data-h="1" style="${at(t1)}">${t1 < 0.999 ? `<span>${esc(fmt(vm.range[1]))}</span>` : ''}</div>`}
        </div>
        <div class="sc-vm__end">${esc(fmt(vert ? vm.min : vm.max))}</div>`;
    }
    this.placeVisual();
  }

  private bindVisual(vm: VM): void {
    const el = vm.el!;
    el.addEventListener('click', (e) => {
      const b = (e.target as HTMLElement).closest<HTMLElement>('.sc-vm__piece');
      if (!b || vm.o.interactive === false) return;
      const i = Number(b.dataset.i);
      if (vm.off.has(i)) vm.off.delete(i);
      else vm.off.add(i);
      this.applyRanges();
      this.renderVisual();
      this.draw();
    });
    el.addEventListener('pointerdown', (e) => {
      if (vm.o.pieces || vm.o.interactive === false) return;
      const track = el.querySelector<HTMLElement>('.sc-vm__track');
      if (!track) return;
      const vert = (vm.o.position ?? 'right') === 'right' || vm.o.position === 'left';
      const valueAt = (ev: PointerEvent): number => {
        const r = track.getBoundingClientRect();
        const t = vert ? 1 - (ev.clientY - r.top) / r.height : (ev.clientX - r.left) / r.width;
        return vm.min + clamp(t, 0, 1) * (vm.max - vm.min);
      };
      const h = (e.target as HTMLElement).closest<HTMLElement>('.sc-vm__handle');
      const v0 = valueAt(e);
      // a handle moves its end; the bar moves the nearest end
      let which = h ? Number(h.dataset.h) : Math.abs(v0 - vm.range[0]) < Math.abs(v0 - vm.range[1]) ? 0 : 1;
      if (!h && !(e.target as HTMLElement).closest('.sc-vm__track')) return;
      e.preventDefault();
      el.setPointerCapture(e.pointerId);
      const move = (ev: PointerEvent): void => {
        const v = valueAt(ev);
        const r: [number, number] = [...vm.range];
        r[which] = v;
        if (r[0] > r[1]) {
          r.reverse();
          which = 1 - which;
        }
        vm.range = r;
        this.applyRanges();
        this.renderVisual();
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

  /** room taken by the visualMap controls on each side */
  private visualRoom(): { right: number; left: number; bottom: number; top: number } {
    const r = { right: 0, left: 0, bottom: 0, top: 0 };
    for (const vm of this.vms) {
      if (vm.o.show === false) continue;
      const pos = vm.o.position ?? 'right';
      const vert = pos === 'right' || pos === 'left';
      const w = vert ? (vm.o.pieces ? 96 : 66) : vm.o.pieces ? 30 : 48;
      r[pos] = Math.max(r[pos], w);
    }
    return r;
  }

  private placeVisual(): void {
    const groups: Record<string, VM[]> = {};
    for (const vm of this.vms) if (vm.el) (groups[vm.o.position ?? 'right'] ??= []).push(vm);
    const p = this.plot;
    for (const [pos, list] of Object.entries(groups)) {
      const vert = pos === 'right' || pos === 'left';
      list.forEach((vm, i) => {
        const s = vm.el!.style;
        if (vert) {
          const h = (p.h - (list.length - 1) * 12) / list.length;
          const pad = this.opts.padding ?? 8;
          s.left = pos === 'right' ? `${this.width - pad - (vm.o.pieces ? 92 : 58)}px` : `${pad}px`;
          s.top = `${p.y + i * (h + 12)}px`;
          s.height = `${vm.o.pieces ? 'auto' : `${Math.max(60, h)}px`}`;
          s.width = '';
        } else {
          const w = Math.min(p.w, 420);
          const pad = this.opts.padding ?? 8;
          s.left = `${p.x + (p.w - w) / 2}px`;
          s.width = `${w}px`;
          s.top = pos === 'bottom' ? `${this.height - pad - (vm.o.pieces ? 26 : 40) - i * 44}px` : `${pad + i * 44}px`;
          s.height = '';
        }
      });
    }
  }

  // ------------------------------------------------------------------ build & animate

  private duration(): number {
    const a = this.opts.animation ?? true;
    return a === false ? 0 : typeof a === 'object' ? (a.duration ?? 700) : 700;
  }

  private rebuild(mode: 'enter' | 'morph' | null): void {
    const now = performance.now();
    const prev = new Map<string, Snap>();
    if (mode === 'morph') for (const it of this.items) prev.set(it.key, this.current(it, now));
    const old = this.items;
    this.normalize();
    this.layout();
    this.ghosts = [];
    const total = this.items.length;
    const dur = this.duration();
    const animate = mode !== null && dur > 0 && total <= LARGE * 1.5 && this.width > 1;
    for (const it of this.items) {
      it.delay = 0;
      it.from = null;
      if (!animate) continue;
      const p = prev.get(it.key);
      it.from = p ?? { ...it.to, w: 0, h: 0 };
    }
    if (animate) {
      if (mode === 'enter') {
        const a = this.opts.animation;
        const d = typeof a === 'object' ? a.delay : undefined;
        const xs = this.items.map((it) => it.to.x);
        const x0 = Math.min(...xs);
        const span = Math.max(...xs) - x0 || 1;
        this.items.forEach((it, i) => {
          it.delay = typeof d === 'function' ? d(i) : typeof d === 'number' ? d * i : d === 'x' ? ((it.to.x - x0) / span) * 500 : 0;
        });
      }
      const keys = new Set(this.items.map((it) => it.key));
      for (const it of old) {
        const from = prev.get(it.key);
        if (keys.has(it.key) || !from) continue;
        this.ghosts.push({ ...it, from, to: { ...from, w: 0, h: 0, a: 0 }, delay: 0 });
      }
      this.animStart = now;
      this.animEnd = now + dur + Math.max(0, ...this.items.map((it) => it.delay));
    } else this.animEnd = 0;
    this.hover = null;
    this.hideTooltip();
    this.renderLegend();
    this.loop();
  }

  private progress(it: Item, now: number): number {
    if (!it.from) return 1;
    const k = (now - this.animStart - it.delay) / this.duration();
    return k >= 1 ? 1 : k <= 0 ? 0 : easeOutCubic(k);
  }

  private current(it: Item, now: number): Snap {
    const t = this.progress(it, now);
    if (t >= 1 || !it.from) return it.to;
    const f = it.from;
    const to = it.to;
    const l = (a: number, b: number): number => a + (b - a) * t;
    return {
      x: l(f.x, to.x),
      y: l(f.y, to.y),
      w: l(f.w, to.w),
      h: l(f.h, to.h),
      sym: t < 0.5 ? f.sym : to.sym,
      c: [l(f.c[0], to.c[0]), l(f.c[1], to.c[1]), l(f.c[2], to.c[2]), l(f.c[3], to.c[3])],
      a: l(f.a, to.a),
    };
  }

  private hasEffects(): boolean {
    return this.items.some((it) => it.effect);
  }

  private loop(): void {
    cancelAnimationFrame(this.raf);
    if (this.destroyed) return;
    this.draw();
    if (performance.now() < this.animEnd || this.hasEffects()) this.raf = requestAnimationFrame(() => this.loop());
    else {
      this.ghosts = [];
      for (const it of this.items) it.from = null;
    }
  }

  // ------------------------------------------------------------------ layout & scales

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

  private resize(): void {
    this.measure();
    this.layout();
    this.draw();
  }

  private get polarCfg(): { start: number; cw: boolean; inner: number } | null {
    const p = this.opts.polar;
    if (!p) return null;
    const o = typeof p === 'object' ? p : {};
    return { start: ((o.startAngle ?? 90) * Math.PI) / 180, cw: o.clockwise ?? true, inner: clamp(o.innerRadius ?? 0, 0, 0.9) };
  }

  private domX(): [number, number] {
    return this.viewX ?? [this.ax.min, this.ax.max];
  }

  private domY(): [number, number] {
    return this.viewY ?? [this.ay.min, this.ay.max];
  }

  /** Domain and ticks of an axis from the visible points. */
  private scale(a: Axis, which: 'x' | 'y', px: number): void {
    const ao = a.opts;
    if (a.type === 'category') {
      const n = Math.max(1, a.cats.length);
      const polarAngle = which === 'x' && this.polarCfg;
      a.min = polarAngle ? 0 : a.gap ? -0.5 : 0;
      a.max = polarAngle ? n : a.gap ? n - 0.5 : Math.max(1, n - 1);
      a.ticks = a.cats.map((_, i) => i);
      return;
    }
    let lo = Infinity;
    let hi = -Infinity;
    const add = (v: number | undefined): void => {
      if (v === undefined || !Number.isFinite(v) || (a.type === 'log' && v <= 0)) return;
      const t = this.T(a, v);
      if (t < lo) lo = t;
      if (t > hi) hi = t;
    };
    for (const it of this.items) {
      if (which === 'x') add(it.xv);
      else {
        add(it.yv);
        add(it.y0);
      }
    }
    if (!Number.isFinite(lo)) [lo, hi] = a.type === 'log' ? [0, 1] : [0, 1];
    if (a.type === 'log') {
      a.min = typeof ao.min === 'number' ? this.T(a, ao.min) : Math.floor(lo);
      a.max = typeof ao.max === 'number' ? this.T(a, ao.max) : Math.ceil(hi);
      if (a.max <= a.min) a.max = a.min + 1;
      a.ticks = [];
      for (let e = Math.ceil(a.min); e <= Math.floor(a.max); e++) a.ticks.push(e);
      if (a.ticks.length < 3) {
        const extra = [2, 5].map((m) => Math.log(m) / Math.log(a.base));
        a.ticks = a.ticks.flatMap((e) => [e, ...extra.map((x) => e + x)]).filter((t) => t >= a.min && t <= a.max);
      }
      return;
    }
    if (ao.beginAtZero) {
      lo = Math.min(lo, 0);
      hi = Math.max(hi, 0);
    }
    const count = ao.ticks ?? Math.max(2, Math.round(px / (which === 'x' ? 90 : 48)));
    const nice = niceScale(lo, hi, count);
    a.min = typeof ao.min === 'number' ? ao.min : ao.min === 'dataMin' ? lo : nice.min;
    a.max = typeof ao.max === 'number' ? ao.max : ao.max === 'dataMax' ? hi : nice.max;
    if (a.max <= a.min) a.max = a.min + 1;
    a.ticks = this.ticksOf(a, [a.min, a.max], count);
  }

  private ticksOf(a: Axis, [lo, hi]: [number, number], count: number): number[] {
    if (a.type === 'category') return a.ticks;
    if (a.type === 'log') return a.ticks.filter((t) => t >= lo - 1e-9 && t <= hi + 1e-9);
    return niceScale(lo, hi, count).ticks.filter((t) => t >= lo - 1e-9 && t <= hi + 1e-9);
  }

  private fmtTick(a: Axis, t: number): string {
    if (a.type === 'category') {
      const c = a.cats[Math.round(t)] ?? '';
      return a.opts.format ? a.opts.format(Math.round(t), c) : c;
    }
    const v = this.U(a, t);
    return a.opts.format ? a.opts.format(v) : formatCompact(a.type === 'log' ? +v.toPrecision(6) : v);
  }

  private font(size = 11, weight: number | string = 400): string {
    return `${weight} ${size}px ${this.theme.font}`;
  }

  private layout(): void {
    const o = this.opts;
    const pad = o.padding ?? 8;
    const polar = this.polarCfg;
    const room = this.visualRoom();
    const labelRoom = { top: 0, right: 0 };
    for (const m of this.models) {
      if (m.hidden || !m.labels?.layout) continue;
      if (m.labels.layout === 'top') labelRoom.top = 30;
      else {
        this.ctx.font = this.font(m.labels.fontSize, m.labels.fontWeight);
        const w = Math.max(0, ...m.items.map((it) => this.ctx.measureText(this.labelText(it, m.labels!)).width));
        labelRoom.right = Math.max(labelRoom.right, Math.min(160, w + 26));
      }
    }
    const W = this.width;
    const H = this.height;
    const xo = this.ax.opts;
    const yo = this.ay.opts;
    const xShow = xo.show !== false && !polar;
    const yShow = yo.show !== false && !polar;
    // first pass with rough lengths, then measure the labels
    this.scale(this.ax, 'x', W - 80);
    this.scale(this.ay, 'y', H - 50);
    this.ctx.font = this.font(11);
    const yTicks = this.ticksOf(this.ay, this.domY(), 5);
    const yLabelW = yShow ? Math.max(0, ...yTicks.map((t) => this.ctx.measureText(this.fmtTick(this.ay, t)).width)) + 10 + (yo.title ? 18 : 0) : 0;
    const rot = ((xo.rotate ?? 0) * Math.PI) / 180;
    const xLabelW = xShow && rot ? Math.max(0, ...this.ax.ticks.map((t) => this.ctx.measureText(this.fmtTick(this.ax, t)).width)) : 0;
    const xLabelH = xShow ? 20 + Math.abs(Math.sin(rot)) * xLabelW + (xo.title ? 18 : 0) : 0;
    let left = pad + room.left + (yo.opposite ? 6 : yLabelW);
    let right = pad + room.right + labelRoom.right + (yo.opposite ? yLabelW : 10);
    let top = pad + room.top + labelRoom.top + (xo.opposite ? xLabelH : 6);
    let bottom = pad + room.bottom + (xo.opposite ? 6 : xLabelH);
    if (!xShow && !yShow && !polar) {
      // no axes: a little room so the symbols at the edges are not cut
      const edge = Math.min(14, Math.max(4, ...this.items.slice(0, 2000).map((it) => it.size / 2 + 1)));
      left = pad + room.left + edge;
      right = pad + room.right + labelRoom.right + edge;
      top = Math.max(top, pad + room.top + labelRoom.top + edge);
      bottom = pad + room.bottom + edge;
    }
    this.plot = { x: left, y: top, w: Math.max(10, W - left - right), h: Math.max(10, H - top - bottom) };
    if (polar) {
      const m = 22;
      this.plot = { x: left + m, y: top + m, w: Math.max(10, W - left - right - 2 * m), h: Math.max(10, H - top - bottom - 2 * m) };
    }
    this.scale(this.ax, 'x', this.plot.w);
    this.scale(this.ay, 'y', this.plot.h);
    // same px per unit on both axes
    if (o.aspect && !polar && this.ax.type === 'value' && this.ay.type === 'value') {
      const k = typeof o.aspect === 'number' ? o.aspect : 1;
      const [x0, x1] = this.domX();
      const [y0, y1] = this.domY();
      const sx = this.plot.w / (x1 - x0);
      const sy = this.plot.h / (y1 - y0) / k;
      const s = Math.min(sx, sy);
      const w = s * (x1 - x0);
      const h = s * k * (y1 - y0);
      this.plot = { x: this.plot.x + (this.plot.w - w) / 2, y: this.plot.y + (this.plot.h - h) / 2, w, h };
    }
    this.layoutItems();
    this.placeVisual();
  }

  /** x, y (axis numbers) → px */
  private pt(xv: number, yv: number): { x: number; y: number } {
    const [x0, x1] = this.domX();
    const [y0, y1] = this.domY();
    let tx = (this.T(this.ax, xv) - x0) / (x1 - x0 || 1);
    let ty = (this.T(this.ay, yv) - y0) / (y1 - y0 || 1);
    if (this.ax.inverse) tx = 1 - tx;
    if (this.ay.inverse) ty = 1 - ty;
    const p = this.plot;
    const pc = this.polarCfg;
    if (pc) {
      const { cx, cy, R } = this.polarGeom();
      const r = R * (pc.inner + (1 - pc.inner) * ty);
      const a = pc.start + (pc.cw ? -1 : 1) * tx * TAU;
      return { x: cx + r * Math.cos(a), y: cy - r * Math.sin(a) };
    }
    return { x: p.x + tx * p.w, y: p.y + p.h - ty * p.h };
  }

  private polarGeom(): { cx: number; cy: number; R: number } {
    const p = this.plot;
    return { cx: p.x + p.w / 2, cy: p.y + p.h / 2, R: Math.min(p.w, p.h) / 2 };
  }

  /** px size of one category band on an axis */
  private band(a: Axis, len: number): number {
    const [d0, d1] = a === this.ax ? this.domX() : this.domY();
    return len / Math.max(1e-9, d1 - d0);
  }

  private layoutItems(): void {
    const p = this.plot;
    const polar = !!this.polarCfg;
    for (const it of this.items) {
      const c = this.rgbaOf(it.color);
      let { x, y } = this.pt(it.xv, it.yv);
      let w = it.size;
      let h = it.size;
      if (it.y0 !== undefined && !polar) {
        const y0 = this.pt(it.xv, it.y0).y;
        h = Math.abs(y0 - y);
        y = (y + y0) / 2;
        const bw = it.bw ?? it.s.src.barWidth ?? '50%';
        const bandPx = this.ax.type === 'category' ? this.band(this.ax, p.w) : p.w / 12;
        w = typeof bw === 'number' ? bw : (bandPx * parseFloat(bw)) / 100;
      }
      if (!Number.isFinite(x) || !Number.isFinite(y)) {
        x = y = NaN;
      }
      it.to = { x, y, w, h, sym: it.symbol, c: [c[0], c[1], c[2], 1], a: it.opacity * c[3] };
    }
    this.jitter();
    this.grid = null;
    this.layoutLabels();
  }

  /** spread the points of each category (beeswarm or random) */
  private jitter(): void {
    for (const [a, which] of [[this.ax, 'x'], [this.ay, 'y']] as const) {
      const J = a.opts.jitter;
      if (!J || a.type !== 'category' || this.polarCfg) continue;
      const groups = new Map<number, Item[]>();
      for (const it of this.items) {
        const k = which === 'x' ? it.xv : it.yv;
        if (!Number.isFinite(k)) continue;
        let g = groups.get(k);
        if (!g) groups.set(k, (g = []));
        g.push(it);
      }
      for (const g of groups.values()) {
        let offs: number[];
        if (a.opts.jitterOverlap) {
          offs = g.map((it) => {
            let hsh = 0;
            for (let i = 0; i < it.key.length; i++) hsh = (hsh * 31 + it.key.charCodeAt(i)) | 0;
            return ((((hsh >>> 0) % 1000) / 1000) - 0.5) * J;
          });
        } else
          offs = beeswarm(
            g.map((it) => (which === 'x' ? it.to.y : it.to.x)),
            g.map((it) => it.size / 2),
            J / 2,
          );
        g.forEach((it, i) => {
          it.jit = offs[i];
          if (which === 'x') it.to.x += offs[i];
          else it.to.y += offs[i];
        });
      }
    }
  }

  // ------------------------------------------------------------------ labels

  private fmtVal(v: ScatterValue, d: number): string {
    if (v === null || v === undefined) return '–';
    if (typeof v === 'string') return v;
    if (d === 0 && this.ax.type === 'category') return this.ax.cats[v] ?? String(v);
    if (d === 1 && this.ay.type === 'category') return this.ay.cats[v] ?? String(v);
    if (this.opts.valueFormatter) return this.opts.valueFormatter(v, d);
    return v.toLocaleString('pt-PT', { maximumFractionDigits: Math.abs(v) >= 100 ? 1 : 2 });
  }

  private labelText(it: Item, l: NLabels): string {
    if (typeof l.content === 'function') return l.content(this.info(it));
    if (typeof l.content === 'number') return this.fmtVal(it.vals[l.content] ?? null, l.content);
    return it.label ?? it.name ?? '';
  }

  private layoutLabels(): void {
    const out: PlacedLabel[] = [];
    const p = this.plot;
    const boxes: Rect[] = [];
    const free = (r: Rect): boolean => !boxes.some((b) => r.x < b.x + b.w && r.x + r.w > b.x && r.y < b.y + b.h && r.y + r.h > b.y);
    type Edge = { it: Item; text: string; w: number; h: number; color: string; font: string };
    // labels lined up on an edge, from every series together
    const edge: Record<'top' | 'right', Edge[]> = { top: [], right: [] };
    for (const m of this.models) {
      const l = m.labels;
      if (m.hidden || !l) continue;
      const font = this.font(l.fontSize, l.fontWeight);
      this.ctx.font = font;
      const h = l.fontSize + 4;
      const list = m.items
        .filter((it) => Number.isFinite(it.to.x))
        .map((it) => ({ it, text: this.labelText(it, l) }))
        .filter((x) => x.text)
        .map((x) => ({ ...x, w: this.ctx.measureText(x.text).width + 4 }));
      const color = (it: Item): string => l.color ?? (l.position === 'inside' ? '#fff' : it.color);
      if (l.layout) {
        for (const x of list) edge[l.layout].push({ ...x, h, color: color(x.it), font });
        continue;
      }
      const sorted = l.hideOverlap ? [...list].sort((a, b) => b.it.size - a.it.size) : list;
      for (const x of sorted) {
        const s = x.it.to;
        const g = 3;
        const [lx, ly] =
          l.position === 'inside'
            ? [s.x, s.y]
            : l.position === 'right'
              ? [s.x + s.w / 2 + g + x.w / 2, s.y]
              : l.position === 'left'
                ? [s.x - s.w / 2 - g - x.w / 2, s.y]
                : l.position === 'bottom'
                  ? [s.x, s.y + s.h / 2 + g + h / 2]
                  : [s.x, s.y - s.h / 2 - g - h / 2];
        const r = { x: lx - x.w / 2, y: ly - h / 2, w: x.w, h };
        if (l.hideOverlap && !free(r)) continue;
        boxes.push(r);
        out.push({ text: x.text, x: lx, y: ly, w: x.w, h, color: color(x.it), font });
      }
    }
    for (const side of ['top', 'right'] as const) {
      const list = edge[side];
      if (!list.length) continue;
      // a row on top / a column on the right, moved apart, with lines to the points
      const top = side === 'top';
      const lo = top ? p.x : p.y;
      const hi = top ? p.x + p.w : p.y + p.h;
      const size = (x: Edge): number => (top ? x.w + 6 : x.h + 1);
      const chosen = [...list].sort((a, b) => b.it.size - a.it.size);
      let need = chosen.reduce((acc, x) => acc + size(x), 0);
      while (chosen.length && need > hi - lo) need -= size(chosen.pop()!);
      chosen.sort((a, b) => (top ? a.it.to.x - b.it.to.x : a.it.to.y - b.it.to.y));
      const pos = chosen.map((x) => (top ? x.it.to.x : x.it.to.y) - size(x) / 2);
      for (let i = 0; i < pos.length; i++) pos[i] = Math.max(pos[i], i ? pos[i - 1] + size(chosen[i - 1]) : lo);
      for (let i = pos.length - 1; i >= 0; i--) pos[i] = Math.min(pos[i], i < pos.length - 1 ? pos[i + 1] - size(chosen[i]) : hi - size(chosen[i]));
      chosen.forEach((x, i) => {
        const s = x.it.to;
        const c = pos[i] + size(x) / 2;
        if (top) {
          const ly = p.y - 16;
          out.push({ text: x.text, x: c, y: ly, w: x.w, h: x.h, color: x.color, font: x.font, line: [s.x, s.y - s.h / 2 - 2, c, ly + x.h / 2 + 6, c, ly + x.h / 2 + 1] });
        } else {
          const lx = p.x + p.w + 16 + x.w / 2;
          out.push({ text: x.text, x: lx, y: c, w: x.w, h: x.h, color: x.color, font: x.font, line: [s.x + s.w / 2 + 2, s.y, p.x + p.w + 6, c, p.x + p.w + 13, c] });
        }
      });
    }
    this.labelsCache = out;
  }

  // ------------------------------------------------------------------ drawing

  private api(): ScatterGraphicApi {
    return {
      plot: { ...this.plot },
      width: this.width,
      height: this.height,
      theme: this.theme,
      x: (v) => this.pt(this.num(this.ax, v), this.ay.type === 'category' ? 0 : this.U(this.ay, this.domY()[0])).x,
      y: (v) => this.pt(this.ax.type === 'category' ? 0 : this.U(this.ax, this.domX()[0]), this.num(this.ay, v)).y,
      point: (x, y) => this.pt(this.num(this.ax, x), this.num(this.ay, y)),
      toData: (px, py) => this.toData(px, py),
    };
  }

  private draw(): void {
    if (this.destroyed) return;
    const ctx = this.ctx;
    const t = this.theme;
    ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
    ctx.clearRect(0, 0, this.width, this.height);
    if (t.background !== 'transparent') {
      ctx.fillStyle = t.background;
      ctx.fillRect(0, 0, this.width, this.height);
    }
    const now = performance.now();
    if (this.polarCfg) this.drawPolarGrid();
    else this.drawGrid();
    if (this.opts.underlay) {
      ctx.save();
      this.opts.underlay(ctx, this.api());
      ctx.restore();
    }
    if (!this.items.length && !this.ghosts.length) {
      ctx.fillStyle = t.muted;
      ctx.font = this.font(13);
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(this.opts.emptyText ?? 'Sem dados', this.width / 2, this.height / 2);
    }
    const zoomed = !!(this.viewX || this.viewY);
    ctx.save();
    if (zoomed) {
      ctx.beginPath();
      ctx.rect(this.plot.x, this.plot.y, this.plot.w, this.plot.h);
      ctx.clip();
    }
    for (const m of this.models) {
      if (m.hidden) continue;
      const dim = this.seriesAlpha(m);
      this.drawMarkArea(m, dim);
      this.drawHull(m, dim);
      this.drawLine(m, dim);
    }
    for (const m of this.models) {
      if (m.hidden) continue;
      if (m.large && !this.animating(now)) this.drawLarge(m);
      else this.drawItems(m, now);
    }
    this.drawGhosts(now);
    for (const m of this.models) {
      if (m.hidden) continue;
      const dim = this.seriesAlpha(m);
      this.drawRegression(m, dim);
      this.drawMarks(m, dim);
    }
    ctx.restore();
    if (!this.animating(now)) this.drawLabels();
    if (!this.polarCfg) this.drawAxes();
    if (this.opts.graphic) {
      ctx.save();
      this.opts.graphic(ctx, this.api());
      ctx.restore();
    }
    this.drawHover();
    if (this.brushRect) {
      const [x0, y0, x1, y1] = this.brushRect;
      ctx.fillStyle = 'rgba(41, 98, 255, 0.12)';
      ctx.strokeStyle = 'rgba(41, 98, 255, 0.8)';
      ctx.lineWidth = 1;
      ctx.fillRect(Math.min(x0, x1), Math.min(y0, y1), Math.abs(x1 - x0), Math.abs(y1 - y0));
      ctx.strokeRect(Math.min(x0, x1) + 0.5, Math.min(y0, y1) + 0.5, Math.abs(x1 - x0), Math.abs(y1 - y0));
    }
  }

  private animating(now: number): boolean {
    return now < this.animEnd;
  }

  private seriesAlpha(m: SModel): number {
    return this.highlighted && this.highlighted !== m.key ? (this.opts.hoverDim ?? 0.15) : 1;
  }

  /** opacity multiplier of a point: highlight, selection, visualMap range */
  private alphaOf(it: Item, base: number): number {
    let a = base;
    if (!it.inRange) a *= 0.1;
    if (this.selection && !this.selection.has(it)) a *= 0.12;
    return a;
  }

  private hidden(it: Item): boolean {
    return !it.inRange && this.vms.some((vm) => vm.o.outOfRange === 'hide');
  }

  private drawItems(m: SModel, now: number): void {
    const ctx = this.ctx;
    const s = m.src;
    const dim = this.seriesAlpha(m);
    const shadow = s.shadow ? { color: 'rgba(0,0,0,0.35)', blur: 10, offsetY: 3, ...(typeof s.shadow === 'object' ? s.shadow : {}) } : null;
    ctx.globalCompositeOperation = s.blend === 'lighter' ? 'lighter' : 'source-over';
    const time = now / 1000;
    for (const it of m.items) {
      if (this.hidden(it)) continue;
      const k = this.progress(it, now);
      const snap = k >= 1 ? it.to : this.current(it, now);
      if (!(snap.w > 0.2 || snap.h > 0.2) || !Number.isFinite(snap.x)) continue;
      const alpha = this.alphaOf(it, snap.a * dim);
      if (it.effect && k >= 1) this.drawRipple(it, snap, m.effect, time, alpha);
      ctx.globalAlpha = alpha;
      ctx.beginPath();
      if (k < 1 && it.from && (it.from.sym !== it.to.sym || it.from.w !== it.from.h || it.to.w !== it.to.h))
        traceMorph(ctx, it.from.sym, it.from.x, it.from.y, it.from.w, it.from.h, it.to.sym, it.to.x, it.to.y, it.to.w, it.to.h, k);
      else traceSymbol(ctx, snap.sym, snap.x, snap.y, snap.w, snap.h);
      if (s.gradient) {
        const r = Math.max(snap.w, snap.h) / 2;
        const g = ctx.createRadialGradient(snap.x - r * 0.35, snap.y - r * 0.35, r * 0.05, snap.x, snap.y, r);
        g.addColorStop(0, rgba([Math.min(255, snap.c[0] + 110), Math.min(255, snap.c[1] + 110), Math.min(255, snap.c[2] + 110), 1]));
        g.addColorStop(1, rgba(snap.c, 1));
        ctx.fillStyle = g;
      } else ctx.fillStyle = rgba(snap.c, 1);
      if (shadow) {
        ctx.shadowColor = shadow.color;
        ctx.shadowBlur = shadow.blur;
        ctx.shadowOffsetY = shadow.offsetY;
      }
      ctx.fill();
      if (shadow) {
        ctx.shadowColor = 'transparent';
        ctx.shadowBlur = 0;
        ctx.shadowOffsetY = 0;
      }
      if (s.borderWidth) {
        ctx.lineWidth = s.borderWidth;
        ctx.strokeStyle = s.borderColor ?? this.theme.background;
        ctx.stroke();
      }
    }
    ctx.globalAlpha = 1;
    ctx.globalCompositeOperation = 'source-over';
  }

  private drawRipple(it: Item, snap: Snap, e: Required<ScatterEffect>, time: number, alpha: number): void {
    const ctx = this.ctx;
    const r0 = Math.max(snap.w, snap.h) / 2;
    ctx.lineWidth = 1.5;
    for (let k = 0; k < e.count; k++) {
      const ph = (time / e.period + k / e.count + (it.i % 7) * 0.037) % 1;
      const r = r0 * (1 + (e.scale - 1) * ph);
      ctx.globalAlpha = alpha * (1 - ph) * (e.type === 'fill' ? 0.35 : 0.8);
      ctx.beginPath();
      ctx.arc(snap.x, snap.y, r, 0, TAU);
      if (e.type === 'fill') {
        ctx.fillStyle = rgba(snap.c, 1);
        ctx.fill();
      } else {
        ctx.strokeStyle = rgba(snap.c, 1);
        ctx.stroke();
      }
    }
  }

  /** many points: batched by color, squares when tiny */
  private drawLarge(m: SModel): void {
    const ctx = this.ctx;
    const dim = this.seriesAlpha(m);
    ctx.globalCompositeOperation = m.src.blend === 'lighter' ? 'lighter' : 'source-over';
    const groups = new Map<string, Item[]>();
    for (const it of m.items) {
      if (this.hidden(it) || !Number.isFinite(it.to.x)) continue;
      const a = this.alphaOf(it, it.to.a * dim);
      const k = `${it.color}|${a.toFixed(2)}`;
      let g = groups.get(k);
      if (!g) groups.set(k, (g = []));
      g.push(it);
    }
    for (const [k, list] of groups) {
      const [color, a] = k.split('|');
      ctx.globalAlpha = Number(a);
      ctx.fillStyle = color;
      ctx.beginPath();
      for (const it of list) {
        const { x, y, w } = it.to;
        if (w <= 3 || it.symbol !== 'circle') ctx.rect(x - w / 2, y - w / 2, w, w);
        else {
          ctx.moveTo(x + w / 2, y);
          ctx.arc(x, y, w / 2, 0, TAU);
        }
      }
      ctx.fill();
    }
    ctx.globalAlpha = 1;
    ctx.globalCompositeOperation = 'source-over';
  }

  private drawGhosts(now: number): void {
    if (!this.ghosts.length) return;
    const ctx = this.ctx;
    for (const it of this.ghosts) {
      const s = this.current(it, now);
      if (s.w <= 0.2) continue;
      ctx.globalAlpha = s.a;
      ctx.fillStyle = rgba(s.c, 1);
      ctx.beginPath();
      traceSymbol(ctx, s.sym, s.x, s.y, s.w, s.h);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
  }

  private visiblePts(m: SModel): Item[] {
    return m.items.filter((it) => Number.isFinite(it.to.x) && Number.isFinite(it.to.y) && !this.hidden(it));
  }

  private drawHull(m: SModel, dim: number): void {
    if (!m.src.hull) return;
    const pts = this.visiblePts(m).map((it) => [it.to.x, it.to.y] as [number, number]);
    if (pts.length < 3) return;
    const hull = convexHull(pts);
    const ctx = this.ctx;
    const op = typeof m.src.hull === 'object' ? (m.src.hull.opacity ?? 0.12) : 0.12;
    ctx.beginPath();
    hull.forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)));
    ctx.closePath();
    ctx.globalAlpha = op * dim;
    ctx.fillStyle = m.color;
    ctx.fill();
    ctx.globalAlpha = 0.6 * dim;
    ctx.strokeStyle = m.color;
    ctx.lineWidth = 1.2;
    ctx.lineJoin = 'round';
    ctx.stroke();
    ctx.globalAlpha = 1;
  }

  private drawLine(m: SModel, dim: number): void {
    const l = m.src.line;
    if (!l) return;
    const o = typeof l === 'object' ? l : {};
    const pts = this.visiblePts(m);
    if (pts.length < 2) return;
    const ctx = this.ctx;
    ctx.beginPath();
    pts.forEach((it, i) => (i ? ctx.lineTo(it.to.x, it.to.y) : ctx.moveTo(it.to.x, it.to.y)));
    ctx.globalAlpha = 0.8 * dim;
    ctx.strokeStyle = o.color ?? m.color;
    ctx.lineWidth = o.width ?? 1.5;
    ctx.setLineDash(o.dash ?? []);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.globalAlpha = 1;
  }

  private drawRegression(m: SModel, dim: number): void {
    const r = m.src.regression;
    if (!r || this.ax.type === 'category' || this.polarCfg) return;
    const o: ScatterRegressionOptions = typeof r === 'string' ? { type: r } : r;
    const pts = m.items.filter((it) => Number.isFinite(it.xv) && Number.isFinite(it.yv)).map((it) => [it.xv, it.yv] as [number, number]);
    if (pts.length < 2) return;
    const fit = regression(o.type, pts, o.order ?? 2);
    const xs = pts.map((p) => p[0]).filter((x) => o.type !== 'logarithmic' || x > 0);
    const x0 = Math.min(...xs);
    const x1 = Math.max(...xs);
    const ctx = this.ctx;
    const curve: { x: number; y: number }[] = [];
    for (let k = 0; k <= 80; k++) {
      const x = x0 + ((x1 - x0) * k) / 80;
      const y = fit.predict(x);
      if (Number.isFinite(y)) curve.push(this.pt(x, y));
    }
    if (curve.length < 2) return;
    ctx.save();
    ctx.beginPath();
    ctx.rect(this.plot.x, this.plot.y, this.plot.w, this.plot.h);
    ctx.clip();
    ctx.beginPath();
    curve.forEach((p, i) => (i ? ctx.lineTo(p.x, p.y) : ctx.moveTo(p.x, p.y)));
    ctx.globalAlpha = dim;
    ctx.strokeStyle = o.color ?? m.color;
    ctx.lineWidth = o.width ?? 2;
    ctx.setLineDash(o.dash ?? []);
    ctx.stroke();
    ctx.restore();
    const lab = o.label ?? true;
    if (!lab) return;
    const text = lab === 'r2' ? `R² = ${fit.r2.toFixed(3)}` : lab === 'formula' ? fit.expression : `${fit.expression}   R² = ${fit.r2.toFixed(3)}`;
    ctx.font = this.font(11, 600);
    const tw = ctx.measureText(text).width;
    const end = curve[curve.length - 1];
    const x = clamp(end.x - tw, this.plot.x + 4, this.plot.x + this.plot.w - tw - 4);
    const y = clamp(end.y - 12, this.plot.y + 10, this.plot.y + this.plot.h - 10);
    ctx.globalAlpha = dim;
    ctx.fillStyle = this.theme.background === 'transparent' ? 'rgba(0,0,0,0.35)' : this.theme.background;
    ctx.globalAlpha = 0.75 * dim;
    ctx.fillRect(x - 4, y - 8, tw + 8, 16);
    ctx.globalAlpha = dim;
    ctx.fillStyle = o.color ?? m.color;
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.fillText(text, x, y);
    ctx.globalAlpha = 1;
  }

  private drawMarkArea(m: SModel, dim: number): void {
    const a = m.src.marks?.area;
    if (!a || this.polarCfg) return;
    const pts = m.items.filter((it) => Number.isFinite(it.xv) && Number.isFinite(it.yv));
    if (!pts.length) return;
    const p0 = this.pt(Math.min(...pts.map((it) => it.xv)), Math.max(...pts.map((it) => it.yv)));
    const p1 = this.pt(Math.max(...pts.map((it) => it.xv)), Math.min(...pts.map((it) => it.yv)));
    const ctx = this.ctx;
    ctx.globalAlpha = 0.08 * dim;
    ctx.fillStyle = m.color;
    ctx.fillRect(Math.min(p0.x, p1.x), Math.min(p0.y, p1.y), Math.abs(p1.x - p0.x), Math.abs(p1.y - p0.y));
    ctx.globalAlpha = 0.5 * dim;
    ctx.strokeStyle = m.color;
    ctx.setLineDash([3, 3]);
    ctx.strokeRect(Math.min(p0.x, p1.x) + 0.5, Math.min(p0.y, p1.y) + 0.5, Math.abs(p1.x - p0.x), Math.abs(p1.y - p0.y));
    ctx.setLineDash([]);
    if (typeof a === 'string') {
      ctx.globalAlpha = dim;
      ctx.fillStyle = m.color;
      ctx.font = this.font(11, 600);
      ctx.textAlign = 'left';
      ctx.textBaseline = 'top';
      ctx.fillText(a, Math.min(p0.x, p1.x) + 5, Math.min(p0.y, p1.y) + 4);
    }
    ctx.globalAlpha = 1;
  }

  private drawMarks(m: SModel, dim: number): void {
    const mk = m.src.marks;
    if (!mk || this.polarCfg) return;
    const ctx = this.ctx;
    const pts = m.items.filter((it) => Number.isFinite(it.xv) && Number.isFinite(it.yv));
    if (!pts.length) return;
    const p = this.plot;
    ctx.globalAlpha = dim;
    const avg = mk.average === true ? 'y' : mk.average;
    const fmt = (v: number, d: number): string => this.fmtVal(v, d);
    if (avg) {
      ctx.strokeStyle = m.color;
      ctx.lineWidth = 1;
      ctx.setLineDash([5, 4]);
      ctx.font = this.font(10.5, 600);
      ctx.fillStyle = m.color;
      if (avg === 'y' || avg === 'both') {
        const mean = +(pts.reduce((a, it) => a + it.yv, 0) / pts.length).toPrecision(4);
        const y = Math.round(this.pt(pts[0].xv, mean).y) + 0.5;
        ctx.beginPath();
        ctx.moveTo(p.x, y);
        ctx.lineTo(p.x + p.w, y);
        ctx.stroke();
        ctx.textAlign = 'right';
        ctx.textBaseline = 'bottom';
        ctx.fillText(`Média ${fmt(mean, 1)}`, p.x + p.w - 2, y - 2);
      }
      if (avg === 'x' || avg === 'both') {
        const mean = +(pts.reduce((a, it) => a + it.xv, 0) / pts.length).toPrecision(4);
        const x = Math.round(this.pt(mean, pts[0].yv).x) + 0.5;
        ctx.beginPath();
        ctx.moveTo(x, p.y);
        ctx.lineTo(x, p.y + p.h);
        ctx.stroke();
        ctx.textAlign = 'left';
        ctx.textBaseline = 'top';
        ctx.fillText(`Média ${fmt(mean, 0)}`, x + 3, p.y + 2);
      }
      ctx.setLineDash([]);
    }
    const pin = (it: Item, text: string): void => {
      const s = it.to;
      const w = Math.max(26, (ctx.measureText(text).width || 0) + 10);
      const h = w * 1.2;
      ctx.beginPath();
      traceSymbol(ctx, 'pin', s.x, s.y - s.h / 2 - h / 2 + 2, w, h);
      ctx.fillStyle = m.color;
      ctx.fill();
      ctx.fillStyle = '#fff';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(text, s.x, s.y - s.h / 2 - h / 2 - h * 0.12 + 2);
    };
    ctx.font = this.font(10, 700);
    if (mk.max) {
      const it = pts.reduce((a, b) => (b.yv > a.yv ? b : a));
      pin(it, fmt(it.yv, 1));
    }
    if (mk.min) {
      const it = pts.reduce((a, b) => (b.yv < a.yv ? b : a));
      pin(it, fmt(it.yv, 1));
    }
    ctx.globalAlpha = 1;
  }

  private drawLabels(): void {
    const ctx = this.ctx;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    for (const l of this.labelsCache) {
      if (l.line) {
        const [x0, y0, x1, y1, x2, y2] = l.line;
        ctx.globalAlpha = 0.6;
        ctx.strokeStyle = l.color;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(x0, y0);
        ctx.lineTo(x1, y1);
        ctx.lineTo(x2, y2);
        ctx.stroke();
        ctx.globalAlpha = 1;
      }
      ctx.font = l.font;
      ctx.fillStyle = l.color;
      ctx.fillText(l.text, l.x, l.y);
    }
  }

  private gridDash(a: Axis): number[] {
    return a.opts.gridDash ?? [];
  }

  private drawGrid(): void {
    const ctx = this.ctx;
    const p = this.plot;
    ctx.strokeStyle = this.theme.grid;
    ctx.lineWidth = 1;
    const [x0, x1] = this.domX();
    const [y0, y1] = this.domY();
    if (this.ax.opts.grid ?? this.ax.opts.show !== false) {
      ctx.setLineDash(this.gridDash(this.ax));
      ctx.beginPath();
      const ticks = this.ax.type === 'category' && this.ax.gap ? this.ax.ticks.map((t) => t - 0.5).concat(this.ax.ticks.length - 0.5) : this.xTicks();
      for (const t of ticks) {
        if (t < x0 - 1e-9 || t > x1 + 1e-9) continue;
        let k = (t - x0) / (x1 - x0);
        if (this.ax.inverse) k = 1 - k;
        const x = Math.round(p.x + k * p.w) + 0.5;
        ctx.moveTo(x, p.y);
        ctx.lineTo(x, p.y + p.h);
      }
      ctx.stroke();
    }
    if (this.ay.opts.grid ?? this.ay.opts.show !== false) {
      ctx.setLineDash(this.gridDash(this.ay));
      ctx.beginPath();
      const ticks = this.ay.type === 'category' && this.ay.gap ? this.ay.ticks.map((t) => t - 0.5).concat(this.ay.ticks.length - 0.5) : this.yTicks();
      for (const t of ticks) {
        if (t < y0 - 1e-9 || t > y1 + 1e-9) continue;
        let k = (t - y0) / (y1 - y0);
        if (this.ay.inverse) k = 1 - k;
        const y = Math.round(p.y + p.h - k * p.h) + 0.5;
        ctx.moveTo(p.x, y);
        ctx.lineTo(p.x + p.w, y);
      }
      ctx.stroke();
    }
    ctx.setLineDash([]);
  }

  private xTicks(): number[] {
    return this.ticksOf(this.ax, this.domX(), this.ax.opts.ticks ?? Math.max(2, Math.round(this.plot.w / 90)));
  }

  private yTicks(): number[] {
    return this.ticksOf(this.ay, this.domY(), this.ay.opts.ticks ?? Math.max(2, Math.round(this.plot.h / 48)));
  }

  private drawAxes(): void {
    const ctx = this.ctx;
    const p = this.plot;
    const t = this.theme;
    const xo = this.ax.opts;
    const yo = this.ay.opts;
    ctx.font = this.font(11);
    if (xo.show !== false) {
      const yLine = xo.opposite ? p.y : p.y + p.h;
      if (xo.line !== false) {
        ctx.strokeStyle = t.axis;
        ctx.beginPath();
        ctx.moveTo(p.x, Math.round(yLine) + 0.5);
        ctx.lineTo(p.x + p.w, Math.round(yLine) + 0.5);
        ctx.stroke();
      }
      ctx.fillStyle = xo.color ?? t.muted;
      const ticks = this.xTicks();
      const [x0, x1] = this.domX();
      const rot = ((xo.rotate ?? 0) * Math.PI) / 180;
      // skip labels that would overlap
      const widths = ticks.map((v) => ctx.measureText(this.fmtTick(this.ax, v)).width);
      const space = ticks.length > 1 ? (p.w / (x1 - x0)) * Math.abs(ticks[1] - ticks[0]) : p.w;
      const need = rot ? 14 : Math.max(0, ...widths) + 8;
      const step = Math.max(1, Math.ceil(need / Math.max(1, space)));
      ticks.forEach((v, i) => {
        if (i % step) return;
        let k = (v - x0) / (x1 - x0);
        if (this.ax.inverse) k = 1 - k;
        const x = p.x + k * p.w;
        const label = this.fmtTick(this.ax, v);
        const y = xo.opposite ? yLine - 6 : yLine + 6;
        if (rot) {
          ctx.save();
          ctx.translate(x, y);
          ctx.rotate(-rot);
          ctx.textAlign = 'right';
          ctx.textBaseline = 'middle';
          ctx.fillText(label, 0, 0);
          ctx.restore();
        } else {
          ctx.textAlign = 'center';
          ctx.textBaseline = xo.opposite ? 'bottom' : 'top';
          ctx.fillText(label, clamp(x, p.x + widths[i] / 2 - 6, this.width - widths[i] / 2 - 2), y);
        }
      });
      if (xo.title) {
        ctx.fillStyle = t.muted;
        ctx.font = this.font(11, 600);
        ctx.textAlign = 'center';
        ctx.textBaseline = xo.opposite ? 'top' : 'bottom';
        ctx.fillText(xo.title, p.x + p.w / 2, xo.opposite ? (this.opts.padding ?? 8) : this.height - (this.opts.padding ?? 8) - this.visualRoom().bottom);
        ctx.font = this.font(11);
      }
    }
    if (yo.show !== false) {
      const xLine = yo.opposite ? p.x + p.w : p.x;
      if (yo.line) {
        ctx.strokeStyle = t.axis;
        ctx.beginPath();
        ctx.moveTo(Math.round(xLine) + 0.5, p.y);
        ctx.lineTo(Math.round(xLine) + 0.5, p.y + p.h);
        ctx.stroke();
      }
      ctx.fillStyle = yo.color ?? t.muted;
      ctx.textAlign = yo.opposite ? 'left' : 'right';
      ctx.textBaseline = 'middle';
      const [y0, y1] = this.domY();
      const ticks = this.yTicks();
      const space = ticks.length > 1 ? (p.h / (y1 - y0)) * Math.abs(ticks[1] - ticks[0]) : p.h;
      const step = Math.max(1, Math.ceil(13 / Math.max(1, space)));
      ticks.forEach((v, i) => {
        if (i % step) return;
        let k = (v - y0) / (y1 - y0);
        if (this.ay.inverse) k = 1 - k;
        ctx.fillText(this.fmtTick(this.ay, v), yo.opposite ? xLine + 6 : xLine - 6, p.y + p.h - k * p.h);
      });
      if (yo.title) {
        ctx.save();
        ctx.fillStyle = t.muted;
        ctx.font = this.font(11, 600);
        const pad = (this.opts.padding ?? 8) + this.visualRoom().left;
        ctx.translate(yo.opposite ? this.width - pad - this.visualRoom().right : pad + 7, p.y + p.h / 2);
        ctx.rotate(-Math.PI / 2);
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(yo.title, 0, 0);
        ctx.restore();
      }
    }
  }

  private drawPolarGrid(): void {
    const pc = this.polarCfg!;
    const ctx = this.ctx;
    const t = this.theme;
    const { cx, cy, R } = this.polarGeom();
    const [y0, y1] = this.domY();
    const [x0, x1] = this.domX();
    ctx.strokeStyle = t.grid;
    ctx.lineWidth = 1;
    // rings
    const rings = this.ay.type === 'category' ? this.ay.ticks : this.yTicks();
    ctx.setLineDash(this.gridDash(this.ay));
    for (const v of rings) {
      const k = (v - y0) / (y1 - y0);
      const r = R * (pc.inner + (1 - pc.inner) * (this.ay.inverse ? 1 - k : k));
      ctx.beginPath();
      ctx.arc(cx, cy, Math.max(0, r), 0, TAU);
      ctx.stroke();
    }
    ctx.setLineDash([]);
    ctx.strokeStyle = t.axis;
    ctx.beginPath();
    ctx.arc(cx, cy, R, 0, TAU);
    ctx.stroke();
    // spokes and angle labels
    ctx.font = this.font(11);
    ctx.fillStyle = this.ax.opts.color ?? t.muted;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    const spokes = this.ax.type === 'category' ? this.ax.ticks : this.xTicks().filter((v) => v < x1 - 1e-9 || x0 + TAU > x1);
    const step = Math.max(1, Math.ceil(spokes.length / Math.max(4, (TAU * R) / 34)));
    spokes.forEach((v, i) => {
      let k = (v - x0) / (x1 - x0);
      if (this.ax.inverse) k = 1 - k;
      const a = pc.start + (pc.cw ? -1 : 1) * k * TAU;
      const c = Math.cos(a);
      const s = Math.sin(a);
      ctx.strokeStyle = t.grid;
      ctx.beginPath();
      ctx.moveTo(cx + c * R * pc.inner, cy - s * R * pc.inner);
      ctx.lineTo(cx + c * R, cy - s * R);
      ctx.stroke();
      if (this.ax.opts.show !== false && i % step === 0) ctx.fillText(this.fmtTick(this.ax, v), cx + c * (R + 13), cy - s * (R + 11));
    });
    // radius labels along the first spoke
    if (this.ay.opts.show !== false) {
      ctx.fillStyle = this.ay.opts.color ?? t.muted;
      ctx.textAlign = 'left';
      ctx.font = this.font(10);
      const a = pc.start;
      for (const v of rings) {
        const k = (v - y0) / (y1 - y0);
        const r = R * (pc.inner + (1 - pc.inner) * (this.ay.inverse ? 1 - k : k));
        ctx.fillText(this.fmtTick(this.ay, v), cx + Math.cos(a) * r + 4, cy - Math.sin(a) * r);
      }
    }
  }

  private drawHover(): void {
    const it = this.hover;
    if (!it || !Number.isFinite(it.to.x)) return;
    const ctx = this.ctx;
    const s = it.to;
    const k = this.opts.hoverScale ?? 1.35;
    const rect = it.y0 !== undefined;
    ctx.beginPath();
    traceSymbol(ctx, s.sym, s.x, s.y, rect ? s.w : s.w * k, rect ? s.h : s.h * k);
    ctx.globalAlpha = 1;
    ctx.fillStyle = rgba(s.c, 1);
    ctx.fill();
    ctx.lineWidth = 2;
    ctx.strokeStyle = this.theme.background === 'transparent' ? '#fff' : this.theme.background;
    ctx.stroke();
  }

  // ------------------------------------------------------------------ interaction

  private info(it: Item): ScatterPointInfo {
    return {
      series: it.s.src,
      seriesIndex: it.s.index,
      dataIndex: it.i,
      values: it.vals,
      x: it.vals[0] as number | string,
      y: it.vals[1] as number | string | null,
      name: it.name,
      color: it.color,
      size: it.size,
      data: it.data,
    };
  }

  private buildGrid(): Map<number, Item[]> {
    const g = new Map<number, Item[]>();
    for (const it of this.items) {
      if (!Number.isFinite(it.to.x) || this.hidden(it) || !it.inRange) continue;
      const k = Math.floor(it.to.x / 24) * 100000 + Math.floor(it.to.y / 24);
      let c = g.get(k);
      if (!c) g.set(k, (c = []));
      c.push(it);
    }
    return g;
  }

  private hitTest(mx: number, my: number): Item | null {
    let best: Item | null = null;
    let bd = Infinity;
    const test = (it: Item): void => {
      const s = it.to;
      if (it.y0 !== undefined) {
        if (Math.abs(mx - s.x) <= s.w / 2 && Math.abs(my - s.y) <= s.h / 2 + 1) {
          best = it;
          bd = 0;
        }
        return;
      }
      const d = Math.hypot(mx - s.x, my - s.y);
      const r = Math.max(s.w, s.h) / 2 + 3;
      if (d <= Math.max(r, 6) && d - r < bd) {
        bd = d - r;
        best = it;
      }
    };
    if (this.items.length > 1500) {
      this.grid ??= this.buildGrid();
      const gx = Math.floor(mx / 24);
      const gy = Math.floor(my / 24);
      for (let i = -1; i <= 1; i++) for (let j = -1; j <= 1; j++) this.grid.get((gx + i) * 100000 + gy + j)?.forEach(test);
    } else {
      // last drawn wins among equals → walk backwards
      for (let i = this.items.length - 1; i >= 0; i--) {
        const it = this.items[i];
        if (!Number.isFinite(it.to.x) || this.hidden(it) || !it.inRange) continue;
        if (this.highlighted && it.s.key !== this.highlighted) continue;
        test(it);
      }
    }
    return best;
  }

  private dimName(d: number): string {
    const names = this.opts.dimensions;
    if (names?.[d]) return names[d];
    if (d === 0) return this.ax.opts.title ?? 'x';
    if (d === 1) return this.ay.opts.title ?? 'y';
    return `#${d}`;
  }

  private showTooltip(it: Item, mx: number, my: number): void {
    const tt = this.opts.tooltip ?? {};
    if (tt.show === false) return;
    const info = this.info(it);
    let html: string;
    if (tt.formatter) html = tt.formatter(info);
    else {
      const head = this.models.length > 1 || !it.name ? `<div class="sc-tooltip__head"><i class="sc-tooltip__dot" style="background:${it.color}"></i>${esc(it.s.src.name)}</div>` : '';
      const name = it.name ? `<div class="sc-tooltip__name">${head ? '' : `<i class="sc-tooltip__dot" style="background:${it.color}"></i>`}${esc(it.name)}</div>` : '';
      const dims = this.opts.dimensions ? Math.min(it.vals.length, this.opts.dimensions.length) : Math.min(it.vals.length, 2);
      const rows = it.vals
        .slice(0, Math.max(dims, it.y0 !== undefined ? 2 : dims))
        .map((v, d) => `<div class="sc-tooltip__row"><span>${esc(this.dimName(d))}</span><b>${esc(this.fmtVal(v, d))}</b></div>`)
        .join('');
      html = head + name + rows;
    }
    if (!html) return this.hideTooltip();
    const el = this.tooltipEl;
    el.innerHTML = html;
    el.classList.add('is-visible');
    const w = el.offsetWidth;
    const h = el.offsetHeight;
    let x = mx + 14;
    let y = my - h - 10;
    if (x + w > this.width - 4) x = mx - w - 14;
    if (y < 4) y = my + 16;
    el.style.transform = `translate(${Math.max(4, x)}px, ${Math.max(4, Math.min(y, this.height - h - 4))}px)`;
  }

  private hideTooltip(): void {
    this.tooltipEl.classList.remove('is-visible');
  }

  private zoomable(which: 'x' | 'y'): boolean {
    const z = this.opts.zoom;
    if (!z || this.polarCfg) return false;
    if ((which === 'x' ? this.ax : this.ay).type === 'category') return false;
    return z === true || z === which;
  }

  private afterZoom(): void {
    this.layout();
    this.draw();
    const [x0, x1] = this.domX();
    const [y0, y1] = this.domY();
    this.emit('zoom', { x: [this.U(this.ax, x0), this.U(this.ax, x1)], y: [this.U(this.ay, y0), this.U(this.ay, y1)] });
  }

  private bind(): void {
    const c = this.canvas;
    const pos = (e: MouseEvent): { x: number; y: number } => {
      const r = c.getBoundingClientRect();
      return { x: e.clientX - r.left, y: e.clientY - r.top };
    };
    c.addEventListener('pointermove', (e) => {
      const { x, y } = pos(e);
      if (this.drag) {
        const d = this.drag;
        if (d.mode === 'brush') {
          this.brushRect = [d.x, d.y, x, y];
          this.draw();
          return;
        }
        const p = this.plot;
        if (d.vx && this.zoomable('x')) {
          const k = ((x - d.x) / p.w) * (d.vx[1] - d.vx[0]) * (this.ax.inverse ? -1 : 1);
          this.viewX = [d.vx[0] - k, d.vx[1] - k];
        }
        if (d.vy && this.zoomable('y')) {
          const k = ((y - d.y) / p.h) * (d.vy[1] - d.vy[0]) * (this.ay.inverse ? -1 : 1);
          this.viewY = [d.vy[0] + k, d.vy[1] + k];
        }
        this.afterZoom();
        return;
      }
      if (this.animating(performance.now())) return;
      const it = this.hitTest(x, y);
      if (it !== this.hover) {
        this.hover = it;
        c.style.cursor = it ? 'pointer' : this.opts.brush ? 'crosshair' : this.opts.zoom ? 'grab' : '';
        this.draw();
        this.emit('hover', it ? this.info(it) : null);
      }
      if (it) this.showTooltip(it, x, y);
      else this.hideTooltip();
    });
    c.addEventListener('pointerleave', () => {
      if (this.drag) return;
      if (this.hover) {
        this.hover = null;
        this.draw();
        this.emit('hover', null);
      }
      this.hideTooltip();
    });
    c.addEventListener('pointerdown', (e) => {
      const { x, y } = pos(e);
      const p = this.plot;
      if (this.polarCfg || x < p.x || x > p.x + p.w || y < p.y || y > p.y + p.h) return;
      if (this.opts.brush) this.drag = { x, y, vx: null, vy: null, mode: 'brush' };
      else if (this.opts.zoom) this.drag = { x, y, vx: [...this.domX()], vy: [...this.domY()], mode: 'pan' };
      else return;
      c.setPointerCapture(e.pointerId);
      this.hideTooltip();
    });
    const end = (e: PointerEvent): void => {
      const d = this.drag;
      if (!d) return;
      this.drag = null;
      if (d.mode !== 'brush') return;
      const { x, y } = pos(e);
      this.brushRect = null;
      if (Math.abs(x - d.x) < 4 && Math.abs(y - d.y) < 4) {
        // a click: clicking a point selects nothing new, clicking empty space clears
        if (!this.hitTest(x, y) && this.selection) {
          this.selection = null;
          this.emit('brush', []);
        }
        this.draw();
        return;
      }
      const [x0, x1] = [Math.min(x, d.x), Math.max(x, d.x)];
      const [y0, y1] = [Math.min(y, d.y), Math.max(y, d.y)];
      const sel = this.items.filter((it) => it.to.x >= x0 && it.to.x <= x1 && it.to.y >= y0 && it.to.y <= y1 && it.inRange);
      this.selection = new Set(sel);
      this.draw();
      this.emit('brush', sel.map((it) => this.info(it)));
    };
    c.addEventListener('pointerup', end);
    c.addEventListener('pointercancel', end);
    c.addEventListener('click', (e) => {
      const { x, y } = pos(e);
      const it = this.hitTest(x, y);
      if (it) this.emit('click', this.info(it));
    });
    c.addEventListener(
      'wheel',
      (e) => {
        if (!this.opts.zoom || this.polarCfg) return;
        const { x, y } = pos(e);
        const p = this.plot;
        if (x < p.x || x > p.x + p.w || y < p.y || y > p.y + p.h) return;
        e.preventDefault();
        const k = Math.exp(e.deltaY * 0.0015);
        if (this.zoomable('x')) {
          const [a, b] = this.domX();
          let f = (x - p.x) / p.w;
          if (this.ax.inverse) f = 1 - f;
          const m = a + f * (b - a);
          this.viewX = [m - (m - a) * k, m + (b - m) * k];
        }
        if (this.zoomable('y')) {
          const [a, b] = this.domY();
          let f = (p.y + p.h - y) / p.h;
          if (this.ay.inverse) f = 1 - f;
          const m = a + f * (b - a);
          this.viewY = [m - (m - a) * k, m + (b - m) * k];
        }
        this.hover = null;
        this.hideTooltip();
        this.afterZoom();
      },
      { passive: false },
    );
    c.addEventListener('dblclick', () => {
      if (this.opts.zoom && (this.viewX || this.viewY)) this.resetZoom();
    });
  }

  private renderLegend(): void {
    const o = this.opts.legend ?? {};
    const shown = this.models.filter((m) => m.src.legend !== false);
    const show = o.show ?? shown.length > 1;
    this.legendEl.style.display = show ? '' : 'none';
    if (!show) {
      this.legendEl.innerHTML = '';
      return;
    }
    const interactive = o.interactive ?? true;
    this.legendEl.innerHTML = shown
      .map(
        (m) =>
          `<li class="sc-legend__item${interactive ? ' is-interactive' : ''}${m.hidden ? ' is-hidden' : ''}${this.highlighted === m.key ? ' is-hover' : ''}" data-key="${esc(m.key)}"><i class="sc-legend__marker" style="--c:${m.color}"></i><span>${esc(m.src.name)}</span></li>`,
      )
      .join('');
    if (!interactive) return;
    this.legendEl.querySelectorAll<HTMLElement>('.sc-legend__item').forEach((li) => {
      const key = li.dataset.key!;
      li.onclick = () => this.toggle(key);
      li.onmouseenter = () => {
        if (this.hiddenKeys.has(key)) return;
        this.highlighted = key;
        this.draw();
      };
      li.onmouseleave = () => {
        this.highlighted = null;
        this.draw();
      };
    });
  }
}

export function createScatterChart(container: HTMLElement, options: ScatterOptions = {}): ScatterChart {
  return new ScatterChart(container, options);
}
