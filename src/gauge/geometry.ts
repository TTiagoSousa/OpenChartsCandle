/** Pure gauge math: angles, value ↔ angle, ticks, zones. Testable without DOM. */
import { niceScale } from '../shared/format';
import type { GaugeZone } from './types';

export interface Arc {
  /** radians, canvas convention (0 = right, clockwise) */
  start: number;
  end: number;
}

const SHAPES = {
  speedometer: [-120, 120],
  semi: [-90, 90],
  full: [0, 360],
} as const;

const toRad = (deg: number): number => ((deg - 90) * Math.PI) / 180;

/** Arc from a preset or custom degrees (0 = top, clockwise). */
export function gaugeArc(shape: keyof typeof SHAPES = 'speedometer', startAngle?: number, endAngle?: number): Arc {
  const [s, e] = SHAPES[shape];
  return { start: toRad(startAngle ?? s), end: toRad(endAngle ?? e) };
}

export const clamp = (v: number, lo: number, hi: number): number => Math.min(hi, Math.max(lo, v));

export function valueToAngle(v: number, min: number, max: number, arc: Arc): number {
  const t = clamp((v - min) / (max - min || 1), 0, 1);
  return arc.start + (arc.end - arc.start) * t;
}

/** Inverse of valueToAngle (for hover); angle normalized into the arc. Returns null outside the arc. */
export function angleToValue(angle: number, min: number, max: number, arc: Arc): number | null {
  const span = arc.end - arc.start;
  let a = angle;
  while (a < arc.start) a += Math.PI * 2;
  while (a > arc.start + Math.PI * 2) a -= Math.PI * 2;
  if (a - arc.start > span + 1e-9) return null;
  return min + ((a - arc.start) / span) * (max - min);
}

/** Major tick values: round numbers when they fit, else even divisions. */
export function gaugeTicks(min: number, max: number, count: number): number[] {
  const nice = niceScale(min, max, count).ticks.filter((t) => t >= min - 1e-9 && t <= max + 1e-9);
  if (nice.length >= 2 && Math.abs(nice[0] - min) < 1e-9 && Math.abs(nice[nice.length - 1] - max) < 1e-9) return nice;
  const n = Math.max(1, count - 1);
  return Array.from({ length: n + 1 }, (_, i) => +(min + ((max - min) * i) / n).toPrecision(12));
}

export function zoneAt(v: number, zones: GaugeZone[] = []): GaugeZone | null {
  return zones.find((z) => v >= Math.min(z.from, z.to) && v <= Math.max(z.from, z.to)) ?? null;
}

/** Bounding box of the arc on a unit circle (plus the hub), to fit the gauge in its container. */
export function arcBounds(arc: Arc): { minX: number; maxX: number; minY: number; maxY: number } {
  const pts: [number, number][] = [
    [Math.cos(arc.start), Math.sin(arc.start)],
    [Math.cos(arc.end), Math.sin(arc.end)],
    [0, 0],
  ];
  for (let k = Math.ceil(arc.start / (Math.PI / 2)); k * (Math.PI / 2) <= arc.end; k++) {
    const a = k * (Math.PI / 2);
    pts.push([Math.cos(a), Math.sin(a)]);
  }
  return {
    minX: Math.min(...pts.map((p) => p[0])),
    maxX: Math.max(...pts.map((p) => p[0])),
    minY: Math.min(...pts.map((p) => p[1])),
    maxY: Math.max(...pts.map((p) => p[1])),
  };
}

/** Spring-like easing that overshoots ~6% then settles (needle feel). */
export function springEase(t: number): number {
  if (t >= 1) return 1;
  return 1 - Math.exp(-6 * t) * Math.cos(7.5 * t);
}
