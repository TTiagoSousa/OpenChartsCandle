import { Tick, detectXType, formatCompact, formatTooltipTime, monotoneTangents, nearestIndex, niceScale, timeTicks } from './scale';
import type {
  AxisOptions, LineAnnotations, LineCurve, LineEvent, LineGraphicApi, LineHoverPoint, LineOptions, LinePoint, LineSeries, LineTheme,
  LineTooltipContext, LineX, PointShape, XAxisOptions,
} from './types';

const FONT = '-apple-system, BlinkMacSystemFont, "Trebuchet MS", Roboto, Ubuntu, sans-serif';

export const LINE_COLORS = ['#2962ff', '#ff9800', '#089981', '#f23645', '#9c27b0', '#00bcd4', '#e91e63', '#4caf50', '#ffc107', '#3f51b5'];

export const lineDarkTheme: LineTheme = {
  background: '#131722',
  text: '#d1d4dc',
  muted: '#787b86',
  grid: 'rgba(42, 46, 57, 0.7)',
  axis: '#2a2e39',
  crosshair: '#9598a1',
  tooltipBg: '#1e222d',
  tooltipText: '#d1d4dc',
  tooltipBorder: '#2a2e39',
  font: FONT,
};

export const lineLightTheme: LineTheme = {
  background: '#ffffff',
  text: '#131722',
  muted: '#787b86',
  grid: 'rgba(42, 46, 57, 0.08)',
  axis: '#e0e3eb',
  crosshair: '#9598a1',
  tooltipBg: '#ffffff',
  tooltipText: '#131722',
  tooltipBorder: '#e0e3eb',
  font: FONT,
};

type AreaCfg = { opacity: number; gradient: boolean | string[]; ranges?: [LineX, LineX][] } | null;
type PointsCfg = { size: number; shape: PointShape; hollow: boolean; color?: string; borderColor?: string; borderWidth?: number } | null;

/** A series after normalisation (numeric x, sorted, stacked values). */
interface NSeries {
  src: LineSeries;
  key: string;
  index: number;
  color: string;
  xs: number[];
  ys: (number | null)[];
  /** values that are drawn (stacked / percent) */
  top: (number | null)[];
  /** lower bound of the area (stacking) */
  base: number[] | null;
  /** confidence band bounds, per point (null when the series has no band) */
  bandLo: (number | null)[] | null;
  bandHi: (number | null)[] | null;
  /** false when sortByX: false (points in data order) */
  sorted: boolean;
  /** index in the original `data` of each point (for dragging) */
  srcIdx: number[];
  axis: 'left' | 'right';
  curve: LineCurve;
  area: AreaCfg;
  points: PointsCfg;
  width: number;
  dash: number[];
  labels: boolean;
  hidden: boolean;
}

interface Domain {
  min: number;
  max: number;
  ticks: number[];
}

interface Rect {
  x: number;
  y: number;
  w: number;
  h: number;
}

function areaCfg(v: LineSeries['area'] | LineOptions['area']): AreaCfg {
  if (!v) return null;
  const o = typeof v === 'object' ? v : {};
  // own gradient colors are shown at full strength unless an opacity is given
  return { opacity: Array.isArray(o.gradient) ? 1 : 0.28, gradient: true, ...o };
}

function pointsCfg(v: LineSeries['points'] | LineOptions['points']): PointsCfg {
  if (!v) return null;
  return { size: 4, shape: 'circle', hollow: false, ...(typeof v === 'object' ? v : {}) };
}

function alpha(color: string, a: number): string {
  const m = color.match(/^#([\da-f]{2})([\da-f]{2})([\da-f]{2})/i);
  if (m) return `rgba(${parseInt(m[1], 16)},${parseInt(m[2], 16)},${parseInt(m[3], 16)},${a})`;
  const r = color.match(/rgba?\(([^)]+)\)/);
  if (r) {
    const [x, y, z] = r[1].split(',').map((s) => s.trim());
    return `rgba(${x},${y},${z},${a})`;
  }
  return color;
}

const esc = (s: string): string => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const easeOutCubic = (t: number): number => 1 - Math.pow(1 - t, 3);
const toSec = (v: number): number => (v > 1e11 ? v / 1000 : v);

/** `sparkline: true` fills in the defaults of a mini chart (anything given explicitly wins). */
function withPresets(o: LineOptions): LineOptions {
  if (!o.sparkline) return o;
  return {
    padding: 2,
    ...o,
    legend: { show: false, ...(o.legend ?? {}) },
    xAxis: { show: false, grid: false, ...(o.xAxis ?? {}) },
    yAxis: { show: false, grid: false, ...(o.yAxis ?? {}) },
    crosshair: { show: false, ...(o.crosshair ?? {}) },
  };
}

/**
 * Multi-series line / area chart: time, number or category x axis, dual y axis,
 * stacking, shared tooltip, crosshair, interactive legend, annotations, zoom & pan,
 * realtime appends and animations.
 */
export class LineChart {
  readonly root: HTMLElement;
  readonly canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private plotEl: HTMLElement;
  private legendEl: HTMLElement;
  private tooltipEl: HTMLElement;
  private opts: LineOptions;
  private theme!: LineTheme;
  private seriesList: LineSeries[] = [];
  private hiddenKeys = new Set<string>();
  private model: NSeries[] = [];
  private xType: 'time' | 'category' | 'number' = 'number';
  private categories: string[] = [];
  private dataX: [number, number] = [0, 1];
  private view: [number, number] | null = null;
  private yLeft: Domain = { min: 0, max: 1, ticks: [] };
  private yRight: Domain | null = null;
  private plot: Rect = { x: 0, y: 0, w: 1, h: 1 };
  private width = 0;
  private height = 0;
  private dpr = 1;
  private hover: { x: number; points: LineHoverPoint[]; my: number } | null = null;
  private highlighted: string | null = null;
  // animation
  private reveal = 1;
  private morph = 1;
  private animStart = 0;
  private animKind: 'reveal' | 'morph' | null = null;
  private fromTop = new Map<string, (number | null)[]>();
  private fromLeft: Domain | null = null;
  private fromRight: Domain | null = null;
  private raf = 0;
  private handlers = new Map<LineEvent, Set<(v: unknown) => void>>();
  private ro: ResizeObserver;
  private drag: { x: number; view: [number, number] } | null = null;
  /** zoom slider under the plot */
  private sliderRect: Rect | null = null;
  private sliderDrag: { mode: 'l' | 'r' | 'move'; x: number; view: [number, number] } | null = null;
  /** axis breaks (real x units, sorted) */
  private breaks: [number, number][] = [];
  /** fisheye focus (mouse x in px) */
  private lensX: number | null = null;
  /** point being dragged (series key + index in its data) */
  private pointDrag: { key: string; orig: number } | null = null;

  constructor(container: HTMLElement, options: LineOptions = {}) {
    this.opts = withPresets({ ...options });
    this.root = container;
    container.classList.add('lc-root');
    this.plotEl = document.createElement('div');
    this.plotEl.className = 'lc-plot';
    this.canvas = document.createElement('canvas');
    this.canvas.className = 'lc-canvas';
    this.canvas.setAttribute('role', 'img');
    this.ctx = this.canvas.getContext('2d')!;
    this.tooltipEl = document.createElement('div');
    this.tooltipEl.className = 'lc-tooltip';
    this.legendEl = document.createElement('ul');
    this.legendEl.className = 'lc-legend';
    this.plotEl.append(this.canvas, this.tooltipEl);
    container.append(this.plotEl, this.legendEl);
    this.seriesList = (options.series ?? []).map((s) => ({ ...s }));
    for (const s of this.seriesList) if (s.hidden) this.hiddenKeys.add(this.keyOf(s));
    this.applyLook();
    this.bind();
    this.ro = new ResizeObserver(() => this.resize());
    this.ro.observe(this.plotEl);
    this.resize();
    this.rebuild('reveal');
    this.applyInitialZoom();
  }

  /** zoom: { start, end } in % of the data */
  private applyInitialZoom(): void {
    const z = this.opts.zoom;
    if (typeof z !== 'object' || (z.start === undefined && z.end === undefined)) return;
    const [d0, d1] = this.dataX;
    const a = d0 + ((d1 - d0) * Math.max(0, z.start ?? 0)) / 100;
    const b = d0 + ((d1 - d0) * Math.min(100, z.end ?? 100)) / 100;
    if (b - a >= d1 - d0 - 1e-9 || b <= a) return;
    this.view = [a, b];
    this.layout();
    this.draw();
  }

  // ------------------------------------------------------------------ public API

  /** Current series (as given, with appended points). */
  get series(): LineSeries[] {
    return this.seriesList.map((s) => ({ ...s }));
  }

  /** Replace every series. Same series with the same length morph smoothly to the new values. */
  setSeries(series: LineSeries[]): void {
    const sameShape =
      series.length === this.seriesList.length &&
      series.every((s, i) => this.keyOf(s) === this.keyOf(this.seriesList[i]) && s.data.length === this.seriesList[i].data.length);
    this.seriesList = series.map((s) => ({ ...s }));
    this.rebuild(sameShape ? 'morph' : 'reveal');
  }

  /** Change options after creation (animated unless `animate` is false). */
  setOptions(patch: LineOptions, animate = true): void {
    if (patch.series) this.seriesList = patch.series.map((s) => ({ ...s }));
    this.opts = withPresets({ ...this.opts, ...patch });
    this.applyLook();
    this.rebuild(animate ? 'morph' : null);
  }

  /** Change one series (color, data, area…). */
  updateSeries(id: string, patch: Partial<LineSeries>): void {
    const i = this.seriesList.findIndex((s) => this.keyOf(s) === id);
    if (i < 0) return;
    const sameLen = !patch.data || patch.data.length === this.seriesList[i].data.length;
    this.seriesList[i] = { ...this.seriesList[i], ...patch };
    this.rebuild(sameLen ? 'morph' : 'reveal');
  }

  addSeries(s: LineSeries): void {
    this.seriesList.push({ ...s });
    this.rebuild('morph');
  }

  removeSeries(id: string): void {
    this.seriesList = this.seriesList.filter((s) => this.keyOf(s) !== id);
    this.hiddenKeys.delete(id);
    this.rebuild('morph');
  }

  /**
   * Realtime: add a point to a series (or replace the last one when x is equal).
   * With `maxPoints` the oldest points are dropped (sliding window).
   */
  appendPoint(id: string, point: LinePoint | number): void {
    const s = this.seriesList.find((x) => this.keyOf(x) === id);
    if (!s) return;
    const data = [...(s.data as (LinePoint | number | null)[])];
    if (typeof point === 'number') data.push(point);
    else {
      const last = data[data.length - 1];
      if (last && typeof last === 'object' && last.x === point.x) data[data.length - 1] = point;
      else data.push(point);
    }
    const max = this.opts.maxPoints;
    s.data = (max && data.length > max ? data.slice(data.length - max) : data) as LineSeries['data'];
    // keep following the newest data unless the user zoomed into the past
    const following = !this.view || this.view[1] >= this.dataX[1] - 1e-9;
    const span = this.view ? this.view[1] - this.view[0] : 0;
    this.rebuild(null);
    if (following && this.view) this.view = [this.dataX[1] - span, this.dataX[1]];
    this.draw();
  }

  /** Show/hide a series (like clicking the legend). */
  toggle(id: string, hidden?: boolean): void {
    const h = hidden ?? !this.hiddenKeys.has(id);
    if (h) this.hiddenKeys.add(id);
    else this.hiddenKeys.delete(id);
    this.rebuild('morph');
    this.emit('toggle', { id, hidden: h });
  }

  /** Emphasise one series (others are dimmed). null to clear. */
  highlight(id: string | null): void {
    this.highlighted = id;
    this.legendEl.querySelectorAll<HTMLElement>('.lc-legend__item').forEach((li) => li.classList.toggle('is-hover', li.dataset.id === id));
    this.draw();
  }

  /** Zoom the x axis to [from, to] (same unit as the data). */
  setZoom(from: LineX, to: LineX): void {
    const a = Math.min(this.xValue(from), this.xValue(to));
    const b = Math.max(this.xValue(from), this.xValue(to));
    // unchanged: no event (lets two charts sync their zoom without looping)
    if (this.view && Math.abs(this.view[0] - a) < 1e-9 && Math.abs(this.view[1] - b) < 1e-9) return;
    this.view = [a, b];
    this.rebuild(null);
    this.emit('zoom', { from: this.view[0], to: this.view[1] });
  }

  resetZoom(): void {
    if (!this.view) return;
    this.view = null;
    this.rebuild('morph');
    this.emit('zoom', null);
  }

  /**
   * Show the crosshair (and tooltip) at x, as if the mouse were there. null hides it.
   * Used to link charts: chartA.on('hover', (c) => chartB.showHover(c?.x ?? null)).
   */
  showHover(x: LineX | null, tooltip = true): void {
    if (x === null) {
      this.hover = null;
      this.tooltipEl.classList.remove('is-visible');
      this.draw();
      return;
    }
    const xv = this.xValue(x);
    const visible = this.model.filter((s) => !s.hidden && s.xs.length);
    const h = visible.length ? this.sharedAt(xv, visible) : null;
    const my = this.plot.y + this.plot.h / 2;
    this.hover = h ? { ...h, my } : null;
    this.draw();
    if (tooltip) this.showTooltip(this.xToPx(xv), my);
    else this.tooltipEl.classList.remove('is-visible');
  }

  on(event: 'hover', handler: (ctx: LineTooltipContext | null) => void): () => void;
  on(event: 'click', handler: (ctx: LineTooltipContext) => void): () => void;
  on(event: 'toggle', handler: (e: { id: string; hidden: boolean }) => void): () => void;
  on(event: 'zoom', handler: (range: { from: number; to: number } | null) => void): () => void;
  on(event: 'plotclick', handler: (e: { x: number; y: number; px: number; py: number }) => void): () => void;
  on(event: 'change', handler: (e: { series: LineSeries; index: number; x: number; y: number }) => void): () => void;
  on(event: LineEvent, handler: (v: never) => void): () => void {
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
    this.root.classList.remove('lc-root', 'lc-legend-top', 'lc-legend-bottom', 'lc-legend-left', 'lc-legend-right');
    this.plotEl.remove();
    this.legendEl.remove();
  }

  // ------------------------------------------------------------------ model

  private keyOf(s: LineSeries): string {
    return s.id ?? s.name;
  }

  private emit(e: LineEvent, v: unknown): void {
    this.handlers.get(e)?.forEach((h) => h(v));
  }

  private applyLook(): void {
    const o = this.opts;
    const base = o.theme === 'light' ? lineLightTheme : lineDarkTheme;
    this.theme = { ...base, ...(typeof o.theme === 'object' ? o.theme : {}) };
    if (o.background !== undefined) this.theme.background = o.background;
    const lg = { position: 'top', marker: 'line', align: 'start', fontSize: 12, show: true, ...(o.legend ?? {}) };
    this.root.classList.remove('lc-legend-top', 'lc-legend-bottom', 'lc-legend-left', 'lc-legend-right');
    this.root.classList.add(`lc-legend-${lg.position}`);
    this.legendEl.style.display = lg.show ? '' : 'none';
    this.legendEl.className = `lc-legend lc-legend--${lg.marker} lc-legend--align-${lg.align}`;
    this.legendEl.style.fontSize = `${lg.fontSize}px`;
    const t = this.theme;
    const vars: Record<string, string> = {
      '--lc-bg': t.background,
      '--lc-text': t.text,
      '--lc-muted': t.muted,
      '--lc-tt-bg': t.tooltipBg,
      '--lc-tt-text': t.tooltipText,
      '--lc-tt-border': t.tooltipBorder,
      '--lc-font': t.font,
    };
    for (const [k, v] of Object.entries(vars)) this.root.style.setProperty(k, v);
  }

  /** x value of the user's unit → internal numeric x */
  private xValue(x: LineX): number {
    if (typeof x === 'string') {
      const i = this.categories.indexOf(x);
      return i < 0 ? 0 : i;
    }
    return this.xType === 'time' ? toSec(x) : x;
  }

  private normalize(): NSeries[] {
    const o = this.opts;
    const colors = o.colors?.length ? o.colors : LINE_COLORS;
    // x type
    const sampleX: (number | string)[] = [];
    for (const s of this.seriesList) for (const p of s.data) if (p !== null && typeof p === 'object') sampleX.push(p.x);
    const plainOnly = sampleX.length === 0;
    this.xType = o.xType ?? (plainOnly ? (o.categories ? 'category' : 'number') : detectXType(sampleX));
    // categories
    if (this.xType === 'category') {
      const cats = [...(o.categories ?? [])];
      for (const v of sampleX) if (typeof v === 'string' && !cats.includes(v)) cats.push(v);
      if (!cats.length) {
        const n = Math.max(0, ...this.seriesList.map((s) => s.data.length));
        for (let i = 0; i < n; i++) cats.push(String(i + 1));
      }
      this.categories = cats;
    } else this.categories = [];

    return this.seriesList.map((s, index) => {
      const num = (v: number | null | undefined): number | null => (v === null || v === undefined || !Number.isFinite(v) ? null : v);
      const pts: { x: number; y: number | null; lo: number | null; hi: number | null; i: number }[] = s.data.map((p, i) => {
        // band bounds travel with their point through the sort
        const lo = num(s.band?.lower[i]);
        const hi = num(s.band?.upper[i]);
        if (p === null || typeof p === 'number') return { x: i, y: p, lo, hi, i };
        const x = typeof p.x === 'string' ? Math.max(0, this.categories.indexOf(p.x)) : this.xType === 'time' ? toSec(p.x) : p.x;
        return { x, y: p.y === null || !Number.isFinite(p.y) ? null : p.y, lo, hi, i };
      });
      const sorted = s.sortByX !== false;
      if (sorted) pts.sort((a, b) => a.x - b.x);
      const key = this.keyOf(s);
      return {
        src: s,
        key,
        index,
        color: s.color ?? colors[index % colors.length],
        xs: pts.map((p) => p.x),
        ys: pts.map((p) => p.y),
        top: pts.map((p) => p.y),
        base: null,
        sorted,
        srcIdx: pts.map((p) => p.i),
        bandLo: s.band ? pts.map((p) => p.lo) : null,
        bandHi: s.band ? pts.map((p) => p.hi) : null,
        axis: s.axis ?? 'left',
        curve: s.curve ?? o.curve ?? 'linear',
        area: areaCfg(s.area ?? o.area),
        points: pointsCfg(s.points ?? o.points),
        width: s.width ?? 2,
        dash: s.dash ?? [],
        labels: s.labels ?? false,
        hidden: this.hiddenKeys.has(key),
      };
    });
  }

  private stack(model: NSeries[]): void {
    const mode = this.opts.stacked;
    if (!mode) return;
    for (const axis of ['left', 'right'] as const) {
      const list = model.filter((s) => !s.hidden && s.axis === axis);
      const totals = new Map<number, number>();
      if (mode === 'percent') for (const s of list) s.xs.forEach((x, i) => totals.set(x, (totals.get(x) ?? 0) + Math.abs(s.ys[i] ?? 0)));
      const cum = new Map<number, number>();
      for (const s of list) {
        s.base = s.xs.map((x) => cum.get(x) ?? 0);
        s.top = s.xs.map((x, i) => {
          const raw = s.ys[i];
          let v = raw ?? 0;
          if (mode === 'percent') v = totals.get(x) ? (v / totals.get(x)!) * 100 : 0;
          const t = (cum.get(x) ?? 0) + v;
          cum.set(x, t);
          return raw === null && !this.opts.spanGaps ? null : t;
        });
        // stacked series get an area by default; `area: false` keeps plain stacked lines
        if (!s.area && (s.src.area ?? this.opts.area) !== false) s.area = areaCfg(true);
      }
    }
  }

  private domain(axis: 'left' | 'right', ao: AxisOptions, xr: [number, number]): Domain | null {
    const list = this.model.filter((s) => !s.hidden && s.axis === axis);
    if (!list.length && axis === 'right') return null;
    let lo = Infinity;
    let hi = -Infinity;
    for (const s of list) {
      for (let i = 0; i < s.xs.length; i++) {
        if (s.xs[i] < xr[0] || s.xs[i] > xr[1]) continue;
        const v = s.top[i];
        if (v === null) continue;
        lo = Math.min(lo, v, s.base ? s.base[i] : v);
        hi = Math.max(hi, v);
        if (s.bandLo) {
          const bl = s.bandLo[i];
          const bh = s.bandHi![i];
          if (bl !== null) lo = Math.min(lo, bl);
          if (bh !== null) hi = Math.max(hi, bh);
        }
      }
    }
    const ann = this.opts.annotations ?? {};
    for (const l of ann.y ?? []) if ((l.axis ?? 'left') === axis) ((lo = Math.min(lo, l.value)), (hi = Math.max(hi, l.value)));
    for (const b of ann.bands ?? []) if ((b.axis ?? 'left') === axis) ((lo = Math.min(lo, b.from, b.to)), (hi = Math.max(hi, b.from, b.to)));
    if (!Number.isFinite(lo)) ((lo = 0), (hi = 1));
    const base = ao.log === true ? 10 : typeof ao.log === 'number' && ao.log > 1 ? ao.log : 0;
    if (base) {
      // log scale: whole powers of the base around the positive values
      const pos = list.flatMap((s) => s.top.filter((v): v is number => v !== null && v > 0));
      const pLo = ao.min ?? (pos.length ? Math.min(...pos) : 1);
      const pHi = ao.max ?? (pos.length ? Math.max(...pos) : base);
      const lg = (v: number): number => Math.log(v) / Math.log(base);
      let k0 = Math.floor(lg(pLo) + 1e-9);
      let k1 = Math.ceil(lg(pHi) - 1e-9);
      if (k1 <= k0) k1 = k0 + 1;
      const every = Math.max(1, Math.ceil((k1 - k0) / Math.max(2, Math.round(this.plot.h / 40))));
      const ticks: number[] = [];
      for (let k = k0; k <= k1; k += every) ticks.push(+Math.pow(base, k).toPrecision(12));
      if (ao.min !== undefined) k0 = lg(ao.min);
      if (ao.max !== undefined) k1 = lg(ao.max);
      return { min: Math.pow(base, k0), max: Math.pow(base, k1), ticks };
    }
    if (ao.beginAtZero || this.opts.stacked) ((lo = Math.min(lo, 0)), (hi = Math.max(hi, 0)));
    if (this.opts.stacked === 'percent') ((lo = 0), (hi = 100));
    if (ao.min !== undefined) lo = ao.min;
    if (ao.max !== undefined) hi = ao.max;
    const count = ao.ticks ?? Math.max(2, Math.round(this.plot.h / 55));
    const nice = niceScale(lo, hi, count);
    // keep user's explicit bounds exactly
    const min = ao.min !== undefined ? ao.min : nice.min;
    const max = ao.max !== undefined ? ao.max : nice.max;
    return { min, max, ticks: nice.ticks.filter((t) => t >= min - 1e-9 && t <= max + 1e-9) };
  }

  private rebuild(anim: 'reveal' | 'morph' | null): void {
    // remember what is drawn now (for morphing)
    this.fromTop = new Map(this.model.map((s) => [s.key, s.top.slice()]));
    this.fromLeft = this.yLeft;
    this.fromRight = this.yRight;
    this.model = this.normalize();
    this.stack(this.model);
    const visible = this.model.filter((s) => !s.hidden);
    const all = (visible.length ? visible : this.model).flatMap((s) => s.xs);
    if (this.xType === 'category') this.dataX = [-0.5, Math.max(0, this.categories.length - 1) + 0.5];
    else this.dataX = all.length ? [Math.min(...all), Math.max(...all)] : [0, 1];
    const xo = this.opts.xAxis;
    if (this.xType !== 'category' && xo?.min !== undefined) this.dataX[0] = xo.min;
    if (this.xType !== 'category' && xo?.max !== undefined) this.dataX[1] = xo.max;
    if (this.dataX[0] === this.dataX[1]) this.dataX = [this.dataX[0] - 1, this.dataX[1] + 1];
    this.breaks = (xo?.breaks ?? [])
      .map((b) => [this.xValue(b.from), this.xValue(b.to)] as [number, number])
      .filter(([f, t]) => t > f)
      .sort((p, q) => p[0] - q[0]);
    if (this.view) {
      const [a, b] = this.dataX;
      const span = Math.min(this.view[1] - this.view[0], b - a);
      const v0 = Math.max(a, Math.min(this.view[0], b - span));
      this.view = [v0, v0 + span];
      if (span >= b - a - 1e-9) this.view = null;
    }
    this.layout();
    this.renderLegend();
    this.canvas.setAttribute('aria-label', `Gráfico de linhas: ${this.model.map((s) => s.src.name).join(', ')}`);
    const duration = this.duration();
    if (!anim || duration === 0) {
      this.animKind = null;
      this.reveal = 1;
      this.morph = 1;
      this.draw();
      return;
    }
    this.animKind = anim;
    this.animStart = performance.now();
    if (anim === 'reveal') this.reveal = 0;
    else this.morph = 0;
    this.tick();
  }

  private duration(): number {
    const a = this.opts.animation ?? true;
    return a === false ? 0 : typeof a === 'object' ? (a.duration ?? 800) : 800;
  }

  private tick(): void {
    cancelAnimationFrame(this.raf);
    this.raf = requestAnimationFrame((now) => {
      const k = Math.min(1, (now - this.animStart) / this.duration());
      const e = easeOutCubic(k);
      if (this.animKind === 'reveal') this.reveal = e;
      else this.morph = e;
      this.draw();
      if (k < 1) this.tick();
      else this.animKind = null;
    });
  }

  // ------------------------------------------------------------------ layout & scales

  private resize(): void {
    const r = this.plotEl.getBoundingClientRect();
    this.dpr = window.devicePixelRatio || 1;
    this.width = Math.max(1, Math.floor(r.width));
    this.height = Math.max(1, Math.floor(r.height));
    this.canvas.width = Math.round(this.width * this.dpr);
    this.canvas.height = Math.round(this.height * this.dpr);
    this.canvas.style.width = `${this.width}px`;
    this.canvas.style.height = `${this.height}px`;
    this.layout();
    this.draw();
  }

  private get xView(): [number, number] {
    return this.view ?? this.dataX;
  }

  private axisOpts(which: 'x' | 'y' | 'y2'): AxisOptions & XAxisOptions {
    const o = this.opts;
    if (which === 'x') return { show: true, grid: true, ...(o.xAxis ?? {}) } as AxisOptions & XAxisOptions;
    if (which === 'y') return { show: true, grid: true, ...(o.yAxis ?? {}) } as AxisOptions & XAxisOptions;
    return { show: true, grid: false, ...(o.y2Axis ?? {}) } as AxisOptions & XAxisOptions;
  }

  private fmtY(v: number, which: 'y' | 'y2'): string {
    const f = this.axisOpts(which).format;
    if (f) return (f as (v: number) => string)(v);
    if (this.opts.stacked === 'percent') return `${+v.toFixed(0)}%`;
    // below 10 000, show as many decimals as the tick step needs (100.25, 100.5… not 100, 101, 101)
    const d = which === 'y' ? this.yLeft : this.yRight;
    const step = d && d.ticks.length > 1 ? Math.abs(d.ticks[1] - d.ticks[0]) : 0;
    if (!this.logBase(which === 'y' ? 'left' : 'right') && step > 0 && step < 1 && Math.abs(v) < 1e4) {
      let dec = 0;
      while (dec < 6 && Math.abs(Math.round(step * 10 ** dec) - step * 10 ** dec) > 1e-6) dec++;
      return v.toFixed(dec);
    }
    return formatCompact(v);
  }

  private layout(): void {
    const ctx = this.ctx;
    const pad = this.opts.padding ?? 8;
    const ya = this.axisOpts('y');
    const y2a = this.axisOpts('y2');
    const xa = this.axisOpts('x');
    // first pass with a provisional plot height for tick counts
    this.plot = { x: pad, y: pad + 6, w: Math.max(1, this.width - pad * 2), h: Math.max(1, this.height - pad * 2 - 30) };
    const xr = this.xView;
    this.yLeft = this.domain('left', ya, xr) ?? { min: 0, max: 1, ticks: [] };
    this.yRight = this.domain('right', y2a, xr);
    ctx.font = `11px ${this.theme.font}`;
    const widthOf = (d: Domain | null, which: 'y' | 'y2'): number => (d ? Math.max(...d.ticks.map((t) => ctx.measureText(this.fmtY(t, which)).width), 10) + 10 : 0);
    const left = ya.show ? widthOf(this.yLeft, 'y') + (ya.title ? 16 : 0) : 0;
    const right = (this.yRight && y2a.show ? widthOf(this.yRight, 'y2') + (y2a.title ? 16 : 0) : 0) + this.endLabelRoom();
    const slider = typeof this.opts.zoom === 'object' && this.opts.zoom.slider;
    const bottom = (xa.show ? 22 + (xa.title ? 16 : 0) : 4) + (slider ? 44 : 0);
    const x2 = this.opts.x2Axis;
    const x2Room = x2 && x2.show !== false ? 22 + (x2.title ? 16 : 0) : 0;
    // room above the plot for value labels, or for the max / min pins
    const pins = this.model.some((s) => !s.hidden && (s.src.marks?.max || s.src.marks?.min));
    const top = (pins ? 40 : this.model.some((s) => s.labels && !s.hidden) ? 18 : 8) + x2Room;
    this.plot = {
      x: pad + left,
      y: pad + top,
      w: Math.max(10, this.width - pad * 2 - left - right - (right ? 0 : 6)),
      h: Math.max(10, this.height - pad * 2 - bottom - top),
    };
    this.sliderRect = slider ? { x: this.plot.x, y: this.height - pad - 32, w: this.plot.w, h: 30 } : null;
    // polar: the whole area, centered (no side axes)
    if (this.polarCfg) this.plot = { x: pad, y: pad + 4, w: Math.max(10, this.width - pad * 2), h: Math.max(10, this.height - pad * 2 - 8) };
    // recompute y domains with the real height (tick count)
    this.yLeft = this.domain('left', ya, xr) ?? this.yLeft;
    this.yRight = this.domain('right', y2a, xr);
  }

  /** width needed on the right for end labels */
  private endLabelRoom(): number {
    const ctx = this.ctx;
    ctx.font = `600 12px ${this.theme.font}`;
    let w = 0;
    for (const s of this.model) {
      if (s.hidden || !s.src.endLabel) continue;
      const last = this.lastPoint(s);
      if (last) w = Math.max(w, ctx.measureText(this.endLabelText(s, last.raw)).width + 14);
    }
    ctx.font = `11px ${this.theme.font}`;
    return w;
  }

  private endLabelText(s: NSeries, v: number): string {
    const cfg = s.src.endLabel;
    return typeof cfg === 'object' && cfg.format ? cfg.format(s.src.name, v) : s.src.name;
  }

  /** last non-null point of a series (inside the view) */
  private lastPoint(s: NSeries): { i: number; raw: number } | null {
    const b = this.xView[1];
    for (let i = s.xs.length - 1; i >= 0; i--) {
      if (s.xs[i] > b + 1e-9) continue;
      const v = s.ys[i];
      if (v !== null && s.top[i] !== null) return { i, raw: v };
    }
    return null;
  }

  private xToPx(x: number): number {
    const [a, b] = this.xView;
    const ca = this.xc(a);
    const cb = this.xc(b);
    return this.lens(this.plot.x + ((this.xc(x) - ca) / (cb - ca || 1)) * this.plot.w);
  }

  private pxToX(px: number): number {
    const [a, b] = this.xView;
    const ca = this.xc(a);
    const cb = this.xc(b);
    return this.xu(ca + ((this.unlens(px) - this.plot.x) / this.plot.w) * (cb - ca));
  }

  /** x without the time hidden by axis breaks */
  private xc(x: number): number {
    let c = x;
    for (const [f, t] of this.breaks) {
      if (x >= t) c -= t - f;
      else if (x > f) c -= x - f;
    }
    return c;
  }

  /** inverse of xc */
  private xu(c: number): number {
    let x = c;
    for (const [f, t] of this.breaks) {
      if (x >= f) x += t - f;
      else break;
    }
    return x;
  }

  private insideBreak(x: number): boolean {
    return this.breaks.some(([f, t]) => x > f && x < t);
  }

  private lensCfg(): { r: number; k: number } | null {
    const f = this.opts.fisheye;
    if (!f || this.lensX === null) return null;
    const o = typeof f === 'object' ? f : {};
    return { r: o.radius ?? 120, k: o.strength ?? 3 };
  }

  /** fisheye: widens the x axis around the mouse (continuous and monotone, so nothing crosses) */
  private lens(px: number): number {
    const L = this.lensCfg();
    if (!L) return px;
    const d = px - this.lensX!;
    const t = Math.abs(d) / L.r;
    if (t >= 1) return px;
    return this.lensX! + Math.sign(d) * (((L.k + 1) * t) / (L.k * t + 1)) * L.r;
  }

  private unlens(px: number): number {
    const L = this.lensCfg();
    if (!L) return px;
    const d = px - this.lensX!;
    const u = Math.abs(d) / L.r;
    if (u >= 1) return px;
    return this.lensX! + Math.sign(d) * (u / (L.k + 1 - L.k * u)) * L.r;
  }

  /** px → y value (inverse of yToPx, log and inverse aware) */
  private pyToY(py: number, axis: 'left' | 'right'): number {
    const d = this.dom(axis);
    const ao = this.axisOpts(axis === 'left' ? 'y' : 'y2');
    const t = ao.inverse ? (py - this.plot.y) / this.plot.h : (this.plot.y + this.plot.h - py) / this.plot.h;
    const base = this.logBase(axis);
    if (base) {
      const l0 = Math.log(d.min) / Math.log(base);
      const l1 = Math.log(d.max) / Math.log(base);
      return Math.pow(base, l0 + t * (l1 - l0));
    }
    return d.min + t * (d.max - d.min);
  }

  /** log base of an axis, or 0 when linear */
  private logBase(axis: 'left' | 'right'): number {
    const l = this.axisOpts(axis === 'left' ? 'y' : 'y2').log;
    return l === true ? 10 : typeof l === 'number' && l > 1 ? l : 0;
  }

  /** Convert a position in px (relative to the chart) to data values. */
  toData(px: number, py: number, axis: 'left' | 'right' = 'left'): { x: number; y: number } {
    return { x: this.pxToX(px), y: this.pyToY(py, axis) };
  }

  /** Convert data values to a position in px (relative to the chart). */
  toPixel(x: LineX, y: number, axis: 'left' | 'right' = 'left'): { x: number; y: number } {
    return { x: this.xToPx(this.xValue(x)), y: this.yToPx(y, axis) };
  }

  /** animated y domain of an axis */
  private dom(axis: 'left' | 'right'): Domain {
    const to = axis === 'left' ? this.yLeft : (this.yRight ?? this.yLeft);
    const from = axis === 'left' ? this.fromLeft : this.fromRight;
    if (this.animKind !== 'morph' || !from) return to;
    const e = this.morph;
    return { min: from.min + (to.min - from.min) * e, max: from.max + (to.max - from.max) * e, ticks: to.ticks };
  }

  private yToPx(y: number, axis: 'left' | 'right'): number {
    const d = this.dom(axis);
    const base = this.logBase(axis);
    const t = base
      ? y > 0
        ? (Math.log(y) - Math.log(d.min)) / (Math.log(d.max) - Math.log(d.min) || 1)
        : -0.05
      : (y - d.min) / (d.max - d.min || 1);
    // inverse: smallest value on top (rankings)
    return this.axisOpts(axis === 'left' ? 'y' : 'y2').inverse ? this.plot.y + t * this.plot.h : this.plot.y + this.plot.h - t * this.plot.h;
  }

  /** pixel span of an x range (sorted) */
  private xSpan(from: LineX, to: LineX): [number, number] {
    const a = this.xToPx(this.xValue(from));
    const b = this.xToPx(this.xValue(to));
    return [Math.min(a, b), Math.max(a, b)];
  }

  /** drawn value of point i of a series (morph-aware) */
  private yAt(s: NSeries, i: number): number | null {
    const to = s.top[i];
    if (this.animKind !== 'morph' || to === null) return to;
    const from = this.fromTop.get(s.key);
    const f = from && from.length === s.top.length ? from[i] : null;
    return f === null || f === undefined ? to : f + (to - f) * this.morph;
  }

  private xTicks(): Tick[] {
    const xa = this.axisOpts('x');
    const [a, b] = this.xView;
    const max = xa.ticks ?? Math.max(2, Math.floor(this.plot.w / 90));
    const fmt = xa.format as ((x: number, c?: string) => string) | undefined;
    if (this.xType === 'category') {
      const first = Math.max(0, Math.ceil(a));
      const last = Math.min(this.categories.length - 1, Math.floor(b));
      const step = Math.max(1, Math.ceil((last - first + 1) / max));
      const out: Tick[] = [];
      for (let i = first; i <= last; i += step) out.push({ value: i, label: fmt ? fmt(i, this.categories[i]) : this.categories[i] });
      return out;
    }
    // with breaks the visible span is shorter than the real one: ask for proportionally more ticks
    const k = this.breaks.length ? (b - a) / Math.max(1e-9, this.xc(b) - this.xc(a)) : 1;
    if (this.xType === 'time') return timeTicks(a, b, Math.round(max * k)).filter((t) => !this.insideBreak(t.value)).map((t) => (fmt ? { ...t, label: fmt(t.value) } : t));
    return niceScale(a, b, Math.round(max * k))
      .ticks.filter((t) => t >= a && t <= b && !this.insideBreak(t))
      .map((t) => ({ value: t, label: fmt ? fmt(t) : formatCompact(t) }));
  }

  /** label for a hovered x */
  private xLabel(x: number): string {
    const fmt = this.axisOpts('x').format as ((x: number, c?: string) => string) | undefined;
    if (this.xType === 'category') return fmt ? fmt(x, this.categories[x]) : (this.categories[x] ?? String(x));
    if (fmt) return fmt(x);
    if (this.xType === 'time') {
      const xs = this.model.find((s) => !s.hidden && s.xs.length > 1)?.xs ?? [];
      const spacing = xs.length > 1 ? (xs[xs.length - 1] - xs[0]) / (xs.length - 1) : 86400;
      return formatTooltipTime(x, spacing);
    }
    return formatCompact(x);
  }

  // ------------------------------------------------------------------ drawing

  private draw(): void {
    const ctx = this.ctx;
    const t = this.theme;
    const P = this.plot;
    ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
    ctx.clearRect(0, 0, this.width, this.height);
    if (t.background !== 'transparent') {
      ctx.fillStyle = t.background;
      ctx.fillRect(0, 0, this.width, this.height);
    }
    if (this.polarCfg) {
      this.drawPolar();
      this.drawGraphic();
      return;
    }
    const visible = this.model.filter((s) => !s.hidden);
    const xTicks = this.xTicks();

    this.drawGrid(xTicks);
    this.drawBands();

    if (!visible.length || visible.every((s) => !s.xs.length)) {
      ctx.fillStyle = t.muted;
      ctx.font = `13px ${t.font}`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(this.opts.emptyText ?? 'Sem dados', P.x + P.w / 2, P.y + P.h / 2);
      this.drawAxes(xTicks);
      return;
    }

    ctx.save();
    ctx.beginPath();
    ctx.rect(P.x - 2, P.y - 20, P.w * this.reveal + 4, P.h + 22);
    ctx.clip();
    const dimOthers = (s: NSeries): number => (this.highlighted && this.highlighted !== s.key ? (this.opts.hoverDim ?? 0.25) : 1);
    // bands, then areas (stack order), then lines on top
    for (const s of visible) if (s.bandLo) this.drawBand(s, dimOthers(s));
    for (const s of visible) if (s.area) this.drawArea(s, dimOthers(s));
    for (const s of visible) this.drawLine(s, dimOthers(s));
    for (const s of visible) if (s.points) this.drawPoints(s, dimOthers(s));
    for (const s of visible) if (s.labels) this.drawDataLabels(s, dimOthers(s));
    ctx.restore();

    // outside the clip: they may stick out of the plot (pins above the highest point, names on the right)
    for (const s of visible) if (s.src.marks) this.drawMarks(s, dimOthers(s));
    this.drawEndLabels(visible.filter((s) => s.src.endLabel), dimOthers);

    this.drawReferenceLines();
    this.drawGraphic();
    this.drawAxes(xTicks);
    this.drawHover();
    this.drawSlider();
  }

  /** user drawing hook (`graphic`) */
  private drawGraphic(): void {
    const g = this.opts.graphic;
    if (!g) return;
    const api: LineGraphicApi = {
      plot: { ...this.plot },
      width: this.width,
      height: this.height,
      theme: this.theme,
      x: (v) => this.xToPx(this.xValue(v)),
      y: (v, axis = 'left') => this.yToPx(v, axis),
      toData: (px, py) => this.toData(px, py),
    };
    this.ctx.save();
    g(this.ctx, api);
    this.ctx.restore();
  }

  // ------------------------------------------------------------------ polar

  private get polarCfg(): { start: number; cw: boolean } | null {
    const p = this.opts.polar;
    if (!p) return null;
    const o = typeof p === 'object' ? p : {};
    return { start: o.startAngle ?? 90, cw: o.clockwise ?? true };
  }

  private polarGeom(): { cx: number; cy: number; R: number } {
    const P = this.plot;
    return { cx: P.x + P.w / 2, cy: P.y + P.h / 2, R: Math.max(10, Math.min(P.w, P.h) / 2 - 24) };
  }

  /** (angle value, radius value) → px */
  private polarPt(x: number, y: number): { x: number; y: number } {
    const { cx, cy, R } = this.polarGeom();
    const [a, b] = this.dataX;
    const d = this.dom('left');
    const pc = this.polarCfg!;
    const deg = pc.start + (pc.cw ? -1 : 1) * ((x - a) / (b - a || 1)) * 360;
    const th = (-deg * Math.PI) / 180;
    const r = Math.max(0, (y - d.min) / (d.max - d.min || 1)) * R * this.reveal;
    return { x: cx + Math.cos(th) * r, y: cy + Math.sin(th) * r };
  }

  private drawPolar(): void {
    const ctx = this.ctx;
    const t = this.theme;
    const { cx, cy, R } = this.polarGeom();
    const d = this.dom('left');
    const [a, b] = this.dataX;
    const xa = this.axisOpts('x');
    const fmtX = xa.format as ((x: number) => string) | undefined;
    ctx.save();
    // radius circles
    ctx.strokeStyle = t.grid;
    ctx.lineWidth = 1;
    for (const v of this.yLeft.ticks) {
      const r = ((v - d.min) / (d.max - d.min || 1)) * R;
      if (r <= 0.5) continue;
      ctx.beginPath();
      ctx.arc(cx, cy, r, 0, Math.PI * 2);
      ctx.stroke();
    }
    ctx.strokeStyle = t.axis;
    ctx.beginPath();
    ctx.arc(cx, cy, R, 0, Math.PI * 2);
    ctx.stroke();
    // angle spokes and labels
    const full = Math.abs(b - a - 360) < 1e-9 || b - a >= 360;
    const angTicks = niceScale(a, b, 12).ticks.filter((v) => v >= a - 1e-9 && (full ? v < b - 1e-9 : v <= b + 1e-9));
    ctx.font = `11px ${t.font}`;
    ctx.fillStyle = t.muted;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    const pc = this.polarCfg!;
    for (const v of angTicks) {
      const deg = pc.start + (pc.cw ? -1 : 1) * ((v - a) / (b - a || 1)) * 360;
      const th = (-deg * Math.PI) / 180;
      ctx.strokeStyle = t.grid;
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.lineTo(cx + Math.cos(th) * R, cy + Math.sin(th) * R);
      ctx.stroke();
      ctx.fillText(fmtX ? fmtX(v) : formatCompact(v), cx + Math.cos(th) * (R + 14), cy + Math.sin(th) * (R + 14));
    }
    // radius labels along the start spoke
    const th0 = (-pc.start * Math.PI) / 180;
    ctx.textAlign = 'left';
    for (const v of this.yLeft.ticks) {
      const r = ((v - d.min) / (d.max - d.min || 1)) * R;
      ctx.fillText(this.fmtY(v, 'y'), cx + Math.cos(th0) * r + 4, cy + Math.sin(th0) * r + 8);
    }
    // series (straight segments; the curve options follow the x axis and do not apply here)
    const visible = this.model.filter((s) => !s.hidden);
    for (const s of visible) {
      const dim = this.highlighted && this.highlighted !== s.key ? (this.opts.hoverDim ?? 0.25) : 1;
      const pts: { x: number; y: number }[][] = [[]];
      s.xs.forEach((x, i) => {
        const v = this.yAt(s, i);
        if (v === null) {
          if (pts[pts.length - 1].length) pts.push([]);
          return;
        }
        pts[pts.length - 1].push(this.polarPt(x, v));
      });
      ctx.globalAlpha = dim;
      if (s.area) {
        ctx.fillStyle = alpha(s.color, s.area.opacity);
        for (const run of pts) {
          if (run.length < 2) continue;
          ctx.beginPath();
          ctx.moveTo(cx, cy);
          for (const p of run) ctx.lineTo(p.x, p.y);
          ctx.closePath();
          ctx.fill();
        }
      }
      if (s.width > 0) {
        ctx.strokeStyle = s.color;
        ctx.lineWidth = s.width;
        ctx.lineJoin = 'round';
        ctx.setLineDash(s.dash);
        ctx.beginPath();
        for (const run of pts) run.forEach((p, i) => (i ? ctx.lineTo(p.x, p.y) : ctx.moveTo(p.x, p.y)));
        ctx.stroke();
        ctx.setLineDash([]);
      }
      if (s.points) for (const run of pts) for (const p of run) this.marker(p.x, p.y, s.points.size, s.points.shape, s.points.color ?? s.color, s.points.hollow);
      ctx.globalAlpha = 1;
    }
    // hover
    for (const p of this.hover?.points ?? []) {
      const pt = this.polarPt(p.x, p.drawnY);
      ctx.beginPath();
      ctx.arc(pt.x, pt.y, 6, 0, Math.PI * 2);
      ctx.fillStyle = alpha(p.color, 0.25);
      ctx.fill();
      ctx.beginPath();
      ctx.arc(pt.x, pt.y, 3.5, 0, Math.PI * 2);
      ctx.fillStyle = p.color;
      ctx.fill();
    }
    ctx.restore();
  }

  /** nearest point on screen (polar) */
  private polarHit(mx: number, my: number): { x: number; points: LineHoverPoint[] } | null {
    let best: LineHoverPoint | null = null;
    let bestD = 24;
    for (const s of this.model) {
      if (s.hidden) continue;
      s.xs.forEach((x, i) => {
        const y = s.ys[i];
        const top = s.top[i];
        if (y === null || top === null) return;
        const pt = this.polarPt(x, top);
        const dd = Math.hypot(pt.x - mx, pt.y - my);
        if (dd < bestD) ((bestD = dd), (best = { series: s.src, seriesIndex: s.index, index: i, x, y, color: this.colorAt(s, y), drawnY: top }));
      });
    }
    return best ? { x: (best as LineHoverPoint).x, points: [best] } : null;
  }

  private drawGrid(ticks: Tick[]): void {
    const ctx = this.ctx;
    const P = this.plot;
    const px = (v: number): number => (Math.round(v * this.dpr) + 0.5) / this.dpr;
    ctx.save();
    ctx.strokeStyle = this.theme.grid;
    ctx.lineWidth = 1 / this.dpr;
    ctx.beginPath();
    if (this.axisOpts('x').grid) for (const tk of ticks) {
      const x = px(this.xToPx(tk.value));
      if (x < P.x || x > P.x + P.w) continue;
      ctx.moveTo(x, P.y);
      ctx.lineTo(x, P.y + P.h);
    }
    if (this.axisOpts('y').grid) for (const v of this.yLeft.ticks) {
      const y = px(this.yToPx(v, 'left'));
      ctx.moveTo(P.x, y);
      ctx.lineTo(P.x + P.w, y);
    }
    if (this.yRight && this.axisOpts('y2').grid) for (const v of this.yRight.ticks) {
      const y = px(this.yToPx(v, 'right'));
      ctx.moveTo(P.x, y);
      ctx.lineTo(P.x + P.w, y);
    }
    ctx.stroke();
    // fisheye: soft band showing where the lens is
    const L = this.lensCfg();
    if (L) {
      const g = ctx.createLinearGradient(this.lensX! - L.r, 0, this.lensX! + L.r, 0);
      g.addColorStop(0, alpha(this.theme.crosshair, 0));
      g.addColorStop(0.5, alpha(this.theme.crosshair, 0.09));
      g.addColorStop(1, alpha(this.theme.crosshair, 0));
      ctx.fillStyle = g;
      ctx.fillRect(Math.max(P.x, this.lensX! - L.r), P.y, Math.min(P.x + P.w, this.lensX! + L.r) - Math.max(P.x, this.lensX! - L.r), P.h);
    }
    // axis breaks: dashed line and a small zigzag on the x axis
    const [va, vb] = this.xView;
    ctx.strokeStyle = alpha(this.theme.muted, 0.7);
    ctx.lineWidth = 1;
    for (const [f] of this.breaks) {
      if (f <= va || f >= vb) continue;
      const x = px(this.xToPx(f));
      ctx.setLineDash([3, 4]);
      ctx.beginPath();
      ctx.moveTo(x, P.y);
      ctx.lineTo(x, P.y + P.h);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.beginPath();
      const yb = P.y + P.h;
      ctx.moveTo(x - 5, yb + 4);
      ctx.lineTo(x - 2, yb - 4);
      ctx.moveTo(x + 2, yb + 4);
      ctx.lineTo(x + 5, yb - 4);
      ctx.stroke();
    }
    ctx.restore();
  }

  private drawBands(): void {
    const ctx = this.ctx;
    const P = this.plot;
    for (const b of this.opts.annotations?.xBands ?? []) {
      const [x1, x2] = this.xSpan(b.from, b.to);
      const l = Math.max(P.x, x1);
      const r = Math.min(P.x + P.w, x2);
      if (r <= l) continue;
      const color = b.color ?? '#ff9800';
      ctx.fillStyle = alpha(color, 0.12);
      ctx.fillRect(l, P.y, r - l, P.h);
      if (b.label) {
        ctx.font = `600 11px ${this.theme.font}`;
        ctx.fillStyle = alpha(color, 0.95);
        ctx.textAlign = 'center';
        ctx.textBaseline = 'top';
        ctx.fillText(b.label, (l + r) / 2, P.y + 4);
      }
    }
    for (const b of this.opts.annotations?.bands ?? []) {
      const axis = b.axis ?? 'left';
      if (axis === 'right' && !this.yRight) continue;
      const y1 = this.yToPx(b.from, axis);
      const y2 = this.yToPx(b.to, axis);
      const color = b.color ?? '#2962ff';
      ctx.fillStyle = alpha(color, 0.1);
      ctx.fillRect(P.x, Math.min(y1, y2), P.w, Math.abs(y2 - y1));
      if (b.label) {
        ctx.font = `600 11px ${this.theme.font}`;
        ctx.fillStyle = alpha(color, 0.9);
        ctx.textAlign = 'left';
        ctx.textBaseline = 'top';
        ctx.fillText(b.label, P.x + 6, Math.min(y1, y2) + 4);
      }
    }
  }

  /** visible index range of a series (one extra point each side for continuity) */
  /** index of the point closest to x (binary search, or a scan when the series keeps its data order) */
  private nearest(s: NSeries, x: number): number {
    if (s.sorted) return nearestIndex(s.xs, x);
    let best = 0;
    for (let i = 1; i < s.xs.length; i++) if (Math.abs(s.xs[i] - x) < Math.abs(s.xs[best] - x)) best = i;
    return best;
  }

  private range(s: NSeries): [number, number] {
    const [a, b] = this.xView;
    if (!s.xs.length) return [0, -1];
    if (!s.sorted) return [0, s.xs.length - 1];
    const i0 = Math.max(0, this.nearest(s, a) - 1);
    const i1 = Math.min(s.xs.length - 1, this.nearest(s, b) + 1);
    return [i0, i1];
  }

  /** split a series into drawable runs of screen points (breaks at nulls unless spanGaps) */
  private runs(s: NSeries, values: (i: number) => number | null): { x: number; y: number }[][] {
    const [i0, i1] = this.range(s);
    const runs: { x: number; y: number }[][] = [];
    let cur: { x: number; y: number }[] = [];
    for (let i = i0; i <= i1; i++) {
      const v = values(i);
      if (v === null) {
        if (!this.opts.spanGaps && cur.length) {
          runs.push(cur);
          cur = [];
        }
        continue;
      }
      cur.push({ x: this.xToPx(s.xs[i]), y: this.yToPx(v, s.axis) });
    }
    if (cur.length) runs.push(cur);
    return runs;
  }

  private trace(pts: { x: number; y: number }[], curve: LineCurve, move = true): void {
    const ctx = this.ctx;
    if (!pts.length) return;
    if (move) ctx.moveTo(pts[0].x, pts[0].y);
    else ctx.lineTo(pts[0].x, pts[0].y);
    if (curve === 'step' || curve === 'step-end') {
      for (let i = 1; i < pts.length; i++) {
        ctx.lineTo(pts[i].x, pts[i - 1].y);
        ctx.lineTo(pts[i].x, pts[i].y);
      }
    } else if (curve === 'step-start') {
      for (let i = 1; i < pts.length; i++) {
        ctx.lineTo(pts[i - 1].x, pts[i].y);
        ctx.lineTo(pts[i].x, pts[i].y);
      }
    } else if (curve === 'step-middle') {
      for (let i = 1; i < pts.length; i++) {
        const mid = (pts[i - 1].x + pts[i].x) / 2;
        ctx.lineTo(mid, pts[i - 1].y);
        ctx.lineTo(mid, pts[i].y);
        ctx.lineTo(pts[i].x, pts[i].y);
      }
    } else if (curve === 'smooth' && pts.length > 2) {
      const m = monotoneTangents(pts.map((p) => p.x), pts.map((p) => p.y));
      for (let i = 0; i < pts.length - 1; i++) {
        const dx = (pts[i + 1].x - pts[i].x) / 3;
        ctx.bezierCurveTo(pts[i].x + dx, pts[i].y + m[i] * dx, pts[i + 1].x - dx, pts[i + 1].y - m[i + 1] * dx, pts[i + 1].x, pts[i + 1].y);
      }
    } else for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i].x, pts[i].y);
  }

  private drawLine(s: NSeries, opacity: number): void {
    const ctx = this.ctx;
    // width 0 = area only (canvas would ignore lineWidth 0 and keep the previous width)
    if (s.width <= 0) return;
    ctx.save();
    ctx.globalAlpha = opacity;
    ctx.strokeStyle = this.lineGradient(s) ?? s.color;
    ctx.lineWidth = s.width + (this.highlighted === s.key ? 1 : 0);
    const sh = s.src.shadow;
    if (sh) {
      const c = typeof sh === 'object' ? sh : {};
      ctx.shadowColor = c.color ?? alpha(s.color, 0.55);
      ctx.shadowBlur = c.blur ?? 10;
      ctx.shadowOffsetY = c.offsetY ?? 6;
    }
    ctx.lineJoin = 'round';
    ctx.lineCap = 'round';
    ctx.setLineDash(s.dash);
    const runs = this.runs(s, (i) => this.yAt(s, i));
    const path = (): void => {
      ctx.beginPath();
      for (const run of runs) this.trace(run, s.curve);
    };
    path();
    ctx.stroke();
    // pieces: the same path again, clipped to each x range, in the piece color
    for (const pc of s.src.pieces ?? []) {
      const [x1, x2] = this.xSpan(pc.from, pc.to);
      ctx.save();
      ctx.beginPath();
      ctx.rect(x1, this.plot.y - 10, x2 - x1, this.plot.h + 20);
      ctx.clip();
      ctx.strokeStyle = pc.color;
      ctx.lineCap = 'butt';
      path();
      ctx.stroke();
      ctx.restore();
    }
    // value pieces: clipped to horizontal bands of values
    if (s.src.valuePieces?.length) {
      const d = this.dom(s.axis);
      const pad = (d.max - d.min) * 2 || 1;
      for (const vp of s.src.valuePieces) {
        const lo = Math.max(vp.from ?? -Infinity, d.min - pad);
        const hi = Math.min(vp.to ?? Infinity, d.max + pad);
        if (hi <= lo) continue;
        const y1 = this.yToPx(lo, s.axis);
        const y2 = this.yToPx(hi, s.axis);
        ctx.save();
        ctx.beginPath();
        ctx.rect(this.plot.x - 10, Math.min(y1, y2), this.plot.w + 20, Math.abs(y2 - y1));
        ctx.clip();
        ctx.strokeStyle = vp.color;
        path();
        ctx.stroke();
        ctx.restore();
      }
    }
    ctx.restore();
  }

  /** color of a value (valuePieces), for tooltips and hover dots */
  private colorAt(s: NSeries, y: number): string {
    const vp = s.src.valuePieces?.find((p) => y >= (p.from ?? -Infinity) && y <= (p.to ?? Infinity));
    return vp?.color ?? s.color;
  }

  /** shaded band between `band.lower` and `band.upper` */
  private drawBand(s: NSeries, opacity: number): void {
    const ctx = this.ctx;
    const b = s.src.band!;
    const [i0, i1] = this.range(s);
    ctx.save();
    ctx.globalAlpha = opacity;
    ctx.fillStyle = alpha(b.color ?? s.color, b.opacity ?? 0.18);
    let run: number[] = [];
    const flush = (): void => {
      if (run.length > 1) {
        const up = run.map((i) => ({ x: this.xToPx(s.xs[i]), y: this.yToPx(s.bandHi![i]!, s.axis) }));
        const down = run.map((i) => ({ x: this.xToPx(s.xs[i]), y: this.yToPx(s.bandLo![i]!, s.axis) })).reverse();
        ctx.beginPath();
        this.trace(up, s.curve);
        this.trace(down, s.curve, false);
        ctx.closePath();
        ctx.fill();
      }
      run = [];
    };
    for (let i = i0; i <= i1; i++) {
      if (s.bandLo![i] === null || s.bandHi![i] === null) flush();
      else run.push(i);
    }
    flush();
    ctx.restore();
  }

  /** stroke gradient of `lineGradient` (by value: bottom → top, by x: left → right) */
  private lineGradient(s: NSeries): CanvasGradient | null {
    const lg = s.src.lineGradient;
    if (!lg || !lg.colors.length) return null;
    const ctx = this.ctx;
    const cols = lg.colors.length === 1 ? [lg.colors[0], lg.colors[0]] : lg.colors;
    let g: CanvasGradient;
    if (lg.by === 'x') {
      const [i0, i1] = [0, s.xs.length - 1];
      g = ctx.createLinearGradient(this.xToPx(s.xs[i0] ?? 0), 0, this.xToPx(s.xs[i1] ?? 1), 0);
    } else {
      const vals = s.top.filter((v): v is number => v !== null);
      const lo = lg.min ?? Math.min(...vals);
      const hi = lg.max ?? Math.max(...vals);
      const y0 = this.yToPx(lo, s.axis);
      const y1 = this.yToPx(hi, s.axis);
      g = ctx.createLinearGradient(0, y0, 0, y1 === y0 ? y0 - 1 : y1);
    }
    cols.forEach((c, i) => g.addColorStop(i / (cols.length - 1), c));
    return g;
  }

  private drawArea(s: NSeries, opacity: number): void {
    const ctx = this.ctx;
    const cfg = s.area!;
    const P = this.plot;
    const d = this.dom(s.axis);
    const zeroY = this.yToPx(Math.min(Math.max(0, d.min), d.max), s.axis);
    ctx.save();
    ctx.globalAlpha = opacity;
    if (Array.isArray(cfg.gradient) && cfg.gradient.length) {
      // own colors, top → bottom, at full strength (opacity still applies through `opacity`)
      const g = ctx.createLinearGradient(0, P.y, 0, P.y + P.h);
      const cols = cfg.gradient.length === 1 ? [cfg.gradient[0], cfg.gradient[0]] : cfg.gradient;
      cols.forEach((c, i) => g.addColorStop(i / (cols.length - 1), c));
      ctx.globalAlpha = opacity * cfg.opacity;
      ctx.fillStyle = g;
    } else if (cfg.gradient) {
      const g = ctx.createLinearGradient(0, P.y, 0, P.y + P.h);
      g.addColorStop(0, alpha(s.color, cfg.opacity));
      g.addColorStop(1, alpha(s.color, cfg.opacity * 0.08));
      ctx.fillStyle = g;
    } else ctx.fillStyle = alpha(s.color, cfg.opacity);
    if (cfg.ranges?.length) {
      // fill only inside the given x ranges
      ctx.beginPath();
      for (const [from, to] of cfg.ranges) {
        const [x1, x2] = this.xSpan(from, to);
        ctx.rect(x1, P.y - 2, x2 - x1, P.h + 4);
      }
      ctx.clip();
    }
    for (const run of this.runs(s, (i) => this.yAt(s, i))) {
      ctx.beginPath();
      this.trace(run, s.curve);
      if (s.base) {
        // back along the stacked base
        const [i0, i1] = this.range(s);
        const xs = run.map((p) => p.x);
        const basePts: { x: number; y: number }[] = [];
        for (let i = i0; i <= i1; i++) {
          const x = this.xToPx(s.xs[i]);
          if (x >= xs[0] - 0.5 && x <= xs[xs.length - 1] + 0.5) basePts.push({ x, y: this.yToPx(s.base[i], s.axis) });
        }
        basePts.reverse();
        this.trace(basePts, s.curve === 'smooth' ? 'smooth' : s.curve, false);
      } else {
        ctx.lineTo(run[run.length - 1].x, zeroY);
        ctx.lineTo(run[0].x, zeroY);
      }
      ctx.closePath();
      ctx.fill();
    }
    ctx.restore();
  }

  private marker(x: number, y: number, size: number, shape: PointShape, color: string, hollow: boolean, border?: { color: string; width: number }): void {
    const ctx = this.ctx;
    ctx.beginPath();
    if (shape === 'square') ctx.rect(x - size, y - size, size * 2, size * 2);
    else if (shape === 'diamond') {
      ctx.moveTo(x, y - size * 1.3);
      ctx.lineTo(x + size * 1.3, y);
      ctx.lineTo(x, y + size * 1.3);
      ctx.lineTo(x - size * 1.3, y);
      ctx.closePath();
    } else if (shape === 'triangle') {
      ctx.moveTo(x, y - size * 1.3);
      ctx.lineTo(x + size * 1.2, y + size);
      ctx.lineTo(x - size * 1.2, y + size);
      ctx.closePath();
    } else ctx.arc(x, y, size, 0, Math.PI * 2);
    if (hollow) {
      ctx.fillStyle = this.theme.background === 'transparent' ? '#ffffff' : this.theme.background;
      ctx.fill();
      ctx.lineWidth = 2;
      ctx.strokeStyle = color;
      ctx.stroke();
    } else {
      ctx.fillStyle = color;
      ctx.fill();
      if (border) {
        ctx.lineWidth = border.width;
        ctx.strokeStyle = border.color;
        ctx.stroke();
      }
    }
  }

  private drawPoints(s: NSeries, opacity: number): void {
    const cfg = s.points!;
    const [i0, i1] = this.range(s);
    // skip markers when they would overlap (with the fisheye lens, only the magnified ones are drawn)
    const density = (i1 - i0 + 1) / Math.max(1, this.plot.w);
    const lens = density > 0.25 ? this.lensCfg() : null;
    if (density > 0.25 && !lens) return;
    this.ctx.save();
    this.ctx.globalAlpha = opacity;
    for (let i = i0; i <= i1; i++) {
      const v = this.yAt(s, i);
      if (v === null) continue;
      if (lens && Math.abs(this.xToPx(s.xs[i]) - this.lensX!) > lens.r * 0.8) continue;
      const border = cfg.borderColor ? { color: cfg.borderColor, width: cfg.borderWidth ?? 2 } : undefined;
      this.marker(this.xToPx(s.xs[i]), this.yToPx(v, s.axis), cfg.size, cfg.shape, cfg.color ?? (cfg.hollow ? s.color : this.colorAt(s, s.ys[i] ?? v)), cfg.hollow, border);
    }
    this.ctx.restore();
  }

  private fmtValue(v: number, s: LineSeries): string {
    return this.opts.valueFormatter ? this.opts.valueFormatter(v, s) : formatCompact(v);
  }

  private drawDataLabels(s: NSeries, opacity: number): void {
    const ctx = this.ctx;
    const [i0, i1] = this.range(s);
    if ((i1 - i0 + 1) * 28 > this.plot.w) return; // too dense
    ctx.save();
    ctx.globalAlpha = opacity;
    ctx.font = `600 11px ${this.theme.font}`;
    ctx.fillStyle = s.color;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'bottom';
    for (let i = i0; i <= i1; i++) {
      const raw = s.ys[i];
      const v = this.yAt(s, i);
      if (raw === null || v === null) continue;
      ctx.fillText(this.fmtValue(raw, s.src), this.xToPx(s.xs[i]), this.yToPx(v, s.axis) - 7);
    }
    ctx.restore();
  }

  /** pins on max / min and a dashed average line */
  private drawMarks(s: NSeries, opacity: number): void {
    const m = s.src.marks!;
    const ctx = this.ctx;
    const P = this.plot;
    const idx = s.ys.map((v, i) => (v === null || s.top[i] === null ? -1 : i)).filter((i) => i >= 0);
    if (!idx.length) return;
    ctx.save();
    ctx.globalAlpha = opacity * this.reveal;
    if (m.average) {
      const avg = idx.reduce((a, i) => a + s.ys[i]!, 0) / idx.length;
      // the average of the raw values; on stacked charts the line sits on the series' own scale
      const y = Math.round(this.yToPx(avg, s.axis)) + 0.5;
      ctx.strokeStyle = s.color;
      ctx.lineWidth = 1;
      ctx.setLineDash([5, 4]);
      ctx.beginPath();
      ctx.moveTo(P.x, y);
      ctx.lineTo(P.x + P.w, y);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.font = `600 11px ${this.theme.font}`;
      ctx.fillStyle = s.color;
      ctx.textAlign = 'right';
      ctx.textBaseline = 'bottom';
      ctx.fillText(`Média ${this.fmtValue(Math.round(avg * 100) / 100, s.src)}`, P.x + P.w - 4, y - 3);
    }
    const pin = (i: number): void => {
      const x = this.xToPx(s.xs[i]);
      if (x < P.x - 1 || x > P.x + P.w + 1) return;
      const y = this.yToPx(this.yAt(s, i) ?? s.top[i]!, s.axis);
      const text = this.fmtValue(s.ys[i]!, s.src);
      ctx.font = `700 10px ${this.theme.font}`;
      const r = Math.max(12, ctx.measureText(text).width / 2 + 5);
      // balloon above the point, or below when there is no room
      const up = y - r * 2.6 > 2;
      const cy = up ? y - r * 1.75 : y + r * 1.75;
      // tangent points of the lines from the tip to the circle
      const a = Math.acos(1 / 1.75);
      ctx.fillStyle = s.color;
      ctx.beginPath();
      if (up) ctx.arc(x, cy, r, Math.PI / 2 + a, Math.PI / 2 - a);
      else ctx.arc(x, cy, r, -Math.PI / 2 + a, -Math.PI / 2 - a);
      ctx.lineTo(x, y);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = '#ffffff';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(text, x, cy + 0.5);
    };
    if (m.max) pin(idx.reduce((b, i) => (s.ys[i]! > s.ys[b]! ? i : b), idx[0]));
    if (m.min) pin(idx.reduce((b, i) => (s.ys[i]! < s.ys[b]! ? i : b), idx[0]));
    ctx.restore();
  }

  /** names after the last point; labels that would overlap are pushed apart vertically */
  private drawEndLabels(list: NSeries[], dim: (s: NSeries) => number): void {
    const ctx = this.ctx;
    const items: { s: NSeries; x: number; y: number; ty: number; text: string }[] = [];
    for (const s of list) {
      const last = this.lastPoint(s);
      const v = last ? this.yAt(s, last.i) : null;
      if (!last || v === null) continue;
      const y = this.yToPx(v, s.axis);
      items.push({ s, x: this.xToPx(s.xs[last.i]), y, ty: y, text: this.endLabelText(s, last.raw) });
    }
    // relax: sort by y and keep at least `gap` px between neighbours, then pull the group back inside
    const gap = 15;
    items.sort((a, b) => a.y - b.y);
    for (let i = 1; i < items.length; i++) items[i].ty = Math.max(items[i].ty, items[i - 1].ty + gap);
    const overflow = items.length ? items[items.length - 1].ty - (this.plot.y + this.plot.h + 6) : 0;
    if (overflow > 0) {
      for (const it of items) it.ty -= overflow;
      for (let i = items.length - 2; i >= 0; i--) items[i].ty = Math.min(items[i].ty, items[i + 1].ty - gap);
    }
    ctx.save();
    ctx.font = `600 12px ${this.theme.font}`;
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    for (const it of items) {
      const cfg = it.s.src.endLabel;
      const color = (typeof cfg === 'object' && cfg.color) || it.s.color;
      ctx.globalAlpha = dim(it.s) * this.reveal;
      if (Math.abs(it.ty - it.y) > 1) {
        // short leader line when the label was moved
        ctx.strokeStyle = color;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(it.x + 2, it.y);
        ctx.lineTo(it.x + 6, it.ty);
        ctx.stroke();
      }
      ctx.fillStyle = color;
      ctx.fillText(it.text, it.x + 8, it.ty);
    }
    ctx.restore();
  }

  private drawReferenceLines(): void {
    const ctx = this.ctx;
    const P = this.plot;
    const ann: LineAnnotations = this.opts.annotations ?? {};
    ctx.save();
    ctx.font = `600 11px ${this.theme.font}`;
    for (const l of ann.y ?? []) {
      const axis = l.axis ?? 'left';
      if (axis === 'right' && !this.yRight) continue;
      const y = Math.round(this.yToPx(l.value, axis)) + 0.5;
      const color = l.color ?? '#f23645';
      ctx.strokeStyle = color;
      ctx.lineWidth = 1;
      ctx.setLineDash(l.dash ?? [5, 4]);
      ctx.beginPath();
      ctx.moveTo(P.x, y);
      ctx.lineTo(P.x + P.w, y);
      ctx.stroke();
      if (l.label) {
        const w = ctx.measureText(l.label).width + 10;
        ctx.setLineDash([]);
        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.roundRect(P.x + P.w - w - 4, y - 9, w, 18, 3);
        ctx.fill();
        ctx.fillStyle = '#ffffff';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(l.label, P.x + P.w - w / 2 - 4, y + 0.5);
      }
    }
    for (const sg of ann.segments ?? []) {
      const axis = sg.axis ?? 'left';
      const x1 = this.xToPx(this.xValue(sg.from.x));
      const y1 = this.yToPx(sg.from.y, axis);
      const x2 = this.xToPx(this.xValue(sg.to.x));
      const y2 = this.yToPx(sg.to.y, axis);
      const color = sg.color ?? this.theme.text;
      ctx.strokeStyle = color;
      ctx.fillStyle = color;
      ctx.lineWidth = 1.5;
      ctx.setLineDash(sg.dash ?? []);
      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.lineTo(x2, y2);
      ctx.stroke();
      ctx.setLineDash([]);
      // dot at the start, arrow at the end
      ctx.beginPath();
      ctx.arc(x1, y1, 3, 0, Math.PI * 2);
      ctx.fill();
      const ang = Math.atan2(y2 - y1, x2 - x1);
      ctx.beginPath();
      ctx.moveTo(x2, y2);
      ctx.lineTo(x2 - 9 * Math.cos(ang - 0.4), y2 - 9 * Math.sin(ang - 0.4));
      ctx.lineTo(x2 - 9 * Math.cos(ang + 0.4), y2 - 9 * Math.sin(ang + 0.4));
      ctx.closePath();
      ctx.fill();
      if (sg.label) {
        ctx.textAlign = 'center';
        ctx.textBaseline = 'bottom';
        ctx.fillText(sg.label, (x1 + x2) / 2, (y1 + y2) / 2 - 6);
      }
    }
    for (const l of ann.x ?? []) {
      const x = Math.round(this.xToPx(this.xValue(l.value))) + 0.5;
      if (x < P.x || x > P.x + P.w) continue;
      const color = l.color ?? '#9598a1';
      ctx.strokeStyle = color;
      ctx.lineWidth = 1;
      ctx.setLineDash(l.dash ?? [4, 4]);
      ctx.beginPath();
      ctx.moveTo(x, P.y);
      ctx.lineTo(x, P.y + P.h);
      ctx.stroke();
      if (l.label) {
        ctx.setLineDash([]);
        ctx.fillStyle = color;
        ctx.textAlign = 'left';
        ctx.textBaseline = 'top';
        ctx.fillText(l.label, x + 4, P.y + 2);
      }
    }
    ctx.restore();
  }

  private drawAxes(xTicks: Tick[]): void {
    const ctx = this.ctx;
    const P = this.plot;
    const t = this.theme;
    const xa = this.axisOpts('x');
    const ya = this.axisOpts('y');
    const y2a = this.axisOpts('y2');
    ctx.save();
    ctx.font = `11px ${t.font}`;
    ctx.fillStyle = t.muted;
    // axis line
    ctx.fillStyle = t.axis;
    if (xa.show) ctx.fillRect(P.x, Math.round(P.y + P.h), P.w, 1);
    // x labels (skip overlapping ones)
    if (xa.show) {
      ctx.textAlign = 'center';
      ctx.textBaseline = 'top';
      let lastRight = -Infinity;
      for (const tk of xTicks) {
        const x = this.xToPx(tk.value);
        if (x < P.x - 1 || x > P.x + P.w + 1) continue;
        const w = ctx.measureText(tk.label).width;
        if (x - w / 2 < lastRight + 8) continue;
        ctx.font = `${tk.major ? '600 ' : ''}11px ${t.font}`;
        ctx.fillStyle = xa.color ?? (tk.major ? t.text : t.muted);
        ctx.fillText(tk.label, Math.min(Math.max(x, P.x + w / 2), P.x + P.w - w / 2), P.y + P.h + 6);
        lastRight = x + w / 2;
      }
      if (xa.title) {
        ctx.font = `600 11px ${t.font}`;
        ctx.fillStyle = t.muted;
        ctx.fillText(xa.title, P.x + P.w / 2, P.y + P.h + 22);
      }
    }
    // second row of x labels on top
    const x2 = this.opts.x2Axis;
    if (x2 && x2.show !== false) {
      ctx.fillStyle = t.axis;
      ctx.fillRect(P.x, Math.round(P.y), P.w, 1);
      ctx.font = `11px ${t.font}`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'bottom';
      ctx.fillStyle = x2.color ?? t.muted;
      let lastRight = -Infinity;
      for (const tk of xTicks) {
        const x = this.xToPx(tk.value);
        if (x < P.x - 1 || x > P.x + P.w + 1) continue;
        const label = x2.categories ? (x2.categories[tk.value] ?? '') : x2.format ? x2.format(tk.value) : '';
        const w = ctx.measureText(label).width;
        if (!label || x - w / 2 < lastRight + 8) continue;
        ctx.fillText(label, Math.min(Math.max(x, P.x + w / 2), P.x + P.w - w / 2), P.y - 6);
        lastRight = x + w / 2;
      }
      if (x2.title) {
        ctx.font = `600 11px ${t.font}`;
        ctx.fillText(x2.title, P.x + P.w / 2, P.y - 22);
      }
    }
    ctx.font = `11px ${t.font}`;
    ctx.fillStyle = t.muted;
    ctx.textBaseline = 'middle';
    if (ya.show) {
      ctx.textAlign = 'right';
      for (const v of this.yLeft.ticks) ctx.fillText(this.fmtY(v, 'y'), P.x - 8, this.yToPx(v, 'left'));
      if (ya.title) this.verticalTitle(ya.title, (this.opts.padding ?? 8) + 6, P.y + P.h / 2);
    }
    if (this.yRight && y2a.show) {
      ctx.textAlign = 'left';
      for (const v of this.yRight.ticks) ctx.fillText(this.fmtY(v, 'y2'), P.x + P.w + 8, this.yToPx(v, 'right'));
      if (y2a.title) this.verticalTitle(y2a.title, this.width - (this.opts.padding ?? 8) - 6, P.y + P.h / 2);
    }
    ctx.restore();
  }

  private verticalTitle(text: string, x: number, y: number): void {
    const ctx = this.ctx;
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(-Math.PI / 2);
    ctx.font = `600 11px ${this.theme.font}`;
    ctx.fillStyle = this.theme.muted;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(text, 0, 0);
    ctx.restore();
  }

  private drawHover(): void {
    const h = this.hover;
    if (!h) return;
    const ctx = this.ctx;
    const P = this.plot;
    const ch = { show: true, horizontal: false, dash: [4, 4], ...(this.opts.crosshair ?? {}) };
    const x = Math.round(this.xToPx(h.x)) + 0.5;
    ctx.save();
    if (ch.show) {
      ctx.strokeStyle = ch.color ?? this.theme.crosshair;
      ctx.lineWidth = 1;
      ctx.setLineDash(ch.dash);
      ctx.beginPath();
      ctx.moveTo(x, P.y);
      ctx.lineTo(x, P.y + P.h);
      if (ch.horizontal && h.my >= P.y && h.my <= P.y + P.h) {
        const y = Math.round(h.my) + 0.5;
        ctx.moveTo(P.x, y);
        ctx.lineTo(P.x + P.w, y);
      }
      ctx.stroke();
    }
    ctx.setLineDash([]);
    for (const p of h.points) {
      const s = this.model[p.seriesIndex];
      const px = this.xToPx(p.x);
      const py = this.yToPx(p.drawnY, s.axis);
      ctx.beginPath();
      ctx.arc(px, py, 6, 0, Math.PI * 2);
      ctx.fillStyle = alpha(p.color, 0.25);
      ctx.fill();
      ctx.beginPath();
      ctx.arc(px, py, 3.5, 0, Math.PI * 2);
      ctx.fillStyle = p.color;
      ctx.fill();
      ctx.lineWidth = 1.5;
      ctx.strokeStyle = this.theme.background === 'transparent' ? '#ffffff' : this.theme.background;
      ctx.stroke();
    }
    ctx.restore();
  }

  /** window position of the slider, in px */
  private sliderWindow(): [number, number] {
    const S = this.sliderRect!;
    const [d0, d1] = this.dataX;
    const [a, b] = this.xView;
    return [S.x + ((a - d0) / (d1 - d0)) * S.w, S.x + ((b - d0) / (d1 - d0)) * S.w];
  }

  /** navigator: mini line of the first series, the visible window and two handles */
  private drawSlider(): void {
    const S = this.sliderRect;
    if (!S) return;
    const ctx = this.ctx;
    const t = this.theme;
    const [d0, d1] = this.dataX;
    ctx.save();
    ctx.fillStyle = alpha(t.muted, 0.08);
    ctx.strokeStyle = alpha(t.muted, 0.35);
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.roundRect(S.x + 0.5, S.y + 0.5, S.w - 1, S.h - 1, 4);
    ctx.fill();
    ctx.stroke();
    const s = this.model.find((m) => !m.hidden && m.xs.length);
    if (s) {
      const vals = s.top.filter((v): v is number => v !== null);
      const lo = Math.min(...vals);
      const hi = Math.max(...vals);
      const step = Math.max(1, Math.floor(s.xs.length / S.w));
      const px = (x: number): number => S.x + ((x - d0) / (d1 - d0)) * S.w;
      const py = (v: number): number => S.y + S.h - 3 - ((v - lo) / (hi - lo || 1)) * (S.h - 6);
      ctx.beginPath();
      let first = -1;
      let lastX = 0;
      for (let i = 0; i < s.xs.length; i += step) {
        const v = s.top[i];
        if (v === null) continue;
        const x = px(s.xs[i]);
        if (first < 0) ((first = x), ctx.moveTo(x, py(v)));
        else ctx.lineTo(x, py(v));
        lastX = x;
      }
      ctx.strokeStyle = alpha(s.color, 0.7);
      ctx.stroke();
      if (first >= 0) {
        ctx.lineTo(lastX, S.y + S.h);
        ctx.lineTo(first, S.y + S.h);
        ctx.closePath();
        ctx.fillStyle = alpha(s.color, 0.15);
        ctx.fill();
      }
    }
    const [w0, w1] = this.sliderWindow();
    // shade what is outside the window
    ctx.fillStyle = 'rgba(0, 0, 0, 0.28)';
    ctx.fillRect(S.x, S.y, Math.max(0, w0 - S.x), S.h);
    ctx.fillRect(w1, S.y, Math.max(0, S.x + S.w - w1), S.h);
    ctx.fillStyle = alpha('#2962ff', 0.14);
    ctx.fillRect(w0, S.y, w1 - w0, S.h);
    ctx.strokeStyle = '#2962ff';
    ctx.strokeRect(w0 + 0.5, S.y + 0.5, Math.max(1, w1 - w0 - 1), S.h - 1);
    for (const x of [w0, w1]) {
      ctx.fillStyle = '#2962ff';
      ctx.beginPath();
      ctx.roundRect(x - 4, S.y + S.h / 2 - 10, 8, 20, 3);
      ctx.fill();
      ctx.strokeStyle = '#ffffff';
      ctx.beginPath();
      ctx.moveTo(x - 1, S.y + S.h / 2 - 4);
      ctx.lineTo(x - 1, S.y + S.h / 2 + 4);
      ctx.moveTo(x + 1, S.y + S.h / 2 - 4);
      ctx.lineTo(x + 1, S.y + S.h / 2 + 4);
      ctx.stroke();
    }
    // range labels
    ctx.font = `10px ${t.font}`;
    ctx.fillStyle = t.muted;
    ctx.textBaseline = 'middle';
    const [a, b] = this.xView;
    ctx.textAlign = 'right';
    if (w0 - S.x > 50) ctx.fillText(this.xLabel(Math.round(a)), w0 - 7, S.y + S.h / 2);
    ctx.textAlign = 'left';
    if (S.x + S.w - w1 > 50) ctx.fillText(this.xLabel(Math.round(b)), w1 + 7, S.y + S.h / 2);
    ctx.restore();
  }

  private inSlider(x: number, y: number): boolean {
    const S = this.sliderRect;
    return !!S && x >= S.x - 6 && x <= S.x + S.w + 6 && y >= S.y - 4 && y <= S.y + S.h + 4;
  }

  private sliderMove(x: number): void {
    const sd = this.sliderDrag!;
    const S = this.sliderRect!;
    const [d0, d1] = this.dataX;
    const full = d1 - d0;
    const dx = ((x - sd.x) / S.w) * full;
    const minSpan = this.xType === 'category' ? 2 : full / 500;
    let [a, b] = sd.view;
    if (sd.mode === 'move') {
      const span = b - a;
      a = Math.min(Math.max(a + dx, d0), d1 - span);
      b = a + span;
    } else if (sd.mode === 'l') a = Math.min(Math.max(d0, a + dx), b - minSpan);
    else b = Math.max(Math.min(d1, b + dx), a + minSpan);
    this.view = b - a >= full - 1e-9 ? null : [a, b];
    this.layout();
    this.hover = null;
    this.tooltipEl.classList.remove('is-visible');
    this.draw();
  }

  // ------------------------------------------------------------------ interaction

  private hitTest(mx: number, my: number): { x: number; points: LineHoverPoint[] } | null {
    if (this.polarCfg) return this.polarHit(mx, my);
    const P = this.plot;
    if (mx < P.x - 4 || mx > P.x + P.w + 4 || my < P.y - 10 || my > P.y + P.h + 4) return null;
    const visible = this.model.filter((s) => !s.hidden && s.xs.length);
    if (!visible.length) return null;
    const xv = this.pxToX(mx);
    const mode = this.opts.tooltip?.mode ?? 'shared';
    const pointOf = (s: NSeries, i: number): LineHoverPoint | null => {
      const y = s.ys[i];
      const drawn = s.top[i];
      if (y === null || drawn === null) return null;
      return { series: s.src, seriesIndex: s.index, index: i, x: s.xs[i], y, color: this.colorAt(s, y), drawnY: drawn };
    };
    if (mode === 'single') {
      let best: LineHoverPoint | null = null;
      let bestD = 28;
      for (const s of visible) {
        const i = this.nearest(s, xv);
        for (const j of [i - 1, i, i + 1]) {
          if (j < 0 || j >= s.xs.length) continue;
          const p = pointOf(s, j);
          if (!p) continue;
          const d = Math.hypot(this.xToPx(p.x) - mx, this.yToPx(p.drawnY, s.axis) - my);
          if (d < bestD) ((bestD = d), (best = p));
        }
      }
      return best ? { x: best.x, points: [best] } : null;
    }
    return this.sharedAt(xv, visible);
  }

  /** shared hover: closest x among all series, then every series at that x */
  private sharedAt(xv: number, visible: NSeries[]): { x: number; points: LineHoverPoint[] } | null {
    const pointOf = (s: NSeries, i: number): LineHoverPoint | null => {
      const y = s.ys[i];
      const drawn = s.top[i];
      if (y === null || drawn === null) return null;
      return { series: s.src, seriesIndex: s.index, index: i, x: s.xs[i], y, color: this.colorAt(s, y), drawnY: drawn };
    };
    let anchor = NaN;
    let bestDx = Infinity;
    for (const s of visible) {
      const i = this.nearest(s, xv);
      const dx = Math.abs(s.xs[i] - xv);
      if (dx < bestDx) ((bestDx = dx), (anchor = s.xs[i]));
    }
    const points: LineHoverPoint[] = [];
    for (const s of visible) {
      const i = this.nearest(s, anchor);
      const spacing = s.xs.length > 1 ? (s.xs[s.xs.length - 1] - s.xs[0]) / (s.xs.length - 1) : 1;
      if (Math.abs(s.xs[i] - anchor) > spacing * 0.5 + 1e-9) continue;
      const p = pointOf(s, i);
      if (p) points.push(p);
    }
    return points.length ? { x: anchor, points } : null;
  }

  private tooltipContext(h: { x: number; points: LineHoverPoint[] }): LineTooltipContext {
    return { x: h.x, label: this.xLabel(h.x), points: h.points.map((p) => ({ ...p })) };
  }

  /** second x label (x2Axis) for the tooltip head */
  private x2Label(x: number): string {
    const x2 = this.opts.x2Axis;
    if (!x2 || x2.show === false) return '';
    const l = x2.categories ? x2.categories[x] : x2.format ? x2.format(x) : '';
    return l ? ` <span class="lc-tooltip__sub" style="color:${x2.color ?? 'inherit'}">· ${esc(l)}</span>` : '';
  }

  private showTooltip(mx: number, my: number): void {
    const tt = this.tooltipEl;
    const o = this.opts.tooltip ?? {};
    if (!this.hover || o.show === false) {
      tt.classList.remove('is-visible');
      return;
    }
    const ctx = this.tooltipContext(this.hover);
    let rows = ctx.points;
    if (o.sort) rows = [...rows].sort((a, b) => b.y - a.y);
    tt.innerHTML = o.formatter
      ? o.formatter(ctx)
      : `<div class="lc-tooltip__head">${esc(ctx.label)}${this.x2Label(this.hover.x)}</div>${rows
          .map((p) => {
            const ns = this.model[p.seriesIndex];
            const lo = ns.bandLo?.[p.index];
            const hi = ns.bandHi?.[p.index];
            const range = lo !== null && lo !== undefined && hi !== null && hi !== undefined ? ` <small>${esc(this.fmtValue(lo, p.series))} – ${esc(this.fmtValue(hi, p.series))}</small>` : '';
            return `<div class="lc-tooltip__row"><span class="lc-tooltip__dot" style="background:${p.color}"></span><span class="lc-tooltip__name">${esc(p.series.name)}</span><b>${esc(this.fmtValue(p.y, p.series))}${range}</b></div>`;
          })
          .join('')}`;
    tt.classList.add('is-visible');
    const w = tt.offsetWidth;
    const hgt = tt.offsetHeight;
    const P = this.plot;
    const ax = this.polarCfg ? mx : this.xToPx(this.hover.x);
    let left = ax + 14;
    if (left + w > this.width - 4) left = ax - w - 14;
    let top = Math.min(Math.max(my - hgt / 2, P.y), P.y + P.h - hgt);
    top = Math.max(4, top);
    tt.style.transform = `translate(${Math.max(4, left)}px, ${top}px)`;
  }

  private bind(): void {
    const c = this.canvas;
    const local = (e: MouseEvent): { x: number; y: number } => {
      const r = c.getBoundingClientRect();
      return { x: e.clientX - r.left, y: e.clientY - r.top };
    };
    // touch: one finger shows the values, two fingers pinch-zoom; draggable points.
    // Registered first: when they handle the event, the default handlers below do not run.
    const touches = new Map<number, { x: number; y: number }>();
    let pinch: { d: number; view: [number, number]; cx: number } | null = null;
    c.addEventListener('pointerdown', (e) => {
      const p = local(e);
      if (e.pointerType === 'touch' && !this.inSlider(p.x, p.y)) {
        touches.set(e.pointerId, p);
        c.setPointerCapture(e.pointerId);
        if (touches.size === 2 && this.opts.zoom) {
          const [t1, t2] = [...touches.values()];
          pinch = { d: Math.abs(t1.x - t2.x) || 1, view: [...this.xView] as [number, number], cx: (t1.x + t2.x) / 2 };
        } else if (touches.size === 1) this.pointerHover(p.x, p.y);
        e.stopImmediatePropagation();
        return;
      }
      const hit = e.button === 0 ? this.draggableAt(p.x, p.y) : null;
      if (hit) {
        this.pointDrag = hit;
        c.setPointerCapture(e.pointerId);
        e.stopImmediatePropagation();
      }
    });
    c.addEventListener('pointermove', (e) => {
      const p = local(e);
      if (touches.has(e.pointerId)) {
        touches.set(e.pointerId, p);
        if (pinch && touches.size >= 2) {
          const [t1, t2] = [...touches.values()];
          this.zoomAround(pinch.view, pinch.d / (Math.abs(t1.x - t2.x) || 1), pinch.cx);
        } else if (touches.size === 1) this.pointerHover(p.x, p.y);
        e.stopImmediatePropagation();
        return;
      }
      if (this.pointDrag) {
        this.movePoint(p.x, p.y);
        e.stopImmediatePropagation();
      }
    });
    const release = (e: PointerEvent): void => {
      if (touches.has(e.pointerId)) {
        touches.delete(e.pointerId);
        if (touches.size < 2) pinch = null;
        e.stopImmediatePropagation();
        return;
      }
      if (this.pointDrag) {
        this.pointDrag = null;
        if (c.hasPointerCapture(e.pointerId)) c.releasePointerCapture(e.pointerId);
        e.stopImmediatePropagation();
      }
    };
    c.addEventListener('pointerup', release);
    c.addEventListener('pointercancel', release);

    c.addEventListener('pointermove', (e) => {
      const { x, y } = local(e);
      if (this.opts.fisheye) {
        // the lens follows the mouse inside the plot
        this.lensX = x >= this.plot.x && x <= this.plot.x + this.plot.w ? x : null;
      }
      if (this.sliderDrag) {
        this.sliderMove(x);
        return;
      }
      if (this.inSlider(x, y)) {
        const [w0, w1] = this.sliderWindow();
        c.style.cursor = Math.abs(x - w0) <= 7 || Math.abs(x - w1) <= 7 ? 'ew-resize' : 'grab';
        if (this.hover) {
          this.hover = null;
          this.tooltipEl.classList.remove('is-visible');
          this.draw();
        }
        return;
      }
      if (this.drag) {
        const [a, b] = this.drag.view;
        const dx = ((x - this.drag.x) / this.plot.w) * (b - a);
        const [d0, d1] = this.dataX;
        const span = b - a;
        const v0 = Math.min(Math.max(a - dx, d0), d1 - span);
        this.view = [v0, v0 + span];
        this.layout();
        this.hover = null;
        this.tooltipEl.classList.remove('is-visible');
        this.draw();
        return;
      }
      const h = this.hitTest(x, y);
      const prevKey = this.hover ? `${this.hover.x}|${this.hover.points.length}` : '';
      this.hover = h ? { ...h, my: y } : null;
      c.style.cursor = this.draggableAt(x, y) ? 'move' : this.opts.zoom ? 'grab' : h ? 'crosshair' : 'default';
      this.draw();
      this.showTooltip(x, y);
      const key = h ? `${h.x}|${h.points.length}` : '';
      if (key !== prevKey) this.emit('hover', h ? this.tooltipContext(h) : null);
    });
    c.addEventListener('pointerleave', () => {
      if (this.drag) return;
      this.lensX = null;
      this.hover = null;
      this.tooltipEl.classList.remove('is-visible');
      this.draw();
      this.emit('hover', null);
    });
    c.addEventListener('click', (e) => {
      const { x, y } = local(e);
      const h = this.hitTest(x, y);
      if (h) this.emit('click', this.tooltipContext(h));
      const P = this.plot;
      if (x >= P.x && x <= P.x + P.w && y >= P.y && y <= P.y + P.h) {
        const d = this.toData(x, y);
        this.emit('plotclick', { x: d.x, y: d.y, px: x, py: y });
      }
    });
    c.addEventListener('pointerdown', (e) => {
      if (!this.opts.zoom || e.button !== 0) return;
      const p = local(e);
      if (this.inSlider(p.x, p.y)) {
        const [w0, w1] = this.sliderWindow();
        let mode: 'l' | 'r' | 'move' = Math.abs(p.x - w0) <= 7 ? 'l' : Math.abs(p.x - w1) <= 7 ? 'r' : 'move';
        if (mode === 'move' && (p.x < w0 || p.x > w1)) {
          // click outside the window: center it there, then keep dragging
          const S = this.sliderRect!;
          const [d0, d1] = this.dataX;
          const [a, b] = this.xView;
          const span = b - a;
          const at = d0 + ((p.x - S.x) / S.w) * (d1 - d0);
          const v0 = Math.min(Math.max(at - span / 2, d0), d1 - span);
          this.view = span >= d1 - d0 - 1e-9 ? null : [v0, v0 + span];
          this.layout();
          this.draw();
          mode = 'move';
        }
        c.setPointerCapture(e.pointerId);
        this.sliderDrag = { mode, x: p.x, view: [...this.xView] as [number, number] };
        return;
      }
      c.setPointerCapture(e.pointerId);
      this.drag = { x: local(e).x, view: [...this.xView] as [number, number] };
      c.style.cursor = 'grabbing';
    });
    const endDrag = (e: PointerEvent): void => {
      if (this.sliderDrag) {
        this.sliderDrag = null;
        if (c.hasPointerCapture(e.pointerId)) c.releasePointerCapture(e.pointerId);
        this.emit('zoom', this.view ? { from: this.view[0], to: this.view[1] } : null);
        return;
      }
      if (!this.drag) return;
      this.drag = null;
      if (c.hasPointerCapture(e.pointerId)) c.releasePointerCapture(e.pointerId);
      c.style.cursor = 'grab';
      if (this.view) this.emit('zoom', { from: this.view[0], to: this.view[1] });
    };
    c.addEventListener('pointerup', endDrag);
    c.addEventListener('pointercancel', endDrag);
    c.addEventListener(
      'wheel',
      (e) => {
        if (!this.opts.zoom) return;
        e.preventDefault();
        const { x } = local(e);
        const [a, b] = this.xView;
        const [d0, d1] = this.dataX;
        const at = this.pxToX(Math.min(Math.max(x, this.plot.x), this.plot.x + this.plot.w));
        const k = Math.exp(e.deltaY * 0.0015);
        const minSpan = this.xType === 'category' ? 2 : (d1 - d0) / 500;
        let span = Math.min(d1 - d0, Math.max(minSpan, (b - a) * k));
        const ratio = (at - a) / (b - a);
        let v0 = at - span * ratio;
        v0 = Math.min(Math.max(v0, d0), d1 - span);
        if (span >= d1 - d0 - 1e-9) {
          this.view = null;
          span = d1 - d0;
        } else this.view = [v0, v0 + span];
        this.layout();
        this.draw();
        this.emit('zoom', this.view ? { from: this.view[0], to: this.view[1] } : null);
      },
      { passive: false },
    );
    c.addEventListener('dblclick', () => {
      if (this.opts.zoom && this.view) this.resetZoom();
    });
  }

  /** hover at a position (mouse or finger) */
  private pointerHover(x: number, y: number): void {
    const h = this.hitTest(x, y);
    const prev = this.hover ? `${this.hover.x}|${this.hover.points.length}` : '';
    this.hover = h ? { ...h, my: y } : null;
    this.draw();
    this.showTooltip(x, y);
    const key = h ? `${h.x}|${h.points.length}` : '';
    if (key !== prev) this.emit('hover', h ? this.tooltipContext(h) : null);
  }

  /** zoom the view by k around a px position (pinch) */
  private zoomAround(view: [number, number], k: number, cx: number): void {
    const [d0, d1] = this.dataX;
    const span0 = view[1] - view[0];
    const at = view[0] + ((cx - this.plot.x) / this.plot.w) * span0;
    const minSpan = this.xType === 'category' ? 2 : (d1 - d0) / 500;
    const span = Math.min(d1 - d0, Math.max(minSpan, span0 * k));
    const v0 = Math.min(Math.max(at - span * ((at - view[0]) / span0), d0), d1 - span);
    this.view = span >= d1 - d0 - 1e-9 ? null : [v0, v0 + span];
    this.layout();
    this.draw();
    this.emit('zoom', this.view ? { from: this.view[0], to: this.view[1] } : null);
  }

  /** draggable point under the mouse */
  private draggableAt(px: number, py: number): { key: string; orig: number } | null {
    if (this.opts.stacked) return null;
    for (const s of this.model) {
      if (s.hidden || !s.src.draggable) continue;
      const [i0, i1] = this.range(s);
      for (let i = i0; i <= i1; i++) {
        const v = s.top[i];
        if (v === null) continue;
        if (Math.hypot(this.xToPx(s.xs[i]) - px, this.yToPx(v, s.axis) - py) <= 10) return { key: s.key, orig: s.srcIdx[i] };
      }
    }
    return null;
  }

  /** move the dragged point to the mouse and tell the app */
  private movePoint(px: number, py: number): void {
    const d = this.pointDrag!;
    const src = this.seriesList.find((x) => this.keyOf(x) === d.key);
    const ns = this.model.find((x) => x.key === d.key);
    if (!src || !ns) return;
    const mode = src.draggable === 'y' ? 'y' : src.draggable === 'xy' ? 'xy' : this.xType === 'number' ? 'xy' : 'y';
    const P = this.plot;
    const y = +this.pyToY(Math.min(Math.max(py, P.y), P.y + P.h), ns.axis).toPrecision(6);
    const data = [...(src.data as (LinePoint | number | null)[])];
    const old = data[d.orig];
    let x: number;
    if (old !== null && typeof old === 'object') {
      x = mode === 'xy' ? +this.pxToX(Math.min(Math.max(px, P.x), P.x + P.w)).toPrecision(6) : this.xValue(old.x);
      data[d.orig] = { x: mode === 'xy' ? x : old.x, y };
    } else {
      x = d.orig;
      data[d.orig] = y;
    }
    src.data = data as LineSeries['data'];
    // the old hover points at the previous position
    this.hover = null;
    this.tooltipEl.classList.remove('is-visible');
    this.rebuild(null);
    this.emit('change', { series: src, index: d.orig, x, y });
  }

  private renderLegend(): void {
    const ul = this.legendEl;
    const interactive = this.opts.legend?.interactive ?? true;
    ul.innerHTML = '';
    for (const s of this.model) {
      const li = document.createElement('li');
      li.className = `lc-legend__item${s.hidden ? ' is-hidden' : ''}${interactive ? ' is-interactive' : ''}`;
      li.dataset.id = s.key;
      const dashed = s.dash.length ? ' is-dashed' : '';
      li.innerHTML = `<span class="lc-legend__marker${dashed}" style="--c:${s.color}"></span><span class="lc-legend__label">${esc(s.src.name)}</span>`;
      li.addEventListener('mouseenter', () => !s.hidden && this.highlight(s.key));
      li.addEventListener('mouseleave', () => this.highlight(null));
      if (interactive) li.addEventListener('click', () => this.toggle(s.key));
      ul.append(li);
    }
  }
}

export function createLineChart(container: HTMLElement, options: LineOptions = {}): LineChart {
  return new LineChart(container, options);
}
