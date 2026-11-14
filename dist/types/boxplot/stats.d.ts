import type { BoxplotSeries } from './types';
/** Result of boxplotStats: the box, its whiskers and what lies beyond them. */
export interface BoxplotStatsResult {
    /** Lower whisker end: the smallest value inside the lower fence */
    low: number;
    q1: number;
    median: number;
    q3: number;
    /** Upper whisker end: the biggest value inside the upper fence */
    high: number;
    /** Q3 − Q1 */
    iqr: number;
    /** Smallest and biggest values, outliers included */
    min: number;
    max: number;
    mean: number;
    count: number;
    /** Values below Q1 − k·IQR or above Q3 + k·IQR, sorted */
    outliers: number[];
}
/**
 * Quantile p (0–1) of SORTED values with linear interpolation between the closest ranks
 * (h = (n − 1)·p, Hyndman & Fan type 7: the default of R, NumPy and Excel QUARTILE.INC).
 */
export declare function boxplotQuantile(sorted: number[], p: number): number;
/**
 * Box of raw values (NaN and non-numbers are ignored; null when nothing is left). Quartiles with
 * boxplotQuantile; the whiskers go to the most extreme values inside Q1 − k·IQR and Q3 + k·IQR (Tukey, k = 1.5),
 * the rest are outliers. `whisker: 'range'` puts the whiskers at the min and max (no outliers).
 */
export declare function boxplotStats(values: readonly (number | null | undefined)[], opts?: {
    whisker?: number | 'range';
}): BoxplotStatsResult | null;
type Field<T, R> = keyof T | ((row: T) => R);
/**
 * Group raw rows into boxes: one category per distinct `category`, one series per distinct `series` (or a single
 * series named `name`), the values of each group as samples (the chart computes the boxes). Categories and series
 * keep the order of first appearance unless `sort` is given.
 */
export declare function boxplotAggregate<T>(rows: readonly T[], opts: {
    category: Field<T, string | number>;
    value: Field<T, number | null | undefined>;
    series?: Field<T, string | number>;
    name?: string;
    sort?: (a: string, b: string) => number;
}): {
    categories: string[];
    series: BoxplotSeries[];
};
export {};
