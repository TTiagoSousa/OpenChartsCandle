/** Data helpers for bar charts: waterfall, color scales and datasets. Pure, testable without DOM. */
import type { BarSeries } from './types';

export interface WaterfallResult {
  /** invisible base of every bar (use as a `silent` series with color 'transparent') */
  base: number[];
  /** increases (null where the step goes down) */
  up: (number | null)[];
  /** decreases, as positive heights (null where the step goes up) */
  down: (number | null)[];
  /** running total after each step */
  totals: number[];
}

/**
 * Waterfall from a list of changes (+ and −). Stack `base` (invisible), `up` and `down`
 * to draw floating bars that start where the previous one ended.
 * With `start`, the first bar is the starting total and the changes follow it.
 */
export function waterfall(changes: number[], start?: number): WaterfallResult {
  const base: number[] = [];
  const up: (number | null)[] = [];
  const down: (number | null)[] = [];
  const totals: number[] = [];
  let run = 0;
  const steps = start === undefined ? changes : [start, ...changes];
  steps.forEach((v, i) => {
    if (start !== undefined && i === 0) {
      base.push(0);
      up.push(v);
      down.push(null);
      run = v;
    } else if (v >= 0) {
      base.push(run);
      up.push(v);
      down.push(null);
      run += v;
    } else {
      run += v;
      base.push(run);
      up.push(null);
      down.push(-v);
    }
    totals.push(run);
  });
  return { base, up, down, totals };
}

/** Parse #rgb / #rrggbb / rgb() colors to [r, g, b]. */
function rgb(color: string): [number, number, number] {
  const c = color.trim();
  if (c.startsWith('#')) {
    const h = c.length === 4 ? c.slice(1).split('').map((x) => x + x).join('') : c.slice(1, 7);
    return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)];
  }
  const m = c.match(/(\d+(?:\.\d+)?)/g);
  return m ? [+m[0], +m[1], +m[2]] : [0, 0, 0];
}

/** Continuous color scale: value in [min, max] → a color between `colors` (e.g. for colorBy). */
export function colorScale(min: number, max: number, colors: string[]): (v: number) => string {
  const stops = colors.map(rgb);
  return (v: number) => {
    if (stops.length === 1) return colors[0];
    const t = Math.min(1, Math.max(0, (v - min) / (max - min || 1))) * (stops.length - 1);
    const i = Math.min(stops.length - 2, Math.floor(t));
    const f = t - i;
    const [a, b] = [stops[i], stops[i + 1]];
    return `rgb(${Math.round(a[0] + (b[0] - a[0]) * f)}, ${Math.round(a[1] + (b[1] - a[1]) * f)}, ${Math.round(a[2] + (b[2] - a[2]) * f)})`;
  };
}

export type DatasetRow = (string | number | null)[];

export interface DatasetOptions {
  /**
   * 'column' (default): the first column holds the categories and every other column is a series.
   * 'row': the first row holds the categories and every other row is a series.
   */
  seriesLayoutBy?: 'column' | 'row';
  /** Only these series (header names), in this order */
  series?: string[];
}

/**
 * Turn a table (first row = header) or a list of objects into `categories` and `series`.
 * `category` names the column (or key) of the categories — the "encode" of other libraries —
 * and `series` picks the value columns; by default the first column holds the categories.
 */
export function fromDataset(
  source: DatasetRow[] | Record<string, string | number | null>[],
  opts: DatasetOptions & { category?: string } = {},
): { categories: string[]; series: BarSeries[] } {
  if (!source.length) return { categories: [], series: [] };
  // list of objects → table
  let table: DatasetRow[];
  if (!Array.isArray(source[0])) {
    const objs = source as Record<string, string | number | null>[];
    const keys = Object.keys(objs[0]);
    const catKey = opts.category ?? keys[0];
    const valKeys = keys.filter((k) => k !== catKey);
    table = [[catKey, ...valKeys], ...objs.map((o) => [o[catKey], ...valKeys.map((k) => o[k])])];
  } else table = source as DatasetRow[];
  if (opts.seriesLayoutBy === 'row') {
    // transpose: rows become columns
    table = table[0].map((_, c) => table.map((row) => row[c]));
  }
  // encode: move the chosen category column to the front
  if (opts.category && Array.isArray(source[0]) && opts.seriesLayoutBy !== 'row') {
    const ci = table[0].indexOf(opts.category);
    if (ci > 0) table = table.map((r) => [r[ci], ...r.filter((_, i) => i !== ci)]);
  }
  const [header, ...rows] = table;
  const categories = rows.map((r) => String(r[0]));
  let cols = header.slice(1).map((name, i) => ({ name: String(name), col: i + 1 }));
  if (opts.series) cols = opts.series.map((n) => cols.find((c) => c.name === n)).filter((c): c is { name: string; col: number } => !!c);
  const series = cols.map(({ name, col }) => ({
    name,
    data: rows.map((r) => {
      const v = r[col];
      return v === null || v === undefined || v === '' ? null : Number(v);
    }),
  }));
  return { categories, series };
}
