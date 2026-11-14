/**
 * Sankey layout (in the spirit of d3-sankey, as ECharts uses): nodes in columns by their longest path, node
 * heights proportional to their value, then a few passes of weighted-centre relaxation (right to left and left
 * to right) with collision resolution, so the links cross as little as possible.
 *
 * Coordinates are in a "flow frame": `x` runs along the flow (columns), `y` along the stack of each column.
 * A vertical chart just swaps the two axes when drawing.
 */

export type SankeyNodeAlign = 'justify' | 'left' | 'right';

export interface SankeyLayoutNodeInput {
  name: string;
  /** Minimum value of the node (its value is max(this, incoming, outgoing)) */
  value?: number;
  /** Column override */
  depth?: number;
}

export interface SankeyLayoutLinkInput {
  /** Name or index of a node */
  source: string | number;
  target: string | number;
  value: number;
}

export interface SankeyLayoutNode {
  /** Index in the input */
  index: number;
  name: string;
  /** max(incoming, outgoing, the node's own value) */
  value: number;
  inValue: number;
  outValue: number;
  /** Longest path from a source */
  depth: number;
  /** Longest path to a sink */
  height: number;
  /** Column it is drawn in */
  layer: number;
  x0: number;
  x1: number;
  y0: number;
  y1: number;
  /** Outgoing links, ordered by where they arrive */
  sourceLinks: SankeyLayoutLink[];
  /** Incoming links, ordered by where they come from */
  targetLinks: SankeyLayoutLink[];
}

export interface SankeyLayoutLink {
  /** Index in the input */
  index: number;
  source: SankeyLayoutNode;
  target: SankeyLayoutNode;
  value: number;
  width: number;
  /** Centre of the link at its source / target node */
  y0: number;
  y1: number;
}

export interface SankeyLayoutOptions {
  /** Extent along the flow */
  width: number;
  /** Extent along the columns */
  height: number;
  /** Default 20 */
  nodeWidth?: number;
  /** Default 8 */
  nodeGap?: number;
  /** Default 'justify' */
  nodeAlign?: SankeyNodeAlign;
  /** Relaxation passes. 0 keeps the order of the data. Default 32 */
  iterations?: number;
}

export interface SankeyLayoutResult {
  nodes: SankeyLayoutNode[];
  /** Laid-out links (without the ignored ones) */
  links: SankeyLayoutLink[];
  /** Links left out: self-links and links that close a cycle (index in the input) */
  ignored: { index: number; source: string; target: string; reason: 'cycle' | 'self' }[];
  /** Number of columns */
  columns: number;
  /** Pixels per unit of value */
  ky: number;
  /** Gap between nodes actually used */
  gap: number;
}

const sum = (a: number[]): number => a.reduce((s, v) => s + v, 0);

/** Lay out a sankey. Throws on duplicated node names and on links to unknown nodes. */
export function sankeyLayout(nodeInput: SankeyLayoutNodeInput[], linkInput: SankeyLayoutLinkInput[], opts: SankeyLayoutOptions): SankeyLayoutResult {
  const W = Math.max(0, opts.width);
  const H = Math.max(0, opts.height);
  const dx = Math.min(opts.nodeWidth ?? 20, W);
  const align = opts.nodeAlign ?? 'justify';
  const iterations = Math.max(0, Math.floor(opts.iterations ?? 32));

  const byName = new Map<string, SankeyLayoutNode>();
  const nodes: SankeyLayoutNode[] = nodeInput.map((n, index) => {
    if (byName.has(n.name)) throw new Error(`sankey: duplicated node name "${n.name}"`);
    const node: SankeyLayoutNode = { index, name: n.name, value: 0, inValue: 0, outValue: 0, depth: 0, height: 0, layer: 0, x0: 0, x1: 0, y0: 0, y1: 0, sourceLinks: [], targetLinks: [] };
    byName.set(n.name, node);
    return node;
  });
  const find = (id: string | number, i: number): SankeyLayoutNode => {
    const n = typeof id === 'number' ? nodes[id] : byName.get(id);
    if (!n) throw new Error(`sankey: link ${i} points to an unknown node "${id}"`);
    return n;
  };

  // links, without self-links and the links that close a cycle (found by a depth-first search in data order)
  const ignored: SankeyLayoutResult['ignored'] = [];
  const candidates: SankeyLayoutLink[] = [];
  linkInput.forEach((l, index) => {
    const source = find(l.source, index);
    const target = find(l.target, index);
    const value = Number.isFinite(l.value) ? Math.max(0, l.value) : 0;
    if (source === target) ignored.push({ index, source: source.name, target: target.name, reason: 'self' });
    else candidates.push({ index, source, target, value, width: 0, y0: 0, y1: 0 });
  });
  const out = new Map<SankeyLayoutNode, SankeyLayoutLink[]>(nodes.map((n) => [n, []]));
  for (const l of candidates) out.get(l.source)!.push(l);
  const state = new Map<SankeyLayoutNode, 1 | 2>();
  const back = new Set<SankeyLayoutLink>();
  for (const start of nodes) {
    if (state.has(start)) continue;
    state.set(start, 1);
    const stack: [SankeyLayoutNode, number][] = [[start, 0]];
    while (stack.length) {
      const top = stack[stack.length - 1];
      const list = out.get(top[0])!;
      if (top[1] >= list.length) {
        state.set(top[0], 2);
        stack.pop();
        continue;
      }
      const l = list[top[1]++];
      const s = state.get(l.target);
      if (s === 1) back.add(l);
      else if (!s) {
        state.set(l.target, 1);
        stack.push([l.target, 0]);
      }
    }
  }
  const links = candidates.filter((l) => {
    if (!back.has(l)) return true;
    ignored.push({ index: l.index, source: l.source.name, target: l.target.name, reason: 'cycle' });
    return false;
  });
  ignored.sort((a, b) => a.index - b.index);
  for (const l of links) {
    l.source.sourceLinks.push(l);
    l.target.targetLinks.push(l);
  }

  // values
  for (const n of nodes) {
    n.inValue = sum(n.targetLinks.map((l) => l.value));
    n.outValue = sum(n.sourceLinks.map((l) => l.value));
    const own = nodeInput[n.index].value;
    n.value = Math.max(n.inValue, n.outValue, Number.isFinite(own) ? (own as number) : 0);
  }

  // depth (longest path from a source) and height (longest path to a sink), in topological order
  const indeg = new Map(nodes.map((n) => [n, n.targetLinks.length]));
  const order: SankeyLayoutNode[] = nodes.filter((n) => !n.targetLinks.length);
  for (let i = 0; i < order.length; i++)
    for (const l of order[i].sourceLinks) {
      l.target.depth = Math.max(l.target.depth, order[i].depth + 1);
      const d = indeg.get(l.target)! - 1;
      indeg.set(l.target, d);
      if (!d) order.push(l.target);
    }
  for (let i = order.length - 1; i >= 0; i--) for (const l of order[i].targetLinks) l.source.height = Math.max(l.source.height, order[i].height + 1);
  const maxDepth = Math.max(0, ...nodes.map((n) => n.depth));
  for (const n of nodes) {
    n.layer = align === 'left' ? n.depth : align === 'right' ? maxDepth - n.height : n.sourceLinks.length ? n.depth : maxDepth;
    const d = nodeInput[n.index].depth;
    if (typeof d === 'number' && Number.isFinite(d)) n.layer = Math.max(0, Math.floor(d));
  }
  const ncols = nodes.length ? Math.max(...nodes.map((n) => n.layer)) + 1 : 0;
  const columns: SankeyLayoutNode[][] = Array.from({ length: ncols }, () => []);
  for (const n of nodes) columns[n.layer].push(n);

  // x along the flow
  const kx = ncols > 1 ? (W - dx) / (ncols - 1) : 0;
  for (const n of nodes) {
    n.x0 = ncols > 1 ? n.layer * kx : (W - dx) / 2;
    n.x1 = n.x0 + dx;
  }

  // vertical scale and gap: the fullest column fills the height
  const maxLen = Math.max(1, ...columns.map((c) => c.length));
  const py = Math.min(Math.max(0, opts.nodeGap ?? 8), maxLen > 1 ? (H * 0.5) / (maxLen - 1) : Infinity);
  let ky = Infinity;
  for (const c of columns) {
    const total = sum(c.map((n) => n.value));
    if (total > 0) ky = Math.min(ky, Math.max(0, H - (c.length - 1) * py) / total);
  }
  if (!Number.isFinite(ky)) ky = 0;
  for (const l of links) l.width = l.value * ky;

  // first guess: stacked in data order, the free space spread around
  for (const c of columns) {
    let y = 0;
    for (const n of c) {
      n.y0 = y;
      n.y1 = y + n.value * ky;
      y = n.y1 + py;
    }
    const extra = (H - y + py) / (c.length + 1);
    c.forEach((n, i) => {
      n.y0 += extra * (i + 1);
      n.y1 += extra * (i + 1);
    });
  }
  reorderLinks(nodes);

  if (iterations > 0) {
    for (let i = 0; i < iterations; i++) {
      const alpha = Math.pow(0.99, i);
      const beta = Math.max(1 - alpha, (i + 1) / iterations);
      relaxRightToLeft(columns, alpha, beta, py, H);
      relaxLeftToRight(columns, alpha, beta, py, H);
    }
  }
  computeLinkBreadths(nodes);
  return { nodes, links, ignored, columns: ncols, ky, gap: py };
}

/** After moving nodes by hand: order the links of every node by the other end and place them again. */
export function sankeyLinkBreadths(nodes: SankeyLayoutNode[]): void {
  reorderLinks(nodes);
  computeLinkBreadths(nodes);
}

function reorderLinks(nodes: SankeyLayoutNode[]): void {
  for (const n of nodes) {
    n.sourceLinks.sort((a, b) => a.target.y0 - b.target.y0 || a.index - b.index);
    n.targetLinks.sort((a, b) => a.source.y0 - b.source.y0 || a.index - b.index);
  }
}

function computeLinkBreadths(nodes: SankeyLayoutNode[]): void {
  for (const n of nodes) {
    let y0 = n.y0;
    let y1 = n.y0;
    // a node taller than its links (fixed value): centre them
    const h = n.y1 - n.y0;
    y0 += Math.max(0, h - sum(n.sourceLinks.map((l) => l.width))) / 2;
    y1 += Math.max(0, h - sum(n.targetLinks.map((l) => l.width))) / 2;
    for (const l of n.sourceLinks) {
      l.y0 = y0 + l.width / 2;
      y0 += l.width;
    }
    for (const l of n.targetLinks) {
      l.y1 = y1 + l.width / 2;
      y1 += l.width;
    }
  }
}

/** Top the target would need for this link to be straight. */
function targetTop(source: SankeyLayoutNode, target: SankeyLayoutNode, py: number): number {
  let y = source.y0 - ((source.sourceLinks.length - 1) * py) / 2;
  for (const l of source.sourceLinks) {
    if (l.target === target) break;
    y += l.width + py;
  }
  for (const l of target.targetLinks) {
    if (l.source === source) break;
    y -= l.width;
  }
  return y;
}

/** Top the source would need for this link to be straight. */
function sourceTop(source: SankeyLayoutNode, target: SankeyLayoutNode, py: number): number {
  let y = target.y0 - ((target.targetLinks.length - 1) * py) / 2;
  for (const l of target.targetLinks) {
    if (l.source === source) break;
    y += l.width + py;
  }
  for (const l of source.sourceLinks) {
    if (l.target === target) break;
    y -= l.width;
  }
  return y;
}

function reorderNodeLinks(n: SankeyLayoutNode): void {
  for (const l of n.targetLinks) l.source.sourceLinks.sort((a, b) => a.target.y0 - b.target.y0 || a.index - b.index);
  for (const l of n.sourceLinks) l.target.targetLinks.sort((a, b) => a.source.y0 - b.source.y0 || a.index - b.index);
}

/** Each node moves toward the weighted centre of the nodes it comes from (links weighted by value and span). */
function relaxLeftToRight(columns: SankeyLayoutNode[][], alpha: number, beta: number, py: number, H: number): void {
  for (let i = 1; i < columns.length; i++) {
    const column = columns[i];
    for (const target of column) {
      let y = 0;
      let w = 0;
      for (const l of target.targetLinks) {
        const v = l.value * Math.max(1, target.layer - l.source.layer);
        y += targetTop(l.source, target, py) * v;
        w += v;
      }
      if (!(w > 0)) continue;
      const d = (y / w - target.y0) * alpha;
      target.y0 += d;
      target.y1 += d;
      reorderNodeLinks(target);
    }
    column.sort((a, b) => a.y0 - b.y0 || a.index - b.index);
    resolveCollisions(column, beta, py, H);
  }
}

/** Each node moves toward the weighted centre of the nodes it goes to. */
function relaxRightToLeft(columns: SankeyLayoutNode[][], alpha: number, beta: number, py: number, H: number): void {
  for (let i = columns.length - 2; i >= 0; i--) {
    const column = columns[i];
    for (const source of column) {
      let y = 0;
      let w = 0;
      for (const l of source.sourceLinks) {
        const v = l.value * Math.max(1, l.target.layer - source.layer);
        y += sourceTop(source, l.target, py) * v;
        w += v;
      }
      if (!(w > 0)) continue;
      const d = (y / w - source.y0) * alpha;
      source.y0 += d;
      source.y1 += d;
      reorderNodeLinks(source);
    }
    column.sort((a, b) => a.y0 - b.y0 || a.index - b.index);
    resolveCollisions(column, beta, py, H);
  }
}

/** Push overlapping nodes apart (from the middle node outward), then back inside [0, H]. */
function resolveCollisions(nodes: SankeyLayoutNode[], alpha: number, py: number, H: number): void {
  if (!nodes.length) return;
  const i = nodes.length >> 1;
  const subject = nodes[i];
  bottomToTop(nodes, subject.y0 - py, i - 1, alpha, py);
  topToBottom(nodes, subject.y1 + py, i + 1, alpha, py);
  bottomToTop(nodes, H, nodes.length - 1, alpha, py);
  topToBottom(nodes, 0, 0, alpha, py);
}

function topToBottom(nodes: SankeyLayoutNode[], y: number, i: number, alpha: number, py: number): void {
  for (; i < nodes.length; i++) {
    const n = nodes[i];
    const d = (y - n.y0) * alpha;
    if (d > 1e-6) {
      n.y0 += d;
      n.y1 += d;
    }
    y = n.y1 + py;
  }
}

function bottomToTop(nodes: SankeyLayoutNode[], y: number, i: number, alpha: number, py: number): void {
  for (; i >= 0; i--) {
    const n = nodes[i];
    const d = (n.y1 - y) * alpha;
    if (d > 1e-6) {
      n.y0 -= d;
      n.y1 -= d;
    }
    y = n.y0 - py;
  }
}
