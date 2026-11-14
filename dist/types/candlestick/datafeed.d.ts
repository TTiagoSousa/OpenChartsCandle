import type { HistoryResult } from './core/history';
import type { Bar, Quote, SymbolInfo, Timeframe } from './core/types';
/**
 * Data source used by the Terminal UI. Implement it to plug any backend
 * (Binance, your own database, a simulator…).
 *
 * Only `getSymbols`, `getBars` and `subscribeBars` are required.
 */
/** Which bars `getBars` should return: the `countBack` newest bars with `time < to`. */
export interface BarsRequest {
    /** Exclusive upper bound, unix seconds. */
    to: number;
    /** How many bars (the newest ones before `to`). Returning fewer is fine. */
    countBack: number;
    /** Aborted when the answer is no longer needed (symbol or timeframe changed). */
    signal: AbortSignal;
    /** True for the first request of a symbol/timeframe. */
    firstRequest: boolean;
}
/** Answer of `getBars` in blocks. `noMore: true` = nothing older, the chart stops asking. */
export type BarsResult = HistoryResult;
export interface Datafeed {
    /** Instruments available in the symbol search (and the watchlist by default). */
    getSymbols(): SymbolInfo[] | Promise<SymbolInfo[]>;
    /**
     * Historical bars, oldest first. `time` in UTC seconds (ms is accepted).
     *
     * - In blocks (like TradingView): use `request` and return `{ bars, noMore }` with the `countBack`
     *   newest bars before `request.to`. The chart asks for older blocks while the user scrolls left.
     * - All at once (old style): ignore `request` and return `Bar[]` with the whole history.
     */
    getBars(symbol: string, timeframe: Timeframe, request: BarsRequest): Promise<BarsResult | Bar[]>;
    /**
     * Realtime updates. Call `onBar` with the current (forming) bar every time it changes,
     * and with the new bar when a new period starts. Bars older than the last one are ignored.
     * After a lost connection call `onResync()`: the chart loads the bars it missed.
     * Return an unsubscribe function.
     */
    subscribeBars(symbol: string, timeframe: Timeframe, onBar: (bar: Bar) => void, onResync?: () => void): () => void;
    /** Optional realtime quotes for the watchlist / details panel. Return an unsubscribe function. */
    subscribeQuotes?(symbols: string[], onQuote: (quote: Quote) => void): () => void;
}
