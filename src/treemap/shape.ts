/**
 * Shapes of the nodes and the morph between them: rectangles (treemap), annular sectors
 * (sunburst) and polygons (in between, while one turns into the other).
 */
export interface RectShape {
  k: 'r';
  x: number;
  y: number;
  w: number;
  h: number;
}

/** Angles in radians, canvas convention (0 = right, clockwise). */
export interface SectorShape {
  k: 's';
  cx: number;
  cy: number;
  r0: number;
  r1: number;
  a0: number;
  a1: number;
}

export interface PolyShape {
  k: 'p';
  /** x0, y0, x1, y1… */
  pts: number[];
}

export type Shape = RectShape | SectorShape | PolyShape;

const lerp = (a: number, b: number, t: number): number => a + (b - a) * t;

// points per edge: the long edges (top / outer arc, bottom / inner arc) and the short ones
const LONG = 22;
const SHORT = 8;

/**
 * Outline as a polygon, edge by edge so that shapes match when morphing:
 * top ↔ outer arc, right ↔ end radius, bottom ↔ inner arc, left ↔ start radius.
 */
export function sample(s: Shape): number[] {
  if (s.k === 'p') return s.pts;
  const pts: number[] = [];
  const edge = (n: number, f: (t: number) => [number, number]): void => {
    for (let i = 0; i < n; i++) pts.push(...f(i / n));
  };
  if (s.k === 'r') {
    edge(LONG, (t) => [s.x + s.w * t, s.y]);
    edge(SHORT, (t) => [s.x + s.w, s.y + s.h * t]);
    edge(LONG, (t) => [s.x + s.w * (1 - t), s.y + s.h]);
    edge(SHORT, (t) => [s.x, s.y + s.h * (1 - t)]);
  } else {
    const p = (r: number, a: number): [number, number] => [s.cx + r * Math.cos(a), s.cy + r * Math.sin(a)];
    edge(LONG, (t) => p(s.r1, lerp(s.a0, s.a1, t)));
    edge(SHORT, (t) => p(lerp(s.r1, s.r0, t), s.a1));
    edge(LONG, (t) => p(s.r0, lerp(s.a1, s.a0, t)));
    edge(SHORT, (t) => p(lerp(s.r0, s.r1, t), s.a0));
  }
  return pts;
}

/** Shape between a and b (t 0–1). Same kinds interpolate their parameters, others morph as polygons. */
export function lerpShape(a: Shape, b: Shape, t: number): Shape {
  if (t <= 0) return a;
  if (t >= 1) return b;
  if (a.k === 'r' && b.k === 'r') return { k: 'r', x: lerp(a.x, b.x, t), y: lerp(a.y, b.y, t), w: lerp(a.w, b.w, t), h: lerp(a.h, b.h, t) };
  if (a.k === 's' && b.k === 's')
    return { k: 's', cx: lerp(a.cx, b.cx, t), cy: lerp(a.cy, b.cy, t), r0: lerp(a.r0, b.r0, t), r1: lerp(a.r1, b.r1, t), a0: lerp(a.a0, b.a0, t), a1: lerp(a.a1, b.a1, t) };
  const pa = sample(a);
  const pb = sample(b);
  return { k: 'p', pts: pa.map((v, i) => lerp(v, pb[i] ?? v, t)) };
}

/** Same shape squeezed to nothing around its middle (for nodes that appear or leave). */
export function collapse(s: Shape): Shape {
  if (s.k === 'r') return { k: 'r', x: s.x + s.w / 2, y: s.y + s.h / 2, w: 0, h: 0 };
  if (s.k === 's') {
    const m = (s.a0 + s.a1) / 2;
    return { ...s, a0: m, a1: m, r1: s.r0 + (s.r1 - s.r0) * 0.5, r0: s.r0 + (s.r1 - s.r0) * 0.5 };
  }
  const [cx, cy] = center(s);
  return { k: 'p', pts: s.pts.map((v, i) => (i % 2 ? cy : cx)) };
}

export function center(s: Shape): [number, number] {
  if (s.k === 'r') return [s.x + s.w / 2, s.y + s.h / 2];
  if (s.k === 's') {
    const m = (s.a0 + s.a1) / 2;
    const r = s.a1 - s.a0 >= Math.PI * 1.99 && s.r0 === 0 ? 0 : (s.r0 + s.r1) / 2;
    return [s.cx + r * Math.cos(m), s.cy + r * Math.sin(m)];
  }
  let x = 0;
  let y = 0;
  const n = s.pts.length / 2;
  for (let i = 0; i < s.pts.length; i += 2) {
    x += s.pts[i];
    y += s.pts[i + 1];
  }
  return [x / n, y / n];
}

/** Map a shape from the rectangle `from` onto `to` (zoom transitions). */
export function mapShape(s: Shape, from: RectShape, to: RectShape): Shape {
  const sx = from.w ? to.w / from.w : 1;
  const sy = from.h ? to.h / from.h : 1;
  const X = (x: number): number => to.x + (x - from.x) * sx;
  const Y = (y: number): number => to.y + (y - from.y) * sy;
  if (s.k === 'r') return { k: 'r', x: X(s.x), y: Y(s.y), w: s.w * sx, h: s.h * sy };
  if (s.k === 'p') return { k: 'p', pts: s.pts.map((v, i) => (i % 2 ? Y(v) : X(v))) };
  const k = Math.sqrt(sx * sy);
  return { ...s, cx: X(s.cx), cy: Y(s.cy), r0: s.r0 * k, r1: s.r1 * k };
}

export function tracePath(ctx: CanvasRenderingContext2D, s: Shape): void {
  ctx.beginPath();
  if (s.k === 'r') ctx.rect(s.x, s.y, Math.max(0, s.w), Math.max(0, s.h));
  else if (s.k === 's') {
    if (s.a1 - s.a0 >= Math.PI * 2 - 1e-6) {
      ctx.arc(s.cx, s.cy, s.r1, 0, Math.PI * 2);
      if (s.r0 > 0) {
        ctx.moveTo(s.cx + s.r0, s.cy);
        ctx.arc(s.cx, s.cy, s.r0, 0, Math.PI * 2, true);
      }
    } else {
      ctx.arc(s.cx, s.cy, s.r1, s.a0, s.a1);
      if (s.r0 > 0) ctx.arc(s.cx, s.cy, s.r0, s.a1, s.a0, true);
      else ctx.lineTo(s.cx, s.cy);
      ctx.closePath();
    }
  } else {
    ctx.moveTo(s.pts[0], s.pts[1]);
    for (let i = 2; i < s.pts.length; i += 2) ctx.lineTo(s.pts[i], s.pts[i + 1]);
    ctx.closePath();
  }
}

const TAU = Math.PI * 2;

export function contains(s: Shape, x: number, y: number): boolean {
  if (s.k === 'r') return x >= s.x && x <= s.x + s.w && y >= s.y && y <= s.y + s.h;
  if (s.k === 's') {
    const d = Math.hypot(x - s.cx, y - s.cy);
    if (d < s.r0 || d > s.r1) return false;
    if (s.a1 - s.a0 >= TAU - 1e-6) return true;
    const a = (((Math.atan2(y - s.cy, x - s.cx) - s.a0) % TAU) + TAU) % TAU;
    return a <= s.a1 - s.a0;
  }
  return false;
}
