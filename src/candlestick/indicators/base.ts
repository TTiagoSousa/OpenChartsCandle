import { TIMEFRAMES, type Bar, type Timeframe, parseTimeframe } from '../core/types';
import { uid } from '../core/utils';
import type { PaneView } from '../core/view';

export type ParamType = 'number' | 'color' | 'bool' | 'select' | 'text' | 'session';
export interface ParamDef {
  key: string;
  label: string;
  type: ParamType;
  min?: number;
  max?: number;
  step?: number;
  options?: string[];
  /** Text shown for each option of a 'select' (default: the value). */
  optionLabels?: Record<string, string>;
  /** Heading shown above this field in the settings dialog (when it differs from the field before). */
  section?: string;
  /** The field is greyed out in the settings dialog when this is false (e.g. the band width without bands). */
  enabled?: (p: Params) => boolean;
  /** A boolean param shown as a checkbox before the label (show / hide this line), as in TradingView's style tab. */
  toggle?: string;
  /** A number param edited in the same row, after the colour (e.g. the level of a band); uses `min` / `max` / `step`. */
  numberKey?: string;
  /** A line style param ('solid' / 'dashed' / 'dotted') edited in the same row, after the colour. */
  dashKey?: string;
  /** Shown indented under the field before (a detail of it), as in TradingView's style tab. */
  indent?: boolean;
  /** For a 'text' field: the problem with a value, or null when it is right. */
  check?: (v: string) => string | null;
  /** Tab of the settings dialog: 'values' (Valores) or 'style' (Estilo). Default: 'style' in the "Estilo" section. */
  tab?: 'values' | 'style';
}

/** The units of the "Visibilidade" tab: the indicator shows on the timeframes of a unit from `min` to `max`. */
export const VISIBILITY_UNITS = [
  { key: 'seconds', label: 'Segundos', max: 59 },
  { key: 'minutes', label: 'Minutos', max: 59 },
  { key: 'hours', label: 'Horas', max: 24 },
  { key: 'days', label: 'Dias', max: 366 },
  { key: 'weeks', label: 'Semanas', max: 52 },
  { key: 'months', label: 'Meses', max: 12 },
] as const;
export type VisibilityUnit = (typeof VISIBILITY_UNITS)[number]['key'];
/** On which timeframes an indicator shows ("Visibilidade"): a unit left out shows on all of its timeframes. */
export type Visibility = Partial<Record<VisibilityUnit, { on: boolean; min: number; max: number }>>;

/** The unit and count of a timeframe: 900 s → minutes 15, 86400 → days 1, 604800 → weeks 1. */
export function timeframeUnit(seconds: number): { unit: VisibilityUnit; n: number } {
  if (seconds < 60) return { unit: 'seconds', n: seconds };
  if (seconds < 3600) return { unit: 'minutes', n: Math.round(seconds / 60) };
  if (seconds < 86400) return { unit: 'hours', n: Math.round(seconds / 3600) };
  if (seconds >= 28 * 86400) return { unit: 'months', n: Math.max(1, Math.round(seconds / (30 * 86400))) };
  if (seconds % 604800 === 0) return { unit: 'weeks', n: seconds / 604800 };
  return { unit: 'days', n: Math.round(seconds / 86400) };
}
export type Params = Record<string, number | string | boolean>;
export interface LegendValue {
  text: string;
  color: string;
}
export interface AxisLabel {
  price: number;
  color: string;
  text?: string;
}

export const N = (p: Params, k: string): number => Number(p[k]);
export const S = (p: Params, k: string): string => String(p[k]);

export function source(b: Bar, src: string): number {
  switch (src) {
    case 'open': return b.open;
    case 'high': return b.high;
    case 'low': return b.low;
    case 'volume': return b.volume;
    case 'hl2': return (b.high + b.low) / 2;
    case 'hlc3': return (b.high + b.low + b.close) / 3;
    case 'ohlc4': return (b.open + b.high + b.low + b.close) / 4;
    case 'hlcc4': return (b.high + b.low + 2 * b.close) / 4;
    default: return b.close;
  }
}

export function resize(arr: number[], n: number, from: number): void {
  if (arr.length > n) arr.length = n;
  while (arr.length < n) arr.push(NaN);
  for (let i = Math.max(0, from); i < n; i++) arr[i] = NaN;
}

/**
 * Simple moving average from index `from` onwards.
 * Full recompute uses a rolling sum; live ticks only recompute the last bars.
 */
export function smaInto(out: number[], src: (i: number) => number, n: number, len: number, from: number): void {
  resize(out, n, from);
  if (from <= len) {
    let sum = 0;
    for (let i = 0; i < n; i++) {
      sum += src(i);
      if (i >= len) sum -= src(i - len);
      out[i] = i >= len - 1 ? sum / len : NaN;
    }
    return;
  }
  for (let i = from; i < n; i++) {
    let sum = 0;
    for (let k = i - len + 1; k <= i; k++) sum += src(k);
    out[i] = sum / len;
  }
}

/**
 * Relative Strength Index with Wilder's smoothing (TradingView's `ta.rsi`): the first average gain/loss is
 * the SMA of the first `len` changes. `gain` / `loss` keep the smoothed averages so live ticks are cheap.
 */
export function rsiInto(out: number[], gain: number[], loss: number[], src: (i: number) => number, n: number, len: number, from: number): void {
  resize(out, n, from);
  resize(gain, n, from);
  resize(loss, n, from);
  const rsi = (g: number, l: number): number => (l === 0 ? (g === 0 ? 50 : 100) : g === 0 ? 0 : 100 - 100 / (1 + g / l));
  let i = Math.max(0, from);
  if (i <= len || !isFinite(gain[i - 1])) {
    for (let j = 0; j < Math.min(n, len); j++) out[j] = gain[j] = loss[j] = NaN;
    if (n <= len) return;
    let g = 0;
    let l = 0;
    for (let j = 1; j <= len; j++) {
      const d = src(j) - src(j - 1);
      if (d > 0) g += d;
      else l -= d;
    }
    gain[len] = g / len;
    loss[len] = l / len;
    out[len] = rsi(gain[len], loss[len]);
    i = len + 1;
  }
  for (; i < n; i++) {
    const d = src(i) - src(i - 1);
    gain[i] = (gain[i - 1] * (len - 1) + Math.max(d, 0)) / len;
    loss[i] = (loss[i - 1] * (len - 1) + Math.max(-d, 0)) / len;
    out[i] = rsi(gain[i], loss[i]);
  }
}

export type MaType = 'sma' | 'ema' | 'rma' | 'wma' | 'vwma';

/**
 * Moving average of a series that may start with NaN (e.g. the RSI), from index `from` onwards, like Pine's
 * `ta.*`: the EMA starts at the first value, the RMA at the SMA of the first `len`, and SMA / WMA / VWMA need
 * `len` values in a row. `vol` is only read by the VWMA.
 */
export function maInto(out: number[], src: (i: number) => number, vol: (i: number) => number, n: number, len: number, type: MaType, from: number): void {
  resize(out, n, from);
  let start = Math.max(0, from);
  if (type === 'ema' || type === 'rma') {
    // recursive: carry on from the value before, or start over when there is none
    if (start > 0 && !isFinite(out[start - 1]) && isFinite(src(start - 1))) start = 0;
    const a = type === 'ema' ? 2 / (len + 1) : 1 / len;
    for (let i = start; i < n; i++) {
      const x = src(i);
      const prev = i > 0 ? out[i - 1] : NaN;
      if (!isFinite(x)) out[i] = NaN;
      else if (isFinite(prev)) out[i] = a * x + (1 - a) * prev;
      else out[i] = type === 'ema' ? x : windowMa(src, vol, i, len, 'sma');
    }
    return;
  }
  for (let i = start; i < n; i++) out[i] = windowMa(src, vol, i, len, type);
}

function windowMa(src: (i: number) => number, vol: (i: number) => number, i: number, len: number, type: MaType): number {
  if (i - len + 1 < 0) return NaN;
  let sum = 0;
  let wsum = 0;
  for (let k = 0; k < len; k++) {
    const x = src(i - k);
    if (!isFinite(x)) return NaN;
    const w = type === 'wma' ? len - k : type === 'vwma' ? vol(i - k) : 1;
    sum += x * w;
    wsum += w;
  }
  return wsum ? sum / wsum : NaN;
}

/** Population standard deviation of the last `len` values (Pine's `ta.stdev`), NaN while there are fewer. */
export function stdevAt(src: (i: number) => number, i: number, len: number): number {
  if (i - len + 1 < 0) return NaN;
  let sum = 0;
  for (let k = 0; k < len; k++) sum += src(i - k);
  const mean = sum / len;
  let sq = 0;
  for (let k = 0; k < len; k++) sq += (src(i - k) - mean) ** 2;
  return isFinite(sq) ? Math.sqrt(sq / len) : NaN;
}

/**
 * A line through the values. `points` (values of a larger timeframe): the line only goes through the bars where
 * it is true, the first bar of each new value, straight from one to the next, like the TradingView line.
 */
export function strokeSeries(v: PaneView, values: number[], color: string, width = 1, points: ArrayLike<number> | null = null, past = 0): void {
  const ctx = v.ctx;
  let from = Math.max(0, v.from - 1);
  // `past`: bars drawn after the view's last one (a line moved to the right goes past the last bar)
  let to = Math.min(values.length - 1, v.to + 1 + Math.max(0, past));
  if (points) {
    // from the point before the visible bars to the one after, so the line crosses the edges
    while (from > 0 && !points[from]) from--;
    while (to < values.length - 1 && !points[to]) to++;
  }
  ctx.save();
  ctx.strokeStyle = color;
  ctx.lineWidth = width;
  ctx.lineJoin = 'round';
  ctx.beginPath();
  let pen = false;
  for (let i = from; i <= to; i++) {
    const val = values[i];
    if (!isFinite(val)) {
      pen = false;
      continue;
    }
    if (points && !points[i]) continue;
    const x = v.ts.indexToX(i);
    const y = v.ps.priceToY(val);
    if (pen) ctx.lineTo(x, y);
    else ctx.moveTo(x, y);
    pen = true;
  }
  ctx.stroke();
  ctx.restore();
}

export function rangeOf(values: number[], from: number, to: number): [number, number] | null {
  let lo = Infinity;
  let hi = -Infinity;
  for (let i = Math.max(0, from); i <= Math.min(values.length - 1, to); i++) {
    const v = values[i];
    if (!isFinite(v)) continue;
    if (v < lo) lo = v;
    if (v > hi) hi = v;
  }
  return lo <= hi ? [lo, hi] : null;
}

export abstract class Indicator {
  id = uid('ind');
  visible = true;
  abstract readonly type: string;
  abstract readonly name: string;
  abstract readonly short: string;
  abstract readonly overlay: boolean;
  abstract readonly schema: ParamDef[];
  /** If true, contributes to main autoscale */
  readonly affectsScale: boolean = true;
  /** Set by the chart: call when the indicator's data changed outside of `compute`. */
  onDataChanged: (() => void) | null = null;
  params: Params;
  /** Values per bar given to `compute`: the chart's bars, or the bars of the indicator's own `timeframe`. */
  raw: number[] = [];
  /**
   * Values per chart bar (what is drawn). The same array as `raw`, or, with an own `timeframe`, `raw` mapped
   * to the chart's bars without look-ahead (set by the chart).
   */
  values: number[] = this.raw;
  /** More lines computed with `raw` on the same bars (e.g. the RSI's moving average and bands). */
  rawLines: number[][] = [];
  /** `rawLines` per chart bar, mapped like `values` (set by the chart). */
  lines: number[][] = this.rawLines;
  /** Set by the chart: its timeframe in seconds (the title shows the indicator's own when it differs). */
  chartTimeframe = 0;
  /**
   * Set by the chart for a larger own timeframe: 1 on the chart bars where a new bar of that timeframe is first
   * used. The line joins those bars (no steps); `values` keeps the value on every bar for the legend.
   */
  points: Uint8Array | null = null;
  /** Id of the simulation indicator this is (`terminal.setSimulationIndicators`), or null: one of the user's. */
  origin: string | null = null;
  /** On which timeframes it shows (the "Visibilidade" tab); null: on all. */
  visibility: Visibility | null = null;

  /** Shown on the chart's timeframe: visible (the eye) and allowed by `visibility`. */
  get shown(): boolean {
    return this.visible && visibleOn(this.visibility, this.chartTimeframe);
  }

  constructor(defaults: Params, params?: Params) {
    this.params = { ...defaults, ...(params ?? {}) };
  }

  /** Compute `raw` from bar `from` onwards (0 = everything). */
  abstract compute(bars: Bar[], from: number): void;
  /** Bars needed before the first one shown for the values to be ready (the chart loads them). */
  warmup(): number {
    return 0;
  }
  /** The indicator's own timeframe (`params.timeframe`), or null: it follows the chart. */
  timeframe(): Timeframe | null {
    const id = String(this.params.timeframe ?? '');
    return id ? parseTimeframe(id) : null;
  }
  /** ' · 4h' when the indicator uses another timeframe than the chart. */
  protected timeframeSuffix(): string {
    const tf = this.timeframe();
    return tf && tf.seconds !== this.chartTimeframe ? ` · ${tf.short}` : '';
  }
  abstract draw(v: PaneView): void;
  abstract legend(i: number, v: PaneView): LegendValue[];
  range(_from: number, _to: number): [number, number] | null {
    return null;
  }
  axisLabels(): AxisLabel[] {
    return [];
  }
  title(): string {
    const nums = this.schema.filter((s) => (s.type === 'number' || s.type === 'select') && !s.section && s.key !== 'width' && s.key !== 'timeframe').map((s) => this.params[s.key]);
    return (nums.length ? `${this.short} ${nums.join(' ')}` : this.short) + this.timeframeSuffix();
  }
  formatValue(val: number, v: PaneView): string {
    return isFinite(val) ? v.fmt(val) : '∅';
  }
  toJSON(): { type: string; params: Params; visible: boolean; visibility?: Visibility } {
    return { type: this.type, params: this.params, visible: this.visible, ...(this.visibility ? { visibility: this.visibility } : {}) };
  }
}

/** Whether `visibility` lets an indicator show on a timeframe of `seconds` (0: not known yet, shows). */
export function visibleOn(visibility: Visibility | null, seconds: number): boolean {
  if (!visibility || !(seconds > 0)) return true;
  const { unit, n } = timeframeUnit(seconds);
  const r = visibility[unit];
  return !r || (r.on && n >= r.min && n <= r.max);
}

export const SOURCES = ['open', 'high', 'low', 'close', 'volume'];
export const SOURCE_LABELS: Record<string, string> = { open: 'Abertura', high: 'Máxima', low: 'Mínima', close: 'Fechamento', volume: 'Volume' };
export const SOURCE: ParamDef = { key: 'source', label: 'Fonte', type: 'select', options: SOURCES, optionLabels: SOURCE_LABELS };
export const TIMEFRAME: ParamDef = {
  key: 'timeframe',
  label: 'Tempo gráfico',
  type: 'select',
  options: ['', ...TIMEFRAMES.map((t) => t.id)],
  optionLabels: { '': 'O do gráfico', ...Object.fromEntries(TIMEFRAMES.map((t) => [t.id, t.label])) },
};
export const STYLE = 'Estilo';
/**
 * A source that is no longer offered (e.g. 'hl2' in a saved state) falls back to the close; the timeframe is
 * stored as its id ('4h' → '240'), and one that can't be read means the chart's.
 */
export function validParams(p: Params): Params {
  const tf = p.timeframe ? parseTimeframe(String(p.timeframe)) : null;
  return { ...p, source: SOURCES.includes(String(p.source)) ? p.source : 'close', timeframe: tf ? tf.id : '' };
}

/**
 * The values moved `offset` bars to the right (left when negative), like TradingView's "Deslocamento": a
 * positive offset draws past the last bar. Returns the same arrays when the offset is 0.
 */
export function shiftSeries(values: number[], points: ArrayLike<number> | null, offset: number): { values: number[]; points: ArrayLike<number> | null } {
  if (!offset) return { values, points };
  const n = values.length;
  const len = Math.max(n, n + offset);
  const out = new Array<number>(len).fill(NaN);
  const pts = points ? new Uint8Array(len) : null;
  for (let i = 0; i < n; i++) {
    const j = i + offset;
    if (j < 0 || j >= len) continue;
    out[j] = values[i];
    if (pts) pts[j] = points![i];
  }
  return { values: out, points: pts };
}
