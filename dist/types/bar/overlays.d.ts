/** Pure calculations for lines drawn over bars: moving averages, trends, cumulative. Testable without DOM. */
type Values = (number | null)[];
/** Simple moving average. A window that contains a gap (null) gives null. */
export declare function sma(values: Values, period: number): Values;
/** Weighted moving average (newest value weighs the most). */
export declare function wma(values: Values, period: number): Values;
/**
 * Exponential moving average (alpha = 2 / (period + 1)), seeded with the SMA of the first
 * `period` values. Gaps keep the previous average and give null at that point.
 */
export declare function ema(values: Values, period: number): Values;
export interface TrendResult {
    values: Values;
    /** goodness of fit, 0–1 */
    r2: number;
}
/** Least-squares straight line through the values (x = position). */
export declare function linearTrend(values: Values): TrendResult & {
    slope: number;
    intercept: number;
};
/**
 * Exponential trend y = a·e^(b·x), fitted on ln(y) (only positive values count).
 * `growth` is the change per position: 0.05 = +5% per category.
 */
export declare function exponentialTrend(values: Values): TrendResult & {
    growth: number;
};
/** Running total; with `percent` the running share of the grand total (Pareto curve). */
export declare function cumulative(values: Values, percent?: boolean): Values;
/** Flat line at the mean of the values. */
export declare function average(values: Values): Values;
export {};
