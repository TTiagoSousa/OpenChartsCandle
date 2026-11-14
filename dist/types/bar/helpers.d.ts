/** Data helpers for bar charts: waterfall, color scales and datasets. Pure, testable without DOM. */
import type { BarSeries } from './types';
export interface WaterfallResult {
    /** invisible base of every bar (use as a `silent` series with color 'transparent') */
    base: number[];
    /** increases (null where the step goes down) */
    up: (number | null)[];
    /** decreases, as positive heights (null where the step goes up) */
    down: (number | null)[];
    /** running total after each step */
    totals: number[];
}
/**
 * Waterfall from a list of changes (+ and −). Stack `base` (invisible), `up` and `down`
 * to draw floating bars that start where the previous one ended.
 * With `start`, the first bar is the starting total and the changes follow it.
 */
export declare function waterfall(changes: number[], start?: number): WaterfallResult;
/** Continuous color scale: value in [min, max] → a color between `colors` (e.g. for colorBy). */
export declare function colorScale(min: number, max: number, colors: string[]): (v: number) => string;
export type DatasetRow = (string | number | null)[];
export interface DatasetOptions {
    /**
     * 'column' (default): the first column holds the categories and every other column is a series.
     * 'row': the first row holds the categories and every other row is a series.
     */
    seriesLayoutBy?: 'column' | 'row';
    /** Only these series (header names), in this order */
    series?: string[];
}
/**
 * Turn a table (first row = header) or a list of objects into `categories` and `series`.
 * `category` names the column (or key) of the categories — the "encode" of other libraries —
 * and `series` picks the value columns; by default the first column holds the categories.
 */
export declare function fromDataset(source: DatasetRow[] | Record<string, string | number | null>[], opts?: DatasetOptions & {
    category?: string;
}): {
    categories: string[];
    series: BarSeries[];
};
