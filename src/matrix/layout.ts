import type { MatrixCell, MatrixCoordPart, MatrixHeaderInput, MatrixHeaderItem, MatrixLength, MatrixMediaRule, MatrixValueGrid } from './types';

/** One header cell placed in its level: it spans `span` leaves from `start` and `depth` levels from `level`. */
export interface MatrixHeaderNode {
  name: string;
  item: MatrixHeaderItem;
  level: number;
  /** Levels covered (a leaf above the deepest level spans down to it) */
  depth: number;
  start: number;
  span: number;
  leaf: boolean;
  /** Names from the outermost level down to this node */
  path: string[];
}

export interface MatrixHeaderModel {
  nodes: MatrixHeaderNode[];
  /** Leaves in order (one per column / row) */
  leaves: MatrixHeaderNode[];
  /** Number of levels (0 when there are no leaves) */
  levels: number;
}

const toItem = (h: MatrixHeaderInput): MatrixHeaderItem => (typeof h === 'object' ? h : { value: h });

/** Header tree → placed nodes. A count gives plain leaves named '0', '1', … */
export function matrixHeader(data: MatrixHeaderInput[] | number | undefined): MatrixHeaderModel {
  const input: MatrixHeaderInput[] = typeof data === 'number' ? Array.from({ length: Math.max(0, Math.floor(data)) }, (_, i) => String(i)) : (data ?? []);
  const depthOf = (h: MatrixHeaderInput): number => {
    const it = toItem(h);
    return it.children?.length ? 1 + Math.max(...it.children.map(depthOf)) : 1;
  };
  const levels = input.length ? Math.max(...input.map(depthOf)) : 0;
  const nodes: MatrixHeaderNode[] = [];
  const leaves: MatrixHeaderNode[] = [];
  const walk = (list: MatrixHeaderInput[], level: number, parent: string[]): void => {
    for (const h of list) {
      const item = toItem(h);
      const name = String(item.value);
      const path = [...parent, name];
      const leaf = !item.children?.length;
      const node: MatrixHeaderNode = { name, item, level, depth: leaf ? levels - level : 1, start: leaves.length, span: 0, leaf, path };
      nodes.push(node);
      if (leaf) {
        leaves.push(node);
        node.span = 1;
      } else {
        walk(item.children!, level + 1, path);
        node.span = leaves.length - node.start;
      }
    }
  };
  walk(input, 0, []);
  return { nodes, leaves, levels };
}

/** Parses a length: px, a share of the room ('%'), or a flex weight ('2fr', 'auto', a numeric string). */
export function matrixParseLength(v: MatrixLength | undefined, room: number): { px: number; fr: number } {
  if (v === undefined || v === 'auto') return { px: 0, fr: 1 };
  if (typeof v === 'number') return { px: Math.max(0, v), fr: 0 };
  const s = v.trim();
  const n = parseFloat(s);
  if (s.endsWith('%')) return { px: Math.max(0, ((Number.isFinite(n) ? n : 0) / 100) * room), fr: 0 };
  if (s.endsWith('px')) return { px: Math.max(0, Number.isFinite(n) ? n : 0), fr: 0 };
  return { px: 0, fr: Math.max(0, Number.isFinite(n) ? n : 1) };
}

/**
 * Sizes of the leaves in `room` px: fixed sizes first, the rest shared by the flex weights (each at least
 * `minSize`). When the fixed sizes do not fit they shrink together.
 */
export function matrixSizes(lengths: (MatrixLength | undefined)[], room: number, minSize = 0): number[] {
  const parsed = lengths.map((l) => matrixParseLength(l, room));
  const fixed = parsed.reduce((a, p) => a + p.px, 0);
  const weights = parsed.reduce((a, p) => a + p.fr, 0);
  const flexCount = parsed.filter((p) => p.fr > 0).length;
  const minFlex = flexCount * minSize;
  const k = fixed > 0 && fixed + minFlex > room ? Math.max(0, room - minFlex) / fixed : 1;
  const free = Math.max(0, room - fixed * k);
  return parsed.map((p) => (p.fr > 0 ? Math.max(minSize, weights ? (free * p.fr) / weights : 0) : p.px * k));
}

/** Start of each leaf (rounded to whole px so the grid lines stay crisp) and its size; `offsets` has n + 1 entries. */
export function matrixOffsets(sizes: number[], start = 0): { offsets: number[]; sizes: number[] } {
  const offsets = [Math.round(start)];
  let acc = start;
  for (const s of sizes) {
    acc += s;
    offsets.push(Math.round(acc));
  }
  return { offsets, sizes: sizes.map((_, i) => offsets[i + 1] - offsets[i]) };
}

/** Leaf index under a px position (binary search over `offsets`), -1 outside. */
export function matrixIndexAt(offsets: number[], p: number): number {
  const n = offsets.length - 1;
  if (n < 1 || p < offsets[0] || p >= offsets[n]) return -1;
  let lo = 0;
  let hi = n - 1;
  while (lo < hi) {
    const mid = (lo + hi + 1) >> 1;
    if (offsets[mid] <= p) lo = mid;
    else hi = mid - 1;
  }
  return lo;
}

const resolveOne = (p: number | string, h: MatrixHeaderModel): [number, number] | null => {
  const n = h.leaves.length;
  if (typeof p === 'number') return Number.isInteger(p) && p >= 0 && p < n ? [p, p] : null;
  const leaf = h.leaves.findIndex((l) => l.name === p);
  if (leaf >= 0) return [leaf, leaf];
  const node = h.nodes.find((x) => x.name === p) ?? h.nodes.find((x) => x.path.join('/') === p);
  return node ? [node.start, node.start + node.span - 1] : null;
};

/**
 * A coord part → [first, last] leaf (both included): a leaf index, a header name (a parent covers all its
 * leaves; 'parent/child' paths too) or a range [from, to].
 */
export function matrixResolve(part: MatrixCoordPart, h: MatrixHeaderModel): [number, number] | null {
  if (Array.isArray(part)) {
    const a = resolveOne(part[0], h);
    const b = resolveOne(part[1], h);
    if (!a || !b) return null;
    return [Math.min(a[0], b[0]), Math.max(a[1], b[1])];
  }
  return resolveOne(part, h);
}

/** A body cell placed on the leaves: columns x0..x1, rows y0..y1 (included). */
export interface MatrixPlaced {
  cell: MatrixCell;
  /** Position in the input list */
  index: number;
  x0: number;
  x1: number;
  y0: number;
  y1: number;
}

/** Plain values by row → cells. */
export function matrixGridCells(values: MatrixValueGrid): MatrixCell[] {
  const out: MatrixCell[] = [];
  values.forEach((row, y) => row?.forEach((value, x) => value !== undefined && value !== null && out.push({ coord: [x, y], value })));
  return out;
}

/** True when `data` is a value grid (rows of values) rather than a list of cells. */
export function matrixIsGrid(data: unknown[] | undefined): data is MatrixValueGrid {
  return !!data?.length && data.some((r) => Array.isArray(r));
}

/**
 * Places the body cells. Merged cells (a range, a parent name or colSpan / rowSpan) win over single cells; among
 * equals the later one wins and whatever it overlaps is dropped. `grid[y * nx + x]` = index into `cells`, or -1.
 */
export function matrixPlace(data: MatrixCell[], xh: MatrixHeaderModel, yh: MatrixHeaderModel): { cells: MatrixPlaced[]; grid: Int32Array; nx: number; ny: number } {
  const nx = xh.leaves.length;
  const ny = yh.leaves.length;
  const placed: (MatrixPlaced | null)[] = [];
  const candidates: MatrixPlaced[] = [];
  data.forEach((cell, index) => {
    if (!cell || !cell.coord) return;
    const xr = matrixResolve(cell.coord[0], xh);
    const yr = matrixResolve(cell.coord[1], yh);
    if (!xr || !yr) return;
    const x1 = Math.min(nx - 1, Math.max(xr[1], xr[0] + Math.max(1, Math.floor(cell.colSpan ?? 1)) - 1));
    const y1 = Math.min(ny - 1, Math.max(yr[1], yr[0] + Math.max(1, Math.floor(cell.rowSpan ?? 1)) - 1));
    candidates.push({ cell, index, x0: xr[0], x1, y0: yr[0], y1 });
  });
  const merged = (p: MatrixPlaced): number => (p.x1 > p.x0 || p.y1 > p.y0 ? 1 : 0);
  candidates.sort((a, b) => merged(a) - merged(b) || a.index - b.index);
  const grid = new Int32Array(nx * ny).fill(-1);
  for (const p of candidates) {
    const k = placed.length;
    for (let y = p.y0; y <= p.y1; y++)
      for (let x = p.x0; x <= p.x1; x++) {
        const old = grid[y * nx + x];
        if (old >= 0 && placed[old]) {
          const o = placed[old]!;
          for (let yy = o.y0; yy <= o.y1; yy++) for (let xx = o.x0; xx <= o.x1; xx++) if (grid[yy * nx + xx] === old) grid[yy * nx + xx] = -1;
          placed[old] = null;
        }
        grid[y * nx + x] = k;
      }
    placed.push(p);
  }
  // drop the overlapped cells and sort by position (rows, then columns); the grid follows
  const cells = placed.filter((p): p is MatrixPlaced => !!p).sort((a, b) => a.y0 - b.y0 || a.x0 - b.x0);
  const order = new Map(cells.map((c, i) => [c, i]));
  const remap = placed.map((p) => (p ? order.get(p)! : -1));
  for (let i = 0; i < grid.length; i++) if (grid[i] >= 0) grid[i] = remap[grid[i]];
  return { cells, grid, nx, ny };
}

/** Indices of the media rules that match a container size. */
export function matrixMedia(rules: MatrixMediaRule[] | undefined, width: number, height: number): number[] {
  const out: number[] = [];
  (rules ?? []).forEach((r, i) => {
    const q = r.query ?? {};
    const ar = height > 0 ? width / height : 0;
    const ok =
      (q.minWidth === undefined || width >= q.minWidth) &&
      (q.maxWidth === undefined || width <= q.maxWidth) &&
      (q.minHeight === undefined || height >= q.minHeight) &&
      (q.maxHeight === undefined || height <= q.maxHeight) &&
      (q.minAspectRatio === undefined || ar >= q.minAspectRatio) &&
      (q.maxAspectRatio === undefined || ar <= q.maxAspectRatio);
    if (ok) out.push(i);
  });
  return out;
}
