import type { PieDatum, PieSlice } from './types';

export const DEFAULT_COLORS = [
  '#2962ff', '#089981', '#f23645', '#ff9800', '#9c27b0', '#00bcd4',
  '#e91e63', '#4caf50', '#ffc107', '#3f51b5', '#795548', '#607d8b',
];

export const OTHERS_COLOR = '#787b86';

const keyOf = (d: PieDatum): string => d.id ?? d.label;

/**
 * Turn raw data into slices: colors (stable per key), sorting, grouping of small
 * slices into "Outros", hidden/selected flags and percentages of the visible total.
 */
export function prepareSlices(
  data: PieDatum[],
  o: { sort: 'none' | 'desc' | 'asc'; groupBelow: number; othersLabel: string; colors: string[] },
  hidden: Set<string>,
  selected: Set<string>,
  ring = 0,
  ringName?: string,
): PieSlice[] {
  const clean = data.filter((d) => Number.isFinite(d.value) && d.value > 0);
  // color by position in the ORIGINAL data, so sorting/hiding never changes colors
  const colorOf = new Map<string, string>();
  clean.forEach((d, i) => colorOf.set(keyOf(d), d.color ?? o.colors[i % o.colors.length]));

  let items = [...clean];
  if (o.sort === 'desc') items.sort((a, b) => b.value - a.value);
  else if (o.sort === 'asc') items.sort((a, b) => a.value - b.value);

  let others: PieDatum[] = [];
  if (o.groupBelow > 0) {
    const total = items.reduce((s, d) => s + d.value, 0);
    const small = items.filter((d) => (d.value / total) * 100 < o.groupBelow);
    if (small.length >= 2) {
      others = small;
      items = items.filter((d) => !small.includes(d));
    }
  }
  const all: { datum: PieDatum; grouped: boolean; children?: PieDatum[] }[] = items.map((d) => ({ datum: d, grouped: false }));
  if (others.length) {
    all.push({
      datum: { id: '__others__', label: o.othersLabel, value: others.reduce((s, d) => s + d.value, 0), color: OTHERS_COLOR },
      grouped: true,
      children: others,
    });
  }

  const visibleTotal = all.reduce((s, x) => s + (hidden.has(keyOf(x.datum)) ? 0 : x.datum.value), 0);
  return all.map((x, index) => {
    const id = keyOf(x.datum);
    const isHidden = hidden.has(id);
    return {
      id,
      label: x.datum.label,
      value: x.datum.value,
      percent: isHidden || visibleTotal === 0 ? 0 : (x.datum.value / visibleTotal) * 100,
      color: x.datum.color ?? colorOf.get(id) ?? OTHERS_COLOR,
      index,
      hidden: isHidden,
      ring,
      ringName,
      selected: selected.has(id),
      grouped: x.grouped,
      children: x.children,
      datum: x.datum,
    };
  });
}

export interface SliceGeom {
  a0: number;
  a1: number;
  /** outer radius factor 0–1 (rose charts) */
  r: number;
}

/**
 * Angles (radians) of every slice; hidden slices get a zero-width arc at their position.
 * `minAngle` keeps tiny slices visible (others shrink to compensate);
 * `clockwise = false` mirrors the order inside [start, end].
 * Rose charts: `true` = equal angles, radius by √value (area-like); `'area'` = equal angles, radius by value;
 * `'radius'` = angle and radius both by value.
 */
export function computeAngles(
  slices: PieSlice[],
  start: number,
  end: number,
  rose: boolean | 'area' | 'radius',
  minAngle = 0,
  clockwise = true,
): SliceGeom[] {
  const span = end - start;
  const visible = slices.filter((s) => !s.hidden);
  const total = visible.reduce((s, x) => s + x.value, 0);
  const max = Math.max(...visible.map((s) => s.value), 0);
  const equal = rose === true || rose === 'area';
  let widths = slices.map((s) => (s.hidden || total <= 0 ? 0 : equal ? span / visible.length : (s.value / total) * span));
  if (minAngle > 0 && !equal && visible.length) {
    const min = Math.min(minAngle, span / visible.length);
    const small = widths.map((w, i) => !slices[i].hidden && w < min);
    const fixed = small.filter(Boolean).length * min;
    const restRaw = widths.reduce((a, w, i) => a + (small[i] ? 0 : w), 0);
    const k = restRaw > 0 ? (span - fixed) / restRaw : 0;
    widths = widths.map((w, i) => (slices[i].hidden ? 0 : small[i] ? min : w * k));
  }
  const radius = (v: number): number => {
    if (!rose || max <= 0) return 1;
    return rose === true ? 0.25 + 0.75 * Math.sqrt(v / max) : 0.15 + 0.85 * (v / max);
  };
  let a = start;
  return slices.map((s, i) => {
    const w = widths[i];
    let a0 = a;
    let a1 = a + w;
    if (!clockwise) [a0, a1] = [start + end - a1, start + end - a0];
    a += w;
    return { a0, a1, r: radius(s.value) };
  });
}

/** Bounding box of a unit circle arc from a0 to a1 (plus the center), for fitting half-donuts etc. */
export function arcBounds(a0: number, a1: number): { minX: number; maxX: number; minY: number; maxY: number } {
  const xs = [0, Math.cos(a0), Math.cos(a1)];
  const ys = [0, Math.sin(a0), Math.sin(a1)];
  const lo = Math.min(a0, a1);
  const hi = Math.max(a0, a1);
  for (let k = Math.ceil(lo / (Math.PI / 2)); k * (Math.PI / 2) <= hi; k++) {
    const t = k * (Math.PI / 2);
    xs.push(Math.cos(t));
    ys.push(Math.sin(t));
  }
  return { minX: Math.min(...xs), maxX: Math.max(...xs), minY: Math.min(...ys), maxY: Math.max(...ys) };
}

/** Center and radius so the arc fits the box with the given margins. */
export function fit(
  width: number,
  height: number,
  a0: number,
  a1: number,
  margin: { x: number; y: number },
): { cx: number; cy: number; radius: number } {
  const b = arcBounds(a0, a1);
  const w = Math.max(1, width - margin.x * 2);
  const h = Math.max(1, height - margin.y * 2);
  const radius = Math.max(4, Math.min(w / (b.maxX - b.minX), h / (b.maxY - b.minY)));
  const cx = margin.x + (w - (b.maxX - b.minX) * radius) / 2 - b.minX * radius;
  const cy = margin.y + (h - (b.maxY - b.minY) * radius) / 2 - b.minY * radius;
  return { cx, cy, radius };
}

/** Normalise an angle into [start, start + 2π). */
export function normAngle(a: number, start: number): number {
  const TAU = Math.PI * 2;
  let x = (a - start) % TAU;
  if (x < 0) x += TAU;
  return start + x;
}

export interface LabelBox {
  index: number;
  /** anchor on the slice edge */
  ax: number;
  ay: number;
  /** text position */
  x: number;
  y: number;
  right: boolean;
  /** height of the label (multi-line / rich labels); default: the minimum gap */
  h?: number;
}

/** Spread outside labels vertically on each side so they never overlap. */
export function layoutOutsideLabels(items: LabelBox[], minGap: number, top: number, bottom: number): LabelBox[] {
  // distance between two neighbours: half of each height plus a small gap
  const gap = (a: LabelBox, b: LabelBox): number => (a.h === undefined && b.h === undefined ? minGap : ((a.h ?? minGap) + (b.h ?? minGap)) / 2 + 2);
  for (const side of [true, false]) {
    const list = items.filter((l) => l.right === side).sort((a, b) => a.y - b.y);
    for (let i = 1; i < list.length; i++) {
      const g = gap(list[i - 1], list[i]);
      if (list[i].y - list[i - 1].y < g) list[i].y = list[i - 1].y + g;
    }
    // overflow at the bottom: push everything back up
    const last = list[list.length - 1];
    const over = last ? last.y + (last.h ?? 0) / 2 - bottom : 0;
    if (over > 0) {
      last.y -= over;
      for (let i = list.length - 2; i >= 0; i--) {
        const g = gap(list[i], list[i + 1]);
        if (list[i + 1].y - list[i].y < g) list[i].y = list[i + 1].y - g;
      }
    }
    for (const l of list) l.y = Math.max(top + (l.h ?? 0) / 2, l.y);
  }
  return items;
}
