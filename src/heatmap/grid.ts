/** Pure helpers of the heatmap (no DOM): the cell grid, axis label plans, pieces, buckets and correlations. */
import { gradientAt } from '../shared/color';
import { formatCompact, niceStep } from '../shared/format';
import type { HeatmapAxis, HeatmapDatum, HeatmapKey, HeatmapPiece } from './types';

type DatumObject = Extract<HeatmapDatum, { x: HeatmapKey }>;

export interface HeatGrid {
  nx: number;
  ny: number;
  /** value of cell (x, y) at y * nx + x; NaN = empty */
  values: Float64Array;
  /** objects given in `data`, by cell index */
  datums: Map<number, DatumObject>;
  xNames: (string | number)[];
  yNames: (string | number)[];
  /** finite min / max of the values (0 / 1 when there are none) */
  min: number;
  max: number;
}

/** Category names of an axis: its data, its bins, or 0…n-1. */
function names(axis: HeatmapAxis | undefined, n: number): (string | number)[] {
  if (axis?.data) return axis.data;
  const b = axis?.bins;
  if (b) return Array.from({ length: b.count ?? n }, (_, i) => +(b.min + i * b.step).toPrecision(12));
  return Array.from({ length: n }, (_, i) => i);
}

/** Index of a key on an axis, or -1. */
function indexOf(axis: HeatmapAxis | undefined, k: HeatmapKey, lookup: Map<string, number> | null): number {
  if (typeof k === 'string') return lookup?.get(k) ?? (/^\d+$/.test(k) && !axis?.data ? Number(k) : -1);
  if (!Number.isFinite(k)) return -1;
  const b = axis?.bins;
  if (b && !axis?.data) return Math.floor((k - b.min) / b.step + 1e-9);
  return Math.round(k);
}

/** Build the value grid from `data` triples / objects or a `matrix`. */
export function buildHeatGrid(data: HeatmapDatum[] | undefined, matrix: (number | null)[][] | undefined, xAxis?: HeatmapAxis, yAxis?: HeatmapAxis): HeatGrid {
  const xl = xAxis?.data ? new Map(xAxis.data.map((n, i) => [String(n), i])) : null;
  const yl = yAxis?.data ? new Map(yAxis.data.map((n, i) => [String(n), i])) : null;
  // size: the axes' data / bins, or the biggest index found
  let nx = xAxis?.data?.length ?? xAxis?.bins?.count ?? 0;
  let ny = yAxis?.data?.length ?? yAxis?.bins?.count ?? 0;
  const cells: [number, number, number, DatumObject | null][] = [];
  if (matrix) {
    ny = Math.max(ny, matrix.length);
    for (const row of matrix) nx = Math.max(nx, row.length);
  }
  for (const d of data ?? []) {
    const o = Array.isArray(d) ? null : d;
    const x = indexOf(xAxis, Array.isArray(d) ? d[0] : d.x, xl);
    const y = indexOf(yAxis, Array.isArray(d) ? d[1] : d.y, yl);
    if (x < 0 || y < 0) continue;
    const v = Array.isArray(d) ? d[2] : d.value;
    cells.push([x, y, typeof v === 'number' && Number.isFinite(v) ? v : NaN, o]);
    if (!xAxis?.data && !xAxis?.bins?.count) nx = Math.max(nx, x + 1);
    if (!yAxis?.data && !yAxis?.bins?.count) ny = Math.max(ny, y + 1);
  }
  const values = new Float64Array(nx * ny).fill(NaN);
  const datums = new Map<number, DatumObject>();
  if (matrix)
    matrix.forEach((row, y) =>
      row.forEach((v, x) => {
        if (x < nx && y < ny && typeof v === 'number' && Number.isFinite(v)) values[y * nx + x] = v;
      }),
    );
  for (const [x, y, v, o] of cells) {
    if (x >= nx || y >= ny) continue;
    values[y * nx + x] = v;
    if (o) datums.set(y * nx + x, o);
  }
  let min = Infinity;
  let max = -Infinity;
  for (let i = 0; i < values.length; i++) {
    const v = values[i];
    if (v < min) min = v;
    if (v > max) max = v;
  }
  if (min === Infinity) [min, max] = [0, 1];
  return { nx, ny, values, datums, xNames: names(xAxis, nx), yNames: names(yAxis, ny), min, max };
}

/** Every how many categories a label fits (`need` px per label): 1, 2, 5, 10, 20… so they fall on round positions. */
export function labelStep(need: number, cell: number): number {
  const k = Math.max(1, Math.ceil(need / Math.max(cell, 1e-6)));
  return k <= 2 ? k : Math.ceil(niceStep(k));
}

/**
 * How to show the labels of a category axis: rotation (degrees) and every how many categories.
 * `cell` = px per category, `maxW` = widest label in px. With 'auto' the labels turn 45° when that shows more
 * of them than thinning alone.
 */
export function axisLabelPlan(cell: number, maxW: number, fontSize: number, rotate: number | 'auto' = 'auto', gap = 6): { rotate: number; step: number } {
  const need = (r: number): number => (r === 0 ? maxW + gap : Math.min(maxW + gap, (fontSize + gap) / Math.sin((Math.abs(r) * Math.PI) / 180)));
  const step = (r: number): number => labelStep(need(r), cell);
  if (rotate !== 'auto') return { rotate, step: step(rotate) };
  const flat = step(0);
  if (flat === 1) return { rotate: 0, step: 1 };
  const tilted = step(45);
  return tilted < flat ? { rotate: 45, step: tilted } : { rotate: 0, step: flat };
}

/** Index of the piece of a value, or -1. The last `max` is inclusive when it is the top of the range. */
export function heatPieceOf(pieces: HeatmapPiece[], v: number, top = Infinity): number {
  for (let i = 0; i < pieces.length; i++) {
    const p = pieces[i];
    if (p.value !== undefined) {
      if (v === p.value) return i;
    } else if ((p.min === undefined || v >= p.min) && (p.max === undefined || v < p.max || (v === p.max && p.max >= top))) return i;
  }
  return -1;
}

/** N equal pieces between min and max, colored along `colors`. */
export function splitPieces(min: number, max: number, n: number, colors: string[], format: (v: number) => string = (v) => formatCompact(v)): HeatmapPiece[] {
  const k = Math.max(1, Math.round(n));
  const step = (max - min) / k;
  return Array.from({ length: k }, (_, i) => {
    const lo = min + i * step;
    const hi = i === k - 1 ? max : min + (i + 1) * step;
    return { min: lo, max: hi, color: gradientAt(colors, k > 1 ? i / (k - 1) : 1), label: `${format(lo)} – ${format(hi)}` };
  });
}

/**
 * Cells grouped by color bucket (counting sort), so a frame changes the fill color at most once per bucket.
 * `bucket[i]` < 0 = no bucket (empty cell). Returns the cell order and where each bucket starts in it.
 */
export function bucketOrder(bucket: Int16Array, count: number): { order: Uint32Array; start: Uint32Array } {
  const start = new Uint32Array(count + 1);
  for (let i = 0; i < bucket.length; i++) if (bucket[i] >= 0) start[bucket[i] + 1]++;
  for (let b = 0; b < count; b++) start[b + 1] += start[b];
  const order = new Uint32Array(start[count]);
  const at = start.slice(0, count);
  for (let i = 0; i < bucket.length; i++) {
    const b = bucket[i];
    if (b >= 0) order[at[b]++] = i;
  }
  return { order, start };
}

/** Simple returns of a price series: (p[i] / p[i-1]) - 1. */
export function heatmapReturns(prices: number[]): number[] {
  const out: number[] = [];
  for (let i = 1; i < prices.length; i++) out.push(prices[i - 1] ? prices[i] / prices[i - 1] - 1 : NaN);
  return out;
}

/**
 * Pearson correlation matrix of several series (e.g. the returns of a few assets): `m[i][j]` in [-1, 1],
 * 1 on the diagonal. Pairs use only the positions where both values are finite; a constant series correlates 0.
 */
export function heatmapCorrelation(series: number[][]): number[][] {
  const n = series.length;
  const m = Array.from({ length: n }, () => new Array<number>(n).fill(0));
  for (let i = 0; i < n; i++) {
    m[i][i] = 1;
    for (let j = i + 1; j < n; j++) {
      const a = series[i];
      const b = series[j];
      const len = Math.min(a.length, b.length);
      let k = 0;
      let sa = 0;
      let sb = 0;
      for (let t = 0; t < len; t++)
        if (Number.isFinite(a[t]) && Number.isFinite(b[t])) {
          sa += a[t];
          sb += b[t];
          k++;
        }
      let r = 0;
      if (k > 1) {
        const ma = sa / k;
        const mb = sb / k;
        let cov = 0;
        let va = 0;
        let vb = 0;
        for (let t = 0; t < len; t++)
          if (Number.isFinite(a[t]) && Number.isFinite(b[t])) {
            const da = a[t] - ma;
            const db = b[t] - mb;
            cov += da * db;
            va += da * da;
            vb += db * db;
          }
        r = va > 0 && vb > 0 ? Math.max(-1, Math.min(1, cov / Math.sqrt(va * vb))) : 0;
      }
      m[i][j] = m[j][i] = r;
    }
  }
  return m;
}
