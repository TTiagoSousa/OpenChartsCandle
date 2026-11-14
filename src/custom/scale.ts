/** Axis scales of the custom family: value, log, category and time (ms). Pure, no DOM. */
import { formatCompact, niceScale, niceStep } from '../shared/format';
import type { CustomAxis, CustomAxisType } from './types';

export interface CustomTick {
  value: number;
  label: string;
  /** a "bigger" boundary (new day, month, year) */
  major?: boolean;
}

export interface CustomScale {
  type: CustomAxisType;
  /** Domain in numbers (category: index space, time: ms) */
  min: number;
  max: number;
  /** Full domain without zoom */
  fullMin: number;
  fullMax: number;
  /** px of min → px of max (already swapped when inverse) */
  range: [number, number];
  categories: string[];
  /** Raw value → number (category index, time ms) */
  toNumber(v: unknown): number;
  /** Raw value → px */
  map(v: unknown): number;
  /** Number → px */
  mapNum(n: number): number;
  /** px → number */
  invert(px: number): number;
  /** px of one category band (0 for other axes) */
  band(): number;
  ticks(count?: number): CustomTick[];
  /** Label of a number (category name, date, compact value) */
  label(n: number): string;
}

const MONTHS = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
const pad = (n: number): string => (n < 10 ? '0' : '') + n;

/** Dates: numbers (ms), Date objects or strings ('2024-03-05', '2024-03-05 14:30' as local time). */
export function customTimeValue(v: unknown): number {
  if (typeof v === 'number') return v;
  if (v instanceof Date) return v.getTime();
  if (typeof v === 'string') {
    const m = v.match(/^(\d{4})-(\d{1,2})-(\d{1,2})(?:[ T](\d{1,2}):(\d{2})(?::(\d{2}))?)?$/);
    if (m) return new Date(+m[1], +m[2] - 1, +m[3], +(m[4] ?? 0), +(m[5] ?? 0), +(m[6] ?? 0)).getTime();
    const t = Date.parse(v);
    return Number.isNaN(t) ? NaN : t;
  }
  return NaN;
}

const MS = [1, 2, 5, 10, 20, 50, 100, 200, 500, 1e3, 2e3, 5e3, 1e4, 15e3, 3e4, 6e4, 12e4, 3e5, 6e5, 9e5, 18e5, 36e5, 72e5, 108e5, 216e5, 432e5, 864e5, 1728e5, 6048e5];

/** Time ticks for a range in ms (local time), labels adapted to the interval. */
export function customTimeTicks(min: number, max: number, maxTicks: number): CustomTick[] {
  const range = max - min;
  if (!(range > 0)) return [{ value: min, label: formatTimeLabel(min, 6e4) }];
  const target = range / Math.max(1, maxTicks);
  const step = MS.find((s) => s >= target);
  const out: CustomTick[] = [];
  if (step) {
    const d0 = new Date(min);
    let t: number;
    if (step >= 864e5) {
      t = new Date(d0.getFullYear(), d0.getMonth(), d0.getDate()).getTime();
      while (t < min) t += step;
    } else {
      const offset = -d0.getTimezoneOffset() * 6e4;
      t = Math.ceil((min + offset) / step) * step - offset;
    }
    let prevDay = -1;
    for (; t <= max + 1e-6 && out.length < 400; t += step) {
      const d = new Date(t);
      const day = d.getDate();
      const midnight = d.getHours() === 0 && d.getMinutes() === 0 && d.getSeconds() === 0 && d.getMilliseconds() === 0;
      const newDay = prevDay !== -1 && day !== prevDay;
      prevDay = day;
      out.push({ value: t, label: step >= 864e5 || (midnight && step >= 36e5) ? `${day} ${MONTHS[d.getMonth()]}` : formatTimeLabel(t, step), major: newDay || midnight });
    }
    return out;
  }
  const months = range / (30.44 * 864e5);
  const mStep = [1, 2, 3, 6].find((m) => months / m <= maxTicks);
  const d = new Date(min);
  if (mStep) {
    let y = d.getFullYear();
    let m = Math.ceil((d.getMonth() + (d.getDate() > 1 || d.getHours() > 0 ? 1 : 0)) / mStep) * mStep;
    while (out.length < 400) {
      const t = new Date(y, m, 1).getTime();
      if (t > max) break;
      const dt = new Date(t);
      if (t >= min) out.push({ value: t, label: dt.getMonth() === 0 ? String(dt.getFullYear()) : MONTHS[dt.getMonth()], major: dt.getMonth() === 0 });
      m += mStep;
      if (m >= 12) {
        y += Math.floor(m / 12);
        m %= 12;
      }
    }
    return out;
  }
  const yStep = Math.max(1, niceStep(months / 12 / maxTicks));
  for (let y = Math.ceil(d.getFullYear() / yStep) * yStep; out.length < 400; y += yStep) {
    const t = new Date(y, 0, 1).getTime();
    if (t > max) break;
    if (t >= min) out.push({ value: t, label: String(y), major: true });
  }
  return out;
}

function formatTimeLabel(t: number, step: number): string {
  const d = new Date(t);
  if (step < 1000) return `${pad(d.getMinutes())}:${pad(d.getSeconds())}.${String(d.getMilliseconds()).padStart(3, '0')}`;
  if (step < 6e4) return `${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
  return `${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

/** Full date (and time when it is not midnight) for tooltips. */
export function customFormatDate(t: number): string {
  const d = new Date(t);
  const date = `${d.getDate()} ${MONTHS[d.getMonth()]} ${d.getFullYear()}`;
  if (d.getHours() === 0 && d.getMinutes() === 0 && d.getSeconds() === 0) return date;
  return `${date}, ${pad(d.getHours())}:${pad(d.getMinutes())}${d.getSeconds() ? ':' + pad(d.getSeconds()) : ''}`;
}

/** Guess the axis type from raw values. */
export function customAxisType(values: unknown[], fallback: CustomAxisType = 'value'): CustomAxisType {
  for (const v of values) {
    if (v instanceof Date) return 'time';
    if (typeof v === 'string') return customTimeValue(v) === customTimeValue(v) && /^\d{4}-\d/.test(v) ? 'time' : 'category';
  }
  return fallback;
}

/**
 * A scale for an axis. `values` are the raw values of the data along it (for the range and the categories);
 * `range` the px of the start and the end; `view` a zoomed domain (numbers).
 */
export function customScale(axis: CustomAxis, values: unknown[], range: [number, number], view?: [number, number] | null, defaultTicks = 5): CustomScale {
  const type: CustomAxisType = axis.type ?? (axis.data ? 'category' : customAxisType(values));
  const r: [number, number] = axis.inverse ? [range[1], range[0]] : [range[0], range[1]];
  let categories: string[] = [];
  let toNumber: (v: unknown) => number;
  let min: number;
  let max: number;
  let niceTicks: number[] | null = null;
  const splits = axis.splitNumber ?? defaultTicks;

  if (type === 'category') {
    categories = axis.data ? [...axis.data] : [];
    if (!axis.data) for (const v of values) if (v !== null && v !== undefined && typeof v !== 'number' && !categories.includes(String(v))) categories.push(String(v));
    if (!axis.data && !categories.length) {
      // numbers on a category axis without names: indices
      const n = Math.max(0, ...values.filter((v): v is number => typeof v === 'number').map((v) => Math.floor(v))) + 1;
      categories = Array.from({ length: n }, (_, i) => String(i));
    }
    toNumber = (v) => (typeof v === 'number' ? v : categories.indexOf(String(v)));
    const n = Math.max(1, categories.length);
    const gap = axis.boundaryGap ?? true;
    min = gap || n === 1 ? -0.5 : 0;
    max = gap || n === 1 ? n - 0.5 : n - 1;
  } else {
    toNumber = type === 'time' ? customTimeValue : (v) => (typeof v === 'number' ? v : v === null || v === undefined || v === '' ? NaN : Number(v));
    const nums = values.map(toNumber).filter((v) => Number.isFinite(v) && (type !== 'log' || v > 0));
    let lo = nums.length ? Math.min(...nums) : type === 'log' ? 1 : 0;
    let hi = nums.length ? Math.max(...nums) : type === 'log' ? 10 : 1;
    const ext = { min: lo, max: hi };
    const fixedMin = typeof axis.min === 'number' ? axis.min : typeof axis.min === 'function' ? axis.min(ext) : null;
    const fixedMax = typeof axis.max === 'number' ? axis.max : typeof axis.max === 'function' ? axis.max(ext) : null;
    if (type === 'value' && (axis.beginAtZero ?? true) && fixedMin === null && axis.min !== 'dataMin') {
      lo = Math.min(lo, 0);
      hi = Math.max(hi, 0);
    }
    if (type === 'log') {
      const b = axis.logBase ?? 10;
      const L = Math.log(b);
      lo = fixedMin ?? (axis.min === 'dataMin' ? lo : b ** Math.floor(Math.log(lo) / L + 1e-9));
      hi = fixedMax ?? (axis.max === 'dataMax' ? hi : b ** Math.ceil(Math.log(hi) / L - 1e-9));
      if (hi <= lo) hi = lo * b;
    } else if (type === 'time') {
      lo = fixedMin ?? lo;
      hi = fixedMax ?? hi;
      if (hi <= lo) {
        lo -= 864e5 / 2;
        hi += 864e5 / 2;
      }
    } else {
      if (axis.interval && axis.interval > 0) {
        const s = axis.interval;
        const a = fixedMin ?? (axis.min === 'dataMin' ? lo : Math.floor(lo / s + 1e-9) * s);
        const b = fixedMax ?? (axis.max === 'dataMax' ? hi : Math.ceil(hi / s - 1e-9) * s);
        lo = a;
        hi = b > a ? b : a + s;
        niceTicks = [];
        for (let v = Math.ceil(lo / s - 1e-9) * s; v <= hi + s * 1e-6 && niceTicks.length < 500; v += s) niceTicks.push(+v.toPrecision(12));
      } else {
        const ns = niceScale(fixedMin ?? lo, fixedMax ?? hi, splits);
        lo = fixedMin ?? (axis.min === 'dataMin' ? lo : ns.min);
        hi = fixedMax ?? (axis.max === 'dataMax' ? hi : ns.max);
        if (hi <= lo) {
          const d = Math.abs(lo) * 0.1 || 1;
          lo -= d;
          hi += d;
        }
        niceTicks = ns.ticks.filter((t) => t >= lo - 1e-9 && t <= hi + 1e-9);
      }
    }
    min = lo;
    max = hi;
  }

  const fullMin = min;
  const fullMax = max;
  if (view) [min, max] = view;
  const isLog = type === 'log';
  const L = Math.log(axis.logBase ?? 10);
  const f = (n: number): number => (isLog ? Math.log(Math.max(n, 1e-300)) / L : n);
  const fMin = (): number => f(min);
  const fSpan = (): number => f(max) - f(min) || 1;
  const mapNum = (n: number): number => r[0] + ((f(n) - fMin()) / fSpan()) * (r[1] - r[0]);
  const invert = (px: number): number => {
    const t = fMin() + ((px - r[0]) / (r[1] - r[0] || 1)) * fSpan();
    return isLog ? Math.exp(t * L) : t;
  };
  const label = (n: number): string => {
    if (axis.format) return axis.format(n, type === 'category' ? categories[Math.round(n)] : undefined);
    if (type === 'category') return categories[Math.round(n)] ?? '';
    if (type === 'time') return customFormatDate(n);
    return formatCompact(n);
  };
  const ticks = (count = splits): CustomTick[] => {
    if (type === 'category') {
      const out: CustomTick[] = [];
      for (let i = Math.max(0, Math.ceil(min - 1e-9)); i <= Math.min(categories.length - 1, Math.floor(max + 1e-9)); i++) out.push({ value: i, label: label(i) });
      return out;
    }
    if (type === 'time') {
      const t = customTimeTicks(min, max, count);
      return axis.format ? t.map((k) => ({ ...k, label: axis.format!(k.value) })) : t;
    }
    if (type === 'log') {
      const b = axis.logBase ?? 10;
      const out: CustomTick[] = [];
      const e0 = Math.floor(Math.log(min) / L + 1e-9);
      const e1 = Math.ceil(Math.log(max) / L - 1e-9);
      const every = Math.max(1, Math.ceil((e1 - e0) / Math.max(1, count + 2)));
      for (let e = e0; e <= e1; e += every) {
        const v = b ** e;
        if (v >= min * (1 - 1e-9) && v <= max * (1 + 1e-9)) out.push({ value: v, label: label(v) });
      }
      return out;
    }
    if (niceTicks && !view && count === splits) return niceTicks.map((v) => ({ value: v, label: label(v) }));
    const ns = niceScale(min, max, count);
    return ns.ticks.filter((t) => t >= min - 1e-9 && t <= max + 1e-9).map((v) => ({ value: v, label: label(v) }));
  };
  return {
    type,
    get min() {
      return min;
    },
    get max() {
      return max;
    },
    fullMin,
    fullMax,
    range: r,
    categories,
    toNumber,
    map: (v) => mapNum(toNumber(v)),
    mapNum,
    invert,
    band: () => (type === 'category' ? Math.abs(mapNum(1) - mapNum(0)) : 0),
    ticks,
    label,
  };
}
