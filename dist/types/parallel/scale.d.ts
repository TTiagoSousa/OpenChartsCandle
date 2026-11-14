import type { ParallelAxis, ParallelPiece, ParallelValue } from './types';
/** Pure helpers of the parallel family: axis scales, brush filtering and visualMap pieces (no DOM). */
export interface ParallelScale {
    type: 'value' | 'log' | 'category';
    /** Value at the start / end of the axis (category axes: first / last index) */
    min: number;
    max: number;
    categories: string[];
    inverse: boolean;
    /** Ticks: position 0–1 along the axis and value */
    ticks: {
        t: number;
        value: number | string;
    }[];
    /** Position 0–1 along the axis (0 = start), or NaN when there is no value */
    toT(v: ParallelValue | undefined): number;
    /** Value at a position (category axes: the nearest index) */
    fromT(t: number): number;
}
/** Build the scale of an axis from its options and the values found in the data. */
export declare function buildParallelScale(axis: ParallelAxis, values: ParallelValue[]): ParallelScale;
/** A brushed range on one dimension, as positions 0–1 along the axis (lo ≤ hi). */
export interface ParallelTRange {
    dim: number;
    lo: number;
    hi: number;
}
/**
 * Is row `row` inside every range? `T` holds the positions of all rows, `dims` per row (NaN = no value, never
 * inside a range). No ranges = every row is inside.
 */
export declare function parallelInRanges(T: ArrayLike<number>, row: number, dims: number, ranges: ParallelTRange[]): boolean;
/** Index of the piece a value falls in (value match, or min ≤ v < max), -1 when none. */
export declare function parallelPieceIndex(pieces: ParallelPiece[], v: ParallelValue | undefined): number;
/** The brushed range of an axis in its own units: a value range, or the categories inside. */
export declare function parallelRangeValues(scale: ParallelScale, lo: number, hi: number): {
    from?: number;
    to?: number;
    categories?: string[];
};
/** Cross position (0–1) of a segment from t0 to t1 at a fraction u of the way, straight or eased (smooth). */
export declare function parallelSegmentAt(t0: number, t1: number, u: number, smooth: number): number;
