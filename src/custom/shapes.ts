/**
 * Shapes of the custom family: element trees → flat drawable nodes, drawing, hit-testing,
 * bounds and transitions (numeric interpolation, or polygon morphing between different shapes).
 */
import { parseColor, toColor, type RGBA } from '../shared/color';
import { customFlattenPath, customParsePath, customPathBounds, customTracePath, type CustomPathCommand } from './path';
import type { CustomElement, CustomGradient, CustomLabel, CustomPaint, CustomShapeType, CustomStyle, CustomTransitionProps } from './types';

export type Pt = [number, number];

/** Decomposed transform: translate · rotate · scale. */
export interface CustomTf {
  x: number;
  y: number;
  rot: number;
  sx: number;
  sy: number;
}

/** A drawable leaf. */
export interface CustomNode {
  key: string;
  type: CustomShapeType;
  shape: Record<string, any>;
  style: CustomStyle;
  emphasis?: CustomStyle;
  tf: CustomTf;
  /** cumulative opacity of the groups × style.opacity */
  opacity: number;
  /** uniform scale around the local center (enter / leave pops) */
  scale: number;
  z: number;
  order: number;
  si: number;
  di: number;
  silent?: boolean;
  label?: CustomLabel;
  enterFrom?: CustomTransitionProps;
  leaveTo?: CustomTransitionProps;
  info?: unknown;
  draggable?: boolean;
  cursor?: string;
  /** clip rect in px (series clip) */
  clip?: { x: number; y: number; width: number; height: number } | null;
  /** measured text width (set when drawn) */
  textW?: number;
}

export const IDENTITY: CustomTf = { x: 0, y: 0, rot: 0, sx: 1, sy: 1 };

type Mat = [number, number, number, number, number, number];

const mul = (m: Mat, n: Mat): Mat => [m[0] * n[0] + m[2] * n[1], m[1] * n[0] + m[3] * n[1], m[0] * n[2] + m[2] * n[3], m[1] * n[2] + m[3] * n[3], m[0] * n[4] + m[2] * n[5] + m[4], m[1] * n[4] + m[3] * n[5] + m[5]];

export function tfMatrix(t: CustomTf): Mat {
  const c = Math.cos(t.rot);
  const s = Math.sin(t.rot);
  return [t.sx * c, t.sx * s, -t.sy * s, t.sy * c, t.x, t.y];
}

function decompose(m: Mat): CustomTf {
  const sx = Math.hypot(m[0], m[1]) || 0;
  const rot = Math.atan2(m[1], m[0]);
  const sy = sx ? (m[0] * m[3] - m[1] * m[2]) / sx : Math.hypot(m[2], m[3]);
  return { x: m[4], y: m[5], rot, sx, sy };
}

function invert(m: Mat): Mat | null {
  const det = m[0] * m[3] - m[1] * m[2];
  if (!det) return null;
  return [m[3] / det, -m[1] / det, -m[2] / det, m[0] / det, (m[2] * m[5] - m[3] * m[4]) / det, (m[1] * m[4] - m[0] * m[5]) / det];
}

const apply = (m: Mat, x: number, y: number): Pt => [m[0] * x + m[2] * y + m[4], m[1] * x + m[3] * y + m[5]];

// ------------------------------------------------------------------ element tree → nodes

export interface FlattenCtx {
  si: number;
  di: number;
  out: CustomNode[];
  clip?: CustomNode['clip'];
}

const pathCache = new Map<string, { cmds: CustomPathCommand[]; b: { x: number; y: number; width: number; height: number } }>();

/** Parsed path (cached by its `d`). */
export function pathOf(d: string): { cmds: CustomPathCommand[]; b: { x: number; y: number; width: number; height: number } } {
  let p = pathCache.get(d);
  if (!p) {
    let cmds: CustomPathCommand[] = [];
    try {
      cmds = customParsePath(d);
    } catch {
      cmds = [];
    }
    p = { cmds, b: customPathBounds(cmds) };
    if (pathCache.size > 500) pathCache.clear();
    pathCache.set(d, p);
  }
  return p;
}

/** Turn the element tree of one data item into flat nodes (in drawing order). */
export function customFlatten(
  el: CustomElement | null | undefined | false,
  fc: FlattenCtx,
  parent: { m: Mat; opacity: number; style: CustomStyle; z: number; enter?: CustomTransitionProps; leave?: CustomTransitionProps } = { m: [1, 0, 0, 1, 0, 0], opacity: 1, style: {}, z: 0 },
  path = '0',
): void {
  if (!el || el.ignore) return;
  const ox = el.originX ?? 0;
  const oy = el.originY ?? 0;
  const local = tfMatrix({ x: (el.x ?? 0) + ox, y: (el.y ?? 0) + oy, rot: el.rotation ?? 0, sx: el.scaleX ?? 1, sy: el.scaleY ?? 1 });
  const m = mul(mul(parent.m, local), [1, 0, 0, 1, -ox, -oy]);
  const { opacity: so, ...ownStyle } = el.style ?? {};
  const opacity = parent.opacity * (so ?? 1);
  const z = parent.z + (el.z ?? 0);
  if (el.type === 'group') {
    const style = { ...parent.style, ...ownStyle };
    // a group's enterFrom / leaveTo (opacity, scale, style) passes to children without their own
    const pick = (t: CustomTransitionProps | undefined): CustomTransitionProps | undefined => (t ? { opacity: t.opacity, scale: t.scale, style: t.style } : undefined);
    const enter = pick(el.enterFrom) ?? parent.enter;
    const leave = pick(el.leaveTo) ?? parent.leave;
    el.children.forEach((c, i) => {
      if (!c) return;
      customFlatten(c, fc, { m, opacity, style, z, enter, leave }, `${path}.${i}`);
    });
    return;
  }
  const key = el.id !== undefined && el.id !== null ? `#${el.id}` : `${fc.si}:${fc.di}:${path}`;
  fc.out.push({
    key,
    type: el.type,
    shape: 'shape' in el ? { ...(el.shape as object) } : {},
    style: { ...parent.style, ...ownStyle },
    emphasis: el.emphasis?.style,
    tf: decompose(m),
    opacity,
    scale: 1,
    z,
    order: fc.out.length,
    si: fc.si,
    di: fc.di,
    silent: el.silent,
    label: el.label,
    enterFrom: el.enterFrom ?? parent.enter,
    leaveTo: el.leaveTo ?? parent.leave,
    info: el.info,
    draggable: el.draggable,
    cursor: el.cursor,
    clip: fc.clip ?? null,
  });
}

// ------------------------------------------------------------------ bounds and polygons (local space)

export type TextMeasure = (text: string, font: string) => number;

const approxMeasure: TextMeasure = (t, font) => t.length * (parseFloat(font.match(/(\d+(?:\.\d+)?)px/)?.[1] ?? '12') * 0.58);

export function fontOf(s: CustomStyle, family: string): string {
  if (s.font) return s.font;
  return `${s.fontWeight ?? 400} ${s.fontSize ?? 12}px ${s.fontFamily ?? family}`;
}

function rectNorm(s: Record<string, any>): { x: number; y: number; w: number; h: number } {
  let x = +s.x || 0;
  let y = +s.y || 0;
  let w = +s.width || 0;
  let h = +s.height || 0;
  if (w < 0) {
    x += w;
    w = -w;
  }
  if (h < 0) {
    y += h;
    h = -h;
  }
  return { x, y, w, h };
}

/** Path fit: raw path coordinates → local coordinates of the box. */
function pathFit(s: Record<string, any>): { cmds: CustomPathCommand[]; f: (x: number, y: number) => Pt } {
  const { cmds, b } = pathOf(String(s.pathData ?? ''));
  const x0 = s.x ?? b.x;
  const y0 = s.y ?? b.y;
  if (s.width === undefined && s.height === undefined) {
    const dx = (s.x ?? b.x) - b.x;
    const dy = (s.y ?? b.y) - b.y;
    return { cmds, f: (x, y) => [x + dx, y + dy] };
  }
  const W = s.width ?? b.width;
  const H = s.height ?? b.height;
  let kx = b.width ? W / b.width : 1;
  let ky = b.height ? H / b.height : 1;
  let ox = x0;
  let oy = y0;
  if ((s.layout ?? 'center') === 'center') {
    const k = Math.min(kx, ky);
    ox += (W - b.width * k) / 2;
    oy += (H - b.height * k) / 2;
    kx = ky = k;
  }
  return { cmds, f: (x, y) => [ox + (x - b.x) * kx, oy + (y - b.y) * ky] };
}

/** Text box in local space. */
function textBox(n: CustomNode, measure: TextMeasure, family: string): { x: number; y: number; w: number; h: number } {
  const s = n.style;
  const lines = String(s.text ?? '').split('\n');
  const fs = s.fontSize ?? 12;
  const lh = s.lineHeight ?? fs * 1.25;
  const w = n.textW ?? Math.max(0, ...lines.map((l) => measure(l, fontOf(s, family))));
  const h = lines.length * lh;
  const a = s.align ?? 'left';
  const x = a === 'center' ? -w / 2 : a === 'right' || a === 'end' ? -w : 0;
  const va = s.verticalAlign ?? 'top';
  const y = va === 'middle' ? -h / 2 : va === 'bottom' ? -h : 0;
  return { x, y, w, h };
}

/** Bounding box of a node in its local space. */
export function customLocalBounds(n: CustomNode, measure: TextMeasure = approxMeasure, family = 'sans-serif'): { x: number; y: number; w: number; h: number } {
  const s = n.shape;
  switch (n.type) {
    case 'rect':
    case 'image':
      return rectNorm(s);
    case 'circle':
      return { x: s.cx - s.r, y: s.cy - s.r, w: 2 * s.r, h: 2 * s.r };
    case 'ellipse':
      return { x: s.cx - s.rx, y: s.cy - s.ry, w: 2 * s.rx, h: 2 * s.ry };
    case 'line':
      return { x: Math.min(s.x1, s.x2), y: Math.min(s.y1, s.y2), w: Math.abs(s.x2 - s.x1), h: Math.abs(s.y2 - s.y1) };
    case 'text':
      return textBox(n, measure, family);
    default: {
      const pts = localPolygon(n, 48);
      if (!pts.length) return { x: 0, y: 0, w: 0, h: 0 };
      let x0 = Infinity;
      let y0 = Infinity;
      let x1 = -Infinity;
      let y1 = -Infinity;
      for (const [x, y] of pts) {
        x0 = Math.min(x0, x);
        y0 = Math.min(y0, y);
        x1 = Math.max(x1, x);
        y1 = Math.max(y1, y);
      }
      return { x: x0, y: y0, w: x1 - x0, h: y1 - y0 };
    }
  }
}

/** Outline of a node as points in its local space (n ≈ number of samples for curves). */
export function localPolygon(nd: CustomNode, n = 48): Pt[] {
  const s = nd.shape;
  switch (nd.type) {
    case 'rect':
    case 'image':
    case 'text': {
      const r = nd.type === 'text' ? textBox(nd, approxMeasure, 'sans-serif') : rectNorm(s);
      return [
        [r.x, r.y],
        [r.x + r.w, r.y],
        [r.x + r.w, r.y + r.h],
        [r.x, r.y + r.h],
      ];
    }
    case 'circle':
    case 'ellipse': {
      const rx = nd.type === 'circle' ? s.r : s.rx;
      const ry = nd.type === 'circle' ? s.r : s.ry;
      return Array.from({ length: n }, (_, i) => {
        const a = -Math.PI / 2 + (i / n) * Math.PI * 2;
        return [s.cx + rx * Math.cos(a), s.cy + ry * Math.sin(a)] as Pt;
      });
    }
    case 'sector':
    case 'arc': {
      const a0 = s.startAngle;
      const a1 = s.endAngle;
      const k = Math.max(2, Math.ceil((Math.abs(a1 - a0) / (Math.PI * 2)) * n));
      const out: Pt[] = [];
      for (let i = 0; i <= k; i++) {
        const a = a0 + ((a1 - a0) * i) / k;
        out.push([s.cx + s.r * Math.cos(a), s.cy + s.r * Math.sin(a)]);
      }
      if (nd.type === 'arc') return out;
      const r0 = s.r0 ?? 0;
      if (r0 > 0) for (let i = k; i >= 0; i--) {
        const a = a0 + ((a1 - a0) * i) / k;
        out.push([s.cx + r0 * Math.cos(a), s.cy + r0 * Math.sin(a)]);
      }
      else out.push([s.cx, s.cy]);
      return out;
    }
    case 'polygon':
    case 'polyline':
      return (s.points ?? []).map((p: Pt) => [p[0], p[1]] as Pt);
    case 'line':
      return [
        [s.x1, s.y1],
        [s.x2, s.y2],
      ];
    case 'path': {
      const { cmds, f } = pathFit(s);
      const subs = customFlattenPath(cmds, 8);
      let best: Pt[] = [];
      let bestA = -1;
      for (const sub of subs) {
        const pts = sub.points.map(([x, y]) => f(x, y));
        const a = Math.abs(signedArea(pts));
        if (a > bestA) {
          bestA = a;
          best = pts;
        }
      }
      return best;
    }
  }
  return [];
}

function signedArea(p: Pt[]): number {
  let a = 0;
  for (let i = 0, j = p.length - 1; i < p.length; j = i++) a += (p[j][0] - p[i][0]) * (p[j][1] + p[i][1]);
  return a / 2;
}

/** Points evenly spaced along a ring (closed) or a line (open). */
export function customResample(pts: Pt[], n: number, closed = true): Pt[] {
  if (!pts.length) return Array.from({ length: n }, () => [0, 0] as Pt);
  if (pts.length === 1) return Array.from({ length: n }, () => [pts[0][0], pts[0][1]] as Pt);
  const ring = closed ? [...pts, pts[0]] : pts;
  const cum = [0];
  for (let i = 1; i < ring.length; i++) cum.push(cum[i - 1] + Math.hypot(ring[i][0] - ring[i - 1][0], ring[i][1] - ring[i - 1][1]));
  const total = cum[cum.length - 1];
  if (!total) return Array.from({ length: n }, () => [pts[0][0], pts[0][1]] as Pt);
  const out: Pt[] = [];
  let j = 1;
  for (let i = 0; i < n; i++) {
    const d = closed ? (i / n) * total : (i / Math.max(1, n - 1)) * total;
    while (j < cum.length - 1 && cum[j] < d) j++;
    const seg = cum[j] - cum[j - 1] || 1;
    const t = (d - cum[j - 1]) / seg;
    out.push([ring[j - 1][0] + (ring[j][0] - ring[j - 1][0]) * t, ring[j - 1][1] + (ring[j][1] - ring[j - 1][1]) * t]);
  }
  return out;
}

/** Rotate `b` (and flip it when wound the other way) so that its points line up with `a` (same length). */
export function customAlignRings(a: Pt[], b: Pt[]): Pt[] {
  const n = b.length;
  if (n !== a.length || n < 3) return b;
  let ring = b;
  if (Math.sign(signedArea(a)) !== Math.sign(signedArea(b)) && signedArea(a) && signedArea(b)) ring = [...b].reverse();
  let best = 0;
  let bestD = Infinity;
  const stride = n > 64 ? 2 : 1;
  for (let o = 0; o < n; o += stride) {
    let d = 0;
    for (let i = 0; i < n && d < bestD; i++) {
      const p = a[i];
      const q = ring[(i + o) % n];
      d += (p[0] - q[0]) ** 2 + (p[1] - q[1]) ** 2;
    }
    if (d < bestD) {
      bestD = d;
      best = o;
    }
  }
  return best ? ring.map((_, i) => ring[(i + best) % n]) : ring;
}

/** Outline of a node in world px (transform and pop scale applied). */
export function worldPolygon(nd: CustomNode, n = 48): Pt[] {
  const m = nodeMatrix(nd);
  return localPolygon(nd, n).map(([x, y]) => apply(m, x, y));
}

/** World matrix of a node, with its pop scale around the local center. */
export function nodeMatrix(nd: CustomNode, measure?: TextMeasure, family?: string): Mat {
  let m = tfMatrix(nd.tf);
  if (nd.scale !== 1) {
    const b = customLocalBounds(nd, measure, family);
    const cx = b.x + b.w / 2;
    const cy = b.y + b.h / 2;
    m = mul(m, [nd.scale, 0, 0, nd.scale, cx * (1 - nd.scale), cy * (1 - nd.scale)]);
  }
  return m;
}

// ------------------------------------------------------------------ hit-testing

export function customPointInPolygon(x: number, y: number, pts: Pt[]): boolean {
  let inside = false;
  for (let i = 0, j = pts.length - 1; i < pts.length; j = i++) {
    const [xi, yi] = pts[i];
    const [xj, yj] = pts[j];
    if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) inside = !inside;
  }
  return inside;
}

function distToSegment(x: number, y: number, a: Pt, b: Pt): number {
  const dx = b[0] - a[0];
  const dy = b[1] - a[1];
  const l2 = dx * dx + dy * dy;
  const t = l2 ? Math.max(0, Math.min(1, ((x - a[0]) * dx + (y - a[1]) * dy) / l2)) : 0;
  return Math.hypot(x - a[0] - t * dx, y - a[1] - t * dy);
}

function nearPolyline(x: number, y: number, pts: Pt[], tol: number, closed = false): boolean {
  for (let i = 1; i < pts.length; i++) if (distToSegment(x, y, pts[i - 1], pts[i]) <= tol) return true;
  return closed && pts.length > 2 && distToSegment(x, y, pts[pts.length - 1], pts[0]) <= tol;
}

const hasPaint = (p: CustomPaint | undefined): boolean => p !== undefined && p !== 'none' && p !== 'transparent';

function angleIn(a: number, a0: number, a1: number): boolean {
  let lo = Math.min(a0, a1);
  const hi = Math.max(a0, a1);
  if (hi - lo >= Math.PI * 2 - 1e-9) return true;
  const T = Math.PI * 2;
  lo = ((lo % T) + T) % T;
  const span = hi - Math.min(a0, a1);
  const d = (((a - lo) % T) + T) % T;
  return d <= span + 1e-9;
}

/** Is the point (x, y) in px on the node? `tol` = extra px around thin shapes. */
export function customHitTest(nd: CustomNode, x: number, y: number, tol = 3, measure: TextMeasure = approxMeasure, family = 'sans-serif'): boolean {
  if (nd.opacity <= 0.02 || nd.scale <= 0.01) return false;
  if (nd.clip && (x < nd.clip.x || y < nd.clip.y || x > nd.clip.x + nd.clip.width || y > nd.clip.y + nd.clip.height)) return false;
  const inv = invert(nodeMatrix(nd, measure, family));
  if (!inv) return false;
  const [lx, ly] = apply(inv, x, y);
  const k = Math.hypot(nd.tf.sx, 0) * nd.scale || 1;
  const s = nd.shape;
  const st = nd.style;
  const lw = hasPaint(st.stroke) ? (st.lineWidth ?? 1) : 0;
  const t = (Math.max(lw / 2, tol) + 0) / k;
  const filled = hasPaint(st.fill);
  switch (nd.type) {
    case 'rect':
    case 'image': {
      const r = rectNorm(s);
      const e = filled || nd.type === 'image' ? lw / 2 : 0;
      if (filled || nd.type === 'image') return lx >= r.x - e && lx <= r.x + r.w + e && ly >= r.y - e && ly <= r.y + r.h + e;
      return nearPolyline(lx, ly, localPolygon(nd), t, true);
    }
    case 'text': {
      const b = textBox(nd, measure, family);
      return lx >= b.x - 2 && lx <= b.x + b.w + 2 && ly >= b.y - 2 && ly <= b.y + b.h + 2;
    }
    case 'circle':
    case 'ellipse': {
      const rx = nd.type === 'circle' ? s.r : s.rx;
      const ry = nd.type === 'circle' ? s.r : s.ry;
      if (!(rx > 0 && ry > 0)) return false;
      const dx = lx - s.cx;
      const dy = ly - s.cy;
      if (filled) return (dx / (rx + lw / 2)) ** 2 + (dy / (ry + lw / 2)) ** 2 <= 1;
      const d = Math.hypot(dx / rx, dy / ry);
      return Math.abs(d - 1) * Math.min(rx, ry) <= t;
    }
    case 'sector': {
      const dx = lx - s.cx;
      const dy = ly - s.cy;
      const d = Math.hypot(dx, dy);
      if (d < (s.r0 ?? 0) || d > s.r + lw / 2) return false;
      return angleIn(Math.atan2(dy, dx), s.startAngle, s.endAngle);
    }
    case 'arc': {
      const dx = lx - s.cx;
      const dy = ly - s.cy;
      return Math.abs(Math.hypot(dx, dy) - s.r) <= t && angleIn(Math.atan2(dy, dx), s.startAngle, s.endAngle);
    }
    case 'polygon': {
      const pts: Pt[] = s.points ?? [];
      return (filled && customPointInPolygon(lx, ly, pts)) || nearPolyline(lx, ly, pts, t, true);
    }
    case 'polyline':
      return nearPolyline(lx, ly, s.points ?? [], t);
    case 'line':
      return distToSegment(lx, ly, [s.x1, s.y1], [s.x2, s.y2]) <= t;
    case 'path': {
      const { cmds, f } = pathFit(s);
      const subs = customFlattenPath(cmds, 8).map((sub) => ({ closed: sub.closed, pts: sub.points.map(([a, b]) => f(a, b)) }));
      if (filled) {
        let inside = false;
        for (const sub of subs) if (customPointInPolygon(lx, ly, sub.pts)) inside = !inside;
        if (inside) return true;
      }
      return subs.some((sub) => nearPolyline(lx, ly, sub.pts, t, sub.closed));
    }
  }
  return false;
}

// ------------------------------------------------------------------ interpolation

const lerp = (a: number, b: number, t: number): number => a + (b - a) * t;

const colorCache = new Map<string, RGBA>();
function rgba(c: string): RGBA {
  let v = colorCache.get(c);
  if (!v) {
    v = parseColor(c);
    if (colorCache.size > 2000) colorCache.clear();
    colorCache.set(c, v);
  }
  return v;
}

/** Interpolate two colors (or switch gradients / 'none' at the middle). */
export function customLerpColor(a: CustomPaint | undefined, b: CustomPaint | undefined, t: number): CustomPaint | undefined {
  if (a === b) return b;
  if (typeof a !== 'string' || typeof b !== 'string' || !hasPaint(a) || !hasPaint(b)) {
    // fade from / to nothing: keep the color, opacity does the rest
    if (typeof a === 'string' && typeof b === 'string') {
      if (!hasPaint(a)) return toColor([...rgba(b).slice(0, 3), rgba(b)[3] * t] as RGBA);
      if (!hasPaint(b)) return toColor([...rgba(a).slice(0, 3), rgba(a)[3] * (1 - t)] as RGBA);
    }
    if (a === undefined) return b;
    if (b === undefined) return t < 1 ? a : b;
    return t < 0.5 ? a : b;
  }
  const A = rgba(a);
  const B = rgba(b);
  return toColor([lerp(A[0], B[0], t), lerp(A[1], B[1], t), lerp(A[2], B[2], t), lerp(A[3], B[3], t)]);
}

function lerpStyle(a: CustomStyle, b: CustomStyle, t: number): CustomStyle {
  const out: CustomStyle = { ...b };
  out.fill = customLerpColor(a.fill, b.fill, t);
  out.stroke = customLerpColor(a.stroke, b.stroke, t);
  for (const k of ['lineWidth', 'fillOpacity', 'strokeOpacity', 'fontSize', 'shadowBlur'] as const) {
    const va = a[k];
    const vb = b[k];
    if (typeof va === 'number' && typeof vb === 'number') out[k] = lerp(va, vb, t);
  }
  if (a.text !== b.text && t < 0.5) out.text = a.text;
  return out;
}

function lerpAngle(a: number, b: number, t: number): number {
  let d = (b - a) % (Math.PI * 2);
  if (d > Math.PI) d -= Math.PI * 2;
  if (d < -Math.PI) d += Math.PI * 2;
  return a + d * t;
}

function lerpPoints(a: Pt[], b: Pt[], t: number, closed: boolean): Pt[] {
  let A = a;
  let B = b;
  if (A.length !== B.length) {
    const n = Math.max(A.length, B.length);
    A = customResample(A, n, closed);
    B = customResample(B, n, closed);
  }
  return B.map((p, i) => [lerp(A[i][0], p[0], t), lerp(A[i][1], p[1], t)] as Pt);
}

/** Can a become b by interpolating its props (same kind of shape)? */
function sameKind(a: CustomNode, b: CustomNode): boolean {
  if (a.type !== b.type) return false;
  if (a.type === 'path') return a.shape.pathData === b.shape.pathData;
  return true;
}

/** Can a turn into b at all (text and images only fade)? */
export function customCanMorph(a: CustomNode, b: CustomNode): boolean {
  if (sameKind(a, b)) return true;
  const solid = (n: CustomNode): boolean => n.type !== 'text' && n.type !== 'image';
  return solid(a) && solid(b);
}

/** State of a node at t (0 = a, 1 = b). Different shapes morph through polygons in world px. */
export function customLerpNode(a: CustomNode, b: CustomNode, t: number): CustomNode {
  if (t >= 1) return b;
  const base: CustomNode = { ...b, style: lerpStyle(a.style, b.style, t), opacity: lerp(a.opacity, b.opacity, t), scale: lerp(a.scale, b.scale, t) };
  if (sameKind(a, b)) {
    const shape: Record<string, any> = { ...b.shape };
    for (const k of Object.keys(b.shape)) {
      const va = a.shape[k];
      const vb = b.shape[k];
      if (typeof va === 'number' && typeof vb === 'number') shape[k] = lerp(va, vb, t);
      else if (k === 'points' && Array.isArray(va) && Array.isArray(vb)) shape[k] = lerpPoints(va, vb, t, b.type === 'polygon');
      else if (k === 'r' && Array.isArray(vb)) shape[k] = vb.map((v: number, i: number) => lerp(Array.isArray(va) ? (va[i] ?? v) : typeof va === 'number' ? va : v, v, t));
    }
    base.shape = shape;
    base.tf = { x: lerp(a.tf.x, b.tf.x, t), y: lerp(a.tf.y, b.tf.y, t), rot: lerpAngle(a.tf.rot, b.tf.rot, t), sx: lerp(a.tf.sx, b.tf.sx, t), sy: lerp(a.tf.sy, b.tf.sy, t) };
    return base;
  }
  // morph: both outlines in world px, same number of points, lined up
  const n = 40;
  const open = (x: CustomNode): boolean => x.type === 'polyline' || x.type === 'line' || x.type === 'arc';
  const pa = customResample(worldPolygon(a), n, !open(a));
  const pb = customAlignRings(pa, customResample(worldPolygon(b), n, !open(b)));
  base.type = 'polygon';
  base.shape = { points: pa.map((p, i) => [lerp(p[0], pb[i][0], t), lerp(p[1], pb[i][1], t)]) };
  base.tf = { ...IDENTITY };
  base.scale = 1;
  base.label = t > 0.5 ? b.label : a.label;
  // a stroke-only line turning into a filled shape: fill fades in
  if (!hasPaint(a.style.fill) && hasPaint(b.style.fill) && typeof b.style.fill === 'string') base.style.fill = customLerpColor('transparent', b.style.fill, t);
  if (hasPaint(a.style.fill) && !hasPaint(b.style.fill) && typeof a.style.fill === 'string') base.style.fill = customLerpColor(a.style.fill, 'transparent', t);
  return base;
}

/** A node with transition props applied (enterFrom / leaveTo). */
export function customWithProps(n: CustomNode, p: CustomTransitionProps | undefined, fallback: CustomTransitionProps): CustomNode {
  const q = p ?? fallback;
  const out: CustomNode = { ...n, tf: { ...n.tf }, shape: { ...n.shape, ...(q.shape ?? {}) }, style: { ...n.style, ...(q.style ?? {}) } };
  if (q.opacity !== undefined) out.opacity = q.opacity * (p ? 1 : 1);
  if (q.scale !== undefined) out.scale = q.scale;
  if (q.x !== undefined) out.tf.x = q.x;
  if (q.y !== undefined) out.tf.y = q.y;
  if (q.rotation !== undefined) out.tf.rot = q.rotation;
  return out;
}

// ------------------------------------------------------------------ drawing

const images = new Map<string, HTMLImageElement>();

function imageOf(src: string | CanvasImageSource, onLoad: () => void): CanvasImageSource | null {
  if (typeof src !== 'string') return src;
  let im = images.get(src);
  if (!im) {
    im = new Image();
    im.onload = onLoad;
    im.src = src;
    images.set(src, im);
  }
  return im.complete && im.naturalWidth ? im : null;
}

function paint(ctx: CanvasRenderingContext2D, p: CustomPaint, box: { x: number; y: number; w: number; h: number }): string | CanvasGradient {
  if (typeof p === 'string') return p;
  const g: CustomGradient = p;
  const X = (v: number | undefined, d: number): number => (g.global ? (v ?? d) : box.x + (v ?? d) * box.w);
  const Y = (v: number | undefined, d: number): number => (g.global ? (v ?? d) : box.y + (v ?? d) * box.h);
  const grad =
    g.type === 'radial'
      ? ctx.createRadialGradient(X(g.x, 0.5), Y(g.y, 0.5), 0, X(g.x, 0.5), Y(g.y, 0.5), Math.max(0.001, g.global ? (g.r ?? 1) : (g.r ?? 0.5) * Math.max(box.w, box.h)))
      : ctx.createLinearGradient(X(g.x, 0), Y(g.y, 0), X(g.x2, 0), Y(g.y2, 1));
  for (const [o, c] of g.stops) grad.addColorStop(Math.min(1, Math.max(0, o)), c);
  return grad;
}

function smoothPath(ctx: CanvasRenderingContext2D, pts: Pt[], closed: boolean): void {
  const n = pts.length;
  if (n < 3) {
    pts.forEach((p, i) => (i ? ctx.lineTo(p[0], p[1]) : ctx.moveTo(p[0], p[1])));
    return;
  }
  const at = (i: number): Pt => (closed ? pts[(i + n) % n] : pts[Math.max(0, Math.min(n - 1, i))]);
  ctx.moveTo(pts[0][0], pts[0][1]);
  const last = closed ? n : n - 1;
  for (let i = 0; i < last; i++) {
    const p0 = at(i - 1);
    const p1 = at(i);
    const p2 = at(i + 1);
    const p3 = at(i + 2);
    ctx.bezierCurveTo(p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6, p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6, p2[0], p2[1]);
  }
}

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number | number[] | undefined): void {
  const rs = (Array.isArray(r) ? [r[0] ?? 0, r[1] ?? r[0] ?? 0, r[2] ?? r[0] ?? 0, r[3] ?? r[1] ?? r[0] ?? 0] : [r ?? 0, r ?? 0, r ?? 0, r ?? 0]).map((v) => Math.max(0, Math.min(v, w / 2, h / 2)));
  if (!rs.some((v) => v > 0)) {
    ctx.rect(x, y, w, h);
    return;
  }
  ctx.moveTo(x + rs[0], y);
  ctx.lineTo(x + w - rs[1], y);
  ctx.arcTo(x + w, y, x + w, y + rs[1], rs[1]);
  ctx.lineTo(x + w, y + h - rs[2]);
  ctx.arcTo(x + w, y + h, x + w - rs[2], y + h, rs[2]);
  ctx.lineTo(x + rs[3], y + h);
  ctx.arcTo(x, y + h, x, y + h - rs[3], rs[3]);
  ctx.lineTo(x, y + rs[0]);
  ctx.arcTo(x, y, x + rs[0], y, rs[0]);
  ctx.closePath();
}

function buildPath(ctx: CanvasRenderingContext2D, n: CustomNode): void {
  const s = n.shape;
  ctx.beginPath();
  switch (n.type) {
    case 'rect': {
      const r = rectNorm(s);
      roundRect(ctx, r.x, r.y, r.w, r.h, s.r);
      break;
    }
    case 'circle':
      if (s.r > 0) ctx.arc(s.cx, s.cy, s.r, 0, Math.PI * 2);
      break;
    case 'ellipse':
      if (s.rx > 0 && s.ry > 0) ctx.ellipse(s.cx, s.cy, s.rx, s.ry, 0, 0, Math.PI * 2);
      break;
    case 'sector': {
      const r0 = Math.max(0, s.r0 ?? 0);
      const r = Math.max(0, s.r);
      const ccw = s.endAngle < s.startAngle;
      ctx.arc(s.cx, s.cy, r, s.startAngle, s.endAngle, ccw);
      if (r0 > 0) ctx.arc(s.cx, s.cy, r0, s.endAngle, s.startAngle, !ccw);
      else ctx.lineTo(s.cx, s.cy);
      ctx.closePath();
      break;
    }
    case 'arc':
      ctx.arc(s.cx, s.cy, Math.max(0, s.r), s.startAngle, s.endAngle, s.endAngle < s.startAngle);
      break;
    case 'polygon':
    case 'polyline': {
      const pts: Pt[] = s.points ?? [];
      if (s.smooth) smoothPath(ctx, pts, n.type === 'polygon');
      else pts.forEach((p, i) => (i ? ctx.lineTo(p[0], p[1]) : ctx.moveTo(p[0], p[1])));
      if (n.type === 'polygon') ctx.closePath();
      break;
    }
    case 'line':
      ctx.moveTo(s.x1, s.y1);
      ctx.lineTo(s.x2, s.y2);
      break;
    case 'path': {
      const { cmds, f } = pathFit(s);
      customTracePath(ctx, cmds, f);
      break;
    }
  }
}

export interface DrawEnv {
  dpr: number;
  family: string;
  text: string;
  onImage: () => void;
}

/** Draw one node (its transform, opacity and style); returns nothing. Labels are drawn by `customDrawLabel`. */
export function customDrawNode(ctx: CanvasRenderingContext2D, n: CustomNode, env: DrawEnv, style: CustomStyle = n.style): void {
  const alpha = n.opacity;
  if (alpha <= 0.002 || n.scale <= 0.001) return;
  const m = nodeMatrix(n, (t, f) => {
    ctx.font = f;
    return ctx.measureText(t).width;
  }, env.family);
  const d = env.dpr;
  ctx.setTransform(m[0] * d, m[1] * d, m[2] * d, m[3] * d, m[4] * d, m[5] * d);
  if (style.shadowBlur) {
    ctx.shadowBlur = style.shadowBlur * d;
    ctx.shadowColor = style.shadowColor ?? 'rgba(0,0,0,0.4)';
    ctx.shadowOffsetX = (style.shadowOffsetX ?? 0) * d;
    ctx.shadowOffsetY = (style.shadowOffsetY ?? 0) * d;
  }
  if (n.type === 'text') {
    const text = String(style.text ?? '');
    if (text) {
      ctx.font = fontOf(style, env.family);
      ctx.textAlign = style.align ?? 'left';
      const va = style.verticalAlign ?? 'top';
      ctx.textBaseline = va === 'middle' ? 'middle' : va === 'bottom' ? 'alphabetic' : 'top';
      const lines = text.split('\n');
      const fs = style.fontSize ?? 12;
      const lh = style.lineHeight ?? fs * 1.25;
      n.textW = Math.max(...lines.map((l) => ctx.measureText(l).width));
      const y0 = va === 'middle' ? -((lines.length - 1) * lh) / 2 : va === 'bottom' ? -(lines.length - 1) * lh - fs * 0.2 : 0;
      const box = textBox(n, approxMeasure, env.family);
      if (hasPaint(style.stroke)) {
        ctx.globalAlpha = alpha * (style.strokeOpacity ?? 1);
        ctx.strokeStyle = paint(ctx, style.stroke!, box);
        ctx.lineWidth = style.lineWidth ?? 3;
        ctx.lineJoin = 'round';
        lines.forEach((l, i) => ctx.strokeText(l, 0, y0 + i * lh));
      }
      ctx.globalAlpha = alpha * (style.fillOpacity ?? 1);
      ctx.fillStyle = paint(ctx, style.fill ?? env.text, box);
      lines.forEach((l, i) => ctx.fillText(l, 0, y0 + i * lh));
    }
  } else if (n.type === 'image') {
    const im = style.image ? imageOf(style.image, env.onImage) : null;
    const r = rectNorm(n.shape);
    if (im) {
      ctx.globalAlpha = alpha;
      ctx.drawImage(im, r.x, r.y, r.w, r.h);
    }
  } else {
    buildPath(ctx, n);
    const thin = n.type === 'line' || n.type === 'polyline' || n.type === 'arc';
    const box = customLocalBounds(n);
    if (!thin && hasPaint(style.fill)) {
      ctx.globalAlpha = alpha * (style.fillOpacity ?? 1);
      ctx.fillStyle = paint(ctx, style.fill!, box);
      ctx.fill(n.type === 'path' ? 'evenodd' : 'nonzero');
    }
    const stroke = style.stroke ?? (thin ? style.fill : undefined);
    if (hasPaint(stroke) && (style.lineWidth ?? 1) > 0) {
      ctx.shadowBlur = thin ? ctx.shadowBlur : 0;
      ctx.globalAlpha = alpha * (style.strokeOpacity ?? 1);
      ctx.strokeStyle = paint(ctx, stroke!, box);
      ctx.lineWidth = style.lineWidth ?? 1;
      ctx.lineCap = style.lineCap ?? 'butt';
      ctx.lineJoin = style.lineJoin ?? 'miter';
      ctx.setLineDash(style.lineDash ?? []);
      ctx.stroke();
      ctx.setLineDash([]);
    }
  }
  ctx.shadowBlur = 0;
  ctx.shadowOffsetX = 0;
  ctx.shadowOffsetY = 0;
  ctx.globalAlpha = 1;
}

/** World-space bounding box of a node (for labels). */
export function customWorldBounds(n: CustomNode, measure?: TextMeasure, family?: string): { x: number; y: number; w: number; h: number } {
  const b = customLocalBounds(n, measure, family);
  const m = nodeMatrix(n, measure, family);
  const pts = [apply(m, b.x, b.y), apply(m, b.x + b.w, b.y), apply(m, b.x + b.w, b.y + b.h), apply(m, b.x, b.y + b.h)];
  const xs = pts.map((p) => p[0]);
  const ys = pts.map((p) => p[1]);
  const x = Math.min(...xs);
  const y = Math.min(...ys);
  return { x, y, w: Math.max(...xs) - x, h: Math.max(...ys) - y };
}

/** Fit text in a width: as is, cut with "…", or '' when even "…" does not fit. */
export function customTruncate(text: string, width: number, measure: (t: string) => number): string {
  if (measure(text) <= width) return text;
  if (measure('…') > width) return '';
  let lo = 0;
  let hi = text.length;
  while (lo < hi) {
    const mid = (lo + hi + 1) >> 1;
    if (measure(text.slice(0, mid) + '…') <= width) lo = mid;
    else hi = mid - 1;
  }
  return lo ? text.slice(0, lo) + '…' : '';
}

/** Draw the label of a node on its world box (not rotated / scaled with the node). */
export function customDrawLabel(ctx: CanvasRenderingContext2D, n: CustomNode, env: DrawEnv, readable: (fill: CustomPaint | undefined) => string): void {
  const L = n.label;
  if (!L || L.text === '' || L.text === undefined || n.opacity <= 0.02) return;
  const measure: TextMeasure = (t, f) => {
    ctx.font = f;
    return ctx.measureText(t).width;
  };
  const b = customWorldBounds(n, measure, env.family);
  const pos = L.position ?? 'inside';
  // inside labels stay in the visible part of a clipped shape (e.g. a zoomed flame graph)
  if (n.clip && pos.startsWith('inside')) {
    const x0 = Math.max(b.x, n.clip.x);
    const x1 = Math.min(b.x + b.w, n.clip.x + n.clip.width);
    const y0 = Math.max(b.y, n.clip.y);
    const y1 = Math.min(b.y + b.h, n.clip.y + n.clip.height);
    if (x1 <= x0 || y1 <= y0) return;
    b.x = x0;
    b.y = y0;
    b.w = x1 - x0;
    b.h = y1 - y0;
  }
  const fs = L.fontSize ?? 12;
  const dist = L.distance ?? 4;
  const font = `${L.fontWeight ?? 400} ${fs}px ${env.family}`;
  ctx.setTransform(env.dpr, 0, 0, env.dpr, 0, 0);
  ctx.font = font;
  let text = String(L.text);
  const inside = pos.startsWith('inside');
  if (inside && (L.overflow ?? 'truncate') !== 'none') {
    const room = b.w - dist * 2;
    if (b.h < fs * 0.9) return;
    text = L.overflow === 'hide' ? (ctx.measureText(text).width <= room ? text : '') : customTruncate(text, room, (t) => ctx.measureText(t).width);
    if (!text) return;
  }
  let x = b.x + b.w / 2;
  let y = b.y + b.h / 2;
  let align: CanvasTextAlign = 'center';
  let base: CanvasTextBaseline = 'middle';
  if (pos === 'insideLeft') {
    x = b.x + dist;
    align = 'left';
  } else if (pos === 'insideRight') {
    x = b.x + b.w - dist;
    align = 'right';
  } else if (pos === 'insideTop') {
    y = b.y + dist;
    base = 'top';
  } else if (pos === 'insideBottom') {
    y = b.y + b.h - dist;
    base = 'bottom';
  } else if (pos === 'top') {
    y = b.y - dist;
    base = 'bottom';
  } else if (pos === 'bottom') {
    y = b.y + b.h + dist;
    base = 'top';
  } else if (pos === 'left') {
    x = b.x - dist;
    align = 'right';
  } else if (pos === 'right') {
    x = b.x + b.w + dist;
    align = 'left';
  }
  ctx.textAlign = align;
  ctx.textBaseline = base;
  ctx.globalAlpha = Math.min(1, n.opacity);
  if (L.stroke) {
    ctx.strokeStyle = L.stroke;
    ctx.lineWidth = 3;
    ctx.lineJoin = 'round';
    ctx.strokeText(text, x, y);
  }
  ctx.fillStyle = L.color ?? (inside ? readable(n.style.fill) : env.text);
  ctx.fillText(text, x, y);
  ctx.globalAlpha = 1;
}
