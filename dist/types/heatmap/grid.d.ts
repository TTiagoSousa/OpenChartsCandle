import type { HeatmapAxis, HeatmapDatum, HeatmapKey, HeatmapPiece } from './types';
type DatumObject = Extract<HeatmapDatum, {
    x: HeatmapKey;
}>;
export interface HeatGrid {
    nx: number;
    ny: number;
    /** value of cell (x, y) at y * nx + x; NaN = empty */
    values: Float64Array;
    /** objects given in `data`, by cell index */
    datums: Map<number, DatumObject>;
    xNames: (string | number)[];
    yNames: (string | number)[];
    /** finite min / max of the values (0 / 1 when there are none) */
    min: number;
    max: number;
}
/** Build the value grid from `data` triples / objects or a `matrix`. */
export declare function buildHeatGrid(data: HeatmapDatum[] | undefined, matrix: (number | null)[][] | undefined, xAxis?: HeatmapAxis, yAxis?: HeatmapAxis): HeatGrid;
/** Every how many categories a label fits (`need` px per label): 1, 2, 5, 10, 20… so they fall on round positions. */
export declare function labelStep(need: number, cell: number): number;
/**
 * How to show the labels of a category axis: rotation (degrees) and every how many categories.
 * `cell` = px per category, `maxW` = widest label in px. With 'auto' the labels turn 45° when that shows more
 * of them than thinning alone.
 */
export declare function axisLabelPlan(cell: number, maxW: number, fontSize: number, rotate?: number | 'auto', gap?: number): {
    rotate: number;
    step: number;
};
/** Index of the piece of a value, or -1. The last `max` is inclusive when it is the top of the range. */
export declare function heatPieceOf(pieces: HeatmapPiece[], v: number, top?: number): number;
/** N equal pieces between min and max, colored along `colors`. */
export declare function splitPieces(min: number, max: number, n: number, colors: string[], format?: (v: number) => string): HeatmapPiece[];
/**
 * Cells grouped by color bucket (counting sort), so a frame changes the fill color at most once per bucket.
 * `bucket[i]` < 0 = no bucket (empty cell). Returns the cell order and where each bucket starts in it.
 */
export declare function bucketOrder(bucket: Int16Array, count: number): {
    order: Uint32Array;
    start: Uint32Array;
};
/** Simple returns of a price series: (p[i] / p[i-1]) - 1. */
export declare function heatmapReturns(prices: number[]): number[];
/**
 * Pearson correlation matrix of several series (e.g. the returns of a few assets): `m[i][j]` in [-1, 1],
 * 1 on the diagonal. Pairs use only the positions where both values are finite; a constant series correlates 0.
 */
export declare function heatmapCorrelation(series: number[][]): number[][];
export {};
