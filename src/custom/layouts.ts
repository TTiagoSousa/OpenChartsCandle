/** Layout helpers for custom series: circle packing (front-chain), histogram bins and hexagonal bins. Pure. */
import { niceStep } from '../shared/format';

export interface CustomCircle {
  x: number;
  y: number;
  r: number;
}

// ------------------------------------------------------------------ enclosing circle (Welzl)

function enclosesNot(a: CustomCircle, b: CustomCircle): boolean {
  const dr = a.r - b.r;
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  return dr < 0 || dr * dr < dx * dx + dy * dy;
}

function enclosesWeak(a: CustomCircle, b: CustomCircle): boolean {
  const dr = a.r - b.r + Math.max(a.r, b.r, 1) * 1e-9;
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  return dr > 0 && dr * dr > dx * dx + dy * dy;
}

function enclosesWeakAll(a: CustomCircle, B: CustomCircle[]): boolean {
  return B.every((b) => enclosesWeak(a, b));
}

function basis2(a: CustomCircle, b: CustomCircle): CustomCircle {
  const x21 = b.x - a.x;
  const y21 = b.y - a.y;
  const r21 = b.r - a.r;
  const l = Math.sqrt(x21 * x21 + y21 * y21) || 1e-12;
  return { x: (a.x + b.x + (x21 / l) * r21) / 2, y: (a.y + b.y + (y21 / l) * r21) / 2, r: (l + a.r + b.r) / 2 };
}

function basis3(a: CustomCircle, b: CustomCircle, c: CustomCircle): CustomCircle {
  const { x: x1, y: y1, r: r1 } = a;
  const { x: x2, y: y2, r: r2 } = b;
  const { x: x3, y: y3, r: r3 } = c;
  const a2 = x1 - x2;
  const a3 = x1 - x3;
  const b2 = y1 - y2;
  const b3 = y1 - y3;
  const c2 = r2 - r1;
  const c3 = r3 - r1;
  const d1 = x1 * x1 + y1 * y1 - r1 * r1;
  const d2 = d1 - x2 * x2 - y2 * y2 + r2 * r2;
  const d3 = d1 - x3 * x3 - y3 * y3 + r3 * r3;
  const ab = a3 * b2 - a2 * b3;
  const xa = (b2 * d3 - b3 * d2) / (ab * 2) - x1;
  const xb = (b3 * c2 - b2 * c3) / ab;
  const ya = (a3 * d2 - a2 * d3) / (ab * 2) - y1;
  const yb = (a2 * c3 - a3 * c2) / ab;
  const A = xb * xb + yb * yb - 1;
  const B = 2 * (r1 + xa * xb + ya * yb);
  const C = xa * xa + ya * ya - r1 * r1;
  const r = -(Math.abs(A) > 1e-6 ? (B + Math.sqrt(B * B - 4 * A * C)) / (2 * A) : C / B);
  return { x: x1 + xa + xb * r, y: y1 + ya + yb * r, r };
}

function basis(B: CustomCircle[]): CustomCircle {
  if (B.length === 1) return { x: B[0].x, y: B[0].y, r: B[0].r };
  if (B.length === 2) return basis2(B[0], B[1]);
  return basis3(B[0], B[1], B[2]);
}

function extendBasis(B: CustomCircle[], p: CustomCircle): CustomCircle[] {
  if (enclosesWeakAll(p, B)) return [p];
  for (const b of B) if (enclosesNot(p, b) && enclosesWeakAll(basis2(b, p), B)) return [b, p];
  for (let i = 0; i < B.length - 1; i++)
    for (let j = i + 1; j < B.length; j++)
      if (enclosesNot(basis2(B[i], B[j]), p) && enclosesNot(basis2(B[i], p), B[j]) && enclosesNot(basis2(B[j], p), B[i]) && enclosesWeakAll(basis3(B[i], B[j], p), B)) return [B[i], B[j], p];
  return [p];
}

/** Smallest circle enclosing every circle. */
export function customEnclose(circles: CustomCircle[]): CustomCircle | null {
  // deterministic shuffle (LCG) for the expected linear time
  const arr = circles.slice();
  let s = 1;
  for (let i = arr.length - 1; i > 0; i--) {
    s = (s * 1664525 + 1013904223) % 4294967296;
    const j = Math.floor((s / 4294967296) * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  let B: CustomCircle[] = [];
  let e: CustomCircle | null = null;
  let i = 0;
  let guard = 0;
  while (i < arr.length && guard++ < 1e6) {
    const p = arr[i];
    if (e && enclosesWeak(e, p)) i++;
    else {
      B = extendBasis(B, p);
      e = basis(B);
      i = 0;
    }
  }
  return e;
}

// ------------------------------------------------------------------ siblings (front-chain packing)

function place(b: CustomCircle, a: CustomCircle, c: CustomCircle): void {
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const d2 = dx * dx + dy * dy;
  if (d2) {
    const a2 = (a.r + c.r) ** 2;
    const b2 = (b.r + c.r) ** 2;
    if (a2 > b2) {
      const x = (d2 + b2 - a2) / (2 * d2);
      const y = Math.sqrt(Math.max(0, b2 / d2 - x * x));
      c.x = b.x - x * dx - y * dy;
      c.y = b.y - x * dy + y * dx;
    } else {
      const x = (d2 + a2 - b2) / (2 * d2);
      const y = Math.sqrt(Math.max(0, a2 / d2 - x * x));
      c.x = a.x + x * dx - y * dy;
      c.y = a.y + x * dy + y * dx;
    }
  } else {
    c.x = a.x + c.r;
    c.y = a.y;
  }
}

function intersects(a: CustomCircle, b: CustomCircle): boolean {
  const dr = a.r + b.r - 1e-6;
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  return dr > 0 && dr * dr > dx * dx + dy * dy;
}

interface ChainNode {
  c: CustomCircle;
  next: ChainNode;
  prev: ChainNode;
}

function score(n: ChainNode): number {
  const a = n.c;
  const b = n.next.c;
  const ab = a.r + b.r;
  const dx = (a.x * b.r + b.x * a.r) / ab;
  const dy = (a.y * b.r + b.y * a.r) / ab;
  return dx * dx + dy * dy;
}

/**
 * Pack circles (their `r` set) side by side without overlaps, around (0, 0): sets `x` / `y` of each and
 * returns the radius of the enclosing circle. Front-chain algorithm (Wang et al.), as in d3.packSiblings.
 */
export function customPackSiblings<T extends CustomCircle>(circles: T[]): number {
  const n = circles.length;
  if (!n) return 0;
  let a0 = circles[0];
  a0.x = 0;
  a0.y = 0;
  if (n === 1) return a0.r;
  const b0 = circles[1];
  a0.x = -b0.r;
  b0.x = a0.r;
  b0.y = 0;
  if (n === 2) return a0.r + b0.r;
  place(b0, a0, circles[2]);
  const mk = (c: CustomCircle): ChainNode => ({ c }) as ChainNode;
  let a = mk(a0);
  let b = mk(b0);
  let c = mk(circles[2]);
  a.next = c.prev = b;
  b.next = a.prev = c;
  c.next = b.prev = a;
  pack: for (let i = 3; i < n; i++) {
    place(a.c, b.c, circles[i]);
    c = mk(circles[i]);
    let j = b.next;
    let k = a.prev;
    let sj = b.c.r;
    let sk = a.c.r;
    do {
      if (sj <= sk) {
        if (intersects(j.c, c.c)) {
          b = j;
          a.next = b;
          b.prev = a;
          i--;
          continue pack;
        }
        sj += j.c.r;
        j = j.next;
      } else {
        if (intersects(k.c, c.c)) {
          a = k;
          a.next = b;
          b.prev = a;
          i--;
          continue pack;
        }
        sk += k.c.r;
        k = k.prev;
      }
    } while (j !== k.next);
    c.prev = a;
    c.next = b;
    a.next = b.prev = b = c;
    let aa = score(a);
    while ((c = c.next) !== b) {
      const ca = score(c);
      if (ca < aa) {
        a = c;
        aa = ca;
      }
    }
    b = a.next;
  }
  const chain: CustomCircle[] = [b.c];
  for (let x = b.next; x !== b; x = x.next) chain.push(x.c);
  const e = customEnclose(chain)!;
  for (const ci of circles) {
    ci.x -= e.x;
    ci.y -= e.y;
  }
  return e.r;
}

export interface CustomPackInput {
  name: string;
  value?: number;
  children?: CustomPackInput[];
  [k: string]: unknown;
}

export interface CustomPackedNode {
  x: number;
  y: number;
  r: number;
  depth: number;
  /** sum of the leaf values below */
  value: number;
  data: CustomPackInput;
  parent: CustomPackedNode | null;
  children: CustomPackedNode[];
  /** names from the root, joined by '/' */
  path: string;
}

/**
 * Pack a hierarchy as nested circles in a width × height box (like d3.pack): leaves get an area proportional
 * to their value; `padding` px between siblings and their parent. Returns every node, parents first.
 */
export function customPack(root: CustomPackInput, opts: { width: number; height: number; padding?: number; sort?: boolean }): CustomPackedNode[] {
  const pad = opts.padding ?? 3;
  const build = (d: CustomPackInput, parent: CustomPackedNode | null, depth: number): CustomPackedNode => {
    const node: CustomPackedNode = { x: 0, y: 0, r: 0, depth, value: 0, data: d, parent, children: [], path: parent ? `${parent.path}/${d.name}` : d.name };
    node.children = (d.children ?? []).map((c) => build(c, node, depth + 1));
    if (opts.sort ?? true) node.children.sort((p, q) => q.value - p.value);
    node.value = node.children.length ? node.children.reduce((s, c) => s + c.value, 0) : Math.max(0, d.value ?? 0);
    return node;
  };
  const top = build(root, null, 0);
  const all: CustomPackedNode[] = [];
  const walk = (n: CustomPackedNode): void => {
    all.push(n);
    n.children.forEach(walk);
  };
  walk(top);
  const packWith = (padding: number): void => {
    const post = (n: CustomPackedNode): void => {
      if (!n.children.length) {
        n.r = Math.sqrt(n.value);
        return;
      }
      n.children.forEach(post);
      const kids = n.children.filter((c) => c.r > 0);
      for (const c of kids) c.r += padding;
      const e = customPackSiblings(kids);
      for (const c of kids) c.r -= padding;
      n.r = e + padding;
    };
    post(top);
  };
  packWith(0);
  const half = Math.min(opts.width, opts.height) / 2;
  const k0 = top.r ? half / top.r : 1;
  if (pad > 0) packWith(pad / k0);
  const k = top.r ? half / top.r : 1;
  // children positions are relative to the parent: make them absolute and scale
  const place2 = (n: CustomPackedNode, px: number, py: number): void => {
    n.x = px + n.x * k;
    n.y = py + n.y * k;
    n.r *= k;
    for (const c of n.children) place2(c, n.x, n.y);
  };
  top.x = 0;
  top.y = 0;
  place2(top, opts.width / 2, opts.height / 2);
  return all;
}

// ------------------------------------------------------------------ histogram

export interface CustomBin {
  x0: number;
  x1: number;
  count: number;
}

/** Bin values into equal-width bins with nice edges (`bins` ≈ how many, or a fixed `binWidth`). */
export function customHistogram(values: number[], opts: { bins?: number; binWidth?: number; min?: number; max?: number } = {}): CustomBin[] {
  const v = values.filter((x) => Number.isFinite(x));
  if (!v.length) return [];
  let lo = opts.min ?? Math.min(...v);
  let hi = opts.max ?? Math.max(...v);
  if (hi === lo) hi = lo + 1;
  const w = opts.binWidth ?? niceStep((hi - lo) / (opts.bins ?? Math.ceil(Math.log2(v.length) + 1)));
  if (opts.min === undefined) lo = Math.floor(lo / w) * w;
  if (opts.max === undefined) hi = Math.ceil(hi / w - 1e-9) * w;
  if (hi <= lo) hi = lo + w;
  const n = Math.max(1, Math.round((hi - lo) / w));
  const out: CustomBin[] = Array.from({ length: n }, (_, i) => ({ x0: +(lo + i * w).toPrecision(12), x1: +(lo + (i + 1) * w).toPrecision(12), count: 0 }));
  for (const x of v) {
    if (x < lo || x > hi) continue;
    const i = Math.min(n - 1, Math.floor((x - lo) / w));
    out[i].count++;
  }
  return out;
}

// ------------------------------------------------------------------ hexagonal bins

export interface CustomHexBin {
  /** center */
  x: number;
  y: number;
  /** indices of the points in this hexagon */
  points: number[];
}

/**
 * Group points into pointy-top hexagons of radius `r` (in the points' units). Returns the non-empty hexagons.
 * Use `customHexagon(x, y, r)` for the corners.
 */
export function customHexbin(points: [number, number][], r: number): CustomHexBin[] {
  const dx = r * Math.sqrt(3);
  const dy = r * 1.5;
  const bins = new Map<string, CustomHexBin>();
  points.forEach(([px, py], idx) => {
    if (!Number.isFinite(px) || !Number.isFinite(py)) return;
    let row = Math.round(py / dy);
    let col = Math.round(px / dx - (row & 1) / 2);
    // check the nearest of the candidates around
    const cy = row * dy;
    if (Math.abs(py - cy) * 3 > dy) {
      const cx = (col + (row & 1) / 2) * dx;
      const row2 = py < cy ? row - 1 : row + 1;
      const col2 = Math.round(px / dx - (row2 & 1) / 2);
      const cx2 = (col2 + (row2 & 1) / 2) * dx;
      const cy2 = row2 * dy;
      if ((px - cx2) ** 2 + (py - cy2) ** 2 < (px - cx) ** 2 + (py - cy) ** 2) {
        row = row2;
        col = col2;
      }
    }
    const key = `${row},${col}`;
    let b = bins.get(key);
    if (!b) {
      b = { x: (col + (row & 1) / 2) * dx, y: row * dy, points: [] };
      bins.set(key, b);
    }
    b.points.push(idx);
  });
  return [...bins.values()];
}

/** Corners of a pointy-top hexagon. */
export function customHexagon(x: number, y: number, r: number): [number, number][] {
  return Array.from({ length: 6 }, (_, i) => {
    const a = Math.PI / 6 + (i * Math.PI) / 3;
    return [x + r * Math.cos(a), y + r * Math.sin(a)] as [number, number];
  });
}
