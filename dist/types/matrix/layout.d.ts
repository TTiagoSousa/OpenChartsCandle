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
/** Header tree → placed nodes. A count gives plain leaves named '0', '1', … */
export declare function matrixHeader(data: MatrixHeaderInput[] | number | undefined): MatrixHeaderModel;
/** Parses a length: px, a share of the room ('%'), or a flex weight ('2fr', 'auto', a numeric string). */
export declare function matrixParseLength(v: MatrixLength | undefined, room: number): {
    px: number;
    fr: number;
};
/**
 * Sizes of the leaves in `room` px: fixed sizes first, the rest shared by the flex weights (each at least
 * `minSize`). When the fixed sizes do not fit they shrink together.
 */
export declare function matrixSizes(lengths: (MatrixLength | undefined)[], room: number, minSize?: number): number[];
/** Start of each leaf (rounded to whole px so the grid lines stay crisp) and its size; `offsets` has n + 1 entries. */
export declare function matrixOffsets(sizes: number[], start?: number): {
    offsets: number[];
    sizes: number[];
};
/** Leaf index under a px position (binary search over `offsets`), -1 outside. */
export declare function matrixIndexAt(offsets: number[], p: number): number;
/**
 * A coord part → [first, last] leaf (both included): a leaf index, a header name (a parent covers all its
 * leaves; 'parent/child' paths too) or a range [from, to].
 */
export declare function matrixResolve(part: MatrixCoordPart, h: MatrixHeaderModel): [number, number] | null;
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
export declare function matrixGridCells(values: MatrixValueGrid): MatrixCell[];
/** True when `data` is a value grid (rows of values) rather than a list of cells. */
export declare function matrixIsGrid(data: unknown[] | undefined): data is MatrixValueGrid;
/**
 * Places the body cells. Merged cells (a range, a parent name or colSpan / rowSpan) win over single cells; among
 * equals the later one wins and whatever it overlaps is dropped. `grid[y * nx + x]` = index into `cells`, or -1.
 */
export declare function matrixPlace(data: MatrixCell[], xh: MatrixHeaderModel, yh: MatrixHeaderModel): {
    cells: MatrixPlaced[];
    grid: Int32Array;
    nx: number;
    ny: number;
};
/** Indices of the media rules that match a container size. */
export declare function matrixMedia(rules: MatrixMediaRule[] | undefined, width: number, height: number): number[];
