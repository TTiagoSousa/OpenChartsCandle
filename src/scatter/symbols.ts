/**
 * Symbol outlines in a unit box (-0.5…0.5, y down), clockwise from the top. Every outline can be
 * resampled to the same number of points, so any symbol morphs smoothly into any other.
 */
import type { ScatterSymbol } from './types';

type Pts = [number, number][];

const arc = (cx: number, cy: number, r: number, a0: number, a1: number, n: number): Pts =>
  Array.from({ length: n + 1 }, (_, i) => {
    const a = a0 + ((a1 - a0) * i) / n;
    return [cx + r * Math.cos(a), cy + r * Math.sin(a)] as [number, number];
  });

const D = Math.PI / 180;

function outline(s: ScatterSymbol): Pts {
  switch (s) {
    case 'rect':
      return [[0, -0.5], [0.5, -0.5], [0.5, 0.5], [-0.5, 0.5], [-0.5, -0.5]];
    case 'roundRect': {
      const r = 0.18;
      const c = 0.5 - r;
      return [
        [0, -0.5],
        ...arc(c, -c, r, -90 * D, 0, 4),
        ...arc(c, c, r, 0, 90 * D, 4),
        ...arc(-c, c, r, 90 * D, 180 * D, 4),
        ...arc(-c, -c, r, 180 * D, 270 * D, 4),
      ];
    }
    case 'triangle':
      return [[0, -0.5], [0.5, 0.5], [-0.5, 0.5]];
    case 'diamond':
      return [[0, -0.5], [0.5, 0], [0, 0.5], [-0.5, 0]];
    case 'pin': {
      // a disc on top of a point
      const cy = -0.14;
      const r = 0.36;
      const a = Math.asin(r / (0.5 - cy));
      return [[0, cy - r], ...arc(0, cy, r, -90 * D, 90 * D - a, 10).slice(1), [0, 0.5], ...arc(0, cy, r, 90 * D + a, 270 * D, 10).slice(0, -1)];
    }
    case 'arrow':
      return [[0, -0.5], [0.5, 0.5], [0, 0.2], [-0.5, 0.5]];
    case 'star':
      return Array.from({ length: 10 }, (_, i) => {
        const r = i % 2 ? 0.21 : 0.5;
        const a = -90 * D + i * 36 * D;
        return [r * Math.cos(a), r * Math.sin(a) + 0.04] as [number, number];
      });
    case 'cross': {
      const w = 0.17;
      return [[0, -0.5], [w, -0.5], [w, -w], [0.5, -w], [0.5, w], [w, w], [w, 0.5], [-w, 0.5], [-w, w], [-0.5, w], [-0.5, -w], [-w, -w], [-w, -0.5]];
    }
    default:
      return arc(0, 0, 0.5, -90 * D, 270 * D, 40).slice(0, -1);
  }
}

const cache = new Map<ScatterSymbol, Pts>();
const sampled = new Map<ScatterSymbol, Pts>();

/** Outline of a symbol (unit box). */
export function symbolOutline(s: ScatterSymbol): Pts {
  let p = cache.get(s);
  if (!p) cache.set(s, (p = outline(s)));
  return p;
}

export const MORPH_POINTS = 48;

/** Outline resampled to MORPH_POINTS points evenly along its length, starting at the top. */
export function symbolSamples(s: ScatterSymbol): Pts {
  let out = sampled.get(s);
  if (out) return out;
  const p = symbolOutline(s);
  const segs: number[] = [];
  let total = 0;
  for (let i = 0; i < p.length; i++) {
    const [ax, ay] = p[i];
    const [bx, by] = p[(i + 1) % p.length];
    const l = Math.hypot(bx - ax, by - ay);
    segs.push(l);
    total += l;
  }
  out = [];
  let i = 0;
  let acc = 0;
  for (let k = 0; k < MORPH_POINTS; k++) {
    const t = (k / MORPH_POINTS) * total;
    while (i < p.length - 1 && acc + segs[i] < t) acc += segs[i++];
    const f = segs[i] ? (t - acc) / segs[i] : 0;
    const [ax, ay] = p[i];
    const [bx, by] = p[(i + 1) % p.length];
    out.push([ax + (bx - ax) * f, ay + (by - ay) * f]);
  }
  sampled.set(s, out);
  return out;
}

/** Trace a symbol of w × h px centred on (x, y). */
export function traceSymbol(ctx: CanvasRenderingContext2D, s: ScatterSymbol, x: number, y: number, w: number, h: number): void {
  if (s === 'circle' && Math.abs(w - h) < 0.01) {
    ctx.moveTo(x + w / 2, y);
    ctx.arc(x, y, Math.max(0, w / 2), 0, Math.PI * 2);
    return;
  }
  const p = symbolOutline(s);
  ctx.moveTo(x + p[0][0] * w, y + p[0][1] * h);
  for (let i = 1; i < p.length; i++) ctx.lineTo(x + p[i][0] * w, y + p[i][1] * h);
  ctx.closePath();
}

/** Trace the shape halfway (t) between two symbols, each with its own size. */
export function traceMorph(
  ctx: CanvasRenderingContext2D,
  a: ScatterSymbol, ax: number, ay: number, aw: number, ah: number,
  b: ScatterSymbol, bx: number, by: number, bw: number, bh: number,
  t: number,
): void {
  const pa = symbolSamples(a);
  const pb = symbolSamples(b);
  const x = ax + (bx - ax) * t;
  const y = ay + (by - ay) * t;
  for (let i = 0; i < MORPH_POINTS; i++) {
    const px = x + pa[i][0] * aw * (1 - t) + pb[i][0] * bw * t;
    const py = y + pa[i][1] * ah * (1 - t) + pb[i][1] * bh * t;
    if (i) ctx.lineTo(px, py);
    else ctx.moveTo(px, py);
  }
  ctx.closePath();
}
