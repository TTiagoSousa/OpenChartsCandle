import type { Bar } from '../core/types';
import { formatVolume } from '../core/utils';
import type { PaneView } from '../core/view';
import {
  Indicator,
  type AxisLabel,
  type LegendValue,
  type MaType,
  type ParamDef,
  type Params,
  N,
  S,
  STYLE,
  TIMEFRAME,
  maInto,
  rangeOf,
  resize,
  rsiInto,
  shiftSeries,
  source,
  stdevAt,
  strokeSeries,
} from './base';
import { parseTimeframe } from '../core/types';

/*
 * The "studies": indicators described by their inputs, plots, levels and fills, like a Pine script. The
 * settings dialog, legend, price scale labels, autoscale and the own timeframe come from the description; each
 * study only computes its series. The formulas are the public ones (as documented for Pine's `ta.*`), written
 * here from scratch.
 */

type Src = (i: number) => number;

/** How a plot is drawn: a line (broken where there is no value), columns from 0, crosses, or not drawn (only for fills). */
export type PlotKind = 'line' | 'columns' | 'cross' | 'none';

export interface PlotDef {
  key: string;
  label: string;
  kind?: PlotKind;
  color: string;
  width?: number;
  /** Hidden by default (shown with the checkbox of the "Estilo" tab). */
  hidden?: boolean;
  /** More colours picked per bar by the plot's state (0 = `color`, 1 = the first of these…), e.g. the MACD histogram. */
  colors?: { label: string; color: string }[];
  /** Label of the first colour when there are `colors` (default 'Cor'). */
  colorLabel?: string;
  /** Bars the plot is moved to the right (negative: to the left), e.g. the Ichimoku cloud. */
  offset?: (p: Params) => number;
}

export interface LevelDef {
  key: string;
  label: string;
  value: number;
  color: string;
  hidden?: boolean;
}

export interface FillDef {
  key: string;
  label: string;
  /** Two plots or two levels. */
  a: string;
  b: string;
  color: string;
  /** When `a` is below `b` (e.g. the red part of the Ichimoku cloud). */
  colorDown?: string;
  hidden?: boolean;
}

export interface StudyContext {
  bars: Bar[];
  n: number;
  /** First bar to compute (the ones before keep their values). */
  from: number;
  p: Params;
  /** The plot's values. */
  out: (key: string) => number[];
  /** The plot's state (which of its colours) per bar. */
  state: (key: string) => number[];
  /** A working series kept between calls (e.g. an ATR or an EMA used by the plots). */
  tmp: (name: string) => number[];
  /** A source of the bars ('close', 'hl2', 'hlc3'…). */
  src: (key: string) => Src;
  /** Seconds of the bars computed (the own timeframe, else the chart's; 0: not known). */
  tf: number;
}

export interface StudyDef {
  type: string;
  name: string;
  short: string;
  description: string;
  overlay: boolean;
  inputs: ParamDef[];
  defaults: Params;
  plots: PlotDef[];
  levels?: LevelDef[];
  fills?: FillDef[];
  /** 'price' (the symbol's precision), 'volume' (1.2M) or a number of decimals. */
  format?: 'price' | 'volume' | number;
  /** No "Tempo gráfico" input (e.g. the VWAP, anchored to its own periods). */
  noTimeframe?: boolean;
  warmup: (p: Params) => number;
  compute: (c: StudyContext) => void;
  /** Title in the legend (default: the short name and the inputs). */
  title?: (p: Params) => string;
}

export const STUDY_SOURCES = ['open', 'high', 'low', 'close', 'hl2', 'hlc3', 'ohlc4', 'hlcc4', 'volume'];
const STUDY_SOURCE_LABELS: Record<string, string> = {
  open: 'Abertura',
  high: 'Máxima',
  low: 'Mínima',
  close: 'Fechamento',
  hl2: '(Máx. + Mín.) / 2',
  hlc3: '(Máx. + Mín. + Fech.) / 3',
  ohlc4: '(Abert. + Máx. + Mín. + Fech.) / 4',
  hlcc4: '(Máx. + Mín. + 2 × Fech.) / 4',
  volume: 'Volume',
};
export const src = (label = 'Fonte'): ParamDef => ({ key: 'source', label, type: 'select', options: STUDY_SOURCES, optionLabels: STUDY_SOURCE_LABELS });
export const num = (key: string, label: string, min = 1, max = 2000, step?: number, section?: string): ParamDef => ({ key, label, type: 'number', min, max, step, section });
export const MA_TYPES = ['sma', 'ema', 'rma', 'wma', 'vwma'];
export const MA_LABELS: Record<string, string> = { sma: 'SMA', ema: 'EMA', rma: 'SMMA (RMA)', wma: 'WMA', vwma: 'VWMA' };
export type { Src };
export const maSelect = (key: string, label: string, options = MA_TYPES): ParamDef => ({ key, label, type: 'select', options, optionLabels: MA_LABELS });

export const len = (p: Params, k: string): number => Math.max(1, Math.round(N(p, k)));

// ---------------- series helpers (from `from` onwards; NaN while a window is not full) ----------------

export function highest(s: Src, i: number, n: number): number {
  if (i - n + 1 < 0) return NaN;
  let m = -Infinity;
  for (let k = i - n + 1; k <= i; k++) {
    const x = s(k);
    if (!isFinite(x)) return NaN;
    if (x > m) m = x;
  }
  return m;
}

export function lowest(s: Src, i: number, n: number): number {
  if (i - n + 1 < 0) return NaN;
  let m = Infinity;
  for (let k = i - n + 1; k <= i; k++) {
    const x = s(k);
    if (!isFinite(x)) return NaN;
    if (x < m) m = x;
  }
  return m;
}

export function sum(s: Src, i: number, n: number): number {
  if (i - n + 1 < 0) return NaN;
  let t = 0;
  for (let k = i - n + 1; k <= i; k++) t += s(k);
  return t;
}

/** Pine's `ta.tr(handleNa)`: the first bar is high − low with `handleNa`, else no value. */
export function trueRange(bars: Bar[], i: number, handleNa = true): number {
  const b = bars[i];
  if (i === 0) return handleNa ? b.high - b.low : NaN;
  const pc = bars[i - 1].close;
  return Math.max(b.high - b.low, Math.abs(b.high - pc), Math.abs(b.low - pc));
}

export function ma(c: StudyContext, out: number[], s: Src, length: number, type: string): void {
  maInto(out, s, (i) => c.bars[i].volume, c.n, length, type as MaType, c.from);
}

/** `out[i] = f(i)` from `from`. */
export function each(c: StudyContext, out: number[], f: (i: number) => number): void {
  for (let i = c.from; i < c.n; i++) out[i] = f(i);
}

export const at = (a: number[]): Src => (i) => a[i];
export const nz = (x: number): number => (isFinite(x) ? x : 0);

/** Warm-up of a moving average: the recursive ones never forget (10 × length makes the start negligible). */
export const maWarm = (type: string, n: number): number => (type === 'ema' || type === 'rma' ? 10 * n : n);

/** Highest / lowest of the high / low as Pine's `ta.highestbars` (0 = this bar, −k = k bars ago; the latest on a tie). */
function barsSince(bars: Bar[], i: number, n: number, high: boolean): number {
  if (i - n + 1 < 0) return NaN;
  let best = i;
  for (let k = i - 1; k >= i - n + 1; k--) {
    if (high ? bars[k].high > bars[best].high : bars[k].low < bars[best].low) best = k;
  }
  return best - i;
}

// ---------------- the indicator built from a description ----------------

export const GREY_HALF = 'rgba(120,123,134,0.5)';
export const GREY = '#787b86';

export class Study extends Indicator {
  readonly type: string;
  readonly name: string;
  readonly short: string;
  readonly overlay: boolean;
  readonly schema: ParamDef[];
  private series = new Map<string, number[]>();
  private states = new Map<string, number[]>();
  private work = new Map<string, number[]>();
  /** Index of each plot / state in `rawLines` (and so in `lines`). */
  private index = new Map<string, number>();

  constructor(
    readonly def: StudyDef,
    params?: Params,
  ) {
    super(studyDefaults(def), params);
    this.type = def.type;
    this.name = def.name;
    this.short = def.short;
    this.overlay = def.overlay;
    this.schema = studySchema(def);
    this.params = validStudyParams(def, this.params);
    def.plots.forEach((pl, k) => {
      const arr = k === 0 ? this.raw : [];
      this.series.set(pl.key, arr);
      this.index.set(pl.key, this.rawLines.length);
      this.rawLines.push(arr);
      if (pl.colors) {
        const st: number[] = [];
        this.states.set(pl.key, st);
        this.index.set(`${pl.key}#state`, this.rawLines.length);
        this.rawLines.push(st);
      }
    });
  }

  title(): string {
    const p = this.params;
    if (this.def.title) return this.def.title(p) + this.timeframeSuffix();
    const vals = this.def.inputs
      .filter((f) => (f.type === 'number' || f.type === 'select') && f.key !== 'timeframe')
      .map((f) => (f.type === 'select' && MA_TYPES.includes(String(p[f.key])) ? String(p[f.key]).toUpperCase() : p[f.key]));
    return (vals.length ? `${this.short} ${vals.join(' ')}` : this.short) + this.timeframeSuffix();
  }

  warmup(): number {
    return this.def.warmup(this.params);
  }

  compute(bars: Bar[], from: number): void {
    const n = bars.length;
    const f = Math.max(0, Math.min(from, n));
    for (const a of this.series.values()) resize(a, n, f);
    for (const a of this.states.values()) resize(a, n, f);
    const tmp = (name: string): number[] => {
      let a = this.work.get(name);
      if (!a) this.work.set(name, (a = []));
      resize(a, n, f);
      return a;
    };
    this.def.compute({
      bars,
      n,
      from: f,
      p: this.params,
      out: (k) => this.series.get(k)!,
      state: (k) => this.states.get(k)!,
      tmp,
      src: (k) => (i) => source(bars[i], k),
      tf: this.timeframe()?.seconds ?? this.chartTimeframe,
    });
  }

  /** A plot's values per chart bar, moved by its offset. */
  private plotted(key: string): { values: number[]; points: ArrayLike<number> | null; offset: number } {
    const pl = this.def.plots.find((x) => x.key === key)!;
    const offset = pl.offset ? Math.round(pl.offset(this.params)) || 0 : 0;
    const values = this.lines[this.index.get(key)!] ?? [];
    return { ...shiftSeries(values, this.points, offset), offset };
  }

  private stateAt(key: string, i: number): number {
    const k = this.index.get(`${key}#state`);
    return k === undefined ? 0 : (this.lines[k]?.[i] ?? 0);
  }

  private plotColor(pl: PlotDef, state: number): string {
    return S(this.params, state > 0 && pl.colors ? `${pl.key}Color${state}` : `${pl.key}Color`);
  }

  private plotShown(pl: PlotDef): boolean {
    return (pl.kind ?? 'line') !== 'none' && Boolean(this.params[`${pl.key}Show`]);
  }

  /** The values of a plot or a level, for a fill. */
  private side(key: string): { level: number } | { values: number[] } {
    const lv = this.def.levels?.find((l) => l.key === key);
    return lv ? { level: N(this.params, key) } : { values: this.plotted(key).values };
  }

  draw(v: PaneView): void {
    const p = this.params;
    const ctx = v.ctx;
    ctx.save();
    for (const fl of this.def.fills ?? []) {
      if (p[`${fl.key}Show`]) this.drawFill(v, fl);
    }
    ctx.lineWidth = 1;
    ctx.setLineDash([4, 4]);
    for (const lv of this.def.levels ?? []) {
      if (!p[`${lv.key}Show`]) continue;
      const y = Math.round(v.ps.priceToY(N(p, lv.key))) + 0.5;
      ctx.strokeStyle = S(p, `${lv.key}Color`);
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(v.width, y);
      ctx.stroke();
    }
    ctx.setLineDash([]);
    ctx.restore();
    for (const pl of this.def.plots) {
      if (!this.plotShown(pl)) continue;
      const kind = pl.kind ?? 'line';
      const { values, points, offset } = this.plotted(pl.key);
      const width = N(p, `${pl.key}Width`) || 1;
      if (kind === 'line') strokeSeries(v, values, this.plotColor(pl, 0), width, points, offset);
      else if (kind === 'columns') this.drawColumns(v, pl, values);
      else if (kind === 'cross') this.drawCrosses(v, pl, values, width);
    }
  }

  private drawColumns(v: PaneView, pl: PlotDef, values: number[]): void {
    const ctx = v.ctx;
    const sp = v.ts.barSpacing;
    const w = Math.max(1, Math.round(sp * 0.7));
    const y0 = v.ps.priceToY(0);
    ctx.save();
    for (let i = Math.max(0, v.from - 1); i <= Math.min(values.length - 1, v.to + 1); i++) {
      const val = values[i];
      if (!isFinite(val)) continue;
      const x = Math.round(v.ts.indexToX(i) - w / 2);
      const y = v.ps.priceToY(val);
      ctx.fillStyle = this.plotColor(pl, this.stateAt(pl.key, i));
      ctx.fillRect(x, Math.min(y, y0), w, Math.max(1, Math.abs(y0 - y)));
    }
    ctx.restore();
  }

  private drawCrosses(v: PaneView, pl: PlotDef, values: number[], width: number): void {
    const ctx = v.ctx;
    const r = Math.max(2, Math.min(4, v.ts.barSpacing / 3)) + width - 1;
    ctx.save();
    ctx.strokeStyle = this.plotColor(pl, 0);
    ctx.lineWidth = width;
    ctx.beginPath();
    for (let i = Math.max(0, v.from - 1); i <= Math.min(values.length - 1, v.to + 1); i++) {
      if (!isFinite(values[i])) continue;
      const x = Math.round(v.ts.indexToX(i)) + 0.5;
      const y = Math.round(v.ps.priceToY(values[i])) + 0.5;
      ctx.moveTo(x - r, y);
      ctx.lineTo(x + r, y);
      ctx.moveTo(x, y - r);
      ctx.lineTo(x, y + r);
    }
    ctx.stroke();
    ctx.restore();
  }

  /** The area between two plots (bar by bar, so the colour can follow which one is above) or two levels. */
  private drawFill(v: PaneView, fl: FillDef): void {
    const p = this.params;
    const ctx = v.ctx;
    const a = this.side(fl.a);
    const b = this.side(fl.b);
    if ('level' in a && 'level' in b) {
      const ya = v.ps.priceToY(a.level);
      const yb = v.ps.priceToY(b.level);
      ctx.fillStyle = S(p, `${fl.key}Color`);
      ctx.fillRect(0, Math.min(ya, yb), v.width, Math.abs(yb - ya));
      return;
    }
    const va = (i: number): number => ('level' in a ? a.level : a.values[i]);
    const vb = (i: number): number => ('level' in b ? b.level : b.values[i]);
    const last = Math.max('values' in a ? a.values.length : 0, 'values' in b ? b.values.length : 0) - 1;
    const up = S(p, `${fl.key}Color`);
    const down = fl.colorDown ? S(p, `${fl.key}ColorDown`) : up;
    const from = Math.max(0, v.from - 1);
    const to = Math.min(last, v.to + 1);
    // runs of bars with both values and the same colour, each one polygon
    let i = from;
    while (i <= to) {
      if (!isFinite(va(i)) || !isFinite(vb(i))) {
        i++;
        continue;
      }
      const color = va(i) >= vb(i) ? up : down;
      let j = i;
      while (j + 1 <= to && isFinite(va(j + 1)) && isFinite(vb(j + 1)) && (va(j + 1) >= vb(j + 1) ? up : down) === color) j++;
      // one bar further, so neighbouring runs meet
      const end = j + 1 <= to && isFinite(va(j + 1)) && isFinite(vb(j + 1)) ? j + 1 : j;
      ctx.fillStyle = color;
      ctx.beginPath();
      for (let k = i; k <= end; k++) {
        const x = v.ts.indexToX(k);
        const y = v.ps.priceToY(va(k));
        if (k === i) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      for (let k = end; k >= i; k--) ctx.lineTo(v.ts.indexToX(k), v.ps.priceToY(vb(k)));
      ctx.closePath();
      ctx.fill();
      i = j + 1;
    }
  }

  range(from: number, to: number): [number, number] | null {
    const p = this.params;
    let lo = Infinity;
    let hi = -Infinity;
    for (const pl of this.def.plots) {
      if (!this.plotShown(pl)) continue;
      const r = rangeOf(this.plotted(pl.key).values, from, to);
      if (!r) continue;
      lo = Math.min(lo, r[0], pl.kind === 'columns' ? 0 : Infinity);
      hi = Math.max(hi, r[1], pl.kind === 'columns' ? 0 : -Infinity);
    }
    for (const lv of this.def.levels ?? []) {
      if (!p[`${lv.key}Show`]) continue;
      lo = Math.min(lo, N(p, lv.key));
      hi = Math.max(hi, N(p, lv.key));
    }
    return lo <= hi ? [lo, hi] : null;
  }

  formatValue(val: number, v: PaneView): string {
    if (!isFinite(val)) return '∅';
    const f = this.def.format ?? 'price';
    if (f === 'volume') return formatVolume(val);
    if (typeof f === 'number') return val.toFixed(f);
    return v.fmt(val);
  }

  legend(i: number, v: PaneView): LegendValue[] {
    const out: LegendValue[] = [];
    for (const pl of this.def.plots) {
      if (!this.plotShown(pl)) continue;
      // the value drawn on bar i (moved: the one from `offset` bars before)
      const { values, offset } = this.plotted(pl.key);
      out.push({ text: this.formatValue(values[i], v), color: this.plotColor(pl, this.stateAt(pl.key, i - offset)) });
    }
    return out;
  }

  axisLabels(): AxisLabel[] {
    const out: AxisLabel[] = [];
    for (const pl of this.def.plots) {
      if (!this.plotShown(pl) || pl.kind === 'cross') continue;
      const { values } = this.plotted(pl.key);
      // the newest value (a plot moved to the right goes past the last bar)
      const last = values[values.length - 1];
      if (!isFinite(last)) continue;
      const own = this.lines[this.index.get(pl.key)!] ?? [];
      const fmt = this.def.format;
      out.push({
        price: last,
        color: this.plotColor(pl, this.stateAt(pl.key, own.length - 1)),
        text: fmt === 'volume' ? formatVolume(last) : typeof fmt === 'number' ? last.toFixed(fmt) : undefined,
      });
    }
    return out;
  }
}

/** The inputs' defaults and, for each plot / level / fill, its show / colour / width keys. */
function studyDefaults(def: StudyDef): Params {
  const p: Params = { ...def.defaults };
  if (!def.noTimeframe) p.timeframe = '';
  for (const pl of def.plots) {
    if ((pl.kind ?? 'line') === 'none') continue;
    p[`${pl.key}Show`] = !pl.hidden;
    p[`${pl.key}Color`] = pl.color;
    pl.colors?.forEach((c, k) => (p[`${pl.key}Color${k + 1}`] = c.color));
    if (pl.kind !== 'columns') p[`${pl.key}Width`] = pl.width ?? 1;
  }
  for (const lv of def.levels ?? []) {
    p[`${lv.key}Show`] = !lv.hidden;
    p[lv.key] = lv.value;
    p[`${lv.key}Color`] = lv.color;
  }
  for (const fl of def.fills ?? []) {
    p[`${fl.key}Show`] = !fl.hidden;
    p[`${fl.key}Color`] = fl.color;
    if (fl.colorDown) p[`${fl.key}ColorDown`] = fl.colorDown;
  }
  return p;
}

/** The fields of the settings dialog: the inputs (Valores), then a row per plot, level and fill (Estilo). */
function studySchema(def: StudyDef): ParamDef[] {
  const out: ParamDef[] = [...def.inputs];
  if (!def.noTimeframe) out.push(TIMEFRAME);
  for (const pl of def.plots) {
    const kind = pl.kind ?? 'line';
    if (kind === 'none') continue;
    if (pl.colors) {
      // the checkbox, then one colour per state
      out.push({ key: `${pl.key}Show`, label: pl.label, type: 'bool', section: STYLE });
      out.push({ key: `${pl.key}Color`, label: pl.colorLabel ?? 'Cor', type: 'color', indent: true, section: STYLE });
      pl.colors.forEach((c, k) => out.push({ key: `${pl.key}Color${k + 1}`, label: c.label, type: 'color', indent: true, section: STYLE }));
    } else if (kind === 'columns') {
      out.push({ key: `${pl.key}Color`, label: pl.label, type: 'color', toggle: `${pl.key}Show`, section: STYLE });
    } else {
      out.push({ key: `${pl.key}Color`, label: pl.label, type: 'color', toggle: `${pl.key}Show`, numberKey: `${pl.key}Width`, min: 1, max: 4, section: STYLE });
    }
  }
  for (const lv of def.levels ?? []) {
    out.push({ key: `${lv.key}Color`, label: lv.label, type: 'color', toggle: `${lv.key}Show`, numberKey: lv.key, min: -1e9, max: 1e9, step: 0.1, section: STYLE });
  }
  for (const fl of def.fills ?? []) {
    out.push({ key: `${fl.key}Color`, label: fl.label, type: 'color', toggle: `${fl.key}Show`, section: STYLE });
    if (fl.colorDown) out.push({ key: `${fl.key}ColorDown`, label: 'Cor em baixa', type: 'color', indent: true, section: STYLE });
  }
  return out;
}

/** A list value that is not offered takes the default; the timeframe is kept as its id ('4h' → '240'). */
function validStudyParams(def: StudyDef, p: Params): Params {
  const out = { ...p };
  const defaults = studyDefaults(def);
  for (const f of def.inputs) {
    if (f.type === 'select' && f.options && !f.options.includes(String(out[f.key]))) out[f.key] = defaults[f.key];
  }
  if (!def.noTimeframe) {
    const tf = out.timeframe ? parseTimeframe(String(out.timeframe)) : null;
    out.timeframe = tf ? tf.id : '';
  }
  return out;
}

// ---------------- the indicators ----------------

export const BLUE = '#2962ff';
export const ORANGE = '#ff6d00';
export const PURPLE = '#7e57c2';
export const BAND_BG = 'rgba(33,150,243,0.1)';
export const oscLevels = (upper: number, middle: number, lower: number): LevelDef[] => [
  { key: 'upper', label: 'Banda superior', value: upper, color: GREY },
  { key: 'middle', label: 'Banda do meio', value: middle, color: GREY_HALF },
  { key: 'lower', label: 'Banda inferior', value: lower, color: GREY },
];
export const oscFill = (color = BAND_BG): FillDef[] => [{ key: 'bg', label: 'Fundo entre as bandas', a: 'upper', b: 'lower', color }];
export const zeroLevel = (label = 'Linha zero'): LevelDef[] => [{ key: 'zero', label, value: 0, color: GREY_HALF }];

/** A moving average of a source, moved by `offset` (WMA, VWMA, HMA). */
export function averageStudy(type: string, name: string, short: string, description: string, length: number, compute: (c: StudyContext, n: number) => void, warm: (n: number) => number): StudyDef {
  return {
    type,
    name,
    short,
    description,
    overlay: true,
    inputs: [num('length', 'Período', 1, 1000), src(), num('offset', 'Deslocamento', -500, 500)],
    defaults: { length, source: 'close', offset: 0 },
    plots: [{ key: 'ma', label: short, color: BLUE, offset: (p) => N(p, 'offset') }],
    warmup: (p) => warm(len(p, 'length')),
    compute: (c) => compute(c, len(c.p, 'length')),
    title: (p) => `${short} ${len(p, 'length')} ${p.source}${N(p, 'offset') ? ` ${N(p, 'offset')}` : ''}`,
  };
}

export const STUDY_DEFS: StudyDef[] = [
  {
    type: 'volume',
    name: 'Volume',
    short: 'Vol',
    description: 'Volume de cada vela, verde ou vermelho, com uma média',
    overlay: false,
    inputs: [num('maLength', 'Período da média', 1, 1000)],
    defaults: { maLength: 20 },
    plots: [
      { key: 'vol', label: 'Volume', kind: 'columns', color: 'rgba(8,153,129,0.5)', colors: [{ label: 'Em baixa', color: 'rgba(242,54,69,0.5)' }], colorLabel: 'Em alta' },
      { key: 'volMa', label: 'Média do volume', color: '#2196f3', hidden: true },
    ],
    format: 'volume',
    warmup: (p) => len(p, 'maLength'),
    compute: (c) => {
      const vol = c.out('vol');
      const st = c.state('vol');
      each(c, vol, (i) => c.bars[i].volume);
      each(c, st, (i) => (c.bars[i].close < c.bars[i].open ? 1 : 0));
      ma(c, c.out('volMa'), at(vol), len(c.p, 'maLength'), 'sma');
    },
    title: () => 'Vol',
  },
  averageStudy('wma', 'Moving Average Weighted', 'WMA', 'Média móvel ponderada (WMA)', 9, (c, n) => ma(c, c.out('ma'), c.src(S(c.p, 'source')), n, 'wma'), (n) => n),
  averageStudy('vwma', 'Volume Weighted Moving Average', 'VWMA', 'Média móvel ponderada pelo volume (VWMA)', 20, (c, n) => ma(c, c.out('ma'), c.src(S(c.p, 'source')), n, 'vwma'), (n) => n),
  averageStudy(
    'hma',
    'Hull Moving Average',
    'HMA',
    'Média móvel de Hull (HMA)',
    9,
    (c, n) => {
      const s = c.src(S(c.p, 'source'));
      const half = c.tmp('half');
      const full = c.tmp('full');
      const raw = c.tmp('raw');
      ma(c, half, s, Math.max(1, Math.floor(n / 2)), 'wma');
      ma(c, full, s, n, 'wma');
      each(c, raw, (i) => 2 * half[i] - full[i]);
      ma(c, c.out('ma'), at(raw), Math.max(1, Math.floor(Math.sqrt(n))), 'wma');
    },
    (n) => n + Math.floor(Math.sqrt(n)),
  ),
  {
    type: 'bb',
    name: 'Bollinger Bands',
    short: 'BB',
    description: 'Bandas de Bollinger: média com bandas a N desvios-padrão',
    overlay: true,
    inputs: [num('length', 'Período', 1, 1000), maSelect('maType', 'Tipo de média base'), src(), num('mult', 'Desvio padrão', 0.001, 50, 0.1), num('offset', 'Deslocamento', -500, 500)],
    defaults: { length: 20, maType: 'sma', source: 'close', mult: 2, offset: 0 },
    plots: [
      { key: 'basis', label: 'Base', color: BLUE, offset: (p) => N(p, 'offset') },
      { key: 'upper', label: 'Superior', color: '#f23645', offset: (p) => N(p, 'offset') },
      { key: 'lower', label: 'Inferior', color: '#089981', offset: (p) => N(p, 'offset') },
    ],
    fills: [{ key: 'bg', label: 'Fundo', a: 'upper', b: 'lower', color: 'rgba(33,150,243,0.05)' }],
    warmup: (p) => maWarm(S(p, 'maType'), len(p, 'length')),
    compute: (c) => {
      const n = len(c.p, 'length');
      const s = c.src(S(c.p, 'source'));
      const basis = c.out('basis');
      ma(c, basis, s, n, S(c.p, 'maType'));
      const m = N(c.p, 'mult');
      each(c, c.out('upper'), (i) => basis[i] + m * stdevAt(s, i, n));
      each(c, c.out('lower'), (i) => basis[i] - m * stdevAt(s, i, n));
    },
  },
  {
    type: 'macd',
    name: 'MACD',
    short: 'MACD',
    description: 'Convergência e divergência de médias móveis (MACD), com histograma',
    overlay: false,
    inputs: [
      num('fast', 'Período rápido', 1, 1000),
      num('slow', 'Período lento', 1, 1000),
      src(),
      num('signal', 'Suavização do sinal', 1, 50),
      maSelect('oscMa', 'Tipo de MA do oscilador', ['sma', 'ema']),
      maSelect('sigMa', 'Tipo de MA da linha de sinal', ['sma', 'ema']),
    ],
    defaults: { fast: 12, slow: 26, source: 'close', signal: 9, oscMa: 'ema', sigMa: 'ema' },
    plots: [
      {
        key: 'hist',
        label: 'Histograma',
        kind: 'columns',
        color: '#26a69a',
        colorLabel: 'Crescente acima de zero',
        colors: [
          { label: 'Decrescente acima de zero', color: '#b2dfdb' },
          { label: 'Crescente abaixo de zero', color: '#ffcdd2' },
          { label: 'Decrescente abaixo de zero', color: '#ff5252' },
        ],
      },
      { key: 'macd', label: 'MACD', color: BLUE },
      { key: 'sig', label: 'Sinal', color: ORANGE },
    ],
    levels: zeroLevel(),
    warmup: (p) => maWarm(S(p, 'oscMa'), Math.max(len(p, 'fast'), len(p, 'slow'))) + maWarm(S(p, 'sigMa'), len(p, 'signal')),
    compute: (c) => {
      const s = c.src(S(c.p, 'source'));
      const fast = c.tmp('fast');
      const slow = c.tmp('slow');
      ma(c, fast, s, len(c.p, 'fast'), S(c.p, 'oscMa'));
      ma(c, slow, s, len(c.p, 'slow'), S(c.p, 'oscMa'));
      const macd = c.out('macd');
      each(c, macd, (i) => fast[i] - slow[i]);
      const sig = c.out('sig');
      ma(c, sig, at(macd), len(c.p, 'signal'), S(c.p, 'sigMa'));
      const hist = c.out('hist');
      each(c, hist, (i) => macd[i] - sig[i]);
      const st = c.state('hist');
      each(c, st, (i) => {
        const h = hist[i];
        const rising = i > 0 && hist[i - 1] < h;
        return h >= 0 ? (rising ? 0 : 1) : rising ? 2 : 3;
      });
    },
  },
  {
    type: 'stoch',
    name: 'Stochastic',
    short: 'Stoch',
    description: 'Oscilador estocástico (%K e %D)',
    overlay: false,
    inputs: [num('periodK', 'Período %K', 1, 1000), num('smoothK', 'Suavização %K', 1, 100), num('periodD', 'Suavização %D', 1, 100)],
    defaults: { periodK: 14, smoothK: 1, periodD: 3 },
    plots: [
      { key: 'k', label: '%K', color: BLUE },
      { key: 'd', label: '%D', color: ORANGE },
    ],
    levels: oscLevels(80, 50, 20),
    fills: oscFill(),
    format: 2,
    warmup: (p) => len(p, 'periodK') + len(p, 'smoothK') + len(p, 'periodD'),
    compute: (c) => {
      const n = len(c.p, 'periodK');
      const raw = c.tmp('raw');
      const b = c.bars;
      each(c, raw, (i) => {
        const hh = highest((k) => b[k].high, i, n);
        const ll = lowest((k) => b[k].low, i, n);
        return hh === ll ? NaN : (100 * (b[i].close - ll)) / (hh - ll);
      });
      const k = c.out('k');
      ma(c, k, at(raw), len(c.p, 'smoothK'), 'sma');
      ma(c, c.out('d'), at(k), len(c.p, 'periodD'), 'sma');
    },
  },
  {
    type: 'stochrsi',
    name: 'Stochastic RSI',
    short: 'Stoch RSI',
    description: 'Estocástico aplicado ao RSI',
    overlay: false,
    inputs: [num('smoothK', 'K', 1, 100), num('smoothD', 'D', 1, 100), num('lengthRsi', 'Período do RSI', 1, 1000), num('lengthStoch', 'Período do estocástico', 1, 1000), src('Fonte do RSI')],
    defaults: { smoothK: 3, smoothD: 3, lengthRsi: 14, lengthStoch: 14, source: 'close' },
    plots: [
      { key: 'k', label: 'K', color: BLUE },
      { key: 'd', label: 'D', color: ORANGE },
    ],
    levels: oscLevels(80, 50, 20),
    fills: oscFill(),
    format: 2,
    warmup: (p) => 10 * len(p, 'lengthRsi') + len(p, 'lengthStoch') + len(p, 'smoothK') + len(p, 'smoothD'),
    compute: (c) => {
      const rsi = c.tmp('rsi');
      rsiInto(rsi, c.tmp('gain'), c.tmp('loss'), c.src(S(c.p, 'source')), c.n, len(c.p, 'lengthRsi'), c.from);
      const n = len(c.p, 'lengthStoch');
      const raw = c.tmp('raw');
      each(c, raw, (i) => {
        const hh = highest(at(rsi), i, n);
        const ll = lowest(at(rsi), i, n);
        return hh === ll ? NaN : (100 * (rsi[i] - ll)) / (hh - ll);
      });
      const k = c.out('k');
      ma(c, k, at(raw), len(c.p, 'smoothK'), 'sma');
      ma(c, c.out('d'), at(k), len(c.p, 'smoothD'), 'sma');
    },
  },
  {
    type: 'atr',
    name: 'Average True Range',
    short: 'ATR',
    description: 'Amplitude média verdadeira (ATR), a volatilidade',
    overlay: false,
    inputs: [num('length', 'Período', 1, 1000), maSelect('smoothing', 'Suavização', ['rma', 'sma', 'ema', 'wma'])],
    defaults: { length: 14, smoothing: 'rma' },
    plots: [{ key: 'atr', label: 'ATR', color: '#b71c1c' }],
    warmup: (p) => maWarm(S(p, 'smoothing'), len(p, 'length')),
    compute: (c) => {
      const tr = c.tmp('tr');
      each(c, tr, (i) => trueRange(c.bars, i));
      ma(c, c.out('atr'), at(tr), len(c.p, 'length'), S(c.p, 'smoothing'));
    },
  },
  {
    type: 'vwap',
    name: 'Volume Weighted Average Price',
    short: 'VWAP',
    description: 'Preço médio ponderado pelo volume (VWAP) desde o início de cada período, com bandas',
    overlay: true,
    noTimeframe: true,
    inputs: [
      {
        key: 'anchor',
        label: 'Período de ancoragem',
        type: 'select',
        options: ['session', 'week', 'month', 'quarter', 'year'],
        optionLabels: { session: 'Sessão (dia)', week: 'Semana', month: 'Mês', quarter: 'Trimestre', year: 'Ano' },
      },
      src(),
      num('mult1', 'Multiplicador da banda #1', 0, 50, 0.1, 'Bandas (desvio padrão)'),
      num('mult2', 'Multiplicador da banda #2', 0, 50, 0.1, 'Bandas (desvio padrão)'),
      num('mult3', 'Multiplicador da banda #3', 0, 50, 0.1, 'Bandas (desvio padrão)'),
    ],
    defaults: { anchor: 'session', source: 'hlc3', mult1: 1, mult2: 2, mult3: 3 },
    plots: [
      { key: 'vwap', label: 'VWAP', color: BLUE },
      { key: 'up1', label: 'Banda superior #1', color: '#4caf50' },
      { key: 'lo1', label: 'Banda inferior #1', color: '#4caf50' },
      { key: 'up2', label: 'Banda superior #2', color: '#808000', hidden: true },
      { key: 'lo2', label: 'Banda inferior #2', color: '#808000', hidden: true },
      { key: 'up3', label: 'Banda superior #3', color: '#00897b', hidden: true },
      { key: 'lo3', label: 'Banda inferior #3', color: '#00897b', hidden: true },
    ],
    fills: [
      { key: 'fill1', label: 'Fundo das bandas #1', a: 'up1', b: 'lo1', color: 'rgba(76,175,80,0.1)' },
      { key: 'fill2', label: 'Fundo das bandas #2', a: 'up2', b: 'lo2', color: 'rgba(128,128,0,0.1)', hidden: true },
      { key: 'fill3', label: 'Fundo das bandas #3', a: 'up3', b: 'lo3', color: 'rgba(0,137,123,0.1)', hidden: true },
    ],
    // a whole period before the first bar shown would be needed; the chart's history is enough in practice
    warmup: () => 0,
    compute: (c) => {
      const s = c.src(S(c.p, 'source'));
      const pv = c.tmp('pv');
      const vv = c.tmp('v');
      const p2v = c.tmp('p2v');
      const anchor = S(c.p, 'anchor');
      const period = (t: number): number => anchorPeriod(t, anchor);
      const vwap = c.out('vwap');
      const bands = [1, 2, 3].map((k) => ({ up: c.out(`up${k}`), lo: c.out(`lo${k}`), m: N(c.p, `mult${k}`) }));
      for (let i = c.from; i < c.n; i++) {
        const x = s(i);
        const vol = c.bars[i].volume;
        const fresh = i === 0 || period(c.bars[i].time) !== period(c.bars[i - 1].time);
        pv[i] = (fresh ? 0 : pv[i - 1]) + x * vol;
        vv[i] = (fresh ? 0 : vv[i - 1]) + vol;
        p2v[i] = (fresh ? 0 : p2v[i - 1]) + x * x * vol;
        const w = vv[i] > 0 ? pv[i] / vv[i] : NaN;
        vwap[i] = w;
        const sd = vv[i] > 0 ? Math.sqrt(Math.max(0, p2v[i] / vv[i] - w * w)) : NaN;
        for (const b of bands) {
          b.up[i] = w + b.m * sd;
          b.lo[i] = w - b.m * sd;
        }
      }
    },
    title: (p) => `VWAP ${({ session: 'Sessão', week: 'Semana', month: 'Mês', quarter: 'Trimestre', year: 'Ano' } as Record<string, string>)[S(p, 'anchor')]} ${p.source}`,
  },
  {
    type: 'supertrend',
    name: 'Supertrend',
    short: 'Supertrend',
    description: 'Supertrend: tendência pela ATR, verde em alta e vermelho em baixa',
    overlay: true,
    inputs: [num('atrPeriod', 'Período da ATR', 1, 1000), num('factor', 'Fator', 0.01, 100, 0.01)],
    defaults: { atrPeriod: 10, factor: 3 },
    plots: [
      { key: 'up', label: 'Tendência de alta', color: '#089981' },
      { key: 'down', label: 'Tendência de baixa', color: '#f23645' },
      { key: 'mid', label: 'Meio do corpo', kind: 'none', color: GREY },
    ],
    fills: [
      { key: 'upFill', label: 'Fundo em alta', a: 'mid', b: 'up', color: 'rgba(8,153,129,0.1)' },
      { key: 'downFill', label: 'Fundo em baixa', a: 'down', b: 'mid', color: 'rgba(242,54,69,0.1)' },
    ],
    warmup: (p) => 10 * len(p, 'atrPeriod'),
    compute: (c) => {
      const b = c.bars;
      const tr = c.tmp('tr');
      const atr = c.tmp('atr');
      each(c, tr, (i) => trueRange(b, i));
      ma(c, atr, at(tr), len(c.p, 'atrPeriod'), 'rma');
      const ub = c.tmp('ub');
      const lb = c.tmp('lb');
      const st = c.tmp('st');
      const dir = c.tmp('dir');
      const f = N(c.p, 'factor');
      const up = c.out('up');
      const down = c.out('down');
      const mid = c.out('mid');
      for (let i = c.from; i < c.n; i++) {
        const hl2 = (b[i].high + b[i].low) / 2;
        let upper = hl2 + f * atr[i];
        let lower = hl2 - f * atr[i];
        const pl = i > 0 ? nz(lb[i - 1]) : 0;
        const pu = i > 0 ? nz(ub[i - 1]) : 0;
        const pc = i > 0 ? b[i - 1].close : NaN;
        lower = lower > pl || pc < pl ? lower : pl;
        upper = upper < pu || pc > pu ? upper : pu;
        let d: number;
        if (i === 0 || !isFinite(atr[i - 1])) d = 1;
        else if (st[i - 1] === pu) d = b[i].close > upper ? -1 : 1;
        else d = b[i].close < lower ? 1 : -1;
        ub[i] = upper;
        lb[i] = lower;
        dir[i] = d;
        st[i] = d === -1 ? lower : upper;
        const ok = isFinite(atr[i]);
        up[i] = ok && d < 0 ? st[i] : NaN;
        down[i] = ok && d > 0 ? st[i] : NaN;
        mid[i] = (b[i].open + b[i].close) / 2;
      }
    },
  },
  {
    type: 'sar',
    name: 'Parabolic SAR',
    short: 'SAR',
    description: 'SAR parabólico: pontos de paragem e reversão',
    overlay: true,
    inputs: [num('start', 'Início', 0.001, 1, 0.001), num('increment', 'Incremento', 0.001, 1, 0.001), num('maximum', 'Valor máximo', 0.001, 1, 0.01)],
    defaults: { start: 0.02, increment: 0.02, maximum: 0.2 },
    plots: [{ key: 'sar', label: 'SAR', kind: 'cross', color: BLUE }],
    warmup: () => 200,
    compute: (c) => computeSar(c),
  },
  {
    type: 'dmi',
    name: 'Directional Movement Index',
    short: 'DMI',
    description: 'Índice de movimento direcional: ADX, +DI e −DI',
    overlay: false,
    inputs: [num('adxSmoothing', 'Suavização do ADX', 1, 1000), num('diLength', 'Período DI', 1, 1000)],
    defaults: { adxSmoothing: 14, diLength: 14 },
    plots: [
      { key: 'adx', label: 'ADX', color: '#f50057' },
      { key: 'plus', label: '+DI', color: BLUE },
      { key: 'minus', label: '−DI', color: ORANGE },
    ],
    format: 2,
    warmup: (p) => 10 * (len(p, 'diLength') + len(p, 'adxSmoothing')),
    compute: (c) => {
      const b = c.bars;
      const n = len(c.p, 'diLength');
      const pdm = c.tmp('pdm');
      const mdm = c.tmp('mdm');
      const tr = c.tmp('tr');
      each(c, pdm, (i) => {
        if (i === 0) return NaN;
        const up = b[i].high - b[i - 1].high;
        const dn = b[i - 1].low - b[i].low;
        return up > dn && up > 0 ? up : 0;
      });
      each(c, mdm, (i) => {
        if (i === 0) return NaN;
        const up = b[i].high - b[i - 1].high;
        const dn = b[i - 1].low - b[i].low;
        return dn > up && dn > 0 ? dn : 0;
      });
      each(c, tr, (i) => trueRange(b, i, false));
      const trur = c.tmp('trur');
      const sp = c.tmp('sp');
      const sm = c.tmp('sm');
      ma(c, trur, at(tr), n, 'rma');
      ma(c, sp, at(pdm), n, 'rma');
      ma(c, sm, at(mdm), n, 'rma');
      const plus = c.out('plus');
      const minus = c.out('minus');
      each(c, plus, (i) => (100 * sp[i]) / trur[i]);
      each(c, minus, (i) => (100 * sm[i]) / trur[i]);
      const dx = c.tmp('dx');
      each(c, dx, (i) => {
        const s = plus[i] + minus[i];
        return Math.abs(plus[i] - minus[i]) / (s === 0 ? 1 : s);
      });
      const sdx = c.tmp('sdx');
      ma(c, sdx, at(dx), len(c.p, 'adxSmoothing'), 'rma');
      each(c, c.out('adx'), (i) => 100 * sdx[i]);
    },
  },
  {
    type: 'obv',
    name: 'On Balance Volume',
    short: 'OBV',
    description: 'Volume em balanço (OBV): volume acumulado a subir ou a descer',
    overlay: false,
    inputs: [],
    defaults: {},
    plots: [{ key: 'obv', label: 'OBV', color: BLUE }],
    format: 'volume',
    warmup: () => 0,
    compute: (c) => {
      const b = c.bars;
      const obv = c.out('obv');
      for (let i = c.from; i < c.n; i++) {
        if (i === 0) {
          obv[i] = 0;
          continue;
        }
        const d = Math.sign(b[i].close - b[i - 1].close);
        obv[i] = nz(obv[i - 1]) + d * b[i].volume;
      }
    },
  },
  {
    type: 'cci',
    name: 'Commodity Channel Index',
    short: 'CCI',
    description: 'Índice de canal de commodities (CCI)',
    overlay: false,
    inputs: [num('length', 'Período', 1, 1000), src()],
    defaults: { length: 20, source: 'hlc3' },
    plots: [{ key: 'cci', label: 'CCI', color: BLUE }],
    levels: oscLevels(100, 0, -100),
    fills: oscFill(),
    format: 2,
    warmup: (p) => 2 * len(p, 'length'),
    compute: (c) => {
      const n = len(c.p, 'length');
      const s = c.src(S(c.p, 'source'));
      each(c, c.out('cci'), (i) => {
        if (i - n + 1 < 0) return NaN;
        const mean = sum(s, i, n) / n;
        let dev = 0;
        for (let k = i - n + 1; k <= i; k++) dev += Math.abs(s(k) - mean);
        dev /= n;
        return dev === 0 ? 0 : (s(i) - mean) / (0.015 * dev);
      });
    },
  },
  {
    type: 'willr',
    name: 'Williams %R',
    short: '%R',
    description: 'Williams %R: onde está o fecho entre a máxima e a mínima do período',
    overlay: false,
    inputs: [num('length', 'Período', 1, 1000), src()],
    defaults: { length: 14, source: 'close' },
    plots: [{ key: 'r', label: '%R', color: PURPLE }],
    levels: oscLevels(-20, -50, -80),
    fills: oscFill('rgba(126,87,194,0.1)'),
    format: 2,
    warmup: (p) => len(p, 'length'),
    compute: (c) => {
      const n = len(c.p, 'length');
      const b = c.bars;
      const s = c.src(S(c.p, 'source'));
      each(c, c.out('r'), (i) => {
        const hh = highest((k) => b[k].high, i, n);
        const ll = lowest((k) => b[k].low, i, n);
        return hh === ll ? NaN : (100 * (s(i) - hh)) / (hh - ll);
      });
    },
  },
  {
    type: 'mfi',
    name: 'Money Flow Index',
    short: 'MFI',
    description: 'Índice de fluxo de dinheiro (MFI): um RSI com volume',
    overlay: false,
    inputs: [num('length', 'Período', 1, 1000)],
    defaults: { length: 14 },
    plots: [{ key: 'mfi', label: 'MF', color: PURPLE }],
    levels: oscLevels(80, 50, 20),
    fills: oscFill('rgba(126,87,194,0.1)'),
    format: 2,
    warmup: (p) => len(p, 'length') + 1,
    compute: (c) => {
      const n = len(c.p, 'length');
      const b = c.bars;
      const tp = (i: number): number => (b[i].high + b[i].low + b[i].close) / 3;
      const pos = c.tmp('pos');
      const neg = c.tmp('neg');
      each(c, pos, (i) => (i === 0 ? NaN : tp(i) - tp(i - 1) <= 0 ? 0 : b[i].volume * tp(i)));
      each(c, neg, (i) => (i === 0 ? NaN : tp(i) - tp(i - 1) >= 0 ? 0 : b[i].volume * tp(i)));
      each(c, c.out('mfi'), (i) => {
        const up = sum(at(pos), i, n);
        const dn = sum(at(neg), i, n);
        if (!isFinite(up) || !isFinite(dn)) return NaN;
        return dn === 0 ? 100 : 100 - 100 / (1 + up / dn);
      });
    },
  },
  {
    type: 'mom',
    name: 'Momentum',
    short: 'Mom',
    description: 'Momento: a diferença para o valor de N velas antes',
    overlay: false,
    inputs: [num('length', 'Período', 1, 1000), src()],
    defaults: { length: 10, source: 'close' },
    plots: [{ key: 'mom', label: 'Mom', color: BLUE }],
    levels: [{ ...zeroLevel()[0], hidden: true }],
    warmup: (p) => len(p, 'length'),
    compute: (c) => {
      const n = len(c.p, 'length');
      const s = c.src(S(c.p, 'source'));
      each(c, c.out('mom'), (i) => (i - n < 0 ? NaN : s(i) - s(i - n)));
    },
  },
  {
    type: 'roc',
    name: 'Rate Of Change',
    short: 'ROC',
    description: 'Taxa de variação (ROC), em percentagem',
    overlay: false,
    inputs: [num('length', 'Período', 1, 1000), src()],
    defaults: { length: 9, source: 'close' },
    plots: [{ key: 'roc', label: 'ROC', color: BLUE }],
    levels: zeroLevel(),
    format: 2,
    warmup: (p) => len(p, 'length'),
    compute: (c) => {
      const n = len(c.p, 'length');
      const s = c.src(S(c.p, 'source'));
      each(c, c.out('roc'), (i) => (i - n < 0 || s(i - n) === 0 ? NaN : (100 * (s(i) - s(i - n))) / s(i - n)));
    },
  },
  {
    type: 'ao',
    name: 'Awesome Oscillator',
    short: 'AO',
    description: 'Awesome Oscillator: média de 5 menos a de 34 do ponto médio',
    overlay: false,
    inputs: [],
    defaults: {},
    plots: [{ key: 'ao', label: 'Histograma', kind: 'columns', color: '#009688', colorLabel: 'Crescente', colors: [{ label: 'Decrescente', color: '#f44336' }] }],
    warmup: () => 34,
    compute: (c) => {
      const s = c.src('hl2');
      const a = c.tmp('a');
      const b = c.tmp('b');
      ma(c, a, s, 5, 'sma');
      ma(c, b, s, 34, 'sma');
      const ao = c.out('ao');
      each(c, ao, (i) => a[i] - b[i]);
      each(c, c.state('ao'), (i) => (i > 0 && ao[i] - ao[i - 1] > 0 ? 0 : 1));
    },
  },
  {
    type: 'cmf',
    name: 'Chaikin Money Flow',
    short: 'CMF',
    description: 'Fluxo de dinheiro de Chaikin (CMF)',
    overlay: false,
    inputs: [num('length', 'Período', 1, 1000)],
    defaults: { length: 20 },
    plots: [{ key: 'cmf', label: 'CMF', color: '#43a047' }],
    levels: zeroLevel(),
    format: 3,
    warmup: (p) => len(p, 'length'),
    compute: (c) => {
      const n = len(c.p, 'length');
      const b = c.bars;
      const ad = c.tmp('ad');
      each(c, ad, (i) => {
        const x = b[i];
        return (x.close === x.high && x.close === x.low) || x.high === x.low ? 0 : ((2 * x.close - x.low - x.high) / (x.high - x.low)) * x.volume;
      });
      each(c, c.out('cmf'), (i) => {
        const v = sum((k) => b[k].volume, i, n);
        return v ? sum(at(ad), i, n) / v : NaN;
      });
    },
  },
  {
    type: 'aroon',
    name: 'Aroon',
    short: 'Aroon',
    description: 'Aroon: há quantas velas foi a máxima e a mínima do período',
    overlay: false,
    inputs: [num('length', 'Período', 1, 1000)],
    defaults: { length: 14 },
    plots: [
      { key: 'up', label: 'Aroon Up', color: ORANGE },
      { key: 'down', label: 'Aroon Down', color: BLUE },
    ],
    format: 2,
    warmup: (p) => len(p, 'length') + 1,
    compute: (c) => {
      const n = len(c.p, 'length');
      each(c, c.out('up'), (i) => (100 * (barsSince(c.bars, i, n + 1, true) + n)) / n);
      each(c, c.out('down'), (i) => (100 * (barsSince(c.bars, i, n + 1, false) + n)) / n);
    },
  },
  {
    type: 'kc',
    name: 'Keltner Channels',
    short: 'KC',
    description: 'Canais de Keltner: média com bandas pela ATR',
    overlay: true,
    inputs: [
      num('length', 'Período', 1, 1000),
      num('mult', 'Multiplicador', 0.001, 50, 0.1),
      src(),
      { key: 'useEma', label: 'Usar média exponencial', type: 'bool' },
      {
        key: 'bandsStyle',
        label: 'Estilo das bandas',
        type: 'select',
        options: ['atr', 'tr', 'range'],
        optionLabels: { atr: 'Amplitude média verdadeira', tr: 'Amplitude verdadeira', range: 'Amplitude' },
      },
      num('atrLength', 'Período da ATR', 1, 1000),
    ],
    defaults: { length: 20, mult: 2, source: 'close', useEma: true, bandsStyle: 'atr', atrLength: 10 },
    plots: [
      { key: 'upper', label: 'Superior', color: BLUE },
      { key: 'basis', label: 'Base', color: BLUE },
      { key: 'lower', label: 'Inferior', color: BLUE },
    ],
    fills: [{ key: 'bg', label: 'Fundo', a: 'upper', b: 'lower', color: 'rgba(33,150,243,0.05)' }],
    warmup: (p) => 10 * Math.max(len(p, 'length'), len(p, 'atrLength')),
    compute: (c) => {
      const b = c.bars;
      const n = len(c.p, 'length');
      const basis = c.out('basis');
      ma(c, basis, c.src(S(c.p, 'source')), n, c.p.useEma ? 'ema' : 'sma');
      const tr = c.tmp('tr');
      each(c, tr, (i) => trueRange(b, i));
      const range = c.tmp('range');
      const style = S(c.p, 'bandsStyle');
      if (style === 'tr') each(c, range, (i) => tr[i]);
      else if (style === 'atr') ma(c, range, at(tr), len(c.p, 'atrLength'), 'rma');
      else ma(c, range, (i) => b[i].high - b[i].low, n, 'rma');
      const m = N(c.p, 'mult');
      each(c, c.out('upper'), (i) => basis[i] + m * range[i]);
      each(c, c.out('lower'), (i) => basis[i] - m * range[i]);
    },
    title: (p) => `KC ${len(p, 'length')} ${N(p, 'mult')} ${p.source} ${p.useEma ? 'EMA' : 'SMA'}`,
  },
  {
    type: 'dc',
    name: 'Donchian Channels',
    short: 'DC',
    description: 'Canais de Donchian: máxima e mínima do período',
    overlay: true,
    inputs: [num('length', 'Período', 1, 1000), num('offset', 'Deslocamento', -500, 500)],
    defaults: { length: 20, offset: 0 },
    plots: [
      { key: 'basis', label: 'Base', color: ORANGE, offset: (p) => N(p, 'offset') },
      { key: 'upper', label: 'Superior', color: BLUE, offset: (p) => N(p, 'offset') },
      { key: 'lower', label: 'Inferior', color: BLUE, offset: (p) => N(p, 'offset') },
    ],
    fills: [{ key: 'bg', label: 'Fundo', a: 'upper', b: 'lower', color: 'rgba(33,150,243,0.05)' }],
    warmup: (p) => len(p, 'length'),
    compute: (c) => {
      const n = len(c.p, 'length');
      const b = c.bars;
      const up = c.out('upper');
      const lo = c.out('lower');
      each(c, up, (i) => highest((k) => b[k].high, i, n));
      each(c, lo, (i) => lowest((k) => b[k].low, i, n));
      each(c, c.out('basis'), (i) => (up[i] + lo[i]) / 2);
    },
  },
  {
    type: 'ichimoku',
    name: 'Ichimoku Cloud',
    short: 'Ichimoku',
    description: 'Nuvem de Ichimoku: conversão, base, linha atrasada e a nuvem à frente',
    overlay: true,
    inputs: [num('conversion', 'Período da linha de conversão', 1, 1000), num('base', 'Período da linha base', 1, 1000), num('span2', 'Período do Leading Span B', 1, 1000), num('displacement', 'Deslocamento', 1, 1000)],
    defaults: { conversion: 9, base: 26, span2: 52, displacement: 26 },
    plots: [
      { key: 'conv', label: 'Linha de conversão', color: BLUE },
      { key: 'basel', label: 'Linha base', color: '#b71c1c' },
      { key: 'lag', label: 'Linha atrasada', color: '#43a047', offset: (p) => 1 - len(p, 'displacement') },
      { key: 'leadA', label: 'Leading Span A', color: '#a5d6a7', offset: (p) => len(p, 'displacement') - 1 },
      { key: 'leadB', label: 'Leading Span B', color: '#ef9a9a', offset: (p) => len(p, 'displacement') - 1 },
    ],
    fills: [{ key: 'cloud', label: 'Nuvem', a: 'leadA', b: 'leadB', color: 'rgba(67,160,71,0.1)', colorDown: 'rgba(244,67,54,0.1)' }],
    warmup: (p) => Math.max(len(p, 'span2'), len(p, 'base')) + len(p, 'displacement'),
    compute: (c) => {
      const b = c.bars;
      const mid = (i: number, n: number): number => (highest((k) => b[k].high, i, n) + lowest((k) => b[k].low, i, n)) / 2;
      const conv = c.out('conv');
      const base = c.out('basel');
      each(c, conv, (i) => mid(i, len(c.p, 'conversion')));
      each(c, base, (i) => mid(i, len(c.p, 'base')));
      each(c, c.out('lag'), (i) => b[i].close);
      each(c, c.out('leadA'), (i) => (conv[i] + base[i]) / 2);
      each(c, c.out('leadB'), (i) => mid(i, len(c.p, 'span2')));
    },
  },
];

/** The quarter, month… a bar's time (s, UTC) is in, for the VWAP's anchor. */
export function anchorPeriod(t: number, anchor: string): number {
  const day = Math.floor(t / 86400);
  if (anchor === 'session') return day;
  // 1970-01-01 was a Thursday: +3 makes the weeks start on Monday
  if (anchor === 'week') return Math.floor((day + 3) / 7);
  const d = new Date(t * 1000);
  const y = d.getUTCFullYear();
  const m = d.getUTCMonth();
  if (anchor === 'month') return y * 12 + m;
  if (anchor === 'quarter') return y * 4 + Math.floor(m / 3);
  return y;
}

/** Parabolic SAR as Pine's `ta.sar`, carrying its state (trend, extreme point, acceleration) bar by bar. */
function computeSar(c: StudyContext): void {
  const b = c.bars;
  const start = N(c.p, 'start');
  const inc = N(c.p, 'increment');
  const max = N(c.p, 'maximum');
  const out = c.out('sar');
  const mmA = c.tmp('mm');
  const accA = c.tmp('acc');
  const belowA = c.tmp('below');
  for (let i = Math.max(c.from, 0); i < c.n; i++) {
    if (i === 0) {
      out[0] = mmA[0] = accA[0] = belowA[0] = NaN;
      continue;
    }
    let result: number;
    let maxMin: number;
    let acc: number;
    let below: boolean;
    let first = false;
    if (i === 1) {
      below = b[1].close > b[0].close;
      maxMin = below ? b[1].high : b[1].low;
      result = below ? b[0].low : b[0].high;
      first = true;
      acc = start;
    } else {
      result = out[i - 1];
      maxMin = mmA[i - 1];
      acc = accA[i - 1];
      below = belowA[i - 1] === 1;
    }
    result = result + acc * (maxMin - result);
    if (below) {
      if (result > b[i].low) {
        first = true;
        below = false;
        result = Math.max(b[i].high, maxMin);
        maxMin = b[i].low;
        acc = start;
      }
    } else if (result < b[i].high) {
      first = true;
      below = true;
      result = Math.min(b[i].low, maxMin);
      maxMin = b[i].high;
      acc = start;
    }
    if (!first) {
      if (below) {
        if (b[i].high > maxMin) {
          maxMin = b[i].high;
          acc = Math.min(acc + inc, max);
        }
      } else if (b[i].low < maxMin) {
        maxMin = b[i].low;
        acc = Math.min(acc + inc, max);
      }
    }
    if (below) {
      result = Math.min(result, b[i - 1].low);
      if (i > 1) result = Math.min(result, b[i - 2].low);
    } else {
      result = Math.max(result, b[i - 1].high);
      if (i > 1) result = Math.max(result, b[i - 2].high);
    }
    out[i] = result;
    mmA[i] = maxMin;
    accA[i] = acc;
    belowA[i] = below ? 1 : 0;
  }
}

/** The entry of the indicator list for a study. */
export const studyEntry = (def: StudyDef) => ({ type: def.type, name: def.name, description: def.description, create: (p?: Params) => new Study(def, p) });
