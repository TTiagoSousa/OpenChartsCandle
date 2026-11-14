export interface CustomCircle {
    x: number;
    y: number;
    r: number;
}
/** Smallest circle enclosing every circle. */
export declare function customEnclose(circles: CustomCircle[]): CustomCircle | null;
/**
 * Pack circles (their `r` set) side by side without overlaps, around (0, 0): sets `x` / `y` of each and
 * returns the radius of the enclosing circle. Front-chain algorithm (Wang et al.), as in d3.packSiblings.
 */
export declare function customPackSiblings<T extends CustomCircle>(circles: T[]): number;
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
export declare function customPack(root: CustomPackInput, opts: {
    width: number;
    height: number;
    padding?: number;
    sort?: boolean;
}): CustomPackedNode[];
export interface CustomBin {
    x0: number;
    x1: number;
    count: number;
}
/** Bin values into equal-width bins with nice edges (`bins` ≈ how many, or a fixed `binWidth`). */
export declare function customHistogram(values: number[], opts?: {
    bins?: number;
    binWidth?: number;
    min?: number;
    max?: number;
}): CustomBin[];
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
export declare function customHexbin(points: [number, number][], r: number): CustomHexBin[];
/** Corners of a pointy-top hexagon. */
export declare function customHexagon(x: number, y: number, r: number): [number, number][];
