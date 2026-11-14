/** Pure helpers of the line family: ticks, time intervals, curves, lookups. Testable without DOM. */
import { monotoneTangents } from '../shared/curve';
import { formatCompact, niceScale, niceStep } from '../shared/format';

export { formatCompact, monotoneTangents, niceScale, niceStep };

const MONTHS = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
const pad = (n: number): string => (n < 10 ? '0' : '') + n;

const SEC = [1, 5, 15, 30, 60, 300, 900, 1800, 3600, 7200, 10800, 21600, 43200, 86400, 172800, 604800];
const MONTH_STEPS = [1, 2, 3, 6];

export interface Tick {
  value: number;
  label: string;
  /** true for "bigger" boundaries (new day, month, year) */
  major?: boolean;
}

/** Time ticks for a range in seconds, local time, with labels adapted to the interval. */
export function timeTicks(min: number, max: number, maxTicks: number): Tick[] {
  const range = max - min;
  if (!(range > 0)) return [{ value: min, label: formatTime(min, 60) }];
  const target = range / Math.max(1, maxTicks);
  const step = SEC.find((s) => s >= target);
  const out: Tick[] = [];
  if (step) {
    const d0 = new Date(min * 1000);
    let t: number;
    if (step >= 86400) {
      // align to local midnight
      t = new Date(d0.getFullYear(), d0.getMonth(), d0.getDate()).getTime() / 1000;
      while (t < min) t += step;
    } else {
      const offset = -d0.getTimezoneOffset() * 60;
      t = Math.ceil((min + offset) / step) * step - offset;
    }
    let prevDay = -1;
    for (; t <= max && out.length < 200; t += step) {
      const d = new Date(t * 1000);
      const day = d.getDate();
      const newDay = prevDay !== -1 && day !== prevDay;
      prevDay = day;
      const atMidnight = d.getHours() === 0 && d.getMinutes() === 0 && d.getSeconds() === 0;
      out.push({
        value: t,
        label: step >= 86400 || (atMidnight && step >= 3600) ? `${day} ${MONTHS[d.getMonth()]}` : formatTime(t, step),
        major: newDay || atMidnight,
      });
    }
    return out;
  }
  // months / years: calendar stepping
  const months = range / (30.44 * 86400);
  const mStep = MONTH_STEPS.find((m) => months / m <= maxTicks);
  const d = new Date(min * 1000);
  if (mStep) {
    let y = d.getFullYear();
    let m = Math.ceil((d.getMonth() + (d.getDate() > 1 ? 1 : 0)) / mStep) * mStep;
    while (out.length < 200) {
      const t = new Date(y, m, 1).getTime() / 1000;
      if (t > max) break;
      const dt = new Date(t * 1000);
      if (t >= min) out.push({ value: t, label: dt.getMonth() === 0 ? String(dt.getFullYear()) : `${MONTHS[dt.getMonth()]} ${String(dt.getFullYear()).slice(2)}`, major: dt.getMonth() === 0 });
      m += mStep;
      if (m >= 12) {
        y += Math.floor(m / 12);
        m %= 12;
      }
    }
    return out;
  }
  const years = months / 12;
  const yStep = niceStep(years / maxTicks);
  for (let y = Math.ceil(d.getFullYear() / yStep) * yStep; out.length < 200; y += yStep) {
    const t = new Date(y, 0, 1).getTime() / 1000;
    if (t > max) break;
    if (t >= min) out.push({ value: t, label: String(y), major: true });
  }
  return out;
}

export function formatTime(t: number, step: number): string {
  const d = new Date(t * 1000);
  if (step < 60) return `${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
  if (step < 86400) return `${pad(d.getHours())}:${pad(d.getMinutes())}`;
  return `${d.getDate()} ${MONTHS[d.getMonth()]} ${d.getFullYear()}`;
}

/** Full date/time for tooltips, precision chosen from the data spacing. */
export function formatTooltipTime(t: number, spacing: number): string {
  const d = new Date(t * 1000);
  const date = `${d.getDate()} ${MONTHS[d.getMonth()]} ${d.getFullYear()}`;
  if (spacing >= 86400) return date;
  if (spacing >= 60) return `${date}, ${pad(d.getHours())}:${pad(d.getMinutes())}`;
  return `${date}, ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
}

/** Index of the item whose value is closest to `v` in a sorted array. */
export function nearestIndex(sorted: number[], v: number): number {
  if (!sorted.length) return -1;
  let lo = 0;
  let hi = sorted.length - 1;
  while (hi - lo > 1) {
    const mid = (lo + hi) >> 1;
    if (sorted[mid] <= v) lo = mid;
    else hi = mid;
  }
  return Math.abs(sorted[lo] - v) <= Math.abs(sorted[hi] - v) ? lo : hi;
}

/** Decide the x type from the raw values. */
export function detectXType(values: (number | string)[]): 'time' | 'category' | 'number' {
  if (values.some((v) => typeof v === 'string')) return 'category';
  const nums = values as number[];
  return nums.length && nums.every((v) => v > 1e9) ? 'time' : 'number';
}
