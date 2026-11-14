/** Funnel geometry: stage widths and the trapezoid of each stage, in a frame along the flow. */
/** A stage in the funnel frame: `a0`–`a1` along the flow, widths at both ends (across). */
export interface FunnelStageShape {
    a0: number;
    a1: number;
    /** width where the stage starts (top in a vertical funnel) */
    w0: number;
    /** width where it ends */
    w1: number;
}
/** A length given in px or '%' of `total`. */
export declare function funnelLength(v: number | string | undefined, total: number, def: number): number;
/** Width of a value: linear from `min` → `minPx` to `max` → `maxPx`, clamped. */
export declare function funnelWidth(v: number, min: number, max: number, minPx: number, maxPx: number): number;
/**
 * Trapezoids of the stages, in their drawing order. Descending (and 'none'): a stage starts at its own width and
 * ends at the next one's (the last ends at `minPx`); ascending: it starts at the previous one's (the first at
 * `minPx`) and ends at its own, like a pyramid.
 */
export declare function funnelShapes(values: number[], o: {
    length: number;
    gap: number;
    min: number;
    max: number;
    minPx: number;
    maxPx: number;
    ascending: boolean;
}): FunnelStageShape[];
/** Order of the stages for a sort mode (indices into the data). */
export declare function funnelOrder(values: number[], sort?: 'descending' | 'ascending' | 'none'): number[];
export declare function pointInPolygon(x: number, y: number, pts: {
    x: number;
    y: number;
}[]): boolean;
