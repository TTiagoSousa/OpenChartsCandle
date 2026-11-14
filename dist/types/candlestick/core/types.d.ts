import type { SessionHours } from './sessions';
export interface Bar {
    time: number;
    open: number;
    high: number;
    low: number;
    close: number;
    volume: number;
}
/** A point anchored to chart data: time (unix seconds, may be fractional/extrapolated) + price. */
export interface Point {
    time: number;
    price: number;
}
export interface Rect {
    x: number;
    y: number;
    w: number;
    h: number;
}
export type ChartType = 'bars' | 'candles' | 'hollow' | 'heikin' | 'line' | 'step' | 'area' | 'baseline';
export interface Timeframe {
    id: string;
    label: string;
    short: string;
    seconds: number;
}
/** Instrument metadata shown in the UI and used for price formatting. */
export interface SymbolInfo {
    /** Unique ticker, e.g. "BTCUSDT" */
    symbol: string;
    /** Number of decimals for prices, e.g. 2 */
    precision: number;
    /** Long description, e.g. "Bitcoin / TetherUS" */
    name?: string;
    /** Exchange or source label, e.g. "BINANCE" */
    exchange?: string;
    /** Free-form category used by the symbol search tabs: crypto, forex, stock, index, commodity… */
    type?: string;
    /** Quote currency shown next to prices in the details panel */
    currency?: string;
    /** Timeframes offered for this symbol in the Terminal, e.g. ['1', '5', '1h', '4h', '1D']. Default: all. */
    timeframes?: string[];
    /** IANA time zone of the exchange, e.g. 'America/New_York'. Used when the chart's `timezone` is 'exchange'. */
    timezone?: string;
    /**
     * Hours of the trading day in `timezone` (`{ pre: '0400-0930', regular: '0930-1600', post: '1600-2000' }`),
     * used by the session volume profile. Default: those of `exchange` (see `EXCHANGE_SESSIONS`).
     */
    sessions?: SessionHours;
}
/** Realtime summary used by the watchlist and details panel. */
export interface Quote {
    symbol: string;
    last: number;
    change: number;
    changePct: number;
    open?: number;
    high?: number;
    low?: number;
    volume?: number;
}
export declare const TIMEFRAMES: Timeframe[];
export declare function timeframeById(id: string): Timeframe;
/**
 * Timeframe from a string: the ids of `TIMEFRAMES` ("1", "60", "1D") or a number with a unit
 * ("30s", "15m", "4h", "1D", "1W"). A number alone is minutes. Returns null when it can't be read.
 */
export declare function parseTimeframe(s: string): Timeframe | null;
