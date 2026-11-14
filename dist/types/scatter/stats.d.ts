/**
 * Statistics for scatter plots (no DOM): regressions, k-means clustering, convex hulls and
 * the beeswarm layout of jittered categories. Testable on their own.
 */
import type { ScatterRegressionType } from './types';
export interface Regression {
    type: ScatterRegressionType;
    /** linear / polynomial: [c0, c1, c2…] of c0 + c1·x + c2·x²…; exponential: [a, b] of a·e^(b·x); logarithmic: [a, b] of a + b·ln(x) */
    coefficients: number[];
    predict: (x: number) => number;
    /** e.g. 'y = 0.5x + 3' */
    expression: string;
    /** Coefficient of determination (0–1) */
    r2: number;
}
/**
 * Fit a curve to [x, y] points: 'linear', 'exponential' (y > 0), 'logarithmic' (x > 0) or
 * 'polynomial' (order 2 by default).
 */
export declare function regression(type: ScatterRegressionType, points: [number, number][], order?: number): Regression;
export interface KMeansStep {
    centroids: number[][];
    /** cluster of each point */
    labels: number[];
}
export interface KMeansResult extends KMeansStep {
    /** Every iteration, from the first guess to the end (to animate the process) */
    steps: KMeansStep[];
}
/** k-means clustering (k-means++ start) of points with any number of dimensions. */
export declare function kmeans(points: number[][], k: number, opts?: {
    maxIterations?: number;
    seed?: number;
}): KMeansResult;
/** Convex hull (counter-clockwise) of 2D points. */
export declare function convexHull(points: [number, number][]): [number, number][];
/**
 * Sideways offsets (px) that keep circles of the given radii from overlapping when they share a
 * line: each point goes to the free spot closest to the middle (beeswarm). `along` are the positions
 * along the line (px); offsets stay within ±maxOffset (overlaps are allowed beyond it).
 */
export declare function beeswarm(along: number[], radii: number[], maxOffset: number): number[];
