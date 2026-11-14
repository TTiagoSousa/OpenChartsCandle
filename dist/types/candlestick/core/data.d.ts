import type { Bar } from './types';
/** Start of the bucket (UTC) that contains `t` for a timeframe of `tf` seconds. Weeks start on Monday. */
export declare function bucketStart(t: number, tf: number): number;
/**
 * Aggregate bars (typically 1m) into a larger timeframe.
 * Appends to `out` starting from `fromIdx` of `base`.
 */
export declare function aggregate(base: Bar[], tf: number, fromIdx?: number, out?: Bar[]): Bar[];
/** Validate & normalise user supplied bars: sorted ascending, unique times, seconds. */
export declare function normalizeBars(bars: Bar[]): Bar[];
/** The bars of the active timeframe plus time <-> logical index mapping. */
export declare class SeriesData {
    tf: number;
    bars: Bar[];
    constructor(tf: number, bars?: Bar[]);
    get length(): number;
    /**
     * Apply a realtime bar. Same time as the last bar replaces it, newer time appends.
     * Returns the first index that changed, or -1 if the bar was ignored (older than last).
     */
    update(bar: Bar): number;
    /**
     * Add older bars at the start (history paging). Only bars older than the first one are used.
     * Returns how many were added.
     */
    prepend(bars: Bar[]): number;
    /**
     * Add newer bars at the end (forward paging, resync). A bar with the time of the last one replaces it.
     * Returns the first index that changed and how many bars were added, or null if nothing changed.
     */
    append(bars: Bar[]): {
        from: number;
        added: number;
    } | null;
    /**
     * Index of the bar that contains `t` (the last bar starting at or before it): 10:37 → the 10:00 bar on 1h.
     * Before the first bar or after the last one it counts whole periods of the timeframe.
     */
    indexAt(t: number): number;
    /** Fractional logical index for a timestamp (extrapolates beyond data). */
    timeToIndex(t: number): number;
    indexToTime(fi: number): number;
}
