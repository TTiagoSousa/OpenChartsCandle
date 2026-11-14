import { niceStep } from '../shared/format';

/** A max that reads well on the outer ring: 87 → 100, 4300 → 5000. */
export function niceMax(v: number): number {
  if (!(v > 0)) return 1;
  const step = niceStep(v / 5);
  return Math.ceil(v / step - 1e-9) * step;
}

/** Angle (radians, math convention: counterclockwise from the right) of axis i of n. */
export function axisAngle(i: number, n: number, startAngle = 90, clockwise = true): number {
  const step = 360 / Math.max(1, n);
  return ((startAngle + (clockwise ? -1 : 1) * i * step) * Math.PI) / 180;
}

/** Point at distance r along an angle, on a canvas (y grows down). */
export function polar(cx: number, cy: number, r: number, a: number): { x: number; y: number } {
  return { x: cx + r * Math.cos(a), y: cy - r * Math.sin(a) };
}

/** Distance from the center of a value: min → 0, max → R (clamped). */
export function valueRadius(v: number | null, min: number, max: number, R: number): number {
  if (v === null || !isFinite(v)) return 0;
  const t = (v - min) / (max - min || 1);
  return Math.min(1, Math.max(0, t)) * R;
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
