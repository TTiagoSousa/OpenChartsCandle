/** Curve helpers shared by the line and bar families. */
/**
 * Monotone cubic (Fritsch–Carlson) tangents: smooth curves that never overshoot the data
 * (no fake highs/lows between points).
 */
export declare function monotoneTangents(xs: number[], ys: number[]): number[];
