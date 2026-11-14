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
export declare const FORCE_DEFAULTS: ForceParams;
/** The same object without its undefined fields (so they do not hide the defaults in a spread). */
export declare function definedOnly<T extends object>(o: T): Partial<T>;
/** Spiral start positions (like d3): no two nodes on the same spot, roughly round. */
export declare function spiralPosition(i: number, step?: number): {
    x: number;
    y: number;
};
/**
 * Force-directed layout: repulsion between every pair (Barnes–Hut quadtree, O(n log n)), springs on the
 * links, gravity to the center and velocity decay, cooled by `alpha` (velocity Verlet, as in d3-force).
 */
export declare class ForceSimulation<N extends SimNode = SimNode> {
    nodes: N[];
    alpha: number;
    alphaTarget: number;
    readonly p: ForceParams;
    private links;
    private strength;
    private bias;
    private seed;
    private perm;
    private qStart;
    private qEnd;
    private qCx;
    private qCy;
    private qSize;
    private qKids;
    private qKidStart;
    private qKidCount;
    constructor(nodes: N[], links: SimLink[], params?: Partial<ForceParams>);
    setLinks(links: SimLink[]): void;
    get running(): boolean;
    /** Small deterministic noise (separates nodes on the same spot). */
    private jiggle;
    tick(): void;
    /** Run until cool (or `max` ticks). */
    run(max?: number): void;
    /** Push overlapping nodes apart, with a grid of cells as big as the biggest node. */
    private collide;
    /** Quadtree built top-down by partitioning the nodes in place; each cell keeps its count and center. */
    private buildTree;
    private cell;
    private partition;
}
/** Rest lengths of the links: one length, or [shortest, longest] by value (bigger value → shorter). */
export declare function edgeLengths(values: (number | undefined)[], length: number | [number, number]): number[];
/**
 * Run a force layout to the end and return the positions (same order as `nodes`). Links name nodes by id
 * or index. Handy to precompute big graphs and draw them with layout 'none'.
 */
export declare function graphForceLayout(nodes: {
    id?: string;
    x?: number;
    y?: number;
    fixed?: boolean;
}[], links: {
    source: string | number;
    target: string | number;
    value?: number;
}[], options?: {
    repulsion?: number;
    edgeLength?: number | [number, number];
    gravity?: number;
    friction?: number;
    theta?: number;
    iterations?: number;
}): {
    x: number;
    y: number;
}[];
/**
 * Nodes on a circle of radius 1 (y grows down), in input order, or grouped by category / sorted by value.
 * `angle` is in radians (math convention, counterclockwise from the right; drawn with y down).
 */
export declare function graphCircularLayout(nodes: {
    category?: number | string;
    value?: number;
}[], options?: {
    sort?: 'category' | 'value' | 'none';
    startAngle?: number;
    clockwise?: boolean;
}): {
    x: number;
    y: number;
    angle: number;
}[];
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
export declare function fitBox(extent: [number, number, number, number], box: {
    x: number;
    y: number;
    w: number;
    h: number;
}, options?: {
    aspect?: number;
    flipY?: boolean;
    maxScale?: number;
}): Fit;
export interface Rect {
    x: number;
    y: number;
    w: number;
    h: number;
}
/** Which labels to keep: in the given order (most important first), a label is dropped when it overlaps a kept one. */
export declare function hideOverlaps(rects: Rect[], cellSize?: number): boolean[];
/** Control point of a curved edge: off the middle, perpendicular, by `curveness` × length. */
export declare function curveControl(x1: number, y1: number, x2: number, y2: number, curveness: number): {
    x: number;
    y: number;
};
/** Point on a quadratic curve at t. */
export declare function quadAt(x1: number, y1: number, cx: number, cy: number, x2: number, y2: number, t: number): {
    x: number;
    y: number;
};
export declare function distToSegment(px: number, py: number, x1: number, y1: number, x2: number, y2: number): number;
/** Distance to a quadratic curve (sampled in 12 segments). */
export declare function distToQuad(px: number, py: number, x1: number, y1: number, cx: number, cy: number, x2: number, y2: number): number;
/** Ticks of a log axis: 1, 2, 5 × 10ⁿ (or only powers of ten over wide ranges). */
export declare function logTicks(min: number, max: number): number[];
/** Diameter by value, on a sqrt scale between [min, max] px. */
export declare function sizeByValue(v: number | undefined, lo: number, hi: number, range: [number, number]): number;
