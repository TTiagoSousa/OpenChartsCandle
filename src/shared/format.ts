/** Helpers shared by several chart families (no DOM, no family-specific code). */

export function niceStep(raw: number): number {
  if (!(raw > 0) || !Number.isFinite(raw)) return 1;
  const exp = Math.floor(Math.log10(raw));
  const base = 10 ** exp;
  const f = raw / base;
  return (f <= 1 ? 1 : f <= 2 ? 2 : f <= 2.5 ? 2.5 : f <= 5 ? 5 : 10) * base;
}

/** Nice axis range + ticks covering [min, max]. */
export function niceScale(min: number, max: number, count: number): { min: number; max: number; ticks: number[]; step: number } {
  if (!Number.isFinite(min) || !Number.isFinite(max)) return { min: 0, max: 1, ticks: [0, 1], step: 1 };
  if (min === max) {
    const d = Math.abs(min) * 0.1 || 1;
    min -= d;
    max += d;
  }
  const step = niceStep((max - min) / Math.max(1, count));
  const lo = Math.floor(min / step + 1e-9) * step;
  const hi = Math.ceil(max / step - 1e-9) * step;
  const ticks: number[] = [];
  for (let v = lo; v <= hi + step * 1e-6 && ticks.length < 100; v += step) ticks.push(+v.toPrecision(12));
  return { min: lo, max: hi, ticks, step };
}

/** 1.2K, 3.4M… for axis labels. */
export function formatCompact(v: number, maxDecimals = 2): string {
  const a = Math.abs(v);
  const fmt = (x: number, s: string): string => `${+x.toFixed(maxDecimals)}${s}`;
  if (a >= 1e12) return fmt(v / 1e12, 'T');
  if (a >= 1e9) return fmt(v / 1e9, 'B');
  if (a >= 1e6) return fmt(v / 1e6, 'M');
  if (a >= 1e4) return fmt(v / 1e3, 'K');
  return +v.toFixed(a >= 100 ? 0 : a >= 1 ? 2 : 4) + '';
}
