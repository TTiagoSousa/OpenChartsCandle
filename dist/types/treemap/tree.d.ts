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
/** Build the normalized tree under an invisible root (depth -1). Nodes of size 0 are dropped. */
export declare function buildTree(data: TreeNode[], opts?: {
    sizeDimension?: number;
    sort?: 'desc' | 'asc' | false;
    rootName?: string;
}): TNode;
/** Every node below `n` (depth first, parents before children). */
export declare function walk(n: TNode, fn: (n: TNode) => void): void;
export declare function findNode(root: TNode, id: string): TNode | null;
/** Is `a` equal to `b` or one of its ancestors? */
export declare function isAncestor(a: TNode, b: TNode | null): boolean;
/**
 * Tree from flat records with a path, e.g. files and their sizes:
 * `fromPaths([{ path: 'src/app/main.ts', value: 1200 }])`.
 */
export declare function fromPaths(records: {
    path: string | string[];
    value: number | number[];
}[], separator?: string): TreeNode[];
/** Sum of the sizes of a tree (first dimension unless `dimension` is given). */
export declare function treeTotal(data: TreeNode[], dimension?: number): number;
