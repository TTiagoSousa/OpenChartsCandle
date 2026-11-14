/** Pure layout of bars: stacking, groups and positions inside a category band. Testable without DOM. */

export interface StackInput {
  key: string;
  /** stack group (series with the same group stack together) */
  group: string;
  values: (number | null)[];
  hidden: boolean;
  /** value axis (series on different axes never stack together). Default 'left' */
  axis?: string;
}

export interface Segment {
  /** start and end of the bar on the value axis (start = baseline or previous stack top) */
  from: number;
  to: number;
  /** slot (group) index inside the category */
  slot: number;
}

export interface StackResult {
  /** segments[series][category] (null = nothing drawn) */
  segments: (Segment | null)[][];
  /** number of side-by-side slots */
  slots: number;
  /** min/max reached on the value axis */
  min: number;
  max: number;
  /** total per category (visible series, absolute values for percent) */
  totals: number[];
  /** min / max per value axis */
  ranges: Record<string, { min: number; max: number }>;
}

/**
 * Stack or group series. Positive and negative values stack separately (like most libraries),
 * so a negative value never "eats" a positive bar.
 */
export function computeStacks(series: StackInput[], categories: number, mode: false | true | 'percent'): StackResult {
  const visible = series.filter((s) => !s.hidden);
  const groups: string[] = [];
  const groupOf = (s: StackInput): string => (mode ? `${s.axis ?? 'left'}|${s.group}` : s.key);
  for (const s of visible) {
    const g = groupOf(s);
    if (!groups.includes(g)) groups.push(g);
  }
  const totals = new Array<number>(categories).fill(0);
  for (const s of visible) for (let c = 0; c < categories; c++) totals[c] += Math.abs(s.values[c] ?? 0);
  // per group, per category: running positive / negative sums
  const pos = new Map<string, number[]>();
  const neg = new Map<string, number[]>();
  for (const g of groups) {
    pos.set(g, new Array<number>(categories).fill(0));
    neg.set(g, new Array<number>(categories).fill(0));
  }
  let min = 0;
  let max = 0;
  const ranges: Record<string, { min: number; max: number }> = {};
  const extend = (axis: string, v: number): void => {
    const r = (ranges[axis] ??= { min: 0, max: 0 });
    r.min = Math.min(r.min, v);
    r.max = Math.max(r.max, v);
  };
  const segments = series.map((s) => {
    const row: (Segment | null)[] = [];
    const g = groupOf(s);
    const slot = groups.indexOf(g);
    for (let c = 0; c < categories; c++) {
      const raw = s.values[c];
      if (s.hidden || raw === null || raw === undefined || !Number.isFinite(raw) || slot < 0) {
        row.push(null);
        continue;
      }
      let v = raw;
      if (mode === 'percent') v = totals[c] ? (raw / totals[c]) * 100 : 0;
      if (!mode) {
        row.push({ from: 0, to: v, slot });
        min = Math.min(min, v);
        max = Math.max(max, v);
        extend(s.axis ?? 'left', v);
        continue;
      }
      const acc = v >= 0 ? pos.get(g)! : neg.get(g)!;
      const from = acc[c];
      const to = from + v;
      acc[c] = to;
      row.push({ from, to, slot });
      min = Math.min(min, to);
      max = Math.max(max, to);
      extend(s.axis ?? 'left', to);
    }
    return row;
  });
  return { segments, slots: Math.max(1, groups.length), min, max, totals, ranges };
}

/** Position of a slot inside a category band (pixels along the category axis). */
export function slotRect(
  bandStart: number,
  bandSize: number,
  slot: number,
  slots: number,
  categoryGap: number,
  barGap: number,
  maxBarWidth?: number,
): { start: number; size: number } {
  const inner = bandSize * (1 - Math.min(0.9, Math.max(0, categoryGap)));
  let size = Math.max(1, (inner - barGap * (slots - 1)) / slots);
  if (maxBarWidth) size = Math.min(size, maxBarWidth);
  const used = size * slots + barGap * (slots - 1);
  const start = bandStart + (bandSize - used) / 2 + slot * (size + barGap);
  return { start, size };
}

/** Category order after sorting by total of visible values. */
export function sortOrder(totals: number[], sort: 'none' | 'asc' | 'desc'): number[] {
  const idx = totals.map((_, i) => i);
  if (sort === 'asc') idx.sort((a, b) => totals[a] - totals[b]);
  if (sort === 'desc') idx.sort((a, b) => totals[b] - totals[a]);
  return idx;
}
