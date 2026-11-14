import { monotoneTangents } from '../shared/curve';
import { formatCompact, niceScale } from '../shared/format';
import { Segment, StackResult, computeStacks, slotRect, sortOrder } from './layout';
import { average, cumulative, ema, exponentialTrend, linearTrend, sma, wma } from './overlays';
import type {
  BarAxisId, BarAxisOptions, BarDatum, BarEvent, BarGraphicApi, BarItem, BarOptions, BarOverlay, BarOverlayValue, BarSeries, BarTheme,
  BarTooltipContext, BarValue,
} from './types';

const FONT = '-apple-system, BlinkMacSystemFont, "Trebuchet MS", Roboto, Ubuntu, sans-serif';

export const BAR_COLORS = ['#2962ff', '#ff9800', '#089981', '#f23645', '#9c27b0', '#00bcd4', '#e91e63', '#4caf50', '#ffc107', '#3f51b5'];

/** Default colors of the lines over the bars (picked to stand out from the bar palette). */
export const OVERLAY_COLORS = ['#ffd54f', '#ff4081', '#00e5ff', '#b2ff59', '#ea80fc', '#ffffff'];

export const barDarkTheme: BarTheme = {
  background: '#131722',
  text: '#d1d4dc',
  muted: '#787b86',
  grid: 'rgba(42, 46, 57, 0.7)',
  axis: '#2a2e39',
  hover: 'rgba(255, 255, 255, 0.04)',
  tooltipBg: '#1e222d',
  tooltipText: '#d1d4dc',
  tooltipBorder: '#2a2e39',
  font: FONT,
};

export const barLightTheme: BarTheme = {
  background: '#ffffff',
  text: '#131722',
  muted: '#787b86',
  grid: 'rgba(42, 46, 57, 0.08)',
  axis: '#e0e3eb',
  hover: 'rgba(41, 98, 255, 0.06)',
  tooltipBg: '#ffffff',
  tooltipText: '#131722',
  tooltipBorder: '#e0e3eb',
  font: FONT,
};

interface Rect {
  x: number;
  y: number;
  w: number;
  h: number;
}

interface Scale {
  min: number;
  max: number;
  ticks: number[];
}

interface DrawnBar {
  rect: Rect;
  datum: BarDatum;
  /** polar bars: ring sector instead of a rectangle */
  sector?: { r0: number; r1: number; a0: number; a1: number };
}

/** An overlay with its computed values, indexed by category (not display position). */
interface OverlayLine {
  overlay: BarOverlay;
  id: string;
  name: string;
  color: string;
  axis: BarAxisId;
  values: (number | null)[];
}

const OVERLAY_NAMES: Record<BarOverlay['type'], string> = {
  sma: 'Média móvel',
  ema: 'Média exponencial',
  wma: 'Média ponderada',
  linear: 'Tendência linear',
  exponential: 'Tendência exponencial',
  average: 'Média',
  cumulative: 'Acumulado',
  line: 'Linha',
};

const AXES: BarAxisId[] = ['left', 'right', 'right2'];

const esc = (s: string): string => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const easeOutCubic = (t: number): number => 1 - Math.pow(1 - t, 3);
const clamp = (v: number, lo: number, hi: number): number => Math.min(hi, Math.max(lo, v));
const toRad = (deg: number): number => ((deg - 90) * Math.PI) / 180;

function contrast(color: string): string {
  const m = color.match(/^#([\da-f]{2})([\da-f]{2})([\da-f]{2})/i);
  if (!m) return '#ffffff';
  const [r, g, b] = [m[1], m[2], m[3]].map((x) => parseInt(x, 16));
  return 0.299 * r + 0.587 * g + 0.114 * b > 165 ? '#131722' : '#ffffff';
}

function alpha(color: string, a: number): string {
  const m = color.match(/^#([\da-f]{2})([\da-f]{2})([\da-f]{2})/i);
  if (m) return `rgba(${parseInt(m[1], 16)}, ${parseInt(m[2], 16)}, ${parseInt(m[3], 16)}, ${a})`;
  return color;
}

const valueOf = (v: BarValue | undefined): number | null => {
  if (v === null || v === undefined) return null;
  const n = typeof v === 'object' ? v.value : v;
  return n === null || !Number.isFinite(n) ? null : n;
};

/** `sparkline: true` fills in the defaults of a mini chart (anything given explicitly wins). */
function withPresets(o: BarOptions): BarOptions {
  if (!o.sparkline) return o;
  return {
    padding: 2,
    radius: 1,
    ...o,
    legend: { show: false, ...(o.legend ?? {}) },
    categoryAxis: { show: false, ...(o.categoryAxis ?? {}) },
    valueAxis: { show: false, grid: false, ...(o.valueAxis ?? {}) },
  };
}

/**
 * Bar / column chart: grouped, stacked or 100% stacked series, negative values,
 * vertical or horizontal, polar, labels, shared tooltip, interactive legend, reference lines,
 * overlay lines, several value axes, axis breaks, zoom, brush, sorting races and animations.
 */
export class BarChart {
  readonly root: HTMLElement;
  readonly canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private plotEl: HTMLElement;
  private legendEl: HTMLElement;
  private tooltipEl: HTMLElement;
  private opts: BarOptions;
  private theme!: BarTheme;
  private categories: string[] = [];
  private seriesList: BarSeries[] = [];
  /** numeric values and styled items per series / category */
  private vals: (number | null)[][] = [];
  private items: (BarItem | null)[][] = [];
  private hidden = new Set<string>();
  private order: number[] = [];
  /** categories shown, in display order (sorted, limited) */
  private shown: number[] = [];
  private posOf = new Map<number, number>();
  private prevPos = new Map<string, number>();
  private stacks: StackResult = { segments: [], slots: 1, min: 0, max: 1, totals: [], ranges: {} };
  private prev: (Segment | null)[][] | null = null;
  private prevKeys: string[] = [];
  private scales: Record<BarAxisId, Scale> = { left: { min: 0, max: 1, ticks: [0, 1] }, right: { min: 0, max: 1, ticks: [0, 1] }, right2: { min: 0, max: 1, ticks: [0, 1] } };
  private prevScales: Partial<Record<BarAxisId, { min: number; max: number }>> | null = null;
  private used = new Set<BarAxisId>(['left']);
  private lines: OverlayLine[] = [];
  private prevLines = new Map<string, (number | null)[]>();
  /** value breaks of the left axis and the size each one keeps (value units) */
  private vbreaks: [number, number][] = [];
  private breakGap = 0;
  /** Mekko: cumulative widths (0–1) of the shown categories */
  private mekko: number[] | null = null;
  private plot: Rect = { x: 0, y: 0, w: 1, h: 1 };
  private width = 0;
  private height = 0;
  private dpr = 1;
  private hoverCat = -1;
  private hoverBar: DrawnBar | null = null;
  private highlighted: string | null = null;
  private drawn: DrawnBar[] = [];
  private progress = 1;
  private elapsed = 0;
  private animKind: 'reveal' | 'morph' | null = null;
  private animStart = 0;
  private raf = 0;
  /** category zoom, in display positions [from, to) */
  private view: [number, number] | null = null;
  private drag: { x: number; view: [number, number] } | null = null;
  private sliderRect: Rect | null = null;
  private sliderDrag: { mode: 'l' | 'r' | 'move'; x: number; view: [number, number] } | null = null;
  private brushRect: { x0: number; y0: number; x1: number; y1: number } | null = null;
  private selected: Set<string> | null = null;
  private handlers = new Map<BarEvent, Set<(v: unknown) => void>>();
  private ro: ResizeObserver;

  constructor(container: HTMLElement, options: BarOptions = {}) {
    this.opts = withPresets({ ...options });
    this.root = container;
    container.classList.add('bc-root');
    this.plotEl = document.createElement('div');
    this.plotEl.className = 'bc-plot';
    this.canvas = document.createElement('canvas');
    this.canvas.className = 'bc-canvas';
    this.canvas.setAttribute('role', 'img');
    this.ctx = this.canvas.getContext('2d')!;
    this.tooltipEl = document.createElement('div');
    this.tooltipEl.className = 'bc-tooltip';
    this.legendEl = document.createElement('ul');
    this.legendEl.className = 'bc-legend';
    this.plotEl.append(this.canvas, this.tooltipEl);
    container.append(this.plotEl, this.legendEl);
    this.categories = [...(options.categories ?? [])];
    this.seriesList = (options.series ?? []).map((s) => ({ ...s }));
    for (const s of this.seriesList) if (s.hidden) this.hidden.add(this.keyOf(s));
    (options.overlays ?? []).forEach((ov, i) => ov.hidden && this.hidden.add(this.overlayKey(ov, i)));
    // the first resize draws before rebuild(): start with the natural order
    this.order = this.categories.map((_, i) => i);
    this.shown = [...this.order];
    this.order.forEach((c, i) => this.posOf.set(c, i));
    this.applyLook();
    this.bind();
    this.ro = new ResizeObserver(() => this.resize());
    this.ro.observe(this.plotEl);
    this.resize();
    this.rebuild('reveal');
    this.applyInitialZoom();
  }

  // ------------------------------------------------------------------ public API

  get series(): BarSeries[] {
    return this.seriesList.map((s) => ({ ...s, data: [...s.data] }));
  }

  /** Overlay lines with their computed values (one per category), e.g. to show the latest average elsewhere. */
  get overlayValues(): { id: string; name: string; color: string; values: (number | null)[] }[] {
    return this.lines.map((l) => ({ id: l.id, name: l.name, color: l.color, values: [...l.values] }));
  }

  /** Replace the lines drawn over the bars. */
  setOverlays(overlays: BarOverlay[], animate = true): void {
    this.setOptions({ overlays }, animate);
  }

  /** Replace categories and series (animated morph when the shape is the same). */
  setData(categories: string[], series: BarSeries[]): void {
    const same = categories.length === this.categories.length && series.length === this.seriesList.length && series.every((s, i) => this.keyOf(s) === this.keyOf(this.seriesList[i]));
    this.categories = [...categories];
    this.seriesList = series.map((s) => ({ ...s }));
    this.applyLook();
    this.rebuild(same ? 'morph' : 'reveal');
  }

  /** Change options after creation (animated unless `animate` is false). */
  setOptions(patch: BarOptions, animate = true): void {
    if (patch.categories) this.categories = [...patch.categories];
    if (patch.series) this.seriesList = patch.series.map((s) => ({ ...s }));
    (patch.overlays ?? []).forEach((ov, i) => ov.hidden && this.hidden.add(this.overlayKey(ov, i)));
    this.opts = withPresets({ ...this.opts, ...patch });
    this.applyLook();
    this.rebuild(animate ? 'morph' : null);
  }

  /** Change one series (values, color…). */
  updateSeries(id: string, patch: Partial<BarSeries>): void {
    const i = this.seriesList.findIndex((s) => this.keyOf(s) === id);
    if (i < 0) return;
    this.seriesList[i] = { ...this.seriesList[i], ...patch };
    this.rebuild('morph');
  }

  /** Set one value (e.g. realtime). */
  setValue(id: string, categoryIndex: number, value: number | null): void {
    const s = this.seriesList.find((x) => this.keyOf(x) === id);
    if (!s) return;
    s.data = [...s.data];
    const old = s.data[categoryIndex];
    s.data[categoryIndex] = old !== null && typeof old === 'object' ? { ...old, value } : value;
    this.rebuild('morph');
  }

  toggle(id: string, hidden?: boolean): void {
    const h = hidden ?? !this.hidden.has(id);
    if (h) this.hidden.add(id);
    else this.hidden.delete(id);
    this.rebuild('morph');
    this.emit('toggle', { id, hidden: h });
  }

  highlight(id: string | null): void {
    this.highlighted = id;
    this.legendEl.querySelectorAll<HTMLElement>('.bc-legend__item').forEach((li) => li.classList.toggle('is-hover', li.dataset.id === id));
    this.draw();
  }

  /** Zoom on the categories from `from` to `to` (indexes or names, both included). */
  setZoom(from: number | string, to: number | string): void {
    const p = (c: number | string): number => this.posOf.get(typeof c === 'number' ? c : this.categories.indexOf(c)) ?? 0;
    const a = Math.min(p(from), p(to));
    const b = Math.max(p(from), p(to)) + 1;
    this.view = b - a >= this.shown.length ? null : [a, b];
    this.layout();
    this.draw();
    this.emit('zoom', this.view ? { from: this.view[0], to: this.view[1] } : null);
  }

  resetZoom(): void {
    if (!this.view) return;
    this.view = null;
    this.layout();
    this.draw();
    this.emit('zoom', null);
  }

  /** Select bars (like the brush): list of { seriesIndex, categoryIndex }, or null to clear. */
  select(items: { seriesIndex: number; categoryIndex: number }[] | null): void {
    this.selected = items ? new Set(items.map((i) => `${i.seriesIndex}|${i.categoryIndex}`)) : null;
    this.draw();
  }

  on(event: 'hover', handler: (ctx: BarTooltipContext | null) => void): () => void;
  on(event: 'click', handler: (d: BarDatum) => void): () => void;
  on(event: 'toggle', handler: (e: { id: string; hidden: boolean }) => void): () => void;
  on(event: 'zoom', handler: (range: { from: number; to: number } | null) => void): () => void;
  on(event: 'brush', handler: (items: BarDatum[]) => void): () => void;
  on(event: BarEvent, handler: (v: never) => void): () => void {
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
    this.root.classList.remove('bc-root', 'bc-legend-top', 'bc-legend-bottom', 'bc-legend-left', 'bc-legend-right');
    this.plotEl.remove();
    this.legendEl.remove();
  }

  // ------------------------------------------------------------------ model

  private keyOf(s: BarSeries): string {
    return s.id ?? s.name;
  }

  private emit(e: BarEvent, v: unknown): void {
    this.handlers.get(e)?.forEach((h) => h(v));
  }

  private get vertical(): boolean {
    return (this.opts.orientation ?? 'vertical') === 'vertical';
  }

  private axisOf(s: BarSeries): BarAxisId {
    return s.axis ?? 'left';
  }

  private axisOpts(axis: BarAxisId): BarAxisOptions & { breaks?: { from: number; to: number }[] } {
    const o = this.opts;
    if (axis === 'left') return { show: true, grid: true, ...(o.valueAxis ?? {}) };
    if (axis === 'right') return { show: true, grid: false, ...(o.rightAxis ?? {}) };
    return { show: true, grid: false, ...(o.right2Axis ?? {}) };
  }

  private colorOf(s: BarSeries, i: number): string {
    const colors = this.opts.colors?.length ? this.opts.colors : BAR_COLORS;
    return s.color ?? colors[i % colors.length];
  }

  private applyLook(): void {
    const o = this.opts;
    const base = o.theme === 'light' ? barLightTheme : barDarkTheme;
    this.theme = { ...base, ...(typeof o.theme === 'object' ? o.theme : {}) };
    if (o.background !== undefined) this.theme.background = o.background;
    const lg = { position: 'top', marker: 'square', align: 'start', fontSize: 12, show: true, ...(o.legend ?? {}) };
    this.root.classList.remove('bc-legend-top', 'bc-legend-bottom', 'bc-legend-left', 'bc-legend-right');
    this.root.classList.add(`bc-legend-${lg.position}`);
    // a single series needs no legend unless asked for explicitly
    const entries = this.seriesList.filter((s) => !s.silent).length + (o.overlays?.length ?? 0);
    this.legendEl.style.display = lg.show && (entries > 1 || o.legend?.show) ? '' : 'none';
    this.legendEl.className = `bc-legend bc-legend--${lg.marker} bc-legend--align-${lg.align}`;
    this.legendEl.style.fontSize = `${lg.fontSize}px`;
    const t = this.theme;
    const vars: Record<string, string> = {
      '--bc-bg': t.background,
      '--bc-text': t.text,
      '--bc-muted': t.muted,
      '--bc-tt-bg': t.tooltipBg,
      '--bc-tt-text': t.tooltipText,
      '--bc-tt-border': t.tooltipBorder,
      '--bc-font': t.font,
    };
    for (const [k, v] of Object.entries(vars)) this.root.style.setProperty(k, v);
  }

  private rebuild(anim: 'reveal' | 'morph' | null): void {
    // remember the drawn state for morphing (only if series keys are unchanged)
    const keys = this.seriesList.map((s) => this.keyOf(s));
    const canMorph = this.prevKeys.length === keys.length && keys.every((k, i) => k === this.prevKeys[i]) && this.stacks.segments.length === keys.length;
    this.prev = canMorph ? this.currentSegments() : null;
    const animating = this.animKind || this.prev;
    this.prevScales = animating ? { left: this.rangeOf('left'), right: this.rangeOf('right'), right2: this.rangeOf('right2') } : null;
    this.prevLines = new Map(this.lines.map((l) => [l.id, this.lineNow(l)]));
    // where every category is drawn now (bars slide from there when the order changes)
    this.prevPos = new Map(this.shown.map((c) => [this.categories[c], this.aPos(c)]));
    this.prevKeys = keys;

    const n = this.categories.length || Math.max(0, ...this.seriesList.map((s) => s.data.length));
    if (!this.categories.length) this.categories = Array.from({ length: n }, (_, i) => String(i + 1));
    this.vals = this.seriesList.map((s) => Array.from({ length: n }, (_, c) => valueOf(s.data[c])));
    this.items = this.seriesList.map((s) => Array.from({ length: n }, (_, c) => {
      const v = s.data[c];
      return v !== null && typeof v === 'object' ? v : null;
    }));
    this.stacks = computeStacks(
      this.seriesList.map((s, si) => ({ key: this.keyOf(s), group: s.stack ?? '__all__', values: this.vals[si], hidden: this.hidden.has(this.keyOf(s)), axis: this.axisOf(s) })),
      n,
      this.opts.stacked ?? false,
    );
    // helper (silent) series stack but are not part of the totals (e.g. the base of a waterfall)
    if (this.seriesList.some((s) => s.silent)) {
      this.stacks.totals = this.categories.map((_, c) =>
        this.seriesList.reduce((a, s, si) => a + (this.hidden.has(this.keyOf(s)) || s.silent ? 0 : Math.abs(this.vals[si][c] ?? 0)), 0),
      );
    }
    const net = this.categories.map((_, c) => this.seriesList.reduce((a, s, si) => a + (this.hidden.has(this.keyOf(s)) || s.silent ? 0 : (this.vals[si][c] ?? 0)), 0));
    this.order = sortOrder(net, this.opts.sort ?? 'none');
    this.shown = this.opts.limit ? this.order.slice(0, this.opts.limit) : [...this.order];
    this.posOf = new Map(this.shown.map((c, i) => [c, i]));
    if (this.view) {
      const span = Math.min(this.view[1] - this.view[0], this.shown.length);
      const a = clamp(this.view[0], 0, Math.max(0, this.shown.length - span));
      this.view = span >= this.shown.length ? null : [a, a + span];
    }
    // Mekko: widths proportional to the totals
    if (this.opts.widthBy === 'total') {
      const w = this.shown.map((c) => Math.max(0, this.stacks.totals[c] ?? 0));
      const sum = w.reduce((a, b) => a + b, 0) || 1;
      this.mekko = [0];
      w.forEach((x) => this.mekko!.push(this.mekko![this.mekko!.length - 1] + x / sum));
    } else this.mekko = null;
    this.lines = this.computeLines();
    this.layout();
    this.renderLegend();
    this.canvas.setAttribute('aria-label', `Gráfico de barras: ${this.seriesList.filter((s) => !s.silent).map((s) => s.name).join(', ')}`);
    const dur = this.duration();
    if (!anim || dur === 0 || (anim === 'morph' && !this.prev)) {
      if (anim === 'morph' && !this.prev && dur > 0) anim = 'reveal';
      else {
        this.animKind = null;
        this.progress = 1;
        this.draw();
        return;
      }
    }
    this.animKind = anim;
    this.animStart = performance.now();
    this.progress = 0;
    this.elapsed = 0;
    this.tick();
  }

  private applyInitialZoom(): void {
    const z = this.opts.zoom;
    if (typeof z !== 'object' || (z.start === undefined && z.end === undefined)) return;
    const n = this.shown.length;
    const a = Math.floor((n * clamp(z.start ?? 0, 0, 100)) / 100);
    const b = Math.max(a + 1, Math.ceil((n * clamp(z.end ?? 100, 0, 100)) / 100));
    if (b - a >= n) return;
    this.view = [a, b];
    this.layout();
    this.draw();
  }

  // ------------------------------------------------------------------ overlays

  private overlayKey(ov: BarOverlay, i: number): string {
    return ov.id ?? ov.name ?? `${ov.type}-${i}`;
  }

  /** Values of the source series per category (null when hidden or missing). */
  private sourceValues(source: string | undefined): (number | null)[] {
    const n = this.categories.length;
    const visible = this.seriesList.map((s, si) => ({ s, si })).filter(({ s }) => !this.hidden.has(this.keyOf(s)) && !s.silent);
    if (source === 'total') {
      return Array.from({ length: n }, (_, c) => {
        const vs = visible.map(({ si }) => this.vals[si][c]).filter((v): v is number => v !== null);
        return vs.length ? vs.reduce((a, b) => a + b, 0) : null;
      });
    }
    const si = source ? this.seriesList.findIndex((x) => this.keyOf(x) === source || x.name === source) : this.seriesList.findIndex((x) => !x.silent);
    const s = this.seriesList[si];
    if (!s || this.hidden.has(this.keyOf(s))) return new Array(n).fill(null);
    return Array.from({ length: n }, (_, c) => this.vals[si][c] ?? null);
  }

  private computeLines(): OverlayLine[] {
    const list = this.opts.overlays ?? [];
    const n = this.categories.length;
    let colorIndex = 0;
    return list.map((ov, i) => {
      const id = this.overlayKey(ov, i);
      const color = ov.color ?? OVERLAY_COLORS[colorIndex++ % OVERLAY_COLORS.length];
      const axis = ov.axis ?? (ov.type === 'cumulative' ? 'right' : 'left');
      const period = ov.period ?? 3;
      let suffix = '';
      let values: (number | null)[];
      if (ov.type === 'line') values = Array.from({ length: n }, (_, c) => ov.data?.[c] ?? null);
      else {
        // calculations follow the order shown on screen (matters with `sort`, e.g. Pareto)
        const byCat = this.sourceValues(ov.source);
        const shown = this.order.map((c) => byCat[c] ?? null);
        let out: (number | null)[];
        switch (ov.type) {
          case 'sma':
            out = sma(shown, period);
            break;
          case 'ema':
            out = ema(shown, period);
            break;
          case 'wma':
            out = wma(shown, period);
            break;
          case 'linear':
            out = linearTrend(shown).values;
            break;
          case 'exponential': {
            const t = exponentialTrend(shown);
            out = t.values;
            suffix = ` (${t.growth >= 0 ? '+' : ''}${(t.growth * 100).toFixed(1)}%/período)`;
            break;
          }
          case 'average':
            out = average(shown);
            break;
          default:
            out = cumulative(shown, ov.percent);
        }
        values = new Array(n).fill(null);
        this.order.forEach((c, pos) => (values[c] = out[pos]));
        if (['sma', 'ema', 'wma'].includes(ov.type)) suffix = ` (${period})`;
        if (ov.type === 'cumulative' && ov.percent) suffix = ' %';
      }
      const visibleSeries = this.seriesList.filter((s) => !s.silent);
      const many = visibleSeries.length > 1 && ov.type !== 'line';
      const src = ov.source === 'total' ? 'Total' : (this.seriesList.find((x) => this.keyOf(x) === ov.source || x.name === ov.source) ?? visibleSeries[0])?.name;
      const name = ov.name ?? `${OVERLAY_NAMES[ov.type]}${suffix}${many && src ? ` · ${src}` : ''}`;
      return { overlay: ov, id, name, color, axis, values };
    });
  }

  /** values of a line as currently drawn (mid-animation aware) */
  private lineNow(l: OverlayLine): (number | null)[] {
    if (this.animKind !== 'morph' || this.progress >= 1) return l.values;
    const prev = this.prevLines.get(l.id);
    if (!prev || prev.length !== l.values.length) return l.values;
    const e = this.progress;
    return l.values.map((v, i) => (v === null || prev[i] === null ? v : prev[i]! + (v - prev[i]!) * e));
  }

  private fmtAxis(v: number, axis: BarAxisId): string {
    const f = this.axisOpts(axis).format;
    if (f) return f(v);
    if (axis === 'left' && this.opts.stacked === 'percent') return `${+v.toFixed(0)}%`;
    const pct = this.lines.some((l) => l.axis === axis && l.overlay.type === 'cumulative' && l.overlay.percent);
    if (pct && axis !== 'left') return `${+v.toFixed(0)}%`;
    const s = this.scales[axis];
    const step = s.ticks.length > 1 ? Math.abs(s.ticks[1] - s.ticks[0]) : 0;
    if (step > 0 && step < 1 && Math.abs(v) < 1e4) {
      let dec = 0;
      while (dec < 6 && Math.abs(Math.round(step * 10 ** dec) - step * 10 ** dec) > 1e-6) dec++;
      return v.toFixed(dec);
    }
    return formatCompact(v);
  }

  private fmtLine(l: OverlayLine, v: number): string {
    if (l.overlay.type === 'cumulative' && l.overlay.percent) return `${v.toFixed(1)}%`;
    if (l.axis !== 'left' && this.axisOpts(l.axis).format) return this.axisOpts(l.axis).format!(v);
    const src = this.seriesList.find((x) => this.keyOf(x) === l.overlay.source || x.name === l.overlay.source) ?? this.seriesList[0];
    return this.opts.valueFormatter && src ? this.opts.valueFormatter(v, src) : formatCompact(v);
  }

  // ------------------------------------------------------------------ animation

  /** segments as currently drawn (mid-animation aware) */
  private currentSegments(): (Segment | null)[][] {
    return this.stacks.segments.map((row, si) => row.map((seg, c) => (seg ? this.animated(seg, si, c) : null)));
  }

  private get stagger(): number {
    const a = this.opts.animation;
    return typeof a === 'object' ? (a.stagger ?? 0) : 0;
  }

  /** progress of one category (with the stagger delay of its position) */
  private catProgress(c: number): number {
    if (!this.animKind) return 1;
    const pos = this.posOf.get(c) ?? 0;
    const t = (this.elapsed - this.stagger * pos) / (this.duration() || 1);
    return easeOutCubic(clamp(t, 0, 1));
  }

  private animated(seg: Segment, si: number, c: number): Segment {
    if (!this.animKind) return seg;
    const e = this.catProgress(c);
    if (e >= 1) return seg;
    if (this.animKind === 'reveal') return { ...seg, from: seg.from * e, to: seg.to * e };
    const p = this.prev?.[si]?.[c];
    if (!p) return { ...seg, from: seg.from, to: seg.from + (seg.to - seg.from) * e };
    return { slot: seg.slot, from: p.from + (seg.from - p.from) * e, to: p.to + (seg.to - p.to) * e };
  }

  /** animated display position of a category (bars slide when the order changes) */
  private aPos(c: number): number {
    const target = this.posOf.get(c) ?? this.shown.length;
    if (this.animKind !== 'morph') return target;
    const from = this.prevPos.get(this.categories[c]) ?? this.shown.length;
    return from + (target - from) * this.catProgress(c);
  }

  private duration(): number {
    const a = this.opts.animation ?? true;
    return a === false ? 0 : typeof a === 'object' ? (a.duration ?? 700) : 700;
  }

  private tick(): void {
    cancelAnimationFrame(this.raf);
    this.raf = requestAnimationFrame((now) => {
      const dur = this.duration();
      const total = dur + this.stagger * Math.max(0, this.shown.length - 1);
      this.elapsed = now - this.animStart;
      this.progress = easeOutCubic(Math.min(1, this.elapsed / dur));
      // the last frame is drawn as "not animating" (final values, labels)
      if (this.elapsed >= total) this.animKind = null;
      this.draw();
      if (this.animKind) this.tick();
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

  private fmtCategory(i: number): string {
    const f = this.opts.categoryAxis?.format;
    return f ? f(this.categories[i], i) : (this.categories[i] ?? '');
  }

  /** value range of an axis from the bars, overlays and reference lines on it */
  private domainOf(axis: BarAxisId, valueLen: number): Scale {
    const ao = this.axisOpts(axis);
    const r = this.stacks.ranges[axis] ?? { min: 0, max: 0 };
    let lo = Math.min(0, r.min);
    let hi = Math.max(0, r.max);
    if (axis === 'left') for (const a of this.opts.annotations ?? []) ((lo = Math.min(lo, a.value)), (hi = Math.max(hi, a.value)));
    for (const l of this.lines) {
      if (this.hidden.has(l.id) || l.axis !== axis) continue;
      for (const v of l.values) if (v !== null) ((lo = Math.min(lo, v)), (hi = Math.max(hi, v)));
    }
    const pct = this.lines.some((l) => l.axis === axis && l.overlay.type === 'cumulative' && l.overlay.percent);
    if ((axis === 'left' && this.opts.stacked === 'percent') || pct) ((lo = Math.min(0, lo)), (hi = 100));
    if (hi === lo) hi = lo + 1;
    if (ao.min !== undefined) lo = ao.min;
    if (ao.max !== undefined) hi = ao.max;
    // breaks hide part of the range: ask for proportionally more ticks
    const hiddenSpan = axis === 'left' ? this.vbreaks.reduce((a, [f, t]) => a + (t - f), 0) : 0;
    const k = hiddenSpan > 0 ? (hi - lo) / Math.max(1e-9, hi - lo - hiddenSpan) : 1;
    const nice = niceScale(lo, hi, Math.round((ao.ticks ?? Math.max(2, Math.round(valueLen / 70))) * k));
    const min = ao.min ?? nice.min;
    let max = ao.max ?? nice.max;
    if ((((axis === 'left' && this.opts.stacked === 'percent') || pct) && ao.max === undefined)) max = 100;
    const ticks = nice.ticks.filter((t) => t >= min - 1e-9 && t <= max + 1e-9 && !(axis === 'left' && this.vbreaks.some(([f, to]) => t > f && t < to)));
    return { min, max, ticks };
  }

  private layout(): void {
    const ctx = this.ctx;
    const o = this.opts;
    const pad = o.padding ?? 8;
    const ca = { show: true, grid: false, ...(o.categoryAxis ?? {}) };
    const labelsOutside = o.labels?.show && (o.labels.position ?? (o.stacked ? 'center' : 'outside')) === 'outside';
    ctx.font = `11px ${this.theme.font}`;
    // axes in use
    this.used = new Set<BarAxisId>(['left']);
    this.seriesList.forEach((s) => !this.hidden.has(this.keyOf(s)) && this.used.add(this.axisOf(s)));
    this.lines.forEach((l) => !this.hidden.has(l.id) && this.used.add(l.axis));
    // value breaks (left axis)
    this.vbreaks = (o.valueAxis?.breaks ?? []).map((b) => [Math.min(b.from, b.to), Math.max(b.from, b.to)] as [number, number]).filter(([f, t]) => t > f).sort((a, b) => a[0] - b[0]);
    const valueLen = this.vertical ? this.height : this.width;
    for (const axis of AXES) this.scales[axis] = this.domainOf(axis, valueLen);
    if (this.vbreaks.length) {
      const s = this.scales.left;
      const kept = s.max - s.min - this.vbreaks.reduce((a, [f, t]) => a + (t - f), 0);
      this.breakGap = Math.max(0, kept) * 0.03;
    }
    const axisW = (axis: BarAxisId): number => {
      const ao = this.axisOpts(axis);
      if (!this.used.has(axis) || !ao.show) return 0;
      return Math.max(...this.scales[axis].ticks.map((t) => ctx.measureText(this.fmtAxis(t, axis)).width), 10) + 10 + (ao.title ? 16 : 0);
    };
    const va = this.axisOpts('left');
    const catLabelW = ca.show ? Math.min(this.width * 0.35, Math.max(...this.categories.map((_, i) => ctx.measureText(this.fmtCategory(i)).width), 10) + 12) : 0;
    const extra = labelsOutside ? 22 : 6;
    const slider = typeof o.zoom === 'object' && o.zoom.slider && this.vertical && !this.polarCfg;
    if (this.polarCfg) {
      this.plot = { x: pad, y: pad + 4, w: Math.max(10, this.width - pad * 2), h: Math.max(10, this.height - pad * 2 - 8) };
    } else if (this.vertical) {
      const left = va.show ? axisW('left') : 0;
      const right = axisW('right') + axisW('right2');
      const bottom = (ca.show ? 22 : 4) + (ca.title ? 16 : 0) + (slider ? 44 : 0);
      // room above for outside labels or for the max / min pins
      const pins = this.seriesList.some((s) => !this.hidden.has(this.keyOf(s)) && (s.marks?.max || s.marks?.min));
      const top = pins ? 40 : labelsOutside ? 16 : 6;
      this.plot = { x: pad + left, y: pad + top, w: Math.max(10, this.width - pad * 2 - left - Math.max(4, right)), h: Math.max(10, this.height - pad * 2 - bottom - top) };
    } else {
      const left = catLabelW + (ca.title ? 16 : 0);
      const bottom = (va.show ? 22 : 4) + (va.title ? 16 : 0);
      const ra = this.axisOpts('right');
      const top = this.used.has('right') && ra.show ? 20 + (ra.title ? 16 : 0) : 4;
      const pins = this.seriesList.some((s) => !this.hidden.has(this.keyOf(s)) && (s.marks?.max || s.marks?.min));
      this.plot = { x: pad + left, y: pad + top, w: Math.max(10, this.width - pad * 2 - left - (pins ? 44 : extra) - 8), h: Math.max(10, this.height - pad * 2 - bottom - top) };
    }
    this.sliderRect = slider ? { x: this.plot.x, y: this.height - pad - 32, w: this.plot.w, h: 30 } : null;
  }

  /** animated value range of an axis */
  private rangeOf(axis: BarAxisId): { min: number; max: number } {
    const to = this.scales[axis];
    const from = this.prevScales?.[axis];
    if (this.animKind === 'morph' && from) {
      const e = this.progress;
      return { min: from.min + (to.min - from.min) * e, max: from.max + (to.max - from.max) * e };
    }
    return to;
  }

  /** value with the left-axis breaks squeezed to a small gap */
  private vc(v: number): number {
    let c = v;
    for (const [f, t] of this.vbreaks) {
      const k = this.breakGap / (t - f);
      if (v >= t) c -= t - f - this.breakGap;
      else if (v > f) c -= (v - f) * (1 - k);
    }
    return c;
  }

  /** value → pixel along the value axis */
  private vPx(v: number, axis: BarAxisId = 'left'): number {
    const { min, max } = this.rangeOf(axis);
    const c = (x: number): number => (axis === 'left' ? this.vc(x) : x);
    const t = (c(v) - c(min)) / (c(max) - c(min) || 1);
    return this.vertical ? this.plot.y + this.plot.h - t * this.plot.h : this.plot.x + t * this.plot.w;
  }

  /** zoom window in display positions */
  private get viewRange(): [number, number] {
    return this.view ?? [0, Math.max(1, this.shown.length)];
  }

  /** display position → band start & size along the category axis */
  private band(pos: number): { start: number; size: number } {
    const len = this.vertical ? this.plot.w : this.plot.h;
    const origin = this.vertical ? this.plot.x : this.plot.y;
    if (this.mekko && !this.view) {
      const n = this.shown.length;
      const i = clamp(Math.floor(pos), 0, Math.max(0, n - 1));
      const w = this.mekko[i + 1] - this.mekko[i];
      return { start: origin + (this.mekko[i] + (pos - i) * w) * len, size: w * len };
    }
    const [a, b] = this.viewRange;
    const size = len / (b - a);
    return { start: origin + (pos - a) * size, size };
  }

  // ------------------------------------------------------------------ drawing

  private draw(): void {
    const ctx = this.ctx;
    const t = this.theme;
    const P = this.plot;
    const o = this.opts;
    ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
    ctx.clearRect(0, 0, this.width, this.height);
    if (t.background !== 'transparent') {
      ctx.fillStyle = t.background;
      ctx.fillRect(0, 0, this.width, this.height);
    }
    this.drawn = [];
    const visible = this.seriesList.some((s) => !this.hidden.has(this.keyOf(s)));
    if (this.polarCfg) {
      this.drawPolar();
      this.drawGraphic();
      return;
    }
    this.drawGrid();
    if (!visible || !this.categories.length) {
      ctx.fillStyle = t.muted;
      ctx.font = `13px ${t.font}`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(o.emptyText ?? 'Sem dados', P.x + P.w / 2, P.y + P.h / 2);
      this.drawAxes();
      return;
    }

    // hovered category band
    if (this.hoverCat >= 0 && this.posOf.has(this.hoverCat)) {
      const b = this.band(this.aPos(this.hoverCat));
      ctx.fillStyle = t.hover;
      if (this.vertical) ctx.fillRect(b.start, P.y, b.size, P.h);
      else ctx.fillRect(P.x, b.start, P.w, b.size);
    }

    ctx.save();
    if (this.view || this.opts.limit) {
      // zoomed / limited: keep the bars inside the plot
      ctx.beginPath();
      ctx.rect(P.x, P.y - 20, P.w, P.h + 40);
      ctx.clip();
    }
    this.drawBackgrounds();
    this.drawBars();
    this.drawLines();
    ctx.restore();
    this.drawMarks();
    if (o.labels?.show) this.drawLabels();
    this.drawBreaks();
    this.drawAnnotations();
    this.drawGraphic();
    this.drawAxes();
    this.drawBrush();
    this.drawSlider();
  }

  /** categories to draw, with their animated positions (only the ones in the zoom window) */
  private visibleCats(): { c: number; pos: number }[] {
    const [a, b] = this.viewRange;
    const out: { c: number; pos: number }[] = [];
    if (this.animKind === 'morph' || this.mekko) {
      for (const c of this.shown) out.push({ c, pos: this.aPos(c) });
      return out;
    }
    for (let p = Math.max(0, Math.floor(a)); p < Math.min(this.shown.length, Math.ceil(b)); p++) out.push({ c: this.shown[p], pos: p });
    return out;
  }

  private barThickness(): (pos: number, slot: number) => { start: number; size: number } {
    const o = this.opts;
    const gap = o.categoryGap ?? 0.25;
    const barGap = o.barGap ?? 3;
    return (pos, slot) => {
      const b = this.band(pos);
      return slotRect(b.start, b.size, slot, this.stacks.slots, gap, b.size < 6 ? 0 : barGap, o.maxBarWidth);
    };
  }

  /** full-length tracks behind the bars (series `background`) */
  private drawBackgrounds(): void {
    const ctx = this.ctx;
    const slotOf = this.barThickness();
    this.seriesList.forEach((s, si) => {
      if (!s.background || this.hidden.has(this.keyOf(s))) return;
      const axis = this.axisOf(s);
      const { min, max } = this.rangeOf(axis);
      const a = this.vPx(Math.max(min, Math.min(0, max)), axis);
      const z = this.vPx(max, axis);
      ctx.fillStyle = typeof s.background === 'string' ? s.background : alpha(this.theme.muted, 0.14);
      for (const { c, pos } of this.visibleCats()) {
        const seg = this.stacks.segments[si]?.[c];
        if (!seg) continue;
        const sl = slotOf(pos, seg.slot);
        const r = Math.min(this.opts.radius ?? 3, sl.size / 2);
        ctx.beginPath();
        if (this.vertical) ctx.roundRect(sl.start, Math.min(a, z), sl.size, Math.abs(z - a), [r, r, 0, 0]);
        else ctx.roundRect(Math.min(a, z), sl.start, Math.abs(z - a), sl.size, [0, r, r, 0]);
        ctx.fill();
      }
    });
  }

  private drawBars(): void {
    const ctx = this.ctx;
    const o = this.opts;
    const radius = o.radius ?? 3;
    const slotOf = this.barThickness();
    const cats = this.visibleCats();
    // outermost segment per (slot, category, sign) gets the rounded corners
    const outer = new Map<string, number>();
    this.stacks.segments.forEach((row, si) => {
      if (this.seriesList[si]?.silent) return;
      row.forEach((seg, c) => {
        if (!seg) return;
        outer.set(`${seg.slot}|${c}|${seg.to >= seg.from ? '+' : '-'}`, si);
      });
    });
    this.seriesList.forEach((s, si) => {
      const row = this.stacks.segments[si];
      if (!row) return;
      const key = this.keyOf(s);
      const axis = this.axisOf(s);
      const color = this.colorOf(s, si);
      const dimSeries = this.highlighted && this.highlighted !== key ? (o.hoverDim ?? 0.3) : 1;
      for (const { c, pos } of cats) {
        const target = row[c];
        if (!target) continue;
        const seg = this.animated(target, si, c);
        const sl = slotOf(pos, seg.slot);
        const a = this.vPx(seg.from, axis);
        const z = this.vPx(seg.to, axis);
        const raw = this.vals[si][c] ?? 0;
        const item = this.items[si][c];
        const positive = target.to >= target.from;
        let fill = positive || !s.negativeColor ? color : s.negativeColor;
        if (o.colorBy) fill = o.colorBy(raw, c, s);
        if (item?.color) fill = item.color;
        const isOuter = outer.get(`${target.slot}|${c}|${positive ? '+' : '-'}`) === si;
        const r = isOuter ? Math.min(radius, sl.size / 2, Math.abs(z - a)) : 0;
        let rect: Rect;
        let radii: number[];
        if (this.vertical) {
          rect = { x: sl.start, y: Math.min(a, z), w: sl.size, h: Math.max(0.5, Math.abs(z - a)) };
          radii = positive ? [r, r, 0, 0] : [0, 0, r, r];
        } else {
          rect = { x: Math.min(a, z), y: sl.start, w: Math.max(0.5, Math.abs(z - a)), h: sl.size };
          radii = positive ? [0, r, r, 0] : [r, 0, 0, r];
        }
        const total = this.stacks.totals[c] || 1;
        const datum: BarDatum = { series: s, seriesIndex: si, categoryIndex: c, category: this.categories[c], value: raw, color: fill, percent: (Math.abs(raw) / total) * 100, item: item ?? undefined };
        if (s.silent) continue;
        const selDim = this.selected && !this.selected.has(`${si}|${c}`) ? 0.25 : 1;
        const hovered = this.hoverBar && this.hoverBar.datum.seriesIndex === si && this.hoverBar.datum.categoryIndex === c;
        ctx.save();
        ctx.globalAlpha = dimSeries * selDim * (item?.opacity ?? 1);
        const grad = item?.gradient ?? s.gradient;
        if (grad && grad.length) {
          // tip → base
          const tip = this.vertical ? (positive ? rect.y : rect.y + rect.h) : positive ? rect.x + rect.w : rect.x;
          const base = this.vertical ? (positive ? rect.y + rect.h : rect.y) : positive ? rect.x : rect.x + rect.w;
          const g = this.vertical ? ctx.createLinearGradient(0, tip, 0, base) : ctx.createLinearGradient(tip, 0, base, 0);
          const cols = grad.length === 1 ? [grad[0], grad[0]] : grad;
          cols.forEach((col, i) => g.addColorStop(i / (cols.length - 1), col));
          ctx.fillStyle = g;
        } else ctx.fillStyle = fill;
        ctx.beginPath();
        if (rect.w < 1.5 || rect.h < 1.5 || r === 0) ctx.rect(rect.x, rect.y, rect.w, rect.h);
        else ctx.roundRect(rect.x, rect.y, rect.w, rect.h, radii);
        ctx.fill();
        const bw = item?.borderWidth ?? s.borderWidth;
        const bc = item?.borderColor ?? s.borderColor;
        if (bw && bc) {
          ctx.lineWidth = bw;
          ctx.strokeStyle = bc;
          ctx.stroke();
        }
        if (hovered) {
          ctx.fillStyle = 'rgba(255,255,255,0.15)';
          ctx.fill();
        }
        ctx.restore();
        this.drawn.push({ rect, datum });
      }
    });
  }

  private drawGrid(): void {
    const ctx = this.ctx;
    const P = this.plot;
    const px = (v: number): number => (Math.round(v * this.dpr) + 0.5) / this.dpr;
    ctx.save();
    ctx.strokeStyle = this.theme.grid;
    ctx.lineWidth = 1 / this.dpr;
    ctx.beginPath();
    for (const axis of AXES) {
      if (!this.used.has(axis) || !this.axisOpts(axis).grid) continue;
      for (const v of this.scales[axis].ticks) {
        const p = px(this.vPx(v, axis));
        if (this.vertical) {
          ctx.moveTo(P.x, p);
          ctx.lineTo(P.x + P.w, p);
        } else {
          ctx.moveTo(p, P.y);
          ctx.lineTo(p, P.y + P.h);
        }
      }
    }
    if (this.opts.categoryAxis?.grid) {
      for (const { pos } of this.visibleCats()) {
        const b = this.band(pos);
        const p = px(b.start);
        if (this.vertical) {
          ctx.moveTo(p, P.y);
          ctx.lineTo(p, P.y + P.h);
        } else {
          ctx.moveTo(P.x, p);
          ctx.lineTo(P.x + P.w, p);
        }
      }
    }
    ctx.stroke();
    ctx.restore();
  }

  /** zigzag cut across the plot where the value axis has a break */
  private drawBreaks(): void {
    if (!this.vbreaks.length) return;
    const ctx = this.ctx;
    const P = this.plot;
    const { min, max } = this.rangeOf('left');
    ctx.save();
    for (const [f, t] of this.vbreaks) {
      if (t <= min || f >= max) continue;
      const p1 = this.vPx(f);
      const p2 = this.vPx(t);
      const mid = (p1 + p2) / 2;
      const amp = 3;
      const zig = (offset: number): void => {
        ctx.beginPath();
        const len = this.vertical ? P.w : P.h;
        for (let d = 0; d <= len; d += 6) {
          const wobble = (d / 6) % 2 === 0 ? -amp : amp;
          const along = (this.vertical ? P.x : P.y) + d;
          const across = mid + offset + wobble;
          if (d === 0) this.vertical ? ctx.moveTo(along, across) : ctx.moveTo(across, along);
          else this.vertical ? ctx.lineTo(along, across) : ctx.lineTo(across, along);
        }
      };
      // fill the gap with the background, then two zigzag lines
      ctx.fillStyle = this.theme.background === 'transparent' ? 'rgba(0,0,0,0.5)' : this.theme.background;
      zig(-4);
      if (this.vertical) {
        ctx.lineTo(P.x + P.w, mid + 4);
        ctx.lineTo(P.x, mid + 4);
      } else {
        ctx.lineTo(mid + 4, P.y + P.h);
        ctx.lineTo(mid + 4, P.y);
      }
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = this.theme.muted;
      ctx.lineWidth = 1;
      zig(-4);
      ctx.stroke();
      zig(4);
      ctx.stroke();
      void p2;
    }
    ctx.restore();
  }

  private fmtLabel(v: number, d: BarDatum): string {
    const o = this.opts;
    if (d.item?.label !== undefined) return d.item.label;
    if (o.labels?.format) return o.labels.format(v, d);
    if (o.stacked === 'percent') return `${d.percent.toFixed(0)}%`;
    return o.valueFormatter ? o.valueFormatter(v, d.series) : formatCompact(v);
  }

  /** value shown in a label: counts up while the bars animate */
  private labelValue(d: DrawnBar): number {
    if (!this.animKind || this.opts.stacked === 'percent') return d.datum.value;
    const seg = this.stacks.segments[d.datum.seriesIndex]?.[d.datum.categoryIndex];
    if (!seg) return d.datum.value;
    const a = this.animated(seg, d.datum.seriesIndex, d.datum.categoryIndex);
    const v = a.to - a.from;
    const raw = d.datum.value;
    return Number.isInteger(raw) ? Math.round(v) : +v.toFixed(2);
  }

  private drawLabels(): void {
    const ctx = this.ctx;
    const o = this.opts;
    const L = o.labels!;
    const position = L.position ?? (o.stacked ? 'center' : 'outside');
    const rot = ((L.rotate ?? 0) * Math.PI) / 180;
    ctx.save();
    ctx.font = `600 ${L.fontSize ?? 11}px ${this.theme.font}`;
    for (const d of this.drawn) {
      const r = d.rect;
      const text = this.fmtLabel(this.labelValue(d), d.datum);
      const tw = ctx.measureText(text).width;
      const positive = d.datum.value >= 0;
      let x: number;
      let y: number;
      let align: CanvasTextAlign = 'center';
      let color = L.color ?? this.theme.text;
      const inner = L.color ?? contrast(typeof d.datum.color === 'string' ? d.datum.color : '#000000');
      // room along the bar: rotated labels need the bar length, not its width
      const along = this.vertical ? r.h : r.w;
      const across = this.vertical ? r.w : r.h;
      const fitLen = rot ? across + 6 >= (L.fontSize ?? 11) && along >= tw + 6 : (this.vertical ? across : along) >= tw + 6;
      if (this.vertical) {
        x = r.x + r.w / 2;
        if (position === 'center') ((y = r.y + r.h / 2), (color = inner));
        else if (position === 'inside') ((y = positive ? r.y + (rot ? tw / 2 + 6 : 9) : r.y + r.h - (rot ? tw / 2 + 6 : 9)), (color = inner));
        else if (position === 'base') ((y = positive ? r.y + r.h - (rot ? tw / 2 + 6 : 9) : r.y + (rot ? tw / 2 + 6 : 9)), (color = inner));
        else y = positive ? r.y - (rot ? tw / 2 + 6 : 8) : r.y + r.h + (rot ? tw / 2 + 6 : 8);
        if (position !== 'outside' && (!fitLen || r.h < 14)) continue;
        if (position === 'outside' && !rot && tw > r.w + 30) continue;
      } else {
        y = r.y + r.h / 2;
        if (position === 'center') ((x = r.x + r.w / 2), (color = inner));
        else if (position === 'inside') ((x = positive ? r.x + r.w - 6 : r.x + 6), (color = inner), (align = positive ? 'right' : 'left'));
        else if (position === 'base') ((x = positive ? r.x + 6 : r.x + r.w - 6), (color = inner), (align = positive ? 'left' : 'right'));
        else ((x = positive ? r.x + r.w + 6 : r.x - 6), (align = positive ? 'left' : 'right'));
        if (position !== 'outside' && (tw > r.w - 8 || r.h < 12)) continue;
      }
      ctx.fillStyle = color;
      ctx.textBaseline = 'middle';
      if (rot) {
        ctx.save();
        ctx.translate(x, y);
        ctx.rotate(-rot);
        ctx.textAlign = 'center';
        ctx.fillText(text, 0, 0);
        ctx.restore();
      } else {
        ctx.textAlign = align;
        ctx.fillText(text, x, y);
      }
    }
    ctx.restore();
  }

  /** pins on the highest / lowest bar of a series and a line at its average */
  private drawMarks(): void {
    const ctx = this.ctx;
    const P = this.plot;
    this.seriesList.forEach((s, si) => {
      const m = s.marks;
      if (!m || this.hidden.has(this.keyOf(s))) return;
      const bars = this.drawn.filter((d) => d.datum.seriesIndex === si);
      if (!bars.length) return;
      const color = this.colorOf(s, si);
      const axis = this.axisOf(s);
      const fmt = (v: number): string => (this.opts.valueFormatter ? this.opts.valueFormatter(v, s) : formatCompact(v));
      ctx.save();
      ctx.globalAlpha = this.animKind ? this.progress : 1;
      if (m.average) {
        const vals = this.shown.map((c) => this.vals[si][c]).filter((v): v is number => v !== null);
        const avg = vals.reduce((a, b) => a + b, 0) / (vals.length || 1);
        const p = Math.round(this.vPx(avg, axis)) + 0.5;
        ctx.strokeStyle = color;
        ctx.setLineDash([5, 4]);
        ctx.beginPath();
        if (this.vertical) {
          ctx.moveTo(P.x, p);
          ctx.lineTo(P.x + P.w, p);
        } else {
          ctx.moveTo(p, P.y);
          ctx.lineTo(p, P.y + P.h);
        }
        ctx.stroke();
        ctx.setLineDash([]);
        ctx.font = `600 11px ${this.theme.font}`;
        ctx.fillStyle = color;
        ctx.textAlign = 'right';
        ctx.textBaseline = 'bottom';
        if (this.vertical) ctx.fillText(`Média ${fmt(Math.round(avg * 100) / 100)}`, P.x + P.w - 2, p - 3);
        else ctx.fillText(`Média ${fmt(Math.round(avg * 100) / 100)}`, p - 3, P.y + 12);
      }
      const pin = (d: DrawnBar): void => {
        const r = d.rect;
        const positive = d.datum.value >= 0;
        const x = this.vertical ? r.x + r.w / 2 : positive ? r.x + r.w : r.x;
        const y = this.vertical ? (positive ? r.y : r.y + r.h) : r.y + r.h / 2;
        const text = fmt(d.datum.value);
        ctx.font = `700 10px ${this.theme.font}`;
        const rad = Math.max(12, ctx.measureText(text).width / 2 + 5);
        const a = Math.acos(1 / 1.75);
        const up = this.vertical ? positive : true;
        const cx = this.vertical ? x : x + (positive ? rad * 1.75 : -rad * 1.75);
        const cy = this.vertical ? (up ? y - rad * 1.75 : y + rad * 1.75) : y;
        // balloon pointing at the end of the bar
        const dir = this.vertical ? (up ? Math.PI / 2 : -Math.PI / 2) : positive ? Math.PI : 0;
        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.arc(cx, cy, rad, dir + a, dir - a);
        ctx.lineTo(x, y);
        ctx.closePath();
        ctx.fill();
        ctx.fillStyle = contrast(color);
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(text, cx, cy + 0.5);
      };
      if (m.max) pin(bars.reduce((b, d) => (d.datum.value > b.datum.value ? d : b), bars[0]));
      if (m.min) pin(bars.reduce((b, d) => (d.datum.value < b.datum.value ? d : b), bars[0]));
      ctx.restore();
    });
  }

  /** Overlay lines (averages, trends…) with a dot on the hovered category. */
  private drawLines(): void {
    const ctx = this.ctx;
    const P = this.plot;
    for (const l of this.lines) {
      if (this.hidden.has(l.id)) continue;
      const vals = this.lineNow(l);
      const pts: { x: number; y: number; c: number }[][] = [[]];
      for (const c of this.shown) {
        const pos = this.aPos(c);
        const v = vals[c];
        if (v === null || v === undefined) {
          if (pts[pts.length - 1].length) pts.push([]);
          continue;
        }
        const b = this.band(pos);
        const along = b.start + b.size / 2;
        const val = this.vPx(v, l.axis);
        pts[pts.length - 1].push(this.vertical ? { x: along, y: val, c } : { x: val, y: along, c });
      }
      for (const run of pts) run.sort((p, q) => (this.vertical ? p.x - q.x : p.y - q.y));
      const smooth = l.overlay.smooth ?? ['sma', 'ema', 'wma', 'cumulative'].includes(l.overlay.type);
      const dim = this.highlighted && this.highlighted !== l.id ? (this.opts.hoverDim ?? 0.3) : 1;
      ctx.save();
      // reveal: grow along the category axis
      if (this.animKind === 'reveal' && this.progress < 1) {
        ctx.beginPath();
        if (this.vertical) ctx.rect(P.x, 0, P.w * this.progress, this.height);
        else ctx.rect(0, P.y, this.width, P.h * this.progress);
        ctx.clip();
      }
      ctx.globalAlpha = dim;
      ctx.strokeStyle = l.color;
      ctx.lineWidth = l.overlay.width ?? 2;
      ctx.lineJoin = 'round';
      ctx.lineCap = 'round';
      ctx.setLineDash(l.overlay.dash ?? (['linear', 'exponential'].includes(l.overlay.type) ? [7, 5] : l.overlay.type === 'average' ? [3, 4] : []));
      // dark halo so the line stays readable over bars of any color
      for (const pass of ['halo', 'line'] as const) {
        ctx.save();
        if (pass === 'halo') {
          ctx.strokeStyle = 'rgba(0,0,0,0.35)';
          ctx.lineWidth = (l.overlay.width ?? 2) + 3;
        }
        for (const seg of pts) this.strokePath(seg, smooth);
        ctx.restore();
      }
      ctx.setLineDash([]);
      for (const seg of pts)
        for (const p of seg) {
          const hovered = p.c === this.hoverCat;
          if (!l.overlay.points && !hovered) continue;
          ctx.fillStyle = hovered ? l.color : this.theme.background === 'transparent' ? 'rgba(0,0,0,0.6)' : this.theme.background;
          ctx.strokeStyle = l.color;
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.arc(p.x, p.y, hovered ? 4.5 : 3, 0, Math.PI * 2);
          ctx.fill();
          ctx.stroke();
        }
      ctx.restore();
    }
  }

  private strokePath(pts: { x: number; y: number }[], smooth: boolean): void {
    const ctx = this.ctx;
    if (!pts.length) return;
    ctx.beginPath();
    ctx.moveTo(pts[0].x, pts[0].y);
    if (smooth && pts.length > 2) {
      // monotone along the category axis: no fake bumps between bars
      const along = pts.map((p) => (this.vertical ? p.x : p.y));
      const vals = pts.map((p) => (this.vertical ? p.y : p.x));
      const m = monotoneTangents(along, vals);
      for (let i = 0; i < pts.length - 1; i++) {
        const d = (along[i + 1] - along[i]) / 3;
        if (this.vertical) ctx.bezierCurveTo(pts[i].x + d, pts[i].y + m[i] * d, pts[i + 1].x - d, pts[i + 1].y - m[i + 1] * d, pts[i + 1].x, pts[i + 1].y);
        else ctx.bezierCurveTo(pts[i].x + m[i] * d, pts[i].y + d, pts[i + 1].x - m[i + 1] * d, pts[i + 1].y - d, pts[i + 1].x, pts[i + 1].y);
      }
    } else for (const p of pts.slice(1)) ctx.lineTo(p.x, p.y);
    if (pts.length === 1) ctx.lineTo(pts[0].x + 0.01, pts[0].y);
    ctx.stroke();
  }

  private drawAnnotations(): void {
    const ctx = this.ctx;
    const P = this.plot;
    ctx.save();
    ctx.font = `600 11px ${this.theme.font}`;
    for (const a of this.opts.annotations ?? []) {
      const p = Math.round(this.vPx(a.value)) + 0.5;
      const color = a.color ?? '#f23645';
      ctx.strokeStyle = color;
      ctx.lineWidth = 1;
      ctx.setLineDash(a.dash ?? [5, 4]);
      ctx.beginPath();
      if (this.vertical) {
        ctx.moveTo(P.x, p);
        ctx.lineTo(P.x + P.w, p);
      } else {
        ctx.moveTo(p, P.y);
        ctx.lineTo(p, P.y + P.h);
      }
      ctx.stroke();
      if (a.label) {
        ctx.setLineDash([]);
        const w = ctx.measureText(a.label).width + 10;
        ctx.fillStyle = color;
        ctx.beginPath();
        if (this.vertical) ctx.roundRect(P.x + P.w - w, p - 9, w, 18, 3);
        else ctx.roundRect(p - w / 2, P.y - 2, w, 18, 3);
        ctx.fill();
        ctx.fillStyle = '#fff';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        if (this.vertical) ctx.fillText(a.label, P.x + P.w - w / 2, p + 0.5);
        else ctx.fillText(a.label, p, P.y + 7.5);
      }
    }
    ctx.restore();
  }

  /** user drawing hook (`graphic`) */
  private drawGraphic(): void {
    const g = this.opts.graphic;
    if (!g) return;
    const api: BarGraphicApi = {
      plot: { ...this.plot },
      width: this.width,
      height: this.height,
      theme: this.theme,
      vertical: this.vertical,
      category: (c) => {
        const i = typeof c === 'number' ? c : this.categories.indexOf(c);
        const b = this.band(this.aPos(i));
        return b.start + b.size / 2;
      },
      value: (v, axis = 'left') => this.vPx(v, axis),
    };
    this.ctx.save();
    g(this.ctx, api);
    this.ctx.restore();
  }

  private drawAxes(): void {
    const ctx = this.ctx;
    const P = this.plot;
    const t = this.theme;
    const va = this.axisOpts('left');
    const ca = { show: true, ...(this.opts.categoryAxis ?? {}) };
    ctx.save();
    ctx.font = `11px ${t.font}`;
    // baseline at zero
    const { min, max } = this.rangeOf('left');
    const zp = Math.round(this.vPx(Math.min(Math.max(0, min), max))) + 0.5;
    ctx.strokeStyle = t.axis;
    ctx.lineWidth = 1;
    ctx.beginPath();
    if (this.vertical) {
      ctx.moveTo(P.x, zp);
      ctx.lineTo(P.x + P.w, zp);
    } else {
      ctx.moveTo(zp, P.y);
      ctx.lineTo(zp, P.y + P.h);
    }
    ctx.stroke();
    ctx.fillStyle = t.muted;
    // left value labels
    if (va.show) {
      for (const v of this.scales.left.ticks) {
        const p = this.vPx(v);
        if (this.vertical) {
          ctx.textAlign = 'right';
          ctx.textBaseline = 'middle';
          ctx.fillText(this.fmtAxis(v, 'left'), P.x - 8, p);
        } else {
          ctx.textAlign = 'center';
          ctx.textBaseline = 'top';
          ctx.fillText(this.fmtAxis(v, 'left'), p, P.y + P.h + 6);
        }
      }
    }
    // right axes (right side; on top for horizontal bars)
    let offset = 0;
    for (const axis of ['right', 'right2'] as const) {
      const ao = this.axisOpts(axis);
      if (!this.used.has(axis) || !ao.show) continue;
      ctx.font = `11px ${t.font}`;
      ctx.fillStyle = t.muted;
      const w = Math.max(...this.scales[axis].ticks.map((v) => ctx.measureText(this.fmtAxis(v, axis)).width), 10) + 10 + (ao.title ? 16 : 0);
      for (const v of this.scales[axis].ticks) {
        const p = this.vPx(v, axis);
        if (this.vertical) {
          ctx.textAlign = 'left';
          ctx.textBaseline = 'middle';
          ctx.fillText(this.fmtAxis(v, axis), P.x + P.w + 8 + offset, p);
        } else {
          ctx.textAlign = 'center';
          ctx.textBaseline = 'bottom';
          ctx.fillText(this.fmtAxis(v, axis), p, P.y - 6);
        }
      }
      if (this.vertical && offset > 0) {
        // the third axis gets its own line
        ctx.strokeStyle = t.axis;
        ctx.beginPath();
        ctx.moveTo(P.x + P.w + offset + 2.5, P.y);
        ctx.lineTo(P.x + P.w + offset + 2.5, P.y + P.h);
        ctx.stroke();
      }
      if (ao.title) {
        ctx.save();
        ctx.font = `600 11px ${t.font}`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        if (this.vertical) {
          ctx.translate(P.x + P.w + offset + w - 4, P.y + P.h / 2);
          ctx.rotate(Math.PI / 2);
          ctx.fillText(ao.title, 0, 0);
        } else ctx.fillText(ao.title, P.x + P.w / 2, (this.opts.padding ?? 8) + 6);
        ctx.restore();
      }
      offset += w;
    }
    // category labels (skip when they would overlap)
    ctx.font = `11px ${t.font}`;
    if (ca.show) {
      const cats = this.visibleCats();
      const b0 = this.band(cats[0]?.pos ?? 0);
      // ticks on the category axis
      if (ca.ticks) {
        ctx.strokeStyle = t.axis;
        ctx.beginPath();
        for (const { pos } of cats) {
          const b = this.band(pos);
          const at = ca.ticks === 'center' ? b.start + b.size / 2 : b.start;
          if (this.vertical) {
            ctx.moveTo(Math.round(at) + 0.5, P.y + P.h);
            ctx.lineTo(Math.round(at) + 0.5, P.y + P.h + 5);
          } else {
            ctx.moveTo(P.x, Math.round(at) + 0.5);
            ctx.lineTo(P.x - 5, Math.round(at) + 0.5);
          }
        }
        ctx.stroke();
      }
      if (this.vertical) {
        const maxW = Math.max(...cats.map(({ c }) => ctx.measureText(this.fmtCategory(c)).width), 1);
        // bands can be thinner than a pixel (thousands of bars): do not round their size up
        const step = this.mekko ? 1 : Math.max(1, Math.ceil((maxW + 8) / Math.max(1e-6, b0.size)));
        ctx.textAlign = 'center';
        ctx.textBaseline = 'top';
        cats.forEach(({ c, pos }, i) => {
          if (i % step) return;
          const b = this.band(pos);
          const cx = b.start + b.size / 2;
          if (cx < P.x - 1 || cx > P.x + P.w + 1) return;
          ctx.fillStyle = c === this.hoverCat ? t.text : t.muted;
          ctx.fillText(this.fmtCategory(c), cx, P.y + P.h + (ca.ticks ? 8 : 6));
        });
      } else {
        const step = Math.max(1, Math.ceil(14 / Math.max(1e-6, b0.size)));
        ctx.textAlign = 'right';
        ctx.textBaseline = 'middle';
        cats.forEach(({ c, pos }, i) => {
          if (i % step) return;
          const b = this.band(pos);
          const cy = b.start + b.size / 2;
          if (cy < P.y - 1 || cy > P.y + P.h + 1) return;
          ctx.fillStyle = c === this.hoverCat ? t.text : t.muted;
          let label = this.fmtCategory(c);
          const maxW = P.x - (this.opts.padding ?? 8) - 10;
          while (label.length > 3 && ctx.measureText(label).width > maxW) label = label.slice(0, -2) + '…';
          ctx.fillText(label, P.x - 8, cy);
        });
      }
    }
    // titles
    ctx.font = `600 11px ${t.font}`;
    ctx.fillStyle = t.muted;
    const bottomTitle = this.vertical ? ca.title : va.title;
    const leftTitle = this.vertical ? va.title : ca.title;
    if (bottomTitle) {
      ctx.textAlign = 'center';
      ctx.textBaseline = 'top';
      ctx.fillText(bottomTitle, P.x + P.w / 2, P.y + P.h + 22);
    }
    if (leftTitle) {
      ctx.translate((this.opts.padding ?? 8) + 6, P.y + P.h / 2);
      ctx.rotate(-Math.PI / 2);
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(leftTitle, 0, 0);
    }
    ctx.restore();
  }

  private drawBrush(): void {
    const b = this.brushRect;
    if (!b) return;
    const ctx = this.ctx;
    ctx.save();
    ctx.fillStyle = 'rgba(41, 98, 255, 0.12)';
    ctx.strokeStyle = '#2962ff';
    ctx.setLineDash([4, 3]);
    const x = Math.min(b.x0, b.x1);
    const y = Math.min(b.y0, b.y1);
    ctx.fillRect(x, y, Math.abs(b.x1 - b.x0), Math.abs(b.y1 - b.y0));
    ctx.strokeRect(x + 0.5, y + 0.5, Math.abs(b.x1 - b.x0), Math.abs(b.y1 - b.y0));
    ctx.restore();
  }

  // ------------------------------------------------------------------ zoom slider

  private sliderWindow(): [number, number] {
    const S = this.sliderRect!;
    const n = Math.max(1, this.shown.length);
    const [a, b] = this.viewRange;
    return [S.x + (a / n) * S.w, S.x + (b / n) * S.w];
  }

  /** navigator: mini bars of the first series, the visible window and two handles */
  private drawSlider(): void {
    const S = this.sliderRect;
    if (!S) return;
    const ctx = this.ctx;
    const t = this.theme;
    const n = Math.max(1, this.shown.length);
    ctx.save();
    ctx.fillStyle = alpha(t.muted, 0.08);
    ctx.strokeStyle = alpha(t.muted, 0.35);
    ctx.beginPath();
    ctx.roundRect(S.x + 0.5, S.y + 0.5, S.w - 1, S.h - 1, 4);
    ctx.fill();
    ctx.stroke();
    const si = this.seriesList.findIndex((s) => !s.silent && !this.hidden.has(this.keyOf(s)));
    if (si >= 0) {
      const vals = this.shown.map((c) => Math.abs(this.vals[si]?.[c] ?? 0));
      const hi = Math.max(...vals, 1e-9);
      ctx.fillStyle = alpha(this.colorOf(this.seriesList[si], si), 0.45);
      // one column per pixel at most (largest value inside it)
      const cols = Math.min(n, Math.floor(S.w));
      for (let k = 0; k < cols; k++) {
        const i0 = Math.floor((k * n) / cols);
        const i1 = Math.max(i0 + 1, Math.floor(((k + 1) * n) / cols));
        let m = 0;
        for (let i = i0; i < i1; i++) m = Math.max(m, vals[i]);
        const h = (m / hi) * (S.h - 6);
        ctx.fillRect(S.x + (k * S.w) / cols, S.y + S.h - 3 - h, Math.max(1, S.w / cols - (cols < S.w / 3 ? 1 : 0)), h);
      }
    }
    const [w0, w1] = this.sliderWindow();
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
    }
    ctx.restore();
  }

  private inSlider(x: number, y: number): boolean {
    const S = this.sliderRect;
    return !!S && x >= S.x - 6 && x <= S.x + S.w + 6 && y >= S.y - 4 && y <= S.y + S.h + 4;
  }

  private sliderMove(x: number): void {
    const sd = this.sliderDrag!;
    const S = this.sliderRect!;
    const n = Math.max(1, this.shown.length);
    const dx = ((x - sd.x) / S.w) * n;
    let [a, b] = sd.view;
    const minSpan = Math.min(n, 2);
    if (sd.mode === 'move') {
      const span = b - a;
      a = clamp(a + dx, 0, n - span);
      b = a + span;
    } else if (sd.mode === 'l') a = clamp(a + dx, 0, b - minSpan);
    else b = clamp(b + dx, a + minSpan, n);
    this.view = b - a >= n - 1e-9 ? null : [a, b];
    this.clearHover();
    this.draw();
  }

  private clearHover(): void {
    this.hoverCat = -1;
    this.hoverBar = null;
    this.tooltipEl.classList.remove('is-visible');
  }

  // ------------------------------------------------------------------ polar

  private get polarCfg(): { cats: 'angle' | 'radius'; a0: number; a1: number; inner: number; round: boolean } | null {
    const p = this.opts.polar;
    if (!p) return null;
    const o = typeof p === 'object' ? p : {};
    const start = o.startAngle ?? 0;
    const end = o.endAngle ?? start + 360;
    return { cats: o.categories ?? 'radius', a0: toRad(start), a1: toRad(end), inner: clamp(o.innerRadius ?? 0, 0, 0.9), round: o.roundCap ?? false };
  }

  private polarGeom(): { cx: number; cy: number; R: number; r0: number } {
    const P = this.plot;
    const R = Math.max(10, Math.min(P.w, P.h) / 2 - 26);
    return { cx: P.x + P.w / 2, cy: P.y + P.h / 2, R, r0: R * this.polarCfg!.inner };
  }

  /** value → fraction 0–1 of the value scale (left axis) */
  private vFrac(v: number): number {
    const { min, max } = this.rangeOf('left');
    return clamp((v - min) / (max - min || 1), 0, 1);
  }

  private sectorPath(r0: number, r1: number, a0: number, a1: number): void {
    const { cx, cy } = this.polarGeom();
    const ctx = this.ctx;
    ctx.beginPath();
    ctx.arc(cx, cy, Math.max(r0, r1), a0, a1);
    ctx.arc(cx, cy, Math.min(r0, r1), a1, a0, true);
    ctx.closePath();
  }

  private drawPolar(): void {
    const ctx = this.ctx;
    const o = this.opts;
    const t = this.theme;
    const pc = this.polarCfg!;
    const { cx, cy, R, r0 } = this.polarGeom();
    const n = Math.max(1, this.shown.length);
    const span = pc.a1 - pc.a0;
    const gap = o.categoryGap ?? 0.25;
    const ticks = this.scales.left.ticks;
    ctx.save();
    ctx.lineWidth = 1;
    ctx.font = `11px ${t.font}`;
    ctx.fillStyle = t.muted;
    ctx.strokeStyle = t.grid;
    const full = Math.abs(span) >= Math.PI * 2 - 1e-6;
    if (pc.cats === 'angle') {
      // value rings and category spokes
      for (const v of ticks) {
        const r = r0 + this.vFrac(v) * (R - r0);
        ctx.beginPath();
        ctx.arc(cx, cy, r, pc.a0, pc.a1);
        ctx.stroke();
      }
      for (let i = 0; i <= n; i++) {
        if (full && i === n) break;
        const a = pc.a0 + (i / n) * span;
        ctx.beginPath();
        ctx.moveTo(cx + Math.cos(a) * r0, cy + Math.sin(a) * r0);
        ctx.lineTo(cx + Math.cos(a) * R, cy + Math.sin(a) * R);
        ctx.stroke();
      }
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      this.shown.forEach((c, i) => {
        const a = pc.a0 + ((i + 0.5) / n) * span;
        ctx.fillStyle = c === this.hoverCat ? t.text : t.muted;
        ctx.fillText(this.fmtCategory(c), cx + Math.cos(a) * (R + 14), cy + Math.sin(a) * (R + 14));
      });
      ctx.fillStyle = t.muted;
      ctx.textAlign = 'left';
      for (const v of ticks) {
        const r = r0 + this.vFrac(v) * (R - r0);
        ctx.fillText(this.fmtAxis(v, 'left'), cx + Math.cos(pc.a0) * r + 3, cy + Math.sin(pc.a0) * r - 6);
      }
    } else {
      // category rings and value spokes
      const size = (R - r0) / n;
      for (let i = 0; i <= n; i++) {
        ctx.beginPath();
        ctx.arc(cx, cy, r0 + i * size, pc.a0, pc.a1);
        ctx.stroke();
      }
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      for (const v of ticks) {
        const a = pc.a0 + this.vFrac(v) * span;
        ctx.strokeStyle = t.grid;
        ctx.beginPath();
        ctx.moveTo(cx + Math.cos(a) * r0, cy + Math.sin(a) * r0);
        ctx.lineTo(cx + Math.cos(a) * R, cy + Math.sin(a) * R);
        ctx.stroke();
        if (full && Math.abs(this.vFrac(v) - 1) < 1e-9) continue;
        ctx.fillStyle = t.muted;
        ctx.fillText(this.fmtAxis(v, 'left'), cx + Math.cos(a) * (R + 14), cy + Math.sin(a) * (R + 14));
      }
      // category names at the start of each ring
      ctx.textAlign = 'right';
      this.shown.forEach((c, i) => {
        const r = r0 + (i + 0.5) * size;
        ctx.fillStyle = c === this.hoverCat ? t.text : t.muted;
        ctx.fillText(this.fmtCategory(c), cx + Math.cos(pc.a0) * r - 6, cy + Math.sin(pc.a0) * r);
      });
    }
    // bars
    const radius = o.radius ?? 0;
    this.seriesList.forEach((s, si) => {
      const row = this.stacks.segments[si];
      if (!row || s.silent) return;
      const color = this.colorOf(s, si);
      const dim = this.highlighted && this.highlighted !== this.keyOf(s) ? (o.hoverDim ?? 0.3) : 1;
      this.shown.forEach((c, pos) => {
        const target = row[c];
        if (!target) return;
        const seg = this.animated(target, si, c);
        const item = this.items[si][c];
        const raw = this.vals[si][c] ?? 0;
        let fill = target.to >= target.from || !s.negativeColor ? color : s.negativeColor;
        if (o.colorBy) fill = o.colorBy(raw, c, s);
        if (item?.color) fill = item.color;
        let r0b: number;
        let r1b: number;
        let a0b: number;
        let a1b: number;
        if (pc.cats === 'angle') {
          const bandA = span / n;
          const sl = slotRect(pc.a0 + pos * bandA, bandA, seg.slot, this.stacks.slots, gap, 0, undefined);
          a0b = sl.start;
          a1b = sl.start + sl.size;
          r0b = r0 + this.vFrac(seg.from) * (R - r0);
          r1b = r0 + this.vFrac(seg.to) * (R - r0);
        } else {
          const size = (R - r0) / n;
          const sl = slotRect(r0 + pos * size, size, seg.slot, this.stacks.slots, gap, 0, undefined);
          r0b = sl.start;
          r1b = sl.start + sl.size;
          a0b = pc.a0 + this.vFrac(seg.from) * span;
          a1b = pc.a0 + this.vFrac(seg.to) * span;
        }
        const hovered = this.hoverBar && this.hoverBar.datum.seriesIndex === si && this.hoverBar.datum.categoryIndex === c;
        ctx.save();
        ctx.globalAlpha = dim * (item?.opacity ?? 1) * (this.selected && !this.selected.has(`${si}|${c}`) ? 0.25 : 1);
        ctx.fillStyle = fill;
        if (pc.round && pc.cats === 'radius' && Math.abs(a1b - a0b) > 1e-3) {
          // rounded ends: a thick arc with round caps
          ctx.strokeStyle = fill;
          ctx.lineWidth = Math.abs(r1b - r0b);
          ctx.lineCap = 'round';
          ctx.beginPath();
          ctx.arc(cx, cy, (r0b + r1b) / 2, Math.min(a0b, a1b), Math.max(a0b, a1b));
          ctx.stroke();
        } else {
          this.sectorPath(r0b, r1b, Math.min(a0b, a1b), Math.max(a0b, a1b));
          ctx.fill();
          if (radius > 0) {
            ctx.strokeStyle = t.background === 'transparent' ? 'rgba(0,0,0,0.2)' : t.background;
            ctx.lineWidth = 1;
            ctx.stroke();
          }
        }
        if (hovered) {
          ctx.fillStyle = 'rgba(255,255,255,0.15)';
          this.sectorPath(r0b, r1b, Math.min(a0b, a1b), Math.max(a0b, a1b));
          ctx.fill();
        }
        ctx.restore();
        const total = this.stacks.totals[c] || 1;
        this.drawn.push({
          rect: { x: 0, y: 0, w: 0, h: 0 },
          sector: { r0: Math.min(r0b, r1b), r1: Math.max(r0b, r1b), a0: Math.min(a0b, a1b), a1: Math.max(a0b, a1b) },
          datum: { series: s, seriesIndex: si, categoryIndex: c, category: this.categories[c], value: raw, color: fill, percent: (Math.abs(raw) / total) * 100, item: item ?? undefined },
        });
      });
    });
    // labels
    if (o.labels?.show) {
      const L = o.labels;
      const position = L.position ?? (o.stacked ? 'center' : 'outside');
      ctx.font = `600 ${L.fontSize ?? 11}px ${t.font}`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      for (const d of this.drawn) {
        const sc = d.sector!;
        const text = this.fmtLabel(this.labelValue(d), d.datum);
        let r: number;
        let a: number;
        if (pc.cats === 'angle') {
          a = (sc.a0 + sc.a1) / 2;
          r = position === 'outside' ? sc.r1 + 10 : position === 'inside' ? sc.r1 - 10 : position === 'base' ? sc.r0 + 10 : (sc.r0 + sc.r1) / 2;
        } else {
          r = (sc.r0 + sc.r1) / 2;
          const off = 12 / Math.max(1, r);
          a = position === 'outside' ? sc.a1 + off * 1.6 : position === 'inside' ? sc.a1 - off * 1.6 : position === 'base' ? sc.a0 + off * 1.6 : (sc.a0 + sc.a1) / 2;
        }
        ctx.fillStyle = position === 'outside' ? (L.color ?? t.text) : (L.color ?? contrast(d.datum.color));
        ctx.fillText(text, cx + Math.cos(a) * r, cy + Math.sin(a) * r);
      }
    }
    ctx.restore();
  }

  /** polar hit test: category under the mouse and the bar (sector) */
  private polarHit(x: number, y: number): { cat: number; bar: DrawnBar | null } {
    const pc = this.polarCfg!;
    const { cx, cy, R, r0 } = this.polarGeom();
    const r = Math.hypot(x - cx, y - cy);
    let a = Math.atan2(y - cy, x - cx);
    const lo = Math.min(pc.a0, pc.a1);
    while (a < lo) a += Math.PI * 2;
    while (a > lo + Math.PI * 2) a -= Math.PI * 2;
    const n = this.shown.length;
    let cat = -1;
    if (r >= r0 && r <= R + 4 && n) {
      if (pc.cats === 'angle') {
        const f = (a - pc.a0) / (pc.a1 - pc.a0);
        if (f >= 0 && f <= 1) cat = this.shown[Math.min(n - 1, Math.floor(f * n))];
      } else cat = this.shown[Math.min(n - 1, Math.floor(((r - r0) / (R - r0)) * n))];
    }
    const bar =
      this.drawn.find((d) => {
        const s = d.sector!;
        let aa = a;
        while (aa < s.a0) aa += Math.PI * 2;
        while (aa > s.a0 + Math.PI * 2) aa -= Math.PI * 2;
        return r >= s.r0 && r <= s.r1 && aa <= s.a1;
      }) ?? null;
    return { cat, bar };
  }

  // ------------------------------------------------------------------ interaction

  private categoryAt(x: number, y: number): number {
    const P = this.plot;
    if (x < P.x || x > P.x + P.w || y < P.y - 4 || y > P.y + P.h + 4) return -1;
    const n = this.shown.length;
    if (!n) return -1;
    const rel = this.vertical ? (x - P.x) / P.w : (y - P.y) / P.h;
    if (this.mekko && !this.view) {
      const i = this.mekko.findIndex((w, k) => k > 0 && rel <= w);
      return this.shown[clamp(i - 1, 0, n - 1)];
    }
    const [a, b] = this.viewRange;
    const pos = clamp(Math.floor(a + rel * (b - a)), 0, n - 1);
    return this.shown[pos];
  }

  private context(c: number): BarTooltipContext {
    const items = this.drawn.filter((d) => d.datum.categoryIndex === c).map((d) => d.datum);
    const overlays: BarOverlayValue[] = this.lines
      .filter((l) => !this.hidden.has(l.id))
      .map((l) => ({ overlay: l.overlay, id: l.id, name: l.name, value: l.values[c] ?? null, color: l.color }));
    return { categoryIndex: c, category: this.categories[c], items, total: items.reduce((a, d) => a + d.value, 0), overlays };
  }

  private showTooltip(mx: number, my: number): void {
    const tt = this.tooltipEl;
    const o = this.opts.tooltip ?? {};
    if (this.hoverCat < 0 || o.show === false || this.brushRect) {
      tt.classList.remove('is-visible');
      return;
    }
    const mode = o.mode ?? 'shared';
    let ctx = this.context(this.hoverCat);
    if (mode === 'single') {
      if (!this.hoverBar) {
        tt.classList.remove('is-visible');
        return;
      }
      ctx = { ...ctx, items: [this.hoverBar.datum], total: this.hoverBar.datum.value };
    }
    if (!ctx.items.length && !ctx.overlays.length) {
      tt.classList.remove('is-visible');
      return;
    }
    const fmt = (v: number, s: BarSeries): string => (this.opts.valueFormatter ? this.opts.valueFormatter(v, s) : formatCompact(v));
    const showTotal = (o.total ?? !!this.opts.stacked) && mode === 'shared' && ctx.items.length > 1;
    tt.innerHTML = o.formatter
      ? o.formatter(ctx)
      : `<div class="bc-tooltip__head">${esc(this.fmtCategory(ctx.categoryIndex))}</div>${ctx.items
          .map(
            (d) =>
              `<div class="bc-tooltip__row"><span class="bc-tooltip__dot" style="background:${d.color}"></span><span class="bc-tooltip__name">${esc(d.series.name)}</span><b>${esc(fmt(d.value, d.series))}${
                this.opts.stacked === 'percent' ? ` <small>${d.percent.toFixed(1)}%</small>` : ''
              }</b></div>`,
          )
          .join('')}${showTotal ? `<div class="bc-tooltip__total"><span>Total</span><b>${esc(fmt(ctx.total, ctx.items[0].series))}</b></div>` : ''}${this.overlayRows(ctx, mode)}`;
    tt.classList.add('is-visible');
    const w = tt.offsetWidth;
    const h = tt.offsetHeight;
    let left = mx + 14;
    let top = my + 14;
    if (left + w > this.width - 4) left = mx - w - 14;
    if (top + h > this.height - 4) top = my - h - 14;
    tt.style.transform = `translate(${Math.max(4, left)}px, ${Math.max(4, top)}px)`;
  }

  private overlayRows(ctx: BarTooltipContext, mode: 'shared' | 'single'): string {
    if (mode !== 'shared') return '';
    const rows = ctx.overlays
      .filter((o) => o.value !== null)
      .map((o) => {
        const l = this.lines.find((x) => x.id === o.id)!;
        return `<div class="bc-tooltip__row"><span class="bc-tooltip__line" style="background:${o.color}"></span><span class="bc-tooltip__name">${esc(o.name)}</span><b>${esc(this.fmtLine(l, o.value!))}</b></div>`;
      });
    return rows.length ? `<div class="bc-tooltip__overlays">${rows.join('')}</div>` : '';
  }

  private pointerHover(x: number, y: number): void {
    let cat: number;
    let bar: DrawnBar | null;
    if (this.polarCfg) ({ cat, bar } = this.polarHit(x, y));
    else {
      cat = this.categoryAt(x, y);
      bar = this.drawn.find((d) => x >= d.rect.x && x <= d.rect.x + d.rect.w && y >= d.rect.y && y <= d.rect.y + d.rect.h) ?? null;
    }
    const changed = cat !== this.hoverCat || bar?.datum !== this.hoverBar?.datum;
    this.hoverCat = cat;
    this.hoverBar = bar;
    this.canvas.style.cursor = bar ? 'pointer' : this.opts.brush ? 'crosshair' : this.opts.zoom ? 'grab' : 'default';
    if (changed) {
      this.draw();
      this.emit('hover', cat >= 0 ? this.context(cat) : null);
    }
    this.showTooltip(x, y);
  }

  private bind(): void {
    const c = this.canvas;
    const local = (e: MouseEvent): { x: number; y: number } => {
      const r = c.getBoundingClientRect();
      return { x: e.clientX - r.left, y: e.clientY - r.top };
    };
    let moved = false;
    c.addEventListener('pointerdown', (e) => {
      if (e.button !== 0 || this.polarCfg) return;
      const p = local(e);
      moved = false;
      if (this.inSlider(p.x, p.y)) {
        const [w0, w1] = this.sliderWindow();
        let mode: 'l' | 'r' | 'move' = Math.abs(p.x - w0) <= 7 ? 'l' : Math.abs(p.x - w1) <= 7 ? 'r' : 'move';
        if (mode === 'move' && (p.x < w0 || p.x > w1)) {
          // click outside the window: center it there
          const S = this.sliderRect!;
          const n = Math.max(1, this.shown.length);
          const [a, b] = this.viewRange;
          const span = b - a;
          const at = ((p.x - S.x) / S.w) * n;
          const v0 = clamp(at - span / 2, 0, n - span);
          this.view = span >= n ? null : [v0, v0 + span];
          this.draw();
          mode = 'move';
        }
        c.setPointerCapture(e.pointerId);
        this.sliderDrag = { mode, x: p.x, view: [...this.viewRange] as [number, number] };
        return;
      }
      const P = this.plot;
      const inside = p.x >= P.x && p.x <= P.x + P.w && p.y >= P.y && p.y <= P.y + P.h;
      if (this.opts.brush && inside) {
        c.setPointerCapture(e.pointerId);
        this.brushRect = { x0: p.x, y0: p.y, x1: p.x, y1: p.y };
        return;
      }
      if (this.opts.zoom && inside) {
        c.setPointerCapture(e.pointerId);
        this.drag = { x: this.vertical ? p.x : p.y, view: [...this.viewRange] as [number, number] };
        c.style.cursor = 'grabbing';
      }
    });
    c.addEventListener('pointermove', (e) => {
      const { x, y } = local(e);
      if (this.sliderDrag) {
        moved = true;
        this.sliderMove(x);
        return;
      }
      if (this.brushRect) {
        moved = true;
        this.brushRect.x1 = clamp(x, this.plot.x, this.plot.x + this.plot.w);
        this.brushRect.y1 = clamp(y, this.plot.y, this.plot.y + this.plot.h);
        this.clearHover();
        this.draw();
        return;
      }
      if (this.drag) {
        const n = Math.max(1, this.shown.length);
        const [a, b] = this.drag.view;
        const len = this.vertical ? this.plot.w : this.plot.h;
        const d = (((this.vertical ? x : y) - this.drag.x) / len) * (b - a);
        if (Math.abs(d) > 0.01) moved = true;
        const span = b - a;
        const v0 = clamp(a - d, 0, n - span);
        this.view = span >= n ? null : [v0, v0 + span];
        this.clearHover();
        this.draw();
        return;
      }
      if (this.inSlider(x, y)) {
        const [w0, w1] = this.sliderWindow();
        c.style.cursor = Math.abs(x - w0) <= 7 || Math.abs(x - w1) <= 7 ? 'ew-resize' : 'grab';
        return;
      }
      this.pointerHover(x, y);
    });
    const end = (e: PointerEvent): void => {
      if (c.hasPointerCapture(e.pointerId)) c.releasePointerCapture(e.pointerId);
      if (this.sliderDrag) {
        this.sliderDrag = null;
        this.emit('zoom', this.view ? { from: this.view[0], to: this.view[1] } : null);
        return;
      }
      if (this.brushRect) {
        const b = this.brushRect;
        this.brushRect = null;
        if (Math.abs(b.x1 - b.x0) < 4 && Math.abs(b.y1 - b.y0) < 4) {
          // a click clears the selection
          this.selected = null;
          this.draw();
          this.emit('brush', []);
          return;
        }
        const x0 = Math.min(b.x0, b.x1);
        const x1 = Math.max(b.x0, b.x1);
        const y0 = Math.min(b.y0, b.y1);
        const y1 = Math.max(b.y0, b.y1);
        const hits = this.drawn.filter((d) => d.rect.x <= x1 && d.rect.x + d.rect.w >= x0 && d.rect.y <= y1 && d.rect.y + d.rect.h >= y0);
        this.selected = new Set(hits.map((d) => `${d.datum.seriesIndex}|${d.datum.categoryIndex}`));
        this.draw();
        this.emit('brush', hits.map((d) => ({ ...d.datum })));
        return;
      }
      if (this.drag) {
        this.drag = null;
        c.style.cursor = 'grab';
        if (moved) this.emit('zoom', this.view ? { from: this.view[0], to: this.view[1] } : null);
      }
    };
    c.addEventListener('pointerup', end);
    c.addEventListener('pointercancel', end);
    c.addEventListener('pointerleave', () => {
      if (this.drag || this.brushRect || this.sliderDrag) return;
      this.hoverCat = -1;
      this.hoverBar = null;
      this.tooltipEl.classList.remove('is-visible');
      this.draw();
      this.emit('hover', null);
    });
    c.addEventListener('click', () => {
      if (moved) return;
      if (this.hoverBar) this.emit('click', { ...this.hoverBar.datum });
    });
    c.addEventListener(
      'wheel',
      (e) => {
        if (!this.opts.zoom || this.polarCfg) return;
        e.preventDefault();
        const { x, y } = local(e);
        const n = Math.max(1, this.shown.length);
        const [a, b] = this.viewRange;
        const len = this.vertical ? this.plot.w : this.plot.h;
        const rel = clamp(((this.vertical ? x - this.plot.x : y - this.plot.y) / len), 0, 1);
        const at = a + rel * (b - a);
        const span = clamp((b - a) * Math.exp(e.deltaY * 0.0015), Math.min(n, 2), n);
        const v0 = clamp(at - span * rel, 0, n - span);
        this.view = span >= n - 1e-9 ? null : [v0, v0 + span];
        this.clearHover();
        this.draw();
        this.emit('zoom', this.view ? { from: this.view[0], to: this.view[1] } : null);
      },
      { passive: false },
    );
    c.addEventListener('dblclick', () => {
      if (this.opts.zoom && this.view) this.resetZoom();
    });
  }

  private renderLegend(): void {
    const ul = this.legendEl;
    const interactive = this.opts.legend?.interactive ?? true;
    ul.innerHTML = '';
    this.seriesList.forEach((s, i) => {
      if (s.silent) return;
      const key = this.keyOf(s);
      const li = document.createElement('li');
      li.className = `bc-legend__item${this.hidden.has(key) ? ' is-hidden' : ''}${interactive ? ' is-interactive' : ''}`;
      li.dataset.id = key;
      const bg = s.gradient?.length ? `linear-gradient(${s.gradient.join(',')})` : this.colorOf(s, i);
      li.innerHTML = `<span class="bc-legend__marker" style="background:${bg}"></span><span>${esc(s.name)}</span>`;
      li.addEventListener('mouseenter', () => !this.hidden.has(key) && this.highlight(key));
      li.addEventListener('mouseleave', () => this.highlight(null));
      if (interactive) li.addEventListener('click', () => this.toggle(key));
      ul.append(li);
    });
    for (const l of this.lines) {
      const li = document.createElement('li');
      li.className = `bc-legend__item${this.hidden.has(l.id) ? ' is-hidden' : ''}${interactive ? ' is-interactive' : ''}`;
      li.dataset.id = l.id;
      const dashed = l.overlay.dash ? l.overlay.dash.length > 0 : ['linear', 'exponential', 'average'].includes(l.overlay.type);
      li.innerHTML = `<span class="bc-legend__marker bc-legend__marker--line${dashed ? ' is-dashed' : ''}" style="--c:${l.color}"></span><span>${esc(l.name)}</span>`;
      li.addEventListener('mouseenter', () => !this.hidden.has(l.id) && this.highlight(l.id));
      li.addEventListener('mouseleave', () => this.highlight(null));
      if (interactive) li.addEventListener('click', () => this.toggle(l.id));
      ul.append(li);
    }
  }
}

export function createBarChart(container: HTMLElement, options: BarOptions = {}): BarChart {
  return new BarChart(container, options);
}
