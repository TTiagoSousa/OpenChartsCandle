/** Pure helpers of the graph family (no DOM): force simulation, circular layout, fitting, labels, edges. */

export interface SimNode {
  x: number;
  y: number;
  vx: number;
  vy: number;
  /** Pinned position (fixed or dragged), or null */
  fx: number | null;
  fy: number | null;
}

export interface SimLink {
  source: number;
  target: number;
  /** Rest length */
  distance: number;
}

export interface ForceParams {
  repulsion: number;
  gravity: number;
  friction: number;
  theta: number;
  edgeStrength: number;
  alphaMin: number;
  alphaDecay: number;
  /** Radius of each node for the collision force (null = off) */
  radius: number[] | null;
}

export const FORCE_DEFAULTS: ForceParams = {
  repulsion: 60,
  gravity: 0.08,
  friction: 0.4,
  theta: 0.9,
  edgeStrength: 1,
  alphaMin: 0.001,
  alphaDecay: 1 - Math.pow(0.001, 1 / 300),
  radius: null,
};

/** The same object without its undefined fields (so they do not hide the defaults in a spread). */
export function definedOnly<T extends object>(o: T): Partial<T> {
  return Object.fromEntries(Object.entries(o).filter(([, v]) => v !== undefined)) as Partial<T>;
}

/** Spiral start positions (like d3): no two nodes on the same spot, roughly round. */
export function spiralPosition(i: number, step = 10): { x: number; y: number } {
  const r = step * Math.sqrt(0.5 + i);
  const a = i * Math.PI * (3 - Math.sqrt(5));
  return { x: r * Math.cos(a), y: r * Math.sin(a) };
}

/**
 * Force-directed layout: repulsion between every pair (Barnes–Hut quadtree, O(n log n)), springs on the
 * links, gravity to the center and velocity decay, cooled by `alpha` (velocity Verlet, as in d3-force).
 */
export class ForceSimulation<N extends SimNode = SimNode> {
  alpha = 1;
  alphaTarget = 0;
  readonly p: ForceParams;
  private links: SimLink[] = [];
  private strength: number[] = [];
  private bias: number[] = [];
  private seed = 1;
  // quadtree, rebuilt every tick: flat arrays reused between ticks
  private perm = new Int32Array(0);
  private qStart: number[] = [];
  private qEnd: number[] = [];
  private qCx: number[] = [];
  private qCy: number[] = [];
  private qSize: number[] = [];
  private qKids: number[] = [];
  private qKidStart: number[] = [];
  private qKidCount: number[] = [];

  constructor(
    public nodes: N[],
    links: SimLink[],
    params: Partial<ForceParams> = {},
  ) {
    this.p = { ...FORCE_DEFAULTS, ...params };
    this.setLinks(links);
  }

  setLinks(links: SimLink[]): void {
    const n = this.nodes.length;
    this.links = links.filter((l) => l.source !== l.target && l.source >= 0 && l.target >= 0 && l.source < n && l.target < n);
    const count = new Array(n).fill(0);
    for (const l of this.links) {
      count[l.source]++;
      count[l.target]++;
    }
    this.strength = this.links.map((l) => this.p.edgeStrength / Math.min(count[l.source], count[l.target]));
    this.bias = this.links.map((l) => count[l.source] / (count[l.source] + count[l.target]));
  }

  get running(): boolean {
    return this.alpha >= this.p.alphaMin || this.alphaTarget > 0;
  }

  /** Small deterministic noise (separates nodes on the same spot). */
  private jiggle(): number {
    this.seed = (this.seed * 16807) % 2147483647;
    return (this.seed / 2147483647 - 0.5) * 1e-3;
  }

  tick(): void {
    const p = this.p;
    this.alpha += (this.alphaTarget - this.alpha) * p.alphaDecay;
    const alpha = this.alpha;
    const nodes = this.nodes;
    const n = nodes.length;
    if (!n) return;
    // springs
    this.links.forEach((l, k) => {
      const s = nodes[l.source];
      const t = nodes[l.target];
      let x = t.x + t.vx - s.x - s.vx || this.jiggle();
      let y = t.y + t.vy - s.y - s.vy || this.jiggle();
      let d = Math.sqrt(x * x + y * y);
      d = ((d - l.distance) / d) * alpha * this.strength[k];
      x *= d;
      y *= d;
      const b = this.bias[k];
      t.vx -= x * b;
      t.vy -= y * b;
      s.vx += x * (1 - b);
      s.vy += y * (1 - b);
    });
    // repulsion
    if (p.repulsion > 0 && n > 1) {
      this.buildTree();
      const theta2 = p.theta * p.theta;
      const k = -p.repulsion * alpha;
      const stack: number[] = [];
      for (let i = 0; i < n; i++) {
        const a = nodes[i];
        let fx = 0;
        let fy = 0;
        stack.length = 0;
        stack.push(0);
        while (stack.length) {
          const q = stack.pop()!;
          const kids = this.qKidCount[q];
          let dx = this.qCx[q] - a.x;
          let dy = this.qCy[q] - a.y;
          let d2 = dx * dx + dy * dy;
          const mass = this.qEnd[q] - this.qStart[q];
          if (kids && (this.qSize[q] * this.qSize[q]) / theta2 < d2) {
            // far enough: the whole cell acts as one mass at its center
            if (d2 < 1) d2 = Math.sqrt(d2) || 1;
            fx += (dx * k * mass) / d2;
            fy += (dy * k * mass) / d2;
            continue;
          }
          if (kids) {
            for (let c = 0; c < kids; c++) stack.push(this.qKids[this.qKidStart[q] + c]);
            continue;
          }
          for (let m = this.qStart[q]; m < this.qEnd[q]; m++) {
            const j = this.perm[m];
            if (j === i) continue;
            const b = nodes[j];
            dx = b.x - a.x;
            dy = b.y - a.y;
            if (!dx) dx = this.jiggle();
            if (!dy) dy = this.jiggle();
            d2 = dx * dx + dy * dy;
            if (d2 < 1) d2 = Math.sqrt(d2);
            fx += (dx * k) / d2;
            fy += (dy * k) / d2;
          }
        }
        a.vx += fx;
        a.vy += fy;
      }
    }
    // gravity
    if (p.gravity > 0)
      for (const a of nodes) {
        a.vx -= a.x * p.gravity * alpha;
        a.vy -= a.y * p.gravity * alpha;
      }
    if (p.radius) this.collide(p.radius);
    const keep = 1 - p.friction;
    for (const a of nodes) {
      if (a.fx !== null && a.fy !== null) {
        a.x = a.fx;
        a.y = a.fy;
        a.vx = a.vy = 0;
        continue;
      }
      a.vx *= keep;
      a.vy *= keep;
      a.x += a.vx;
      a.y += a.vy;
    }
  }

  /** Run until cool (or `max` ticks). */
  run(max = 300): void {
    for (let i = 0; i < max && this.alpha >= this.p.alphaMin; i++) this.tick();
  }

  /** Push overlapping nodes apart, with a grid of cells as big as the biggest node. */
  private collide(radius: number[]): void {
    const nodes = this.nodes;
    let rMax = 0;
    for (const r of radius) rMax = Math.max(rMax, r);
    if (!(rMax > 0)) return;
    const cell = rMax * 2;
    const grid = new Map<string, number[]>();
    nodes.forEach((a, i) => {
      const key = `${Math.floor((a.x + a.vx) / cell)},${Math.floor((a.y + a.vy) / cell)}`;
      const list = grid.get(key);
      if (list) list.push(i);
      else grid.set(key, [i]);
    });
    nodes.forEach((a, i) => {
      const ax = a.x + a.vx;
      const ay = a.y + a.vy;
      const gx = Math.floor(ax / cell);
      const gy = Math.floor(ay / cell);
      for (let u = gx - 1; u <= gx + 1; u++)
        for (let v = gy - 1; v <= gy + 1; v++) {
          const list = grid.get(`${u},${v}`);
          if (!list) continue;
          for (const j of list) {
            if (j <= i) continue;
            const b = nodes[j];
            let dx = ax - (b.x + b.vx);
            let dy = ay - (b.y + b.vy);
            const r = (radius[i] ?? 0) + (radius[j] ?? 0);
            let d2 = dx * dx + dy * dy;
            if (d2 >= r * r) continue;
            if (!dx) dx = this.jiggle();
            if (!dy) dy = this.jiggle();
            d2 = dx * dx + dy * dy;
            const d = Math.sqrt(d2);
            const f = ((r - d) / d) * 0.5;
            dx *= f;
            dy *= f;
            a.vx += dx;
            a.vy += dy;
            b.vx -= dx;
            b.vy -= dy;
          }
        }
    });
  }

  /** Quadtree built top-down by partitioning the nodes in place; each cell keeps its count and center. */
  private buildTree(): void {
    const nodes = this.nodes;
    const n = nodes.length;
    if (this.perm.length !== n) this.perm = new Int32Array(n);
    for (let i = 0; i < n; i++) this.perm[i] = i;
    let x0 = Infinity;
    let y0 = Infinity;
    let x1 = -Infinity;
    let y1 = -Infinity;
    for (const a of nodes) {
      if (a.x < x0) x0 = a.x;
      if (a.y < y0) y0 = a.y;
      if (a.x > x1) x1 = a.x;
      if (a.y > y1) y1 = a.y;
    }
    const size = Math.max(x1 - x0, y1 - y0, 1e-6);
    this.qStart.length = this.qEnd.length = this.qCx.length = this.qCy.length = this.qSize.length = 0;
    this.qKids.length = this.qKidStart.length = this.qKidCount.length = 0;
    this.cell(0, n, x0, y0, size, 0);
  }

  private cell(start: number, end: number, x0: number, y0: number, size: number, depth: number): number {
    const nodes = this.nodes;
    const perm = this.perm;
    const id = this.qStart.length;
    let cx = 0;
    let cy = 0;
    for (let m = start; m < end; m++) {
      cx += nodes[perm[m]].x;
      cy += nodes[perm[m]].y;
    }
    this.qStart.push(start);
    this.qEnd.push(end);
    this.qCx.push(cx / (end - start));
    this.qCy.push(cy / (end - start));
    this.qSize.push(size);
    this.qKidStart.push(0);
    this.qKidCount.push(0);
    if (end - start <= 1 || depth > 24) return id;
    const h = size / 2;
    const mx = x0 + h;
    const my = y0 + h;
    // split by x, then each half by y: quadrants [start, a) [a, b) [b, c) [c, end)
    const b = this.partition(start, end, (i) => nodes[i].x < mx);
    const a = this.partition(start, b, (i) => nodes[i].y < my);
    const c = this.partition(b, end, (i) => nodes[i].y < my);
    const kids: number[] = [];
    if (a > start) kids.push(this.cell(start, a, x0, y0, h, depth + 1));
    if (b > a) kids.push(this.cell(a, b, x0, my, h, depth + 1));
    if (c > b) kids.push(this.cell(b, c, mx, y0, h, depth + 1));
    if (end > c) kids.push(this.cell(c, end, mx, my, h, depth + 1));
    this.qKidStart[id] = this.qKids.length;
    this.qKidCount[id] = kids.length;
    this.qKids.push(...kids);
    return id;
  }

  private partition(start: number, end: number, left: (i: number) => boolean): number {
    const perm = this.perm;
    let k = start;
    for (let m = start; m < end; m++)
      if (left(perm[m])) {
        const t = perm[k];
        perm[k] = perm[m];
        perm[m] = t;
        k++;
      }
    return k;
  }
}

/** Rest lengths of the links: one length, or [shortest, longest] by value (bigger value → shorter). */
export function edgeLengths(values: (number | undefined)[], length: number | [number, number]): number[] {
  if (typeof length === 'number') return values.map(() => length);
  const [lo, hi] = length;
  const vs = values.filter((v): v is number => v !== undefined && isFinite(v));
  const min = Math.min(...vs);
  const max = Math.max(...vs);
  return values.map((v) => (v === undefined || !isFinite(v) || !(max > min) ? (lo + hi) / 2 : hi - ((v - min) / (max - min)) * (hi - lo)));
}

/**
 * Run a force layout to the end and return the positions (same order as `nodes`). Links name nodes by id
 * or index. Handy to precompute big graphs and draw them with layout 'none'.
 */
export function graphForceLayout(
  nodes: { id?: string; x?: number; y?: number; fixed?: boolean }[],
  links: { source: string | number; target: string | number; value?: number }[],
  options: { repulsion?: number; edgeLength?: number | [number, number]; gravity?: number; friction?: number; theta?: number; iterations?: number } = {},
): { x: number; y: number }[] {
  const index = new Map<string, number>();
  nodes.forEach((n, i) => n.id !== undefined && index.set(n.id, i));
  const ix = (v: string | number): number => (typeof v === 'number' ? v : (index.get(v) ?? -1));
  const sim = nodes.map((n, i) => {
    const s = spiralPosition(i);
    const x = n.x ?? s.x;
    const y = n.y ?? s.y;
    return { x, y, vx: 0, vy: 0, fx: n.fixed ? x : null, fy: n.fixed ? y : null };
  });
  const lengths = edgeLengths(
    links.map((l) => l.value),
    options.edgeLength ?? 40,
  );
  const f = new ForceSimulation(
    sim,
    links.map((l, k) => ({ source: ix(l.source), target: ix(l.target), distance: lengths[k] })),
    definedOnly({ repulsion: options.repulsion, gravity: options.gravity, friction: options.friction, theta: options.theta }),
  );
  f.run(options.iterations ?? 300);
  return sim.map((s) => ({ x: s.x, y: s.y }));
}

/**
 * Nodes on a circle of radius 1 (y grows down), in input order, or grouped by category / sorted by value.
 * `angle` is in radians (math convention, counterclockwise from the right; drawn with y down).
 */
export function graphCircularLayout(
  nodes: { category?: number | string; value?: number }[],
  options: { sort?: 'category' | 'value' | 'none'; startAngle?: number; clockwise?: boolean } = {},
): { x: number; y: number; angle: number }[] {
  const sort = options.sort ?? 'category';
  const order = nodes.map((_, i) => i);
  if (sort === 'category') {
    const first = new Map<string, number>();
    nodes.forEach((n, i) => {
      const k = String(n.category ?? '');
      if (!first.has(k)) first.set(k, i);
    });
    order.sort((a, b) => first.get(String(nodes[a].category ?? ''))! - first.get(String(nodes[b].category ?? ''))! || a - b);
  } else if (sort === 'value') order.sort((a, b) => (nodes[b].value ?? 0) - (nodes[a].value ?? 0) || a - b);
  const n = nodes.length;
  const start = ((options.startAngle ?? 90) * Math.PI) / 180;
  const dir = options.clockwise === false ? 1 : -1;
  const out = new Array<{ x: number; y: number; angle: number }>(n);
  order.forEach((i, k) => {
    const angle = start + (dir * k * Math.PI * 2) / Math.max(1, n);
    out[i] = { x: Math.cos(angle), y: -Math.sin(angle), angle };
  });
  return out;
}

export interface Fit {
  ax: number;
  bx: number;
  ay: number;
  by: number;
}

/**
 * Map a box of coordinates [x0, y0, x1, y1] onto a px box: X = ax·x + bx, Y = ay·y + by. `aspect` keeps
 * the proportions (px per y unit ÷ px per x unit), `flipY` makes y grow up, `maxScale` caps the scale.
 */
export function fitBox(
  extent: [number, number, number, number],
  box: { x: number; y: number; w: number; h: number },
  options: { aspect?: number; flipY?: boolean; maxScale?: number } = {},
): Fit {
  const [x0, y0, x1, y1] = extent;
  const dx = Math.max(x1 - x0, 1e-9);
  const dy = Math.max(y1 - y0, 1e-9);
  let sx = box.w / dx;
  let sy = box.h / dy;
  if (options.aspect !== undefined) {
    sx = Math.min(sx, box.h / (dy * options.aspect));
    sy = sx * options.aspect;
  }
  if (options.maxScale !== undefined) {
    const k = Math.min(1, options.maxScale / sx, options.maxScale / sy);
    sx *= k;
    sy *= k;
  }
  const ay = options.flipY ? -sy : sy;
  return { ax: sx, bx: box.x + box.w / 2 - sx * ((x0 + x1) / 2), ay, by: box.y + box.h / 2 - ay * ((y0 + y1) / 2) };
}

export interface Rect {
  x: number;
  y: number;
  w: number;
  h: number;
}

/** Which labels to keep: in the given order (most important first), a label is dropped when it overlaps a kept one. */
export function hideOverlaps(rects: Rect[], cellSize = 64): boolean[] {
  const grid = new Map<number, number[]>();
  const keep: boolean[] = [];
  const key = (u: number, v: number): number => u * 100003 + v;
  rects.forEach((r, i) => {
    const u0 = Math.floor(r.x / cellSize);
    const u1 = Math.floor((r.x + r.w) / cellSize);
    const v0 = Math.floor(r.y / cellSize);
    const v1 = Math.floor((r.y + r.h) / cellSize);
    for (let u = u0; u <= u1; u++)
      for (let v = v0; v <= v1; v++)
        for (const j of grid.get(key(u, v)) ?? []) {
          const o = rects[j];
          if (r.x < o.x + o.w && o.x < r.x + r.w && r.y < o.y + o.h && o.y < r.y + r.h) {
            keep[i] = false;
            return;
          }
        }
    keep[i] = true;
    for (let u = u0; u <= u1; u++)
      for (let v = v0; v <= v1; v++) {
        const list = grid.get(key(u, v));
        if (list) list.push(i);
        else grid.set(key(u, v), [i]);
      }
  });
  return keep;
}

/** Control point of a curved edge: off the middle, perpendicular, by `curveness` × length. */
export function curveControl(x1: number, y1: number, x2: number, y2: number, curveness: number): { x: number; y: number } {
  return { x: (x1 + x2) / 2 - (y2 - y1) * curveness, y: (y1 + y2) / 2 + (x2 - x1) * curveness };
}

/** Point on a quadratic curve at t. */
export function quadAt(x1: number, y1: number, cx: number, cy: number, x2: number, y2: number, t: number): { x: number; y: number } {
  const u = 1 - t;
  return { x: u * u * x1 + 2 * u * t * cx + t * t * x2, y: u * u * y1 + 2 * u * t * cy + t * t * y2 };
}

export function distToSegment(px: number, py: number, x1: number, y1: number, x2: number, y2: number): number {
  const dx = x2 - x1;
  const dy = y2 - y1;
  const l2 = dx * dx + dy * dy;
  const t = l2 ? Math.max(0, Math.min(1, ((px - x1) * dx + (py - y1) * dy) / l2)) : 0;
  return Math.hypot(px - (x1 + t * dx), py - (y1 + t * dy));
}

/** Distance to a quadratic curve (sampled in 12 segments). */
export function distToQuad(px: number, py: number, x1: number, y1: number, cx: number, cy: number, x2: number, y2: number): number {
  let best = Infinity;
  let prev = { x: x1, y: y1 };
  for (let k = 1; k <= 12; k++) {
    const q = quadAt(x1, y1, cx, cy, x2, y2, k / 12);
    best = Math.min(best, distToSegment(px, py, prev.x, prev.y, q.x, q.y));
    prev = q;
  }
  return best;
}

/** Ticks of a log axis: 1, 2, 5 × 10ⁿ (or only powers of ten over wide ranges). */
export function logTicks(min: number, max: number): number[] {
  if (!(min > 0) || !(max > min)) return [];
  const e0 = Math.floor(Math.log10(min));
  const e1 = Math.ceil(Math.log10(max));
  const mult = e1 - e0 > 4 ? [1] : [1, 2, 5];
  const out: number[] = [];
  for (let e = e0; e <= e1; e++)
    for (const m of mult) {
      const v = +(m * 10 ** e).toPrecision(12);
      if (v >= min * (1 - 1e-9) && v <= max * (1 + 1e-9)) out.push(v);
    }
  return out;
}

/** Diameter by value, on a sqrt scale between [min, max] px. */
export function sizeByValue(v: number | undefined, lo: number, hi: number, range: [number, number]): number {
  if (v === undefined || !isFinite(v) || !(hi > lo)) return (range[0] + range[1]) / 2;
  const t = Math.sqrt(Math.max(0, (v - lo) / (hi - lo)));
  return range[0] + t * (range[1] - range[0]);
}
