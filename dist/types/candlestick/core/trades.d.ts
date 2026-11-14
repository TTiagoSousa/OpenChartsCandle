import type { PaneView } from './view';
/** A position with an entry and (optionally) an exit, drawn like a strategy tester. */
export interface Trade {
    id?: string;
    side: 'long' | 'short';
    entryTime: number;
    entryPrice: number;
    /** Omit while the trade is open: the chart shows live P&L against the last price. */
    exitTime?: number;
    exitPrice?: number;
    /** Quantity, shown in the label and used for absolute P&L */
    qty?: number;
    /** Text of the entry label. Default "Long" / "Short" */
    label?: string;
    /** Text of the exit label. Default: P&L % */
    exitLabel?: string;
}
/** Free-form marker (signal, note, fill…). */
export interface Marker {
    time: number;
    price: number;
    shape?: 'arrowUp' | 'arrowDown' | 'circle' | 'square';
    color?: string;
    text?: string;
}
/**
 * What is drawn for each trade. `entries` / `exits` turn the markers on or off;
 * `lines` is the dashed line from entry to exit (with the P&L in the middle).
 */
export interface TradeDisplay {
    entries: boolean;
    exits: boolean;
    lines: boolean;
}
/** Where a trade was clicked: its entry or its exit marker. */
export type TradePoint = 'entry' | 'exit';
export interface TradeClickEvent {
    trade: Trade;
    point: TradePoint;
}
/** Screen area of a drawn entry/exit marker (pane coordinates), used for clicks. */
export interface TradeHit {
    trade: Trade;
    point: TradePoint;
    x: number;
    y: number;
    w: number;
    h: number;
}
export interface TradeColors {
    long: string;
    short: string;
    profit: string;
    loss: string;
}
export interface TradeStats {
    total: number;
    closed: number;
    open: number;
    wins: number;
    losses: number;
    /** % of closed trades with profit */
    winRate: number;
    /** Sum of P&L % of all trades (open ones at the last price) */
    pnlPct: number;
    /** Sum of absolute P&L (qty × price difference) */
    pnl: number;
}
export declare function tradePnl(t: Trade, lastPrice: number): {
    abs: number;
    pct: number;
};
export declare function tradeStats(trades: Trade[], lastPrice: number): TradeStats;
/**
 * Draw trades on the main pane (context already translated to the pane).
 * Returns the clickable areas of the entries/exits that were drawn.
 */
export declare function drawTrades(v: PaneView, trades: Trade[], colors: TradeColors, display?: TradeDisplay, selectedId?: string | null): TradeHit[];
export declare function drawMarkers(v: PaneView, markers: Marker[]): void;
