/**
 * Tidy tree layout (Reingold–Tilford, in the linear-time version of Buchheim, Jünger and Leipert, as d3 and
 * ECharts use): parents centered over their children, subtrees as close as `separation` allows, and the same
 * shape for the same subtree wherever it is.
 */

export interface TidyInput {
  children: TidyInput[];
}

interface W {
  node: TidyInput;
  parent: W | null;
  children: W[];
  /** index among siblings */
  i: number;
  depth: number;
  /** ancestor, thread, prelim, mod, change, shift */
  A: W | null;
  a: W;
  t: W | null;
  z: number;
  m: number;
  c: number;
  s: number;
}

/** Gap between two neighbours in units: 1 for siblings, 2 for cousins (and divided by the depth when radial). */
export type Separation = (a: { parent: unknown; depth: number }, b: { parent: unknown; depth: number }) => number;

export const defaultSeparation: Separation = (a, b) => (a.parent === b.parent ? 1 : 2);
export const radialSeparation: Separation = (a, b) => (a.parent === b.parent ? 1 : 2) / Math.max(1, a.depth);

/**
 * Positions of every node along the breadth axis (in separation units, the leftmost at its own place) and
 * their depth. The input is only read.
 */
export function tidyLayout<T extends TidyInput>(root: T, separation: Separation = defaultSeparation): Map<T, { x: number; depth: number }> {
  // wrap the tree (with a dummy parent above the root)
  const top: W = mk(null as unknown as TidyInput, null, 0, -1);
  const wroot = mk(root, top, 0, 0);
  top.children = [wroot];
  const order: W[] = [];
  const stack = [wroot];
  while (stack.length) {
    const w = stack.pop()!;
    order.push(w);
    w.children = w.node.children.map((c, i) => mk(c, w, i, w.depth + 1));
    // pre-order that visits the right child first: reversed, it is a post-order from left to right
    stack.push(...w.children);
  }
  const sep = (a: W, b: W): number => separation({ parent: a.parent, depth: a.depth }, { parent: b.parent, depth: b.depth });

  const nextLeft = (v: W): W | null => (v.children.length ? v.children[0] : v.t);
  const nextRight = (v: W): W | null => (v.children.length ? v.children[v.children.length - 1] : v.t);
  const moveSubtree = (wm: W, wp: W, shift: number): void => {
    const change = shift / (wp.i - wm.i);
    wp.c -= change;
    wp.s += shift;
    wm.c += change;
    wp.z += shift;
    wp.m += shift;
  };
  const executeShifts = (v: W): void => {
    let shift = 0;
    let change = 0;
    for (let i = v.children.length - 1; i >= 0; i--) {
      const w = v.children[i];
      w.z += shift;
      w.m += shift;
      shift += w.s + (change += w.c);
    }
  };
  const nextAncestor = (vim: W, v: W, ancestor: W): W => (vim.a.parent === v.parent ? vim.a : ancestor);
  const apportion = (v: W, w: W | null, ancestor: W): W => {
    if (!w) return ancestor;
    let vip: W | null = v;
    let vop: W = v;
    let vim: W | null = w;
    let vom: W = v.parent!.children[0];
    let sip = vip.m;
    let sop = vop.m;
    let sim = vim.m;
    let som = vom.m;
    for (;;) {
      vim = nextRight(vim!);
      vip = nextLeft(vip!);
      if (!vim || !vip) break;
      vom = nextLeft(vom)!;
      vop = nextRight(vop)!;
      vop.a = v;
      const shift = vim.z + sim - vip.z - sip + sep(vim, vip);
      if (shift > 0) {
        moveSubtree(nextAncestor(vim, v, ancestor), v, shift);
        sip += shift;
        sop += shift;
      }
      sim += vim.m;
      sip += vip.m;
      som += vom.m;
      sop += vop.m;
    }
    if (vim && !nextRight(vop)) {
      vop.t = vim;
      vop.m += sim - sop;
    }
    if (vip && !nextLeft(vom)) {
      vom.t = vip;
      vom.m += sip - som;
      ancestor = v;
    }
    return ancestor;
  };

  // first walk: post-order (children before their parent)
  for (let k = order.length - 1; k >= 0; k--) {
    const v = order[k];
    const siblings = v.parent!.children;
    const w = v.i ? siblings[v.i - 1] : null;
    if (v.children.length) {
      executeShifts(v);
      const mid = (v.children[0].z + v.children[v.children.length - 1].z) / 2;
      if (w) {
        v.z = w.z + sep(v, w);
        v.m = v.z - mid;
      } else v.z = mid;
    } else if (w) v.z = w.z + sep(v, w);
    v.parent!.A = apportion(v, w, v.parent!.A ?? siblings[0]);
  }
  top.m = -wroot.z;
  // second walk: pre-order, add the modifiers
  const out = new Map<T, { x: number; depth: number }>();
  let min = Infinity;
  for (const v of order) {
    const x = v.z + v.parent!.m;
    v.m += v.parent!.m;
    out.set(v.node as T, { x, depth: v.depth });
    min = Math.min(min, x);
  }
  for (const p of out.values()) p.x -= min;
  return out;
}

function mk(node: TidyInput, parent: W | null, i: number, depth: number): W {
  const w = { node, parent, children: [], i, depth, A: null, t: null, z: 0, m: 0, c: 0, s: 0 } as unknown as W;
  w.a = w;
  return w;
}
