import type { TreeNode } from './types';

/** Normalized node: sizes summed, ids resolved, parents linked. */
export interface TNode {
  id: string;
  name: string;
  /** names from the top level down to this node (empty for the root) */
  path: string[];
  /** -1 = the invisible root, 0 = top-level nodes */
  depth: number;
  /** area */
  size: number;
  values: number[];
  children: TNode[];
  parent: TNode | null;
  src: TreeNode | null;
  /** position among the siblings (after sorting) */
  index: number;
  /** levels below this node (0 = leaf) */
  height: number;
  color: string;
}

const dims = (v: TreeNode['value']): number[] => (v === undefined ? [] : Array.isArray(v) ? v.map((x) => +x || 0) : [+v || 0]);

/** Build the normalized tree under an invisible root (depth -1). Nodes of size 0 are dropped. */
export function buildTree(data: TreeNode[], opts: { sizeDimension?: number; sort?: 'desc' | 'asc' | false; rootName?: string } = {}): TNode {
  const sd = opts.sizeDimension ?? 0;
  const sort = opts.sort ?? 'desc';
  const seen = new Map<string, number>();
  const make = (src: TreeNode | null, name: string, path: string[], depth: number, parent: TNode | null, kids: TreeNode[]): TNode => {
    let id = src?.id ?? path.join('/');
    const dup = seen.get(id) ?? 0;
    seen.set(id, dup + 1);
    if (dup) id += `#${dup}`;
    const n: TNode = { id, name, path, depth, size: 0, values: [], children: [], parent, src, index: 0, height: 0, color: '' };
    for (const k of kids) {
      const c = make(k, k.name, [...path, k.name], depth + 1, n, k.children ?? []);
      if (c.size > 0) n.children.push(c);
    }
    const own = dims(src?.value);
    if (n.children.length) {
      n.size = n.children.reduce((s, c) => s + c.size, 0);
      const len = Math.max(own.length, ...n.children.map((c) => c.values.length));
      // own values win (e.g. a growth rate); missing dimensions are the sum of the children
      n.values = Array.from({ length: len }, (_, i) => own[i] ?? n.children.reduce((s, c) => s + (c.values[i] ?? 0), 0));
      n.values[sd] = n.size;
      if (sort) n.children.sort((a, b) => (sort === 'asc' ? a.size - b.size : b.size - a.size));
      n.children.forEach((c, i) => (c.index = i));
      n.height = 1 + Math.max(...n.children.map((c) => c.height));
    } else {
      n.values = own;
      n.size = Math.max(0, own[sd] ?? 0);
    }
    return n;
  };
  return make(null, opts.rootName ?? 'Total', [], -1, null, data);
}

/** Every node below `n` (depth first, parents before children). */
export function walk(n: TNode, fn: (n: TNode) => void): void {
  for (const c of n.children) {
    fn(c);
    walk(c, fn);
  }
}

export function findNode(root: TNode, id: string): TNode | null {
  if (root.id === id) return root;
  for (const c of root.children) {
    const f = findNode(c, id);
    if (f) return f;
  }
  return null;
}

/** Is `a` equal to `b` or one of its ancestors? */
export function isAncestor(a: TNode, b: TNode | null): boolean {
  for (let n = b; n; n = n.parent) if (n === a) return true;
  return false;
}

/**
 * Tree from flat records with a path, e.g. files and their sizes:
 * `fromPaths([{ path: 'src/app/main.ts', value: 1200 }])`.
 */
export function fromPaths(records: { path: string | string[]; value: number | number[] }[], separator = '/'): TreeNode[] {
  const top: TreeNode[] = [];
  for (const r of records) {
    const parts = (Array.isArray(r.path) ? r.path : r.path.split(separator)).filter(Boolean);
    let level = top;
    parts.forEach((name, i) => {
      let node = level.find((n) => n.name === name);
      if (!node) level.push((node = { name }));
      if (i === parts.length - 1) node.value = r.value;
      else level = node.children ??= [];
    });
  }
  return top;
}

/** Sum of the sizes of a tree (first dimension unless `dimension` is given). */
export function treeTotal(data: TreeNode[], dimension = 0): number {
  return buildTree(data, { sizeDimension: dimension, sort: false }).size;
}
