import type { SeriesData } from './data';
import type { PriceScale, TimeScale } from './scales';
import { TimeZone, barDate } from './timezone';
import { MONTHS, niceStep, pad2 } from './utils';

export interface TimeTick {
  x: number;
  label: string;
  weight: number;
}

function tickWeight(d: Date, p: Date): number {
  if (d.getUTCFullYear() !== p.getUTCFullYear()) return 9;
  if (d.getUTCMonth() !== p.getUTCMonth()) return 8;
  if (d.getUTCDate() !== p.getUTCDate()) return 7;
  const h = d.getUTCHours();
  if (h !== p.getUTCHours()) {
    if (h % 12 === 0) return 6;
    if (h % 6 === 0) return 5.5;
    if (h % 3 === 0) return 5;
    return 4.5;
  }
  const m = d.getUTCMinutes();
  if (m % 30 === 0) return 4;
  if (m % 15 === 0) return 3.5;
  if (m % 5 === 0) return 3;
  return 2;
}

function tickLabel(d: Date, weight: number): string {
  if (weight >= 9) return String(d.getUTCFullYear());
  if (weight >= 8) return MONTHS[d.getUTCMonth()];
  if (weight >= 7) return String(d.getUTCDate());
  return `${pad2(d.getUTCHours())}:${pad2(d.getUTCMinutes())}`;
}

/**
 * Choose time-axis marks greedily by importance, keeping a minimum pixel spacing.
 * Intraday bars are shown in `tz`; daily and longer bars by their calendar date.
 */
export function computeTimeTicks(ts: TimeScale, data: SeriesData, tz: TimeZone = new TimeZone(), minSpacing = 76): TimeTick[] {
  const n = data.length;
  if (n === 0) return [];
  const wall = data.tf >= 86400 ? barDate : (t: number): Date => tz.wall(t);
  const from = Math.max(1, Math.floor(ts.xToIndex(-minSpacing)));
  const to = Math.ceil(ts.xToIndex(ts.width + minSpacing));
  if (to <= from) return [];
  const count = to - from + 1;
  const weights = new Float32Array(count);
  const levels = new Set<number>();
  let prev = wall(data.indexToTime(from - 1));
  for (let i = from; i <= to; i++) {
    const d = wall(data.indexToTime(i));
    const w = tickWeight(d, prev);
    weights[i - from] = w;
    levels.add(w);
    prev = d;
  }
  const sorted = [...levels].sort((a, b) => b - a);
  const accepted: { x: number; i: number; w: number }[] = [];
  const effSpacing = Math.max(minSpacing, ts.barSpacing * 0.9);
  for (const level of sorted) {
    for (let k = 0; k < count; k++) {
      if (weights[k] !== level) continue;
      const i = from + k;
      const x = ts.indexToX(i);
      // binary search for neighbors in sorted accepted list
      let lo = 0;
      let hi = accepted.length;
      while (lo < hi) {
        const mid = (lo + hi) >> 1;
        if (accepted[mid].x < x) lo = mid + 1;
        else hi = mid;
      }
      const left = accepted[lo - 1];
      const right = accepted[lo];
      if ((left && x - left.x < effSpacing) || (right && right.x - x < effSpacing)) continue;
      accepted.splice(lo, 0, { x, i, w: level });
    }
  }
  return accepted.map((a) => ({ x: a.x, weight: a.w, label: tickLabel(wall(data.indexToTime(a.i)), a.w) }));
}

export function computePriceTicks(ps: PriceScale, height: number, precision: number, spacing = 46): number[] {
  if (height <= 0) return [];
  const top = ps.yToPrice(0);
  const bottom = ps.yToPrice(height);
  const hi = Math.max(top, bottom);
  const lo = Math.min(top, bottom);
  const range = hi - lo;
  if (!(range > 0)) return [];
  const count = Math.max(2, height / spacing);
  let step = niceStep(range / count);
  const minTick = Math.pow(10, -precision);
  if (step < minTick) step = minTick;
  const out: number[] = [];
  const start = Math.ceil(lo / step) * step;
  for (let v = start; v <= hi + step * 1e-6; v += step) {
    out.push(Math.round(v / minTick) * minTick);
    if (out.length > 200) break;
  }
  return out;
}
