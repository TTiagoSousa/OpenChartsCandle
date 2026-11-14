import { EXCHANGE_SESSIONS, type SessionFilter, type SessionPart, type SessionSpan, parseSessionRanges, resolveSessions, splitSessions } from '../core/sessions';
import { font } from '../core/theme';
import { TimeZone } from '../core/timezone';
import { TIMEFRAMES, type Bar, type Timeframe, parseTimeframe } from '../core/types';
import { formatVolume, parseColor, uid } from '../core/utils';
import type { PaneView } from '../core/view';
import { type VPResult, computeVolumeProfile, developingProfile } from './volume-profile';

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

const N = (p: Params, k: string): number => Number(p[k]);
const S = (p: Params, k: string): string => String(p[k]);

function source(b: Bar, src: string): number {
  switch (src) {
    case 'open': return b.open;
    case 'high': return b.high;
    case 'low': return b.low;
    case 'volume': return b.volume;
    default: return b.close;
  }
}

function resize(arr: number[], n: number, from: number): void {
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

function rangeOf(values: number[], from: number, to: number): [number, number] | null {
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

const SOURCES = ['open', 'high', 'low', 'close', 'volume'];
const SOURCE_LABELS: Record<string, string> = { open: 'Abertura', high: 'Máxima', low: 'Mínima', close: 'Fechamento', volume: 'Volume' };
const SOURCE: ParamDef = { key: 'source', label: 'Fonte', type: 'select', options: SOURCES, optionLabels: SOURCE_LABELS };
const TIMEFRAME: ParamDef = {
  key: 'timeframe',
  label: 'Tempo gráfico',
  type: 'select',
  options: ['', ...TIMEFRAMES.map((t) => t.id)],
  optionLabels: { '': 'O do gráfico', ...Object.fromEntries(TIMEFRAMES.map((t) => [t.id, t.label])) },
};
const STYLE = 'Estilo';
/**
 * A source that is no longer offered (e.g. 'hl2' in a saved state) falls back to the close; the timeframe is
 * stored as its id ('4h' → '240'), and one that can't be read means the chart's.
 */
function validParams(p: Params): Params {
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

/** Simple or exponential moving average: one line over the candles, which can be moved left or right. */
class MovingAverage extends Indicator {
  readonly overlay = true;
  readonly schema: ParamDef[] = [
    { key: 'length', label: 'Período', type: 'number', min: 1, max: 1000 },
    SOURCE,
    { key: 'offset', label: 'Deslocamento', type: 'number', min: -500, max: 500 },
    TIMEFRAME,
    { key: 'color', label: 'Cor', type: 'color', section: STYLE },
    { key: 'width', label: 'Espessura', type: 'number', min: 1, max: 4, section: STYLE },
  ];

  constructor(
    readonly type: 'sma' | 'ema',
    params?: Params,
  ) {
    super(validParams({ length: type === 'ema' ? 9 : 50, source: 'close', offset: 0, timeframe: '', color: '#2962ff', width: 1, ...(params ?? {}) }));
  }

  get name(): string {
    return this.type === 'ema' ? 'Moving Average Exponential' : 'Moving Average';
  }

  get short(): string {
    return this.type === 'ema' ? 'EMA' : 'MA';
  }

  private get length(): number {
    return Math.max(1, Math.round(N(this.params, 'length')));
  }

  private get offset(): number {
    return Math.round(N(this.params, 'offset')) || 0;
  }

  /** `MA 50 close`, with the offset only when there is one (`EMA 9 close 5`). */
  title(): string {
    return `${this.short} ${this.length} ${this.params.source}${this.offset ? ` ${this.offset}` : ''}${this.timeframeSuffix()}`;
  }

  /** The EMA never forgets: 10 × length bars before make the start negligible. */
  warmup(): number {
    return this.type === 'ema' ? 10 * this.length : this.length - 1;
  }

  compute(bars: Bar[], from: number): void {
    const src = S(this.params, 'source');
    const get = (i: number): number => source(bars[i], src);
    if (this.type === 'ema') maInto(this.raw, get, (i) => bars[i].volume, bars.length, this.length, 'ema', from);
    else smaInto(this.raw, get, bars.length, this.length, from);
  }

  /** What is drawn: the values moved by the offset. */
  private plotted(): { values: number[]; points: ArrayLike<number> | null } {
    return shiftSeries(this.values, this.points, this.offset);
  }

  draw(v: PaneView): void {
    const p = this.plotted();
    strokeSeries(v, p.values, S(this.params, 'color'), N(this.params, 'width'), p.points, this.offset);
  }

  range(from: number, to: number): [number, number] | null {
    return rangeOf(this.plotted().values, from, to);
  }

  /** The value drawn on bar `i` (with an offset, the one from `offset` bars before). */
  legend(i: number, v: PaneView): LegendValue[] {
    const j = i - this.offset;
    return [{ text: this.formatValue(j >= 0 && j < this.values.length ? this.values[j] : NaN, v), color: S(this.params, 'color') }];
  }

  axisLabels(): AxisLabel[] {
    const last = this.values[this.values.length - 1];
    return isFinite(last) ? [{ price: last, color: S(this.params, 'color') }] : [];
  }
}

/** The RSI's smoothing: none, simple or exponential. */
const RSI_MA_TYPES = ['none', 'sma', 'ema'];
const RSI_MA_LABELS: Record<string, string> = {
  none: 'Nenhuma',
  sma: 'Média móvel simples (SMA)',
  ema: 'Média móvel exponencial (EMA)',
};
/** In the title: `RSI 14 close SMA 14`. */
const RSI_MA_SHORT: Record<string, string> = { sma: 'SMA', ema: 'EMA' };
const RSI_MA = 'Média do RSI';

/** RSI in its own pane (0–100), with the overbought / oversold levels and the band between them. */
class RelativeStrengthIndex extends Indicator {
  readonly type = 'rsi';
  readonly name = 'Relative Strength Index';
  readonly short = 'RSI';
  readonly overlay = false;
  readonly schema: ParamDef[] = [
    { key: 'length', label: 'Período IFR', type: 'number', min: 1, max: 500 },
    SOURCE,
    TIMEFRAME,
    { key: 'maType', label: 'Tipo', type: 'select', options: RSI_MA_TYPES, optionLabels: RSI_MA_LABELS, section: RSI_MA },
    { key: 'maLength', label: 'Período', type: 'number', min: 1, max: 500, section: RSI_MA, enabled: (p) => p.maType !== 'none' },
    { key: 'color', label: 'RSI', type: 'color', toggle: 'showRsi', section: STYLE },
    { key: 'width', label: 'Espessura do RSI', type: 'number', min: 1, max: 4, section: STYLE },
    { key: 'maColor', label: 'Média do RSI', type: 'color', section: STYLE, enabled: (p) => p.maType !== 'none' },
    { key: 'upperColor', label: 'Banda superior', type: 'color', toggle: 'showUpper', numberKey: 'upper', min: 0, max: 100, section: STYLE },
    { key: 'middleColor', label: 'Banda do meio', type: 'color', toggle: 'showMiddle', numberKey: 'middle', min: 0, max: 100, section: STYLE },
    { key: 'lowerColor', label: 'Banda inferior', type: 'color', toggle: 'showLower', numberKey: 'lower', min: 0, max: 100, section: STYLE },
    { key: 'bgColor', label: 'Fundo entre as bandas', type: 'color', toggle: 'showBg', section: STYLE },
  ];
  private gain: number[] = [];
  private loss: number[] = [];
  /** The RSI's moving average. */
  private ma: number[] = [];

  constructor(params?: Params) {
    const p = validParams({
      length: 14,
      source: 'close',
      timeframe: '',
      maType: 'none',
      maLength: 14,
      showRsi: true,
      color: '#7e57c2',
      width: 1,
      maColor: '#fdd835',
      showUpper: true,
      upper: 70,
      upperColor: '#787b86',
      showMiddle: true,
      middle: 50,
      middleColor: 'rgba(120,123,134,0.5)',
      showLower: true,
      lower: 30,
      lowerColor: '#787b86',
      showBg: true,
      bgColor: 'rgba(126,87,194,0.1)',
      ...(params ?? {}),
    });
    // the averages that were taken out, in a saved state: the SMA; anything else: none
    const { bbMult: _, ...rest } = p;
    const t = String(p.maType);
    super({ ...rest, maType: RSI_MA_TYPES.includes(t) ? t : ['sma_bb', 'rma', 'wma', 'vwma'].includes(t) ? 'sma' : 'none' });
    this.rawLines.push(this.ma);
  }

  private get length(): number {
    return Math.max(1, Math.round(N(this.params, 'length')));
  }

  private get maLength(): number {
    return Math.max(1, Math.round(N(this.params, 'maLength')));
  }

  private get maType(): string {
    return S(this.params, 'maType');
  }

  title(): string {
    const t = this.maType;
    const ma = t === 'none' ? '' : ` ${RSI_MA_SHORT[t]} ${this.maLength}`;
    return `${this.short} ${this.length} ${this.params.source}${ma}${this.timeframeSuffix()}`;
  }

  /**
   * Wilder's smoothing never forgets: about 10 × length bars before make the start negligible (< 0.01). The
   * average adds its own length (10 × for the recursive EMA).
   */
  warmup(): number {
    const t = this.maType;
    return 10 * this.length + (t === 'none' ? 0 : t === 'ema' ? 10 * this.maLength : this.maLength);
  }

  compute(bars: Bar[], from: number): void {
    const src = S(this.params, 'source');
    const n = bars.length;
    rsiInto(this.raw, this.gain, this.loss, (i) => source(bars[i], src), n, this.length, from);
    const t = this.maType;
    if (t === 'none') {
      for (const a of this.rawLines) resize(a, n, 0);
      return;
    }
    maInto(this.ma, (i) => this.raw[i], (i) => bars[i].volume, n, this.maLength, t as MaType, from);
  }

  draw(v: PaneView): void {
    const ctx = v.ctx;
    const p = this.params;
    const yU = v.ps.priceToY(N(p, 'upper'));
    const yL = v.ps.priceToY(N(p, 'lower'));
    ctx.save();
    if (p.showBg) {
      ctx.fillStyle = S(p, 'bgColor');
      ctx.fillRect(0, Math.min(yU, yL), v.width, Math.abs(yL - yU));
    }
    ctx.lineWidth = 1;
    ctx.setLineDash([4, 4]);
    for (const [show, key, color] of [['showUpper', 'upper', 'upperColor'], ['showMiddle', 'middle', 'middleColor'], ['showLower', 'lower', 'lowerColor']]) {
      if (!p[show]) continue;
      const y = Math.round(v.ps.priceToY(N(p, key))) + 0.5;
      ctx.strokeStyle = S(p, color);
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(v.width, y);
      ctx.stroke();
    }
    ctx.restore();
    const [ma] = this.lines;
    if (p.showRsi) strokeSeries(v, this.values, S(p, 'color'), N(p, 'width'), this.points);
    if (this.maType !== 'none') strokeSeries(v, ma, S(this.params, 'maColor'), 1, this.points);
  }

  /**
   * Like TradingView: the visible values (and the average) plus the upper / lower levels, not a
   * fixed 0–100 (which left the line in a thin band in the middle of the pane, with empty space above and below).
   */
  range(from: number, to: number): [number, number] {
    let lo = Math.min(N(this.params, 'lower'), N(this.params, 'upper'));
    let hi = Math.max(N(this.params, 'lower'), N(this.params, 'upper'));
    const rsi = this.params.showRsi ? [this.values] : [];
    const series = this.maType === 'none' ? rsi : [...rsi, this.lines[0]];
    for (const s of series) {
      const r = rangeOf(s, from, to);
      if (r) {
        lo = Math.min(lo, r[0]);
        hi = Math.max(hi, r[1]);
      }
    }
    return [lo, hi];
  }

  /** Cut to 2 decimals like TradingView (26.9957 → 26.99), not rounded. */
  formatValue(val: number): string {
    return isFinite(val) ? (Math.trunc(val * 100 + 1e-7) / 100).toFixed(2) : '∅';
  }

  legend(i: number): LegendValue[] {
    const out: LegendValue[] = [];
    if (this.params.showRsi) out.push({ text: this.formatValue(this.values[i]), color: S(this.params, 'color') });
    if (this.maType !== 'none') out.push({ text: this.formatValue(this.lines[0][i]), color: S(this.params, 'maColor') });
    return out;
  }

  axisLabels(): AxisLabel[] {
    const out: AxisLabel[] = [];
    const last = this.values[this.values.length - 1];
    if (this.params.showRsi && isFinite(last)) out.push({ price: last, color: S(this.params, 'color'), text: this.formatValue(last) });
    const ma = this.maType === 'none' ? NaN : this.lines[0][this.lines[0].length - 1];
    if (isFinite(ma)) out.push({ price: ma, color: S(this.params, 'maColor'), text: this.formatValue(ma) });
    return out;
  }
}

/** The sessions option of the session volume profile, as in TradingView. */
const SVP_SESSIONS = ['each', 'all', 'pre', 'regular', 'post', 'overnight', 'custom'];
const SVP_SESSION_LABELS: Record<string, string> = {
  each: 'Cada (pré-mercado, mercado, pós-mercado, noturno)',
  all: 'Todos',
  pre: 'Somente o pré-mercado',
  regular: 'Somente o mercado',
  post: 'Somente o pós-mercado',
  overnight: 'Apenas noturno',
  custom: 'Personalizado',
};
/** In the title: `SVP HD Cada 24 70`. */
const SVP_SESSION_SHORT: Record<string, string> = { each: 'Cada', all: 'Todos', pre: 'Pré', regular: 'Mercado', post: 'Pós', overnight: 'Noturno', custom: 'Pers.' };
const DASHES = ['solid', 'dashed', 'dotted'];

function dashOf(d: string, width: number): number[] {
  if (d === 'dashed') return [Math.max(4, width * 3), Math.max(3, width * 2)];
  if (d === 'dotted') return [Math.max(1, width), Math.max(2, width * 1.6)];
  return [];
}

/** The lines of a session's profile: param keys of the toggle, colour and style. */
const SVP_LINES = [
  { show: 'showVah', color: 'vahColor', dash: 'vahStyle', extend: 'extendVah', name: 'VAH' },
  { show: 'showVal', color: 'valColor', dash: 'valStyle', extend: 'extendVal', name: 'VAL' },
  { show: 'showPoc', color: 'pocColor', dash: 'pocStyle', extend: 'extendPoc', name: 'POC' },
] as const;
type SvpLevel = (typeof SVP_LINES)[number]['name'];
const SVP_VOLUME_LABELS: Record<string, string> = { updown: 'Alta/Baixa', total: 'Total', delta: 'Delta' };

interface SvpProfile {
  /** Index of the session's last bar when it was computed, and its number of rows. */
  to: number;
  rows: number;
  vp: VPResult;
  /** The developing POC / VAH / VAL per bar of the session (computed when shown). */
  dev?: { poc: number[]; vah: number[]; val: number[] };
  /** First bar after the session that reaches each level (-1: none yet), and the last bar already looked at. */
  hits: Partial<Record<SvpLevel, number>>;
  checked: Partial<Record<SvpLevel, number>>;
}

/** HD rows: about one row per 3 px of the session's height, in steps of ~19% so a small zoom keeps them. */
function hdRows(px: number): number {
  const r = Math.min(500, Math.max(6, px / 3));
  return Math.round(Math.pow(2, Math.round(Math.log2(r) * 4) / 4));
}

/**
 * Session volume profile ("SVP HD"): one volume profile per session of the trading day, over its own bars,
 * with its POC and value area. The sessions come from the exchange's hours (`EXCHANGE_SESSIONS`,
 * `SymbolInfo.sessions`): each part apart (pre-market, market, post-market, overnight), all together, only
 * one part, or custom hours.
 */
class SessionVolumeProfile extends Indicator {
  readonly type = 'svp';
  readonly name = 'Session Volume Profile HD';
  readonly short = 'SVP HD';
  readonly overlay = true;
  /** Behind the candles, and the price scale does not stretch to it. */
  readonly affectsScale = false;
  readonly schema: ParamDef[] = [
    { key: 'session', label: 'Sessão', type: 'select', options: SVP_SESSIONS, optionLabels: SVP_SESSION_LABELS },
    {
      key: 'customSession',
      label: 'Sessão customizada',
      type: 'session',
      enabled: (p) => p.session === 'custom',
      check: (v) => (parseSessionRanges(v) ? null : `horário inválido "${v}", ex.: 0930-1600 ou 0900-1130,1230-1530`),
    },
    {
      key: 'exchange',
      label: 'Bolsa',
      type: 'select',
      options: ['', ...EXCHANGE_SESSIONS.map((e) => e.id)],
      optionLabels: { '': 'A do símbolo', ...Object.fromEntries(EXCHANGE_SESSIONS.map((e) => [e.id, e.label])) },
    },
    {
      key: 'rowsLayout',
      label: 'Layout das linhas',
      type: 'select',
      options: ['auto', 'rows', 'ticks'],
      optionLabels: { auto: 'Automático (HD)', rows: 'Número de linhas', ticks: 'Ticks por linha' },
    },
    { key: 'rowSize', label: 'Tamanho da linha', type: 'number', min: 1, max: 2000, indent: true, enabled: (p) => p.rowsLayout !== 'auto' },
    { key: 'volume', label: 'Volume', type: 'select', options: ['updown', 'total', 'delta'], optionLabels: SVP_VOLUME_LABELS },
    { key: 'vaPct', label: 'Volume da Área do Valor', type: 'number', min: 1, max: 100 },
    { key: 'extendPoc', label: 'Estender POC à direita', type: 'bool' },
    { key: 'extendVah', label: 'Estender VAH à direita', type: 'bool' },
    { key: 'extendVal', label: 'Estender VAL à direita', type: 'bool' },
    { key: 'showProfile', label: 'Perfil de Volume', type: 'bool', section: STYLE },
    { key: 'valuesColor', label: 'Valores', type: 'color', toggle: 'showValues', indent: true, section: STYLE },
    { key: 'widthPct', label: 'Largura (% da caixa)', type: 'number', min: 1, max: 100, indent: true, section: STYLE },
    { key: 'placement', label: 'Posição', type: 'select', options: ['left', 'right'], optionLabels: { left: 'Esquerda', right: 'Direita' }, indent: true, section: STYLE },
    { key: 'upColor', label: 'Volume de alta', type: 'color', indent: true, section: STYLE },
    { key: 'downColor', label: 'Volume de baixa', type: 'color', indent: true, section: STYLE },
    { key: 'vaUpColor', label: 'Área de Valor de Alta', type: 'color', indent: true, section: STYLE },
    { key: 'vaDownColor', label: 'Área de Valor de Baixa', type: 'color', indent: true, section: STYLE },
    { key: 'vahColor', label: 'VAH', type: 'color', toggle: 'showVah', dashKey: 'vahStyle', section: STYLE },
    { key: 'valColor', label: 'VAL', type: 'color', toggle: 'showVal', dashKey: 'valStyle', section: STYLE },
    { key: 'pocColor', label: 'POC', type: 'color', toggle: 'showPoc', dashKey: 'pocStyle', section: STYLE },
    { key: 'devPocColor', label: 'Desenvolvendo o POC', type: 'color', toggle: 'showDevPoc', dashKey: 'devPocStyle', section: STYLE },
    { key: 'devVaColor', label: 'VA em desenvolvimento', type: 'color', toggle: 'showDevVa', dashKey: 'devVaStyle', section: STYLE },
    { key: 'boxColor', label: 'Caixa do Histograma', type: 'color', section: STYLE },
    { key: 'labelsOnScale', label: 'Legendas na escala de preço', type: 'bool', section: STYLE },
    { key: 'legendValues', label: 'Valores na linha de status', type: 'bool', section: STYLE },
    { key: 'inputsInTitle', label: 'Inputs na barra de status', type: 'bool', section: 'Valores de entrada', tab: 'style' },
  ];
  private bars: Bar[] = [];
  /** The sessions found so far (null: split again), what they were split with and in which zone. */
  private spans: SessionSpan[] | null = null;
  private spanKey = '';
  private zone = new TimeZone('UTC');
  /** Bars from this index changed since the sessions were split (a live tick, a new bar). */
  private dirtyFrom = Infinity;
  /** Profiles by the time of the session's first bar. */
  private cache = new Map<number, SvpProfile>();
  private cacheTick = NaN;
  private lastView: PaneView | null = null;

  constructor(params?: Params) {
    const p: Params = {
      session: 'each',
      customSession: '0930-1600',
      exchange: '',
      rowsLayout: 'auto',
      rowSize: 24,
      volume: 'updown',
      vaPct: 70,
      extendPoc: true,
      extendVah: false,
      extendVal: false,
      showProfile: true,
      showValues: false,
      valuesColor: '#b2b5be',
      widthPct: 30,
      placement: 'left',
      upColor: 'rgba(41,98,255,0.25)',
      downColor: 'rgba(251,192,45,0.25)',
      vaUpColor: 'rgba(41,98,255,0.6)',
      vaDownColor: 'rgba(251,192,45,0.6)',
      showVah: false,
      vahColor: '#787b86',
      vahStyle: 'solid',
      showVal: false,
      valColor: '#787b86',
      valStyle: 'solid',
      showPoc: true,
      pocColor: '#ff9800',
      pocStyle: 'dotted',
      showDevPoc: false,
      devPocColor: '#787b86',
      devPocStyle: 'solid',
      showDevVa: false,
      devVaColor: '#00838f',
      devVaStyle: 'solid',
      boxColor: 'rgba(120,134,170,0.08)',
      labelsOnScale: true,
      legendValues: true,
      inputsInTitle: true,
      ...(params ?? {}),
    };
    // a value that is not offered takes the first one
    const pick = (k: string, list: string[]): void => {
      if (!list.includes(String(p[k]))) p[k] = list[0];
    };
    pick('session', SVP_SESSIONS);
    pick('exchange', ['', ...EXCHANGE_SESSIONS.map((e) => e.id)]);
    pick('rowsLayout', ['auto', 'rows', 'ticks']);
    pick('volume', ['updown', 'total', 'delta']);
    pick('placement', ['left', 'right']);
    for (const k of ['vahStyle', 'valStyle', 'pocStyle', 'devPocStyle', 'devVaStyle']) pick(k, DASHES);
    super(p);
  }

  /** `SVP HD Cada Alta/Baixa 70` (with the row size when it is not automatic), or `SVP HD` without the inputs. */
  title(): string {
    const p = this.params;
    if (!p.inputsInTitle) return this.short;
    const rows = p.rowsLayout === 'auto' ? '' : ` ${N(p, 'rowSize')}`;
    return `${this.short} ${SVP_SESSION_SHORT[S(p, 'session')]}${rows} ${SVP_VOLUME_LABELS[S(p, 'volume')]} ${N(p, 'vaPct')}`;
  }

  /** A whole day before the first bar shown, so its session is complete. */
  warmup(): number {
    const tf = this.chartTimeframe;
    return tf > 0 && tf < 86400 ? Math.min(2000, Math.ceil(86400 / tf)) : 0;
  }

  compute(bars: Bar[], from: number): void {
    this.bars = bars;
    if (from <= 0) {
      this.spans = null;
      this.cache.clear();
      this.dirtyFrom = Infinity;
    } else this.dirtyFrom = Math.min(this.dirtyFrom, from);
  }

  /** The parts the bars are split into, from the session option and the exchange's (or the custom) hours. */
  private filter(v: PaneView): { tz: string; filter: SessionFilter; merge: boolean } {
    const p = this.params;
    const { hours, timezone } = resolveSessions(S(p, 'exchange'), v.symbol);
    const session = S(p, 'session');
    if (session === 'custom') return { tz: timezone, filter: [{ part: 'custom', ranges: parseSessionRanges(S(p, 'customSession')) ?? [] }], merge: false };
    const filter: SessionFilter = [];
    for (const part of ['regular', 'pre', 'post', 'overnight'] as SessionPart[]) {
      if (session !== 'each' && session !== 'all' && session !== part) continue;
      const ranges = hours[part] ? parseSessionRanges(hours[part]!) : null;
      if (ranges) filter.push({ part, ranges });
    }
    return { tz: timezone, filter, merge: session === 'all' };
  }

  /** The sessions of the bars: split once, then again only from the session a new bar or tick is in. */
  private sessions(v: PaneView): SessionSpan[] {
    const { tz, filter, merge } = this.filter(v);
    const key = `${tz}|${v.tf}|${merge}|${JSON.stringify(filter)}`;
    if (!this.spans || key !== this.spanKey) {
      this.spanKey = key;
      try {
        this.zone = new TimeZone(tz);
      } catch {
        this.zone = new TimeZone('UTC'); // a zone the browser doesn't know
      }
      this.spans = splitSessions(this.bars, 0, v.tf, this.zone, filter, merge);
      this.cache.clear();
      this.dirtyFrom = Infinity;
    } else if (this.dirtyFrom < Infinity) {
      const spans = this.spans;
      let k = spans.length;
      while (k > 0 && spans[k - 1].to >= this.dirtyFrom - 1) k--;
      const start = Math.min(k < spans.length ? spans[k].from : this.dirtyFrom, this.dirtyFrom);
      for (const s of spans.splice(k)) this.cache.delete(this.bars[s.from]?.time);
      spans.push(...splitSessions(this.bars, start, v.tf, this.zone, filter, merge));
      this.dirtyFrom = Infinity;
    }
    return this.spans;
  }

  /**
   * The profile of a session (cached; the session with the last bar is computed again when it changes). With
   * HD rows the count follows the session's height on screen; `loose`: a cached one will do (a session off
   * screen, only for its extended lines).
   */
  private profile(s: SessionSpan, v: PaneView, loose = false): SvpProfile | null {
    const p = this.params;
    if (v.tick !== this.cacheTick) {
      this.cacheTick = v.tick;
      this.cache.clear();
    }
    const t = this.bars[s.from].time;
    let c = this.cache.get(t);
    if (c && c.to === s.to && loose) return c;
    const layout = S(p, 'rowsLayout');
    let rows = Math.max(1, Math.round(N(p, 'rowSize')));
    if (layout === 'auto') {
      let lo = Infinity;
      let hi = -Infinity;
      for (let i = s.from; i <= s.to; i++) {
        lo = Math.min(lo, this.bars[i].low);
        hi = Math.max(hi, this.bars[i].high);
      }
      rows = hdRows(Math.abs(v.ps.priceToY(lo) - v.ps.priceToY(hi)));
    }
    if (!c || c.to !== s.to || c.rows !== rows) {
      const vp = computeVolumeProfile(this.bars, s.from, s.to, rows, N(p, 'vaPct') / 100, layout === 'ticks' ? rows * v.tick : 0);
      if (!vp) return null;
      c = { to: s.to, rows, vp, hits: {}, checked: {} };
      this.cache.set(t, c);
    }
    if (!c.dev && (p.showDevPoc || p.showDevVa)) c.dev = developingProfile(this.bars, s.from, s.to, c.vp, N(p, 'vaPct') / 100);
    return c;
  }

  /** The session bar `i` is in, or null. */
  private spanAt(spans: SessionSpan[], i: number): SessionSpan | null {
    let a = 0;
    let b = spans.length - 1;
    while (a <= b) {
      const m = (a + b) >> 1;
      if (spans[m].to < i) a = m + 1;
      else if (spans[m].from > i) b = m - 1;
      else return spans[m];
    }
    return null;
  }

  /** Prices of the POC (middle of its row), VAH (top of the value area) and VAL (bottom). */
  private levels(vp: VPResult): Record<'POC' | 'VAH' | 'VAL', number> {
    const r = vp.rows[vp.poc];
    return { POC: (r.lo + r.hi) / 2, VAH: vp.rows[vp.vaHigh].hi, VAL: vp.rows[vp.vaLow].lo };
  }

  /**
   * The first bar after the session whose range reaches `price` (where an extended line stops, as in
   * TradingView), or -1: none yet. Only new bars are looked at again; the last one can still change.
   */
  private reachedAt(c: SvpProfile, s: SessionSpan, name: SvpLevel, price: number): number {
    const hit = c.hits[name];
    if (hit !== undefined && hit >= 0) return hit;
    const bars = this.bars;
    for (let j = Math.max(s.to + 1, (c.checked[name] ?? s.to) + 1); j < bars.length; j++) {
      if (bars[j].low <= price && bars[j].high >= price) return (c.hits[name] = j);
    }
    c.checked[name] = bars.length - 2;
    return (c.hits[name] = -1);
  }

  /** VAH / VAL / POC of a session: across it, or extended to the right until a later bar reaches them. */
  private drawLevels(v: PaneView, s: SessionSpan, c: SvpProfile, xa: number, xb: number, onScreen: boolean): void {
    const p = this.params;
    const ctx = v.ctx;
    const lv = this.levels(c.vp);
    ctx.lineWidth = 1;
    for (const l of SVP_LINES) {
      if (!p[l.show]) continue;
      let end = xb;
      if (p[l.extend]) {
        const j = this.reachedAt(c, s, l.name, lv[l.name]);
        end = j >= 0 ? v.ts.indexToX(j) : v.width;
      } else if (!onScreen) continue;
      if (end < 0) continue;
      const y = Math.round(v.ps.priceToY(lv[l.name])) + 0.5;
      ctx.strokeStyle = S(p, l.color);
      ctx.setLineDash(dashOf(S(p, l.dash), 1));
      ctx.beginPath();
      ctx.moveTo(xa, y);
      ctx.lineTo(Math.max(xb, end), y);
      ctx.stroke();
    }
    ctx.setLineDash([]);
  }

  draw(v: PaneView): void {
    this.lastView = v;
    if (!this.bars.length) return;
    const p = this.params;
    const spans = this.sessions(v);
    const ctx = v.ctx;
    const sp = v.ts.barSpacing;
    const extending = SVP_LINES.some((l) => p[l.show] && p[l.extend]);
    ctx.save();
    for (const s of spans) {
      if (s.from > v.to + 1) break;
      if (s.to < v.from - 1) {
        // off screen to the left: only its lines that go on to the right
        if (!extending) continue;
        const c = this.profile(s, v, true);
        if (c) this.drawLevels(v, s, c, v.ts.indexToX(s.from) - sp / 2, v.ts.indexToX(s.to) + sp / 2, false);
        continue;
      }
      const c = this.profile(s, v);
      if (!c) continue;
      const vp = c.vp;
      const xa = v.ts.indexToX(s.from) - sp / 2;
      const xb = v.ts.indexToX(s.to) + sp / 2;
      if (parseColor(S(p, 'boxColor')).a > 0) {
        const yTop = v.ps.priceToY(vp.rows[vp.rows.length - 1].hi);
        const yBot = v.ps.priceToY(vp.rows[0].lo);
        ctx.fillStyle = S(p, 'boxColor');
        ctx.fillRect(xa, Math.min(yTop, yBot), xb - xa, Math.abs(yBot - yTop));
      }
      if (p.showProfile) this.drawHistogram(v, vp, xa, xb);
      ctx.lineWidth = 1;
      if (c.dev && p.showDevPoc) this.drawSteps(v, s, c.dev.poc, S(p, 'devPocColor'), S(p, 'devPocStyle'));
      if (c.dev && p.showDevVa) {
        this.drawSteps(v, s, c.dev.vah, S(p, 'devVaColor'), S(p, 'devVaStyle'));
        this.drawSteps(v, s, c.dev.val, S(p, 'devVaColor'), S(p, 'devVaStyle'));
      }
      this.drawLevels(v, s, c, xa, xb, true);
    }
    ctx.restore();
  }

  /** The rows of a profile from the left (or right) edge of its session, `widthPct` of its width at most. */
  private drawHistogram(v: PaneView, vp: VPResult, xa: number, xb: number): void {
    const p = this.params;
    const ctx = v.ctx;
    const mode = S(p, 'volume');
    const right = p.placement === 'right';
    const maxW = ((xb - xa) * N(p, 'widthPct')) / 100;
    let max = 0;
    for (const r of vp.rows) max = Math.max(max, mode === 'delta' ? Math.abs(r.up - r.down) : r.up + r.down);
    if (!(max > 0)) return;
    // `x` from the profile's edge
    const box = (x: number, w: number, top: number, h: number): void => {
      if (w > 0) ctx.fillRect(right ? xb - x - w : xa + x, top, w, h);
    };
    ctx.font = font(10);
    ctx.textBaseline = 'middle';
    ctx.textAlign = right ? 'right' : 'left';
    vp.rows.forEach((r, i) => {
      const y1 = v.ps.priceToY(r.hi);
      const y2 = v.ps.priceToY(r.lo);
      const top = Math.min(y1, y2) + 0.5;
      const h = Math.max(1, Math.abs(y2 - y1) - 1);
      const va = i >= vp.vaLow && i <= vp.vaHigh;
      const upC = S(p, va ? 'vaUpColor' : 'upColor');
      const dnC = S(p, va ? 'vaDownColor' : 'downColor');
      let w: number;
      let value = r.up + r.down;
      if (mode === 'delta') {
        value = r.up - r.down;
        w = (Math.abs(value) / max) * maxW;
        ctx.fillStyle = value >= 0 ? upC : dnC;
        box(0, w, top, h);
      } else if (mode === 'total') {
        w = (value / max) * maxW;
        ctx.fillStyle = upC;
        box(0, w, top, h);
      } else {
        const wUp = (r.up / max) * maxW;
        const wDn = (r.down / max) * maxW;
        ctx.fillStyle = upC;
        box(0, wUp, top, h);
        ctx.fillStyle = dnC;
        box(wUp, wDn, top, h);
        w = wUp + wDn;
      }
      if (p.showValues && h >= 9 && value) {
        ctx.fillStyle = S(p, 'valuesColor');
        ctx.fillText(formatVolume(value), right ? xb - w - 3 : xa + w + 3, top + h / 2);
      }
    });
  }

  /** A developing line: the value of each bar across its width, joined by vertical steps. */
  private drawSteps(v: PaneView, s: SessionSpan, values: number[], color: string, dash: string): void {
    const ctx = v.ctx;
    const sp = v.ts.barSpacing;
    ctx.strokeStyle = color;
    ctx.setLineDash(dashOf(dash, 1));
    ctx.beginPath();
    const a = Math.max(s.from, v.from - 1);
    const b = Math.min(s.to, v.to + 1);
    for (let i = a; i <= b; i++) {
      const x = v.ts.indexToX(i);
      const y = Math.round(v.ps.priceToY(values[i - s.from])) + 0.5;
      if (i === a) ctx.moveTo(x - sp / 2, y);
      else ctx.lineTo(x - sp / 2, y);
      ctx.lineTo(x + sp / 2, y);
    }
    ctx.stroke();
  }

  /** POC, VAH and VAL of the session under the crosshair (the lines that are shown). */
  legend(i: number, v: PaneView): LegendValue[] {
    const p = this.params;
    if (!p.legendValues || !this.bars.length) return [];
    const s = this.spanAt(this.sessions(v), i);
    const c = s && this.profile(s, v);
    if (!c) return [];
    const lv = this.levels(c.vp);
    return SVP_LINES.filter((l) => p[l.show]).map((l) => ({ text: v.fmt(lv[l.name]), color: S(p, l.color) }));
  }

  /** POC, VAH and VAL of the last session on the price scale. */
  axisLabels(): AxisLabel[] {
    const p = this.params;
    const v = this.lastView;
    if (!p.labelsOnScale || !v || !this.spans?.length) return [];
    const c = this.profile(this.spans[this.spans.length - 1], v);
    if (!c) return [];
    const lv = this.levels(c.vp);
    return SVP_LINES.filter((l) => p[l.show]).map((l) => ({ price: lv[l.name], color: S(p, l.color) }));
  }
}

export interface IndicatorEntry {
  type: string;
  name: string;
  description: string;
  create: (params?: Params) => Indicator;
}

export const INDICATORS: IndicatorEntry[] = [
  { type: 'sma', name: 'Moving Average', description: 'Média móvel simples (SMA)', create: (p) => new MovingAverage('sma', p) },
  { type: 'ema', name: 'Moving Average Exponential', description: 'Média móvel exponencial (EMA)', create: (p) => new MovingAverage('ema', p) },
  { type: 'rsi', name: 'Relative Strength Index', description: 'Índice de força relativa (RSI), num painel próprio', create: (p) => new RelativeStrengthIndex(p) },
  {
    type: 'svp',
    name: 'Session Volume Profile HD',
    description: 'Perfil de volume de cada sessão (pré-mercado, mercado, pós-mercado, noturno)',
    create: (p) => new SessionVolumeProfile(p),
  },
];

export function createIndicator(type: string, params?: Params): Indicator | null {
  const e = INDICATORS.find((x) => x.type === type);
  return e ? e.create(params) : null;
}

/**
 * Problems with the params of an indicator that comes from outside (e.g. a simulation): unknown type, unknown
 * keys, wrong value types, values that a list does not offer, numbers out of range. Empty when all is right.
 */
export function checkIndicatorParams(type: string, params: Params = {}): string[] {
  const ind = createIndicator(type);
  if (!ind) return [`tipo '${type}' desconhecido (existem: ${INDICATORS.map((e) => e.type).join(', ')})`];
  const out: string[] = [];
  const defaults = ind.params;
  for (const [key, val] of Object.entries(params)) {
    if (!(key in defaults)) {
      out.push(`'${key}' não existe no ${type} (existem: ${Object.keys(defaults).join(', ')})`);
      continue;
    }
    const want = typeof defaults[key];
    if (typeof val !== want) {
      out.push(`'${key}' devia ser ${want === 'number' ? 'um número' : want === 'boolean' ? 'true / false' : 'um texto'}, veio ${JSON.stringify(val)}`);
      continue;
    }
    const f = ind.schema.find((x) => x.key === key || x.numberKey === key);
    if (!f) continue;
    if (f.type === 'select' && f.key === key && key !== 'timeframe' && !f.options?.includes(String(val))) {
      out.push(`'${key}' = ${JSON.stringify(val)} não é válido (valores: ${f.options!.map((o) => JSON.stringify(o)).join(', ')})`);
    }
    const bad = (f.type === 'text' || f.type === 'session') && f.key === key ? f.check?.(String(val)) : null;
    if (bad) out.push(`'${key}': ${bad}`);
    if (key === 'timeframe' && val &&!parseTimeframe(String(val))) out.push(`'timeframe' = ${JSON.stringify(val)} não é um tempo gráfico (ex.: '60', '4h', '1D')`);
    if (typeof val === 'number' && (f.type === 'number' || f.numberKey === key) && ((f.min !== undefined && val < f.min) || (f.max !== undefined && val > f.max))) {
      out.push(`'${key}' = ${val} fora do intervalo ${f.min} a ${f.max}`);
    }
  }
  return out;
}
