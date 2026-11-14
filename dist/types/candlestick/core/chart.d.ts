import { DrawingManager, DrawingStorage } from '../drawings/manager';
import type { Drawing } from '../drawings/base';
import type { Indicator } from '../indicators/indicators';
import { SeriesData } from './data';
import { DataSourceOptions, History, HistorySource } from './history';
import { PriceScale, TimeScale } from './scales';
import { Theme } from './theme';
import { Marker, Trade, TradeClickEvent, TradeColors, TradeDisplay, TradePoint } from './trades';
import { TimeRange } from './time-ranges';
import { TimeframeFeed } from './timeframes';
import { TimeZone, TimeZoneId } from './timezone';
import { Bar, ChartType, Rect, SymbolInfo } from './types';
import { Emitter } from './utils';
import { PaneView } from './view';
export interface Pane {
    id: string;
    ps: PriceScale;
    rect: Rect;
    ratio: number;
    indicators: Indicator[];
    main: boolean;
}
export type CursorMode = 'cross' | 'dot' | 'arrow' | 'eraser';
export interface ContextMenuEvent {
    clientX: number;
    clientY: number;
    drawing: Drawing | null;
    pane: Pane | null;
}
export interface ChartOptions {
    /** Instrument shown (used for price precision and drawings storage key). */
    symbol?: SymbolInfo;
    /** Initial chart type. Default "candles". */
    chartType?: ChartType;
    /**
     * Where drawings are persisted per symbol. Defaults to localStorage (key prefix "openchartscandle").
     * Pass `null` to disable persistence and manage drawings yourself via `chart.drawings`.
     */
    drawingStorage?: DrawingStorage | null;
    /** Colors (background, grid, candles…). Missing keys come from the default theme. */
    theme?: Partial<Theme>;
    /** Show the price scale on the right. Default true. */
    priceAxis?: boolean;
    /** Show the time scale at the bottom. Default true. */
    timeAxis?: boolean;
    /** Show the crosshair. Default true. */
    crosshair?: boolean;
    /** Dotted line + label at the last price. Default true. */
    lastPriceLine?: boolean;
    /** Colors used by `setTrades`. */
    tradeColors?: Partial<TradeColors>;
    /** What is drawn for each trade: entries, exits and the line between them. Default all on. */
    tradeDisplay?: Partial<TradeDisplay>;
    /** Zoom/scroll with the mouse wheel. Set false inside scrollable pages (dashboards). Default true. */
    mouseWheel?: boolean;
    /**
     * Time zone of the time axis and the crosshair: 'local' (the browser's, default), 'UTC', an IANA name
     * ('Europe/Lisbon', 'America/New_York'…) or 'exchange' (`symbol.timezone`). Daily bars always show their date.
     */
    timezone?: TimeZoneId;
}
export declare class Chart {
    readonly el: HTMLElement;
    readonly canvas: HTMLCanvasElement;
    private ctx;
    width: number;
    height: number;
    dpr: number;
    symbol: SymbolInfo;
    data: SeriesData;
    readonly ts: TimeScale;
    panes: Pane[];
    chartType: ChartType;
    private haBars;
    readonly drawings: DrawingManager;
    crosshair: {
        x: number;
        y: number;
        pane: Pane | null;
        visible: boolean;
        index: number;
    };
    cursorMode: CursorMode;
    priceAxisW: number;
    timeAxisH: number;
    /** This chart's colors. Change with `applyTheme`. */
    theme: Theme;
    showPriceAxis: boolean;
    showTimeAxis: boolean;
    crosshairEnabled: boolean;
    mouseWheel: boolean;
    lastPriceLine: boolean;
    trades: Trade[];
    markers: Marker[];
    /** Vertical lines and shaded zones in time. Change with `setTimeRanges`. */
    timeRanges: TimeRange[];
    tradeColors: TradeColors;
    /** What is drawn for each trade. Change with `setTradeDisplay`. */
    tradeDisplay: TradeDisplay;
    /** Id of the highlighted trade (ring around its entry and exit), or null. */
    selectedTradeId: string | null;
    private tradeHits;
    percentMode: boolean;
    readonly crosshairMoved: Emitter<number | null>;
    readonly dataUpdated: Emitter<void>;
    readonly layoutChanged: Emitter<void>;
    readonly indicatorsChanged: Emitter<void>;
    readonly viewChanged: Emitter<void>;
    readonly drawingDblClick: Emitter<Drawing>;
    readonly contextMenu: Emitter<ContextMenuEvent>;
    /** A trade's entry or exit was clicked on the chart. */
    readonly tradeClick: Emitter<TradeClickEvent>;
    /** The highlighted trade changed (`selectTrade`, a click or `goToTrade`). */
    readonly tradeSelected: Emitter<Trade | null>;
    /** Trades were set, added or updated. */
    readonly tradesChanged: Emitter<void>;
    /** `tradeDisplay` changed. */
    readonly tradeDisplayChanged: Emitter<TradeDisplay>;
    /** A request of the data source started (true) or all of them finished (false). */
    readonly loadingChanged: Emitter<boolean>;
    /** A request of the data source failed. Nothing is shown on the chart: show it in your app. */
    readonly historyError: Emitter<unknown>;
    /** Bars arrived from the data source: older ('back'), newer ('forward') or a new set ('reset'). */
    readonly historyLoaded: Emitter<{
        added: number;
        direction: 'back' | 'forward' | 'reset';
    }>;
    /** The time zone of the axis changed (`setTimezone`). */
    readonly timezoneChanged: Emitter<TimeZoneId>;
    /** History paging (`setDataSource`). */
    readonly history: History;
    /** Don't draw the bars while the first request with a `time` is positioning the view. */
    private holding;
    private tfFeed;
    /** Bars of the other timeframes used by indicators, by seconds. */
    private tfSeries;
    /** Timeframe (seconds) whose bars each indicator's `raw` was computed on; 0 = the chart's. */
    private indMode;
    private tzId;
    private tzCache;
    private frame;
    private interaction;
    private kinetic;
    private kineticRaf;
    private animRaf;
    private lastLayoutKey;
    private lastCrosshairIndex;
    private pointerInside;
    private resizeObserver;
    constructor(el: HTMLElement, options?: ChartOptions);
    /** Change colors (merged with the current theme). */
    applyTheme(patch: Partial<Theme>): void;
    /** Change display options after creation. */
    applyOptions(o: Pick<ChartOptions, 'priceAxis' | 'timeAxis' | 'crosshair' | 'lastPriceLine' | 'tradeColors' | 'tradeDisplay' | 'mouseWheel'>): void;
    /**
     * Show entries/exits (strategy tester style). Open trades show live P&L.
     * Trades without `id` get one from their position ("1", "2"…), so every trade can be found.
     */
    setTrades(trades: Trade[]): void;
    addTrade(trade: Trade): void;
    /** Update a trade by id (e.g. close it with exitTime/exitPrice). */
    updateTrade(id: string, patch: Partial<Trade>): void;
    /** The trade with this id, if any. */
    trade(id: string): Trade | undefined;
    /**
     * Choose what is drawn: only entries, only exits, or both with or without the dashed line.
     * `chart.setTradeDisplay({ exits: false })` → only entries;
     * `chart.setTradeDisplay({ lines: false })` → both, without the line.
     */
    setTradeDisplay(patch: Partial<TradeDisplay>): void;
    /** Highlight a trade (ring around its entry and exit). `null` clears it. */
    selectTrade(id: string | null): void;
    /**
     * Scroll to a trade by id and highlight it.
     * `point`: 'entry' centers the entry, 'exit' the exit (an open trade has none: goes to the last bar),
     * 'both' zooms so the whole trade fits. Bars that are not loaded yet are loaded first (data source).
     * Resolves false when the id is unknown or the trade is before the start of the history.
     */
    goToTrade(id: string, point?: TradePoint | 'both', opts?: {
        animate?: boolean;
        select?: boolean;
    }): Promise<boolean>;
    private animateRightOffset;
    /** Trade entry/exit under a point of the main pane (pane coordinates). */
    tradeAt(x: number, y: number): TradeClickEvent | null;
    /** The time zone chosen with the `timezone` option or `setTimezone` ('local' by default). */
    get timezone(): TimeZoneId;
    /** The zone actually used: 'exchange' resolves to `symbol.timezone` (UTC without one). */
    get timeZone(): TimeZone;
    /**
     * Time zone of the time axis and the crosshair: 'local', 'UTC', an IANA name ('Europe/Lisbon') or 'exchange'.
     * Throws a RangeError for a name the browser doesn't know.
     */
    setTimezone(tz: TimeZoneId): void;
    /** Format an instant like the crosshair label, in the chart's time zone. */
    formatTime(time: number, withTime?: boolean): string;
    /**
     * Vertical lines (`{ from }`) and shaded zones (`{ from, to }`) in time: start of a simulation, warm-up,
     * excluded periods… Each edge snaps to the bar that contains it, in any timeframe.
     */
    setTimeRanges(ranges: TimeRange[]): void;
    /** Add one line or zone. Returns its id. */
    addTimeRange(range: TimeRange): string;
    /** Remove the line or zone with this id. */
    removeTimeRange(id: string): void;
    setMarkers(markers: Marker[]): void;
    /** Remove the chart from the DOM and stop all observers/animations. */
    destroy(): void;
    get mainPane(): Pane;
    private makePane;
    /** Set the instrument (precision, name). Loads the drawings stored for it. */
    setSymbol(info: SymbolInfo): void;
    /**
     * Replace all bars. `timeframeSeconds` is the bar duration (60 = 1m, 86400 = 1D).
     * `resetView` scrolls back to the latest bar and re-enables auto scale.
     */
    setData(bars: Bar[], timeframeSeconds: number, resetView?: boolean): void;
    /** Replace the bars without touching the data source (used by the history paging). @internal */
    replaceData(bars: Bar[], timeframeSeconds: number, resetView: boolean): void;
    /**
     * Load bars from a source that serves them in blocks, like TradingView: the latest `countBack` bars first,
     * older blocks while scrolling to the left, and whatever `goToTime` / `goToTrade` need.
     * Requests for a previous source are aborted and their answers ignored.
     * Resolves false when the first request failed or another source replaced this one.
     *
     * chart.setDataSource(({ to, countBack, signal }) => api.bars('BTCUSDT', '1h', to, countBack, signal), 3600);
     */
    setDataSource(source: HistorySource | null, timeframeSeconds: number, opts?: DataSourceOptions): Promise<boolean>;
    /** The data source lost its connection and is back: load the bars since the last one. */
    resync(): void;
    /** The first bars of a data source with a `time` are loading (nothing is drawn yet). */
    get isHolding(): boolean;
    /** Requests of the data source in progress. */
    get isLoading(): boolean;
    /** Make sure the loaded bars contain `time` (loading older ones if needed). */
    ensureHistory(time: number): Promise<boolean>;
    /** Add older bars at the left (history paging). The view does not move. Returns how many were added. */
    prependBars(bars: Bar[]): number;
    /**
     * Add newer bars at the right (forward paging, resync). With `follow` the view stays on the newest bar,
     * otherwise it does not move. Returns how many bars were added.
     */
    appendBars(bars: Bar[], follow?: boolean): number;
    private afterDataReset;
    /** Realtime update: same time as the last bar replaces it, a newer time appends a new bar. */
    update(bar: Bar): void;
    /** Current bars (oldest first). */
    get bars(): Bar[];
    private recomputeIndicators;
    /**
     * Where indicators with their own `timeframe` (the 4h MA on a 1h chart) get their bars: the same contract
     * as `setDataSource`, plus the timeframe. Set it again when the symbol changes. The Terminal sets it.
     *
     * chart.setTimeframeFeed({
     *   getBars: (tf, { to, countBack, signal }) => api.bars('BTCUSDT', tf.id, to, countBack, signal),
     *   subscribeBars: (tf, onBar) => api.subscribe('BTCUSDT', tf.id, onBar),
     * });
     */
    setTimeframeFeed(feed: TimeframeFeed | null): void;
    /** The timeframe an indicator uses when it is not the chart's, or null. */
    private ownTimeframe;
    /** Forget the bars of the other timeframes (new symbol or feed); they load again for the new data. */
    private dropTimeframeSeries;
    /** One series per timeframe in use; indicators that changed between the chart's and another are recomputed. */
    private syncTimeframes;
    /** Compute an indicator on its bars (`full`: from the start even if its mode did not change), then map it. */
    private computeIndicator;
    /** Values per chart bar from the values per bar of the indicator's own timeframe (no look-ahead). */
    private mapIndicator;
    private onTimeframeBars;
    /**
     * Bars an indicator on the chart's timeframe needs before the first one shown (warm-up): older blocks are
     * loaded until they are there, also after a jump (`goToTime`, `goToTrade`).
     */
    warmupBars(): number;
    /** Called on every frame: load the bars of the other timeframes that the visible bars (and their warm-up) need. */
    private checkTimeframes;
    displayBars(): Bar[];
    setChartType(t: ChartType): void;
    get indicators(): Indicator[];
    addIndicator(ind: Indicator): void;
    removeIndicator(ind: Indicator): void;
    updateIndicator(ind: Indicator): void;
    paneOf(ind: Indicator): Pane | undefined;
    resetView(): void;
    /** Show the last `count` bars. */
    showLastBars(count: number): void;
    scrollBars(delta: number): void;
    zoomStep(dir: 1 | -1): void;
    scrollToRealtime(): void;
    isScrolledBack(): boolean;
    /** Time at the center of the chart (unix seconds). */
    centerTime(): number;
    /**
     * Scroll to an instant (unix seconds or ms). With a data source, bars that are not loaded yet are
     * loaded first. `align`: 'center' (default) or 'start' (left side). Resolves false when the instant
     * could not be reached (before the start of the history, failed request, replaced data).
     */
    goToTime(time: number, opts?: {
        align?: 'center' | 'start';
        animate?: boolean;
    }): Promise<boolean>;
    setAutoScale(on: boolean): void;
    setLog(on: boolean): void;
    setPercent(on: boolean): void;
    setInvert(on: boolean): void;
    view(p: Pane): PaneView;
    mainView(): PaneView;
    fmt(p: number): string;
    private resize;
    private layout;
    private updatePriceAxisWidth;
    private autoscale;
    requestRender(): void;
    draw(): void;
    private drawGrid;
    private lastBarColor;
    private drawLastPriceLine;
    private crosshairActive;
    private drawCrosshair;
    private fmtAxis;
    private percentBase;
    private drawPriceAxis;
    private layoutLabels;
    private drawAxisLabel;
    private drawTimeAxis;
    private drawTimeLabel;
    private area;
    private local;
    private mods;
    private setCrosshair;
    private hideCrosshair;
    private baseCursor;
    private setCursor;
    private bindEvents;
    private stopKinetic;
    private onDown;
    private onMove;
    private tradeHitAt;
    private onUp;
    private onDblClick;
    private onWheel;
    /** Keyboard helpers used by the app */
    finishPath(): void;
    screenshot(): string;
}
