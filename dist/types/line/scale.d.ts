/** Pure helpers of the line family: ticks, time intervals, curves, lookups. Testable without DOM. */
import { monotoneTangents } from '../shared/curve';
import { formatCompact, niceScale, niceStep } from '../shared/format';
export { formatCompact, monotoneTangents, niceScale, niceStep };
export interface Tick {
    value: number;
    label: string;
    /** true for "bigger" boundaries (new day, month, year) */
    major?: boolean;
}
/** Time ticks for a range in seconds, local time, with labels adapted to the interval. */
export declare function timeTicks(min: number, max: number, maxTicks: number): Tick[];
export declare function formatTime(t: number, step: number): string;
/** Full date/time for tooltips, precision chosen from the data spacing. */
export declare function formatTooltipTime(t: number, spacing: number): string;
/** Index of the item whose value is closest to `v` in a sorted array. */
export declare function nearestIndex(sorted: number[], v: number): number;
/** Decide the x type from the raw values. */
export declare function detectXType(values: (number | string)[]): 'time' | 'category' | 'number';
