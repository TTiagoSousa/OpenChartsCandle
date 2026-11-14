/** Funnel geometry: stage widths and the trapezoid of each stage, in a frame along the flow. */

/** A stage in the funnel frame: `a0`–`a1` along the flow, widths at both ends (across). */
export interface FunnelStageShape {
  a0: number;
  a1: number;
  /** width where the stage starts (top in a vertical funnel) */
  w0: number;
  /** width where it ends */
  w1: number;
}

/** A length given in px or '%' of `total`. */
export function funnelLength(v: number | string | undefined, total: number, def: number): number {
  if (v === undefined) return def;
  if (typeof v === 'number') return v;
  const s = v.trim();
  return s.endsWith('%') ? (total * parseFloat(s)) / 100 : parseFloat(s) || 0;
}

/** Width of a value: linear from `min` → `minPx` to `max` → `maxPx`, clamped. */
export function funnelWidth(v: number, min: number, max: number, minPx: number, maxPx: number): number {
  if (max <= min) return maxPx;
  const t = Math.min(1, Math.max(0, (v - min) / (max - min)));
  return minPx + (maxPx - minPx) * t;
}

/**
 * Trapezoids of the stages, in their drawing order. Descending (and 'none'): a stage starts at its own width and
 * ends at the next one's (the last ends at `minPx`); ascending: it starts at the previous one's (the first at
 * `minPx`) and ends at its own, like a pyramid.
 */
export function funnelShapes(values: number[], o: { length: number; gap: number; min: number; max: number; minPx: number; maxPx: number; ascending: boolean }): FunnelStageShape[] {
  const n = values.length;
  if (!n) return [];
  const gap = Math.min(o.gap, n > 1 ? (o.length * 0.5) / (n - 1) : 0);
  const h = (o.length - gap * (n - 1)) / n;
  const w = values.map((v) => funnelWidth(v, o.min, o.max, o.minPx, o.maxPx));
  return values.map((_, i) => ({
    a0: i * (h + gap),
    a1: i * (h + gap) + h,
    w0: o.ascending ? (i ? w[i - 1] : o.minPx) : w[i],
    w1: o.ascending ? w[i] : i < n - 1 ? w[i + 1] : o.minPx,
  }));
}

/** Order of the stages for a sort mode (indices into the data). */
export function funnelOrder(values: number[], sort: 'descending' | 'ascending' | 'none' = 'descending'): number[] {
  const idx = values.map((_, i) => i);
  if (sort === 'descending') idx.sort((a, b) => values[b] - values[a] || a - b);
  else if (sort === 'ascending') idx.sort((a, b) => values[a] - values[b] || a - b);
  return idx;
}

export function pointInPolygon(x: number, y: number, pts: { x: number; y: number }[]): boolean {
  let inside = false;
  for (let i = 0, j = pts.length - 1; i < pts.length; j = i++) {
    const a = pts[i];
    const b = pts[j];
    if (a.y > y !== b.y > y && x < ((b.x - a.x) * (y - a.y)) / (b.y - a.y) + a.x) inside = !inside;
  }
  return inside;
}
