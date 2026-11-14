import type { Chart } from './chart';
import type { Bar } from './types';
/** One request for bars: the `countBack` newest bars with `time < to`. */
export interface HistoryRequest {
    /** Exclusive upper bound, unix seconds. */
    to: number;
    /** How many bars to return (the newest ones before `to`). Returning fewer is fine. */
    countBack: number;
    /** Aborted when the answer is no longer needed (symbol or timeframe changed, chart destroyed). */
    signal: AbortSignal;
    /** True for the first request of a symbol/timeframe. */
    firstRequest: boolean;
}
/** Answer to a `HistoryRequest`. `noMore: true` = there is nothing older, stop asking. */
export interface HistoryResult {
    bars: Bar[];
    noMore?: boolean;
}
/**
 * Where the chart gets its bars from. Returning a plain `Bar[]` means "this is the whole history"
 * (old style datafeeds): the chart never asks again.
 */
export type HistorySource = (request: HistoryRequest) => Promise<HistoryResult | Bar[]>;
export interface DataSourceOptions {
    /** Open the chart at this instant (unix seconds or ms) instead of the latest bars. */
    time?: number;
    /** Where `time` goes: the center of the chart or its left side. Default 'center'. */
    align?: 'center' | 'start';
    /** Bars asked per request. Default 1000. */
    countBack?: number;
    /**
     * Farther than this many bars from the loaded ones, `goToTime` / `goToTrade` load a window around the
     * date instead of every bar in between (scrolling right then loads the rest). Default 20000.
     */
    maxJump?: number;
}
/**
 * History paging of a chart: loads older bars when the view gets near the first one, windows around far
 * dates, newer bars after a jump or a lost connection. One request at a time; answers for an older
 * symbol/timeframe are dropped even if the source ignores the AbortSignal.
 */
export declare class History {
    private chart;
    source: HistorySource | null;
    /** Series id: changes on every new source (symbol/timeframe). */
    gen: number;
    /** Nothing older to load. */
    noMoreBack: boolean;
    /** The loaded bars don't reach the realtime edge (after a jump or a resync). */
    liveGap: boolean;
    /** While filling a gap at the right edge, keep the view on the newest bar. */
    follow: boolean;
    countBack: number;
    maxJump: number;
    private liveBar;
    private fwdCursor;
    private queue;
    private ctrl;
    private pending;
    private backTask;
    /** After a failed request, automatic loading waits a little before trying again. */
    private retryAt;
    private fwdTask;
    constructor(chart: Chart);
    get loading(): boolean;
    /** Forget the source and drop everything in flight. */
    reset(): void;
    /** First request of a source: replaces the chart's bars. Resolves false when it failed or was replaced. */
    start(source: HistorySource, tf: number, opts: DataSourceOptions): Promise<boolean>;
    /**
     * Called on every frame: loads more when the view is within one screen of the loaded edge, or when the
     * indicators' warm-up needs more bars before the first visible one.
     */
    check(): void;
    /** Load one block of older bars. Resolves with how many were added, -1 on error or when replaced. */
    loadBack(countBack?: number): Promise<number>;
    /** Load newer bars after a jump or a lost connection, until the realtime edge is reached. */
    loadForward(): Promise<number>;
    /**
     * Make the loaded bars contain `time`: older blocks, newer blocks or, when it is far, a window around it.
     * Resolves false when it could not (no source answer, before the start of the history, replaced).
     */
    cover(time: number, margin?: number): Promise<boolean>;
    /** Replace the bars with a window around `time` (the bars in between are loaded later, on demand). */
    private jump;
    /** Back to the newest bars after a jump. */
    toLatest(): Promise<boolean>;
    /**
     * The datafeed lost its connection and is back: load the bars since the last one we have.
     * If the view was on the newest bar it stays there.
     */
    resync(): void;
    /** Realtime bar while the loaded bars don't reach the edge: keep the newest, apply it once connected. */
    holdLive(bar: Bar): boolean;
    /** Exclusive end of the newest bar: the bar being formed now (or the last realtime bar seen). */
    private edge;
    /** `to` of a window that puts `time` in its middle. */
    private windowEnd;
    private fetch;
    /** Run tasks one at a time; errors go to `chart.historyError`. */
    private run;
}
