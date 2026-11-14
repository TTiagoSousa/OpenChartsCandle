import { niceScale } from '../shared/format';
import type { ParallelAxis, ParallelPiece, ParallelValue } from './types';

/** Pure helpers of the parallel family: axis scales, brush filtering and visualMap pieces (no DOM). */

export interface ParallelScale {
  type: 'value' | 'log' | 'category';
  /** Value at the start / end of the axis (category axes: first / last index) */
  min: number;
  max: number;
  categories: string[];
  inverse: boolean;
  /** Ticks: position 0–1 along the axis and value */
  ticks: { t: number; value: number | string }[];
  /** Position 0–1 along the axis (0 = start), or NaN when there is no value */
  toT(v: ParallelValue | undefined): number;
  /** Value at a position (category axes: the nearest index) */
  fromT(t: number): number;
}

const isNum = (v: unknown): v is number => typeof v === 'number' && Number.isFinite(v);

/** Build the scale of an axis from its options and the values found in the data. */
export function buildParallelScale(axis: ParallelAxis, values: ParallelValue[]): ParallelScale {
  const type = axis.type ?? (axis.data ? 'category' : values.some((v) => typeof v === 'string') ? 'category' : 'value');
  const inverse = !!axis.inverse;
  const flip = (t: number): number => (inverse ? 1 - t : t);

  if (type === 'category') {
    const categories = axis.data ? [...axis.data] : [];
    if (!axis.data) {
      const seen = new Set<string>();
      for (const v of values) {
        if (v === null || v === undefined || seen.has(String(v))) continue;
        seen.add(String(v));
        categories.push(String(v));
      }
    }
    const index = new Map(categories.map((c, i) => [c, i]));
    const n = categories.length;
    const pos = (i: number): number => flip(n > 1 ? i / (n - 1) : 0.5);
    return {
      type,
      min: 0,
      max: Math.max(0, n - 1),
      categories,
      inverse,
      ticks: categories.map((c, i) => ({ t: pos(i), value: c })),
      toT: (v) => {
        if (v === null || v === undefined) return NaN;
        const i = index.get(String(v));
        return i === undefined ? NaN : pos(i);
      },
      fromT: (t) => (n > 1 ? Math.round(flip(t) * (n - 1)) : 0),
    };
  }

  let lo = Infinity;
  let hi = -Infinity;
  for (const v of values) {
    if (!isNum(v) || (type === 'log' && v <= 0)) continue;
    lo = Math.min(lo, v);
    hi = Math.max(hi, v);
  }

  if (type === 'log') {
    if (isNum(axis.min) && axis.min > 0) lo = axis.min;
    if (isNum(axis.max) && axis.max > 0) hi = axis.max;
    if (!Number.isFinite(lo)) {
      lo = 1;
      hi = 10;
    }
    const nice = axis.nice !== false;
    let a = Math.log10(lo);
    let b = Math.log10(hi);
    if (nice && axis.min === undefined) a = Math.floor(a + 1e-9);
    if (nice && axis.max === undefined) b = Math.ceil(b - 1e-9);
    if (a === b) {
      a -= 1;
      b += 1;
    }
    const min = 10 ** a;
    const max = 10 ** b;
    const toT = (v: ParallelValue | undefined): number => (isNum(v) && v > 0 ? flip((Math.log10(v) - a) / (b - a)) : NaN);
    const ticks: { t: number; value: number }[] = [];
    const span = b - a;
    const mults = span <= 1.5 ? [1, 2, 5] : [1];
    const stride = Math.max(1, Math.ceil(span / 8));
    for (let e = Math.floor(a); e <= Math.ceil(b); e += stride)
      for (const m of mults) {
        const v = +(m * 10 ** e).toPrecision(12);
        if (v >= min * (1 - 1e-9) && v <= max * (1 + 1e-9)) ticks.push({ t: toT(v), value: v });
      }
    return { type, min, max, categories: [], inverse, ticks, toT, fromT: (t) => 10 ** (a + flip(t) * (b - a)) };
  }

  if (isNum(axis.min)) lo = axis.min;
  if (isNum(axis.max)) hi = axis.max;
  if (!Number.isFinite(lo) && !Number.isFinite(hi)) {
    lo = 0;
    hi = 1;
  } else if (!Number.isFinite(lo)) lo = hi - 1;
  else if (!Number.isFinite(hi)) hi = lo + 1;
  if (lo > hi) [lo, hi] = [hi, lo];
  if (lo === hi) {
    const d = Math.abs(lo) * 0.1 || 1;
    if (!isNum(axis.min)) lo -= d;
    if (!isNum(axis.max)) hi += d;
    if (lo === hi) hi = lo + 1;
  }
  const count = axis.splitNumber ?? 5;
  const s = niceScale(lo, hi, count);
  const nice = axis.nice !== false;
  if (nice && axis.min === undefined) lo = s.min;
  if (nice && axis.max === undefined) hi = s.max;
  const ticksSrc = niceScale(lo, hi, count).ticks.filter((v) => v >= lo - (hi - lo) * 1e-9 && v <= hi + (hi - lo) * 1e-9);
  const toT = (v: ParallelValue | undefined): number => (isNum(v) ? flip((v - lo) / (hi - lo)) : NaN);
  return {
    type: 'value',
    min: lo,
    max: hi,
    categories: [],
    inverse,
    ticks: ticksSrc.map((v) => ({ t: toT(v), value: v })),
    toT,
    fromT: (t) => lo + flip(t) * (hi - lo),
  };
}

/** A brushed range on one dimension, as positions 0–1 along the axis (lo ≤ hi). */
export interface ParallelTRange {
  dim: number;
  lo: number;
  hi: number;
}

/**
 * Is row `row` inside every range? `T` holds the positions of all rows, `dims` per row (NaN = no value, never
 * inside a range). No ranges = every row is inside.
 */
export function parallelInRanges(T: ArrayLike<number>, row: number, dims: number, ranges: ParallelTRange[]): boolean {
  for (const r of ranges) {
    const t = T[row * dims + r.dim];
    if (!(t >= r.lo - 1e-9 && t <= r.hi + 1e-9)) return false;
  }
  return true;
}

/** Index of the piece a value falls in (value match, or min ≤ v < max), -1 when none. */
export function parallelPieceIndex(pieces: ParallelPiece[], v: ParallelValue | undefined): number {
  if (v === null || v === undefined) return -1;
  for (let i = 0; i < pieces.length; i++) {
    const p = pieces[i];
    if (p.value !== undefined) {
      if (String(p.value) === String(v)) return i;
      continue;
    }
    if (typeof v !== 'number') continue;
    if ((p.min === undefined || v >= p.min) && (p.max === undefined || v < p.max)) return i;
  }
  return -1;
}

/** The brushed range of an axis in its own units: a value range, or the categories inside. */
export function parallelRangeValues(scale: ParallelScale, lo: number, hi: number): { from?: number; to?: number; categories?: string[] } {
  if (scale.type === 'category') return { categories: scale.categories.filter((c) => { const t = scale.toT(c); return t >= lo - 1e-9 && t <= hi + 1e-9; }) };
  const a = scale.fromT(lo);
  const b = scale.fromT(hi);
  return { from: Math.min(a, b), to: Math.max(a, b) };
}

/** Cross position (0–1) of a segment from t0 to t1 at a fraction u of the way, straight or eased (smooth). */
export function parallelSegmentAt(t0: number, t1: number, u: number, smooth: number): number {
  if (!smooth) return t0 + (t1 - t0) * u;
  // cubic bézier with control points at `smooth` of the way, on the same level as each end: close to smoothstep
  const e = u * u * (3 - 2 * u);
  const s = Math.min(1, Math.max(0, smooth));
  return t0 + (t1 - t0) * (u + (e - u) * Math.min(1, s * 2));
}
