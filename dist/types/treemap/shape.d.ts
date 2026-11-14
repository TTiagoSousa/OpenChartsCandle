/**
 * Shapes of the nodes and the morph between them: rectangles (treemap), annular sectors
 * (sunburst) and polygons (in between, while one turns into the other).
 */
export interface RectShape {
    k: 'r';
    x: number;
    y: number;
    w: number;
    h: number;
}
/** Angles in radians, canvas convention (0 = right, clockwise). */
export interface SectorShape {
    k: 's';
    cx: number;
    cy: number;
    r0: number;
    r1: number;
    a0: number;
    a1: number;
}
export interface PolyShape {
    k: 'p';
    /** x0, y0, x1, y1… */
    pts: number[];
}
export type Shape = RectShape | SectorShape | PolyShape;
/**
 * Outline as a polygon, edge by edge so that shapes match when morphing:
 * top ↔ outer arc, right ↔ end radius, bottom ↔ inner arc, left ↔ start radius.
 */
export declare function sample(s: Shape): number[];
/** Shape between a and b (t 0–1). Same kinds interpolate their parameters, others morph as polygons. */
export declare function lerpShape(a: Shape, b: Shape, t: number): Shape;
/** Same shape squeezed to nothing around its middle (for nodes that appear or leave). */
export declare function collapse(s: Shape): Shape;
export declare function center(s: Shape): [number, number];
/** Map a shape from the rectangle `from` onto `to` (zoom transitions). */
export declare function mapShape(s: Shape, from: RectShape, to: RectShape): Shape;
export declare function tracePath(ctx: CanvasRenderingContext2D, s: Shape): void;
export declare function contains(s: Shape, x: number, y: number): boolean;
