import { SeriesData } from './data';
import type { HistoryRequest, HistoryResult } from './history';
import type { Bar, Timeframe } from './types';
/**
 * Bars of other timeframes, for indicators with their own `timeframe` (e.g. the 4h MA on a 1h chart).
 * Same contract as the chart's data source: the `countBack` newest bars before `request.to`, or a plain
 * `Bar[]` with the whole history. The Terminal builds it from its `Datafeed`.
 */
export interface TimeframeFeed {
    getBars(timeframe: Timeframe, request: HistoryRequest): Promise<HistoryResult | Bar[]>;
    /** Realtime bars of that timeframe (the forming one on every change). Return an unsubscribe function. */
    subscribeBars?(timeframe: Timeframe, onBar: (bar: Bar) => void): () => void;
}
/**
 * For each chart bar, the index of the bar of the other timeframe whose value it shows, or -1. No look-ahead:
 * - a larger timeframe gives the last of its bars closed when the chart bar opens: on 1h, the 4h bar that
 *   closed at 12:00 for the 12:00 to 15:00 bars, the next one from the 16:00 bar on (steps);
 * - a smaller one gives its last bar closed when the chart bar closes (the forming chart bar: the last closed).
 * The newest bar of the other timeframe only counts once it is closed. `live`: its bars reach now; when they
 * don't, chart bars after them get -1 (not loaded yet) instead of an old value.
 */
export declare function mapTimeframe(chart: Bar[], chartTf: number, own: Bar[], ownTf: number, live: boolean): Int32Array;
/**
 * The bars of one other timeframe, loaded in blocks around what the chart shows: one window, extended to
 * the left (older blocks) and to the right (up to now, then realtime), replaced by a new window after a
 * far jump. One request at a time.
 */
export declare class TimeframeSeries {
    readonly tf: Timeframe;
    private readonly feed;
    private readonly changed;
    private readonly idle;
    private readonly failed;
    data: SeriesData;
    /** Nothing older to load. */
    noMoreBack: boolean;
    /** The bars reach now: realtime bars are applied. */
    live: boolean;
    private whole;
    private busy;
    private dead;
    private retryAt;
    private fwdCursor;
    private first;
    /** `to` of the last window that came back empty: not asked again. */
    private emptyWindow;
    private held;
    private readonly ctrl;
    private unsub;
    /**
     * `changed(from)`: bars from index `from` changed (0 = replaced or older bars added).
     * `idle()`: a request finished (the chart checks again whether more is needed).
     */
    constructor(tf: Timeframe, feed: TimeframeFeed, changed: (from: number) => void, idle: () => void, failed: (err: unknown) => void);
    destroy(): void;
    /**
     * Make the bars cover `[from, to)` (unix seconds), at most `maxBars` of them (keeping the newest part).
     * Called on every frame: starts at most one request.
     */
    ensure(from: number, to: number, countBack: number, maxBars: number): void;
    private run;
    private onLive;
    private flush;
}
