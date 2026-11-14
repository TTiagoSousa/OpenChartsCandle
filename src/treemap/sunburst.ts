/**
 * Sunburst geometry: lengths in px or '%', ring radii per level, sectors with rounded corners
 * and the room a label has inside a sector.
 */
import type { SectorShape } from './shape';
import type { TreemapLength } from './types';

const TAU = Math.PI * 2;

/** `40` → 40 px, `'40%'` → 40 % of `base`, `'40'` / `'40px'` → 40 px; anything else → undefined. */
export function sunLength(v: TreemapLength | undefined, base: number): number | undefined {
  if (v === undefined || v === null) return undefined;
  if (typeof v === 'number') return Number.isFinite(v) ? v : undefined;
  const s = v.trim();
  const n = parseFloat(s);
  if (!Number.isFinite(n)) return undefined;
  return s.endsWith('%') ? (base * n) / 100 : n;
}

/**
 * Inner and outer radius of `count` rings between `inner` and `outer`. A ring takes its own `r0` / `r`
 * when given; the others start where the previous one ends and share evenly the room up to the next
 * fixed radius (or `outer`).
 */
export function sunburstRings(count: number, inner: number, outer: number, specs: { r0?: number; r?: number }[] = []): [number, number][] {
  const out: [number, number][] = [];
  let b = inner;
  for (let i = 0; i < count; i++) {
    const s = specs[i] ?? {};
    const a = s.r0 ?? b;
    let e = s.r;
    if (e === undefined) {
      // this ring and the next ones without an own end share the room up to the next known radius
      let n = 1;
      let target = outer;
      for (let k = i + 1; k < count; k++) {
        const t = specs[k] ?? {};
        if (t.r0 !== undefined) {
          target = t.r0;
          break;
        }
        n++;
        if (t.r !== undefined) {
          target = t.r;
          break;
        }
      }
      e = a + Math.max(0, target - a) / n;
    }
    out.push([a, Math.max(a, e)]);
    b = Math.max(a, e);
  }
  return out;
}

/**
 * Largest usable corner radii `[inner, outer]` of a sector: no more than half the ring's thickness,
 * and small enough that the two corners of one arc do not cross.
 */
export function sectorCorners(s: SectorShape, want: [number, number]): [number, number] {
  const span = s.a1 - s.a0;
  if (span >= TAU - 1e-6 || span <= 0) return [0, 0];
  const half = Math.max(0, (s.r1 - s.r0) / 2);
  const h = Math.sin(Math.min(span, Math.PI) / 2);
  const outer = Math.min(want[1], half, (s.r1 * h) / (1 + h));
  const inner = s.r0 > 0 ? Math.min(want[0], half, h < 1 ? (s.r0 * h) / (1 - h) : Infinity) : 0;
  return [Math.max(0, inner), Math.max(0, outer)];
}

/** Path of an annular sector with rounded corners (falls back to sharp corners where they do not fit). */
export function traceRoundSector(ctx: CanvasRenderingContext2D, s: SectorShape, radius: [number, number]): void {
  const [ci, co] = sectorCorners(s, radius);
  const { cx, cy, r0, r1, a0, a1 } = s;
  const P = (r: number, a: number): [number, number] => [cx + r * Math.cos(a), cy + r * Math.sin(a)];
  ctx.beginPath();
  if (co > 0.3) {
    const d = Math.asin(co / (r1 - co));
    const [x1, y1] = P(r1 - co, a0 + d);
    const [x2, y2] = P(r1 - co, a1 - d);
    ctx.arc(x1, y1, co, a0 - Math.PI / 2, a0 + d);
    ctx.arc(cx, cy, r1, a0 + d, a1 - d);
    ctx.arc(x2, y2, co, a1 - d, a1 + Math.PI / 2);
  } else ctx.arc(cx, cy, r1, a0, a1);
  if (r0 <= 0) ctx.lineTo(cx, cy);
  else if (ci > 0.3) {
    const d = Math.asin(ci / (r0 + ci));
    const [x3, y3] = P(r0 + ci, a1 - d);
    const [x4, y4] = P(r0 + ci, a0 + d);
    ctx.arc(x3, y3, ci, a1 + Math.PI / 2, a1 - d + Math.PI);
    ctx.arc(cx, cy, r0, a1 - d, a0 + d, true);
    ctx.arc(x4, y4, ci, a0 + d + Math.PI, a0 + Math.PI * 1.5);
  } else ctx.arc(cx, cy, r0, a1, a0, true);
  ctx.closePath();
}

/**
 * Room for a line of text inside a sector whose text runs at `angle` (radians, canvas): `along` the text
 * and `across` it. Radial text gets the ring's thickness, tangential text the arc length; in between, a mix.
 */
export function sectorTextRoom(s: SectorShape, angle: number): { along: number; across: number } {
  const radial = Math.max(0, s.r1 - s.r0);
  const rm = (s.r0 + s.r1) / 2;
  const arc = Math.max(0, Math.min(s.a1 - s.a0, Math.PI) * rm);
  const phi = angle - (s.a0 + s.a1) / 2;
  const room = (p: number): number => {
    const c = Math.abs(Math.cos(p));
    const sn = Math.abs(Math.sin(p));
    return 1 / (c / Math.max(1e-6, radial) + sn / Math.max(1e-6, arc));
  };
  return { along: room(phi), across: room(phi + Math.PI / 2) };
}

/** Text angle that keeps a label upright: turns `angle` half a turn when the text would read upside down. */
export function uprightAngle(angle: number): { angle: number; flipped: boolean } {
  const n = ((angle % TAU) + TAU) % TAU;
  const flipped = n > Math.PI / 2 + 1e-9 && n < (Math.PI * 3) / 2 - 1e-9;
  return { angle: flipped ? angle + Math.PI : angle, flipped };
}
