import type { Chart } from '../core/chart';
import { TradePoint } from '../core/trades';
export interface TradeListOptions {
    /** Title of the panel. Default "Lista de trades". `null` hides the header title. */
    title?: string | null;
    /** Buttons Ambas / Entradas / Saídas and the "Linha" switch. Default true. */
    toggles?: boolean;
    /** Field to jump to a trade by id. Default true. */
    search?: boolean;
    /** Summary: trades, win rate, P&L. Default true. */
    stats?: boolean;
    /** The table of trades. `false` leaves only the header (a toolbar for the chart). Default true. */
    table?: boolean;
    /** What a click on a row does. Default 'entry'. The entry and exit cells always go to their point. */
    rowClick?: TradePoint | 'both';
    /** Newest trade at the top. Default true. */
    newestFirst?: boolean;
    /** The title collapses / expands the table. Default false. */
    collapsible?: boolean;
    /** Start collapsed (with `collapsible`). Default false. */
    collapsed?: boolean;
    /** Format of times. Default: like the crosshair label of the chart's timeframe. */
    formatTime?: (timeSeconds: number) => string;
    /** Format of prices. Default: the symbol's precision. */
    formatPrice?: (price: number) => string;
}
/**
 * List of trades linked to a chart: show only entries, only exits or both (with or without the
 * line between them), jump to a trade by id, and click a row / entry / exit to scroll the chart to it.
 * Clicking a trade on the chart selects its row.
 */
export declare class TradeList {
    readonly chart: Chart;
    readonly el: HTMLElement;
    private opts;
    private body;
    private statsEl;
    private modeBtns;
    private lineBtn;
    private rows;
    private offs;
    private lastBars;
    constructor(container: HTMLElement, chart: Chart, options?: TradeListOptions);
    /** Re-read the chart theme (call after `chart.applyTheme`). */
    applyTheme(): void;
    /** Remove the list and its listeners. */
    destroy(): void;
    private buildHeader;
    private setMode;
    private syncToggles;
    private fmtTime;
    private fmtPrice;
    private lastPrice;
    private onData;
    private fillPnl;
    private renderStats;
    /** Rebuild the table from `chart.trades`. Called automatically when trades or data change. */
    render(): void;
    private markSelected;
}
/** Create a trade list linked to a chart (or `terminal.chart`). */
export declare function createTradeList(container: HTMLElement, chart: Chart, options?: TradeListOptions): TradeList;
