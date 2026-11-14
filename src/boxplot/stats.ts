import type { BoxplotSeries } from './types';

/** Result of boxplotStats: the box, its whiskers and what lies beyond them. */
export interface BoxplotStatsResult {
  /** Lower whisker end: the smallest value inside the lower fence */
  low: number;
  q1: number;
  median: number;
  q3: number;
  /** Upper whisker end: the biggest value inside the upper fence */
  high: number;
  /** Q3 − Q1 */
  iqr: number;
  /** Smallest and biggest values, outliers included */
  min: number;
  max: number;
  mean: number;
  count: number;
  /** Values below Q1 − k·IQR or above Q3 + k·IQR, sorted */
  outliers: number[];
}

/**
 * Quantile p (0–1) of SORTED values with linear interpolation between the closest ranks
 * (h = (n − 1)·p, Hyndman & Fan type 7: the default of R, NumPy and Excel QUARTILE.INC).
 */
export function boxplotQuantile(sorted: number[], p: number): number {
  const n = sorted.length;
  if (!n) return NaN;
  const h = (n - 1) * Math.min(1, Math.max(0, p));
  const i = Math.floor(h);
  const e = h - i;
  return e && i + 1 < n ? sorted[i] + e * (sorted[i + 1] - sorted[i]) : sorted[i];
}

/**
 * Box of raw values (NaN and non-numbers are ignored; null when nothing is left). Quartiles with
 * boxplotQuantile; the whiskers go to the most extreme values inside Q1 − k·IQR and Q3 + k·IQR (Tukey, k = 1.5),
 * the rest are outliers. `whisker: 'range'` puts the whiskers at the min and max (no outliers).
 */
export function boxplotStats(values: readonly (number | null | undefined)[], opts: { whisker?: number | 'range' } = {}): BoxplotStatsResult | null {
  const v = values.filter((x): x is number => typeof x === 'number' && Number.isFinite(x)).sort((a, b) => a - b);
  const n = v.length;
  if (!n) return null;
  const q1 = boxplotQuantile(v, 0.25);
  const median = boxplotQuantile(v, 0.5);
  const q3 = boxplotQuantile(v, 0.75);
  const iqr = q3 - q1;
  const k = opts.whisker ?? 1.5;
  const lo = k === 'range' ? -Infinity : q1 - k * iqr;
  const hi = k === 'range' ? Infinity : q3 + k * iqr;
  const inside = v.filter((x) => x >= lo && x <= hi);
  return {
    // with a tiny k the box itself may hold no value inside the fences: the whiskers then stop at the box
    low: Math.min(q1, inside.length ? inside[0] : q1),
    q1,
    median,
    q3,
    high: Math.max(q3, inside.length ? inside[inside.length - 1] : q3),
    iqr,
    min: v[0],
    max: v[n - 1],
    mean: v.reduce((a, b) => a + b, 0) / n,
    count: n,
    outliers: v.filter((x) => x < lo || x > hi),
  };
}

type Field<T, R> = keyof T | ((row: T) => R);

const read = <T, R>(row: T, f: Field<T, R>): R => (typeof f === 'function' ? (f as (r: T) => R)(row) : (row[f as keyof T] as unknown as R));

/**
 * Group raw rows into boxes: one category per distinct `category`, one series per distinct `series` (or a single
 * series named `name`), the values of each group as samples (the chart computes the boxes). Categories and series
 * keep the order of first appearance unless `sort` is given.
 */
export function boxplotAggregate<T>(
  rows: readonly T[],
  opts: { category: Field<T, string | number>; value: Field<T, number | null | undefined>; series?: Field<T, string | number>; name?: string; sort?: (a: string, b: string) => number },
): { categories: string[]; series: BoxplotSeries[] } {
  const cats: string[] = [];
  const catIndex = new Map<string, number>();
  const groups = new Map<string, Map<string, number[]>>();
  for (const row of rows) {
    const c = String(read(row, opts.category));
    const s = opts.series !== undefined ? String(read(row, opts.series)) : (opts.name ?? 'Série');
    const v = read(row, opts.value);
    if (!catIndex.has(c)) {
      catIndex.set(c, cats.length);
      cats.push(c);
    }
    if (!groups.has(s)) groups.set(s, new Map());
    const g = groups.get(s)!;
    if (!g.has(c)) g.set(c, []);
    if (typeof v === 'number' && Number.isFinite(v)) g.get(c)!.push(v);
  }
  if (opts.sort) cats.sort(opts.sort);
  return {
    categories: cats,
    series: [...groups].map(([name, g]) => ({ name, samples: cats.map((c) => g.get(c) ?? null) })),
  };
}
