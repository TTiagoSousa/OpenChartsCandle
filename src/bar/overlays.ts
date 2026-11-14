/** Pure calculations for lines drawn over bars: moving averages, trends, cumulative. Testable without DOM. */

type Values = (number | null)[];

const valid = (v: number | null | undefined): v is number => v !== null && v !== undefined && Number.isFinite(v);

/** Simple moving average. A window that contains a gap (null) gives null. */
export function sma(values: Values, period: number): Values {
  const p = Math.max(1, Math.floor(period));
  return values.map((_, i) => {
    if (i < p - 1) return null;
    let sum = 0;
    for (let k = i - p + 1; k <= i; k++) {
      const v = values[k];
      if (!valid(v)) return null;
      sum += v;
    }
    return sum / p;
  });
}

/** Weighted moving average (newest value weighs the most). */
export function wma(values: Values, period: number): Values {
  const p = Math.max(1, Math.floor(period));
  const den = (p * (p + 1)) / 2;
  return values.map((_, i) => {
    if (i < p - 1) return null;
    let sum = 0;
    for (let k = 0; k < p; k++) {
      const v = values[i - p + 1 + k];
      if (!valid(v)) return null;
      sum += v * (k + 1);
    }
    return sum / den;
  });
}

/**
 * Exponential moving average (alpha = 2 / (period + 1)), seeded with the SMA of the first
 * `period` values. Gaps keep the previous average and give null at that point.
 */
export function ema(values: Values, period: number): Values {
  const p = Math.max(1, Math.floor(period));
  const alpha = 2 / (p + 1);
  const out: Values = [];
  let prev: number | null = null;
  const seed: number[] = [];
  for (const v of values) {
    if (!valid(v)) {
      out.push(null);
      continue;
    }
    if (prev === null) {
      seed.push(v);
      if (seed.length < p) {
        out.push(null);
        continue;
      }
      prev = seed.reduce((a, b) => a + b, 0) / p;
      out.push(prev);
      continue;
    }
    prev = v * alpha + prev * (1 - alpha);
    out.push(prev);
  }
  return out;
}

export interface TrendResult {
  values: Values;
  /** goodness of fit, 0–1 */
  r2: number;
}

/** Least-squares straight line through the values (x = position). */
export function linearTrend(values: Values): TrendResult & { slope: number; intercept: number } {
  const pts = values.map((v, i) => [i, v] as const).filter((p): p is readonly [number, number] => valid(p[1]));
  if (pts.length < 2) return { values: values.map(() => null), slope: 0, intercept: 0, r2: 0 };
  const n = pts.length;
  const mx = pts.reduce((a, p) => a + p[0], 0) / n;
  const my = pts.reduce((a, p) => a + p[1], 0) / n;
  let sxy = 0;
  let sxx = 0;
  let syy = 0;
  for (const [x, y] of pts) {
    sxy += (x - mx) * (y - my);
    sxx += (x - mx) ** 2;
    syy += (y - my) ** 2;
  }
  const slope = sxx ? sxy / sxx : 0;
  const intercept = my - slope * mx;
  const r2 = syy ? (sxy * sxy) / (sxx * syy) : 1;
  return { values: values.map((_, i) => intercept + slope * i), slope, intercept, r2 };
}

/**
 * Exponential trend y = a·e^(b·x), fitted on ln(y) (only positive values count).
 * `growth` is the change per position: 0.05 = +5% per category.
 */
export function exponentialTrend(values: Values): TrendResult & { growth: number } {
  const logs = values.map((v) => (valid(v) && v > 0 ? Math.log(v) : null));
  const fit = linearTrend(logs);
  if (logs.filter(valid).length < 2) return { values: values.map(() => null), growth: 0, r2: 0 };
  return { values: values.map((_, i) => Math.exp(fit.intercept + fit.slope * i)), growth: Math.exp(fit.slope) - 1, r2: fit.r2 };
}

/** Running total; with `percent` the running share of the grand total (Pareto curve). */
export function cumulative(values: Values, percent = false): Values {
  const total = values.reduce<number>((a, v) => a + (valid(v) ? v : 0), 0);
  let run = 0;
  return values.map((v) => {
    if (valid(v)) run += v;
    return percent ? (total ? (run / total) * 100 : 0) : run;
  });
}

/** Flat line at the mean of the values. */
export function average(values: Values): Values {
  const ok = values.filter(valid);
  const m = ok.length ? ok.reduce((a, b) => a + b, 0) / ok.length : null;
  return values.map(() => m);
}
