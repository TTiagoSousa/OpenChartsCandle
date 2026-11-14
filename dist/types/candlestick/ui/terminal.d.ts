import { Chart } from '../core/chart';
import { Theme } from '../core/theme';
import type { TradeColors, TradeDisplay } from '../core/trades';
import { TimeZoneId } from '../core/timezone';
import { ChartType, SymbolInfo, Timeframe } from '../core/types';
import { Emitter } from '../core/utils';
import type { Datafeed } from '../datafeed';
import { Params } from '../indicators/indicators';
import { TradeList, TradeListOptions } from './trade-list';
/**
 * An indicator used by a simulation, with its settings (`terminal.setSimulationIndicators`).
 *
 * ```ts
 * { id: 'rsi-entrada', type: 'rsi', label: 'RSI de entrada', params: { length: 14, upper: 70, lower: 30 } }
 * ```
 */
export interface SimulationIndicator {
    /** Stable key, unique in the list (e.g. 'rsi-entrada'): calling again with the same ids keeps what is on the chart. */
    id: string;
    /** 'sma', 'ema' or 'rsi' (see `INDICATORS`). */
    type: string;
    /** The settings, with the same keys as `createIndicator` (what is missing takes the default). */
    params?: Params;
    /** Name in the dialog. Default: the indicator's name. */
    label?: string;
    /** On the chart from the start. Default true. */
    visible?: boolean;
}
export interface TerminalOptions {
    /** Data source (history + realtime). Required. */
    datafeed: Datafeed;
    /** Initial symbol. Defaults to the last used one, or the first symbol of the datafeed. */
    symbol?: string;
    /** Initial timeframe id ("1", "5", "60", "1D"…). Default "5". */
    timeframe?: string;
    /**
     * Timeframes offered in the UI: `Timeframe` objects or strings ("1", "5", "15m", "1h", "4h", "1D", "1W").
     * A symbol's own `timeframes` (from `getSymbols`) take precedence. Default: TIMEFRAMES.
     */
    timeframes?: (Timeframe | string)[];
    /** Open the first symbol at this instant (unix seconds or ms) instead of the latest bars. */
    initialTime?: number;
    /** Bars asked per `getBars` request (datafeeds that serve blocks). Default 1000. */
    countBack?: number;
    /**
     * Time zone of the time axis, the crosshair and the clock: 'local' (the browser's, default), 'UTC', an IANA
     * name ('Europe/Lisbon', 'America/New_York'…) or 'exchange' (`SymbolInfo.timezone`). The clock in the bottom
     * bar opens a menu to change it (remembered with `storageKey`).
     */
    timezone?: TimeZoneId;
    /** Time zones in the clock menu. Default: TIMEZONES. */
    timezones?: {
        id: TimeZoneId;
        label: string;
    }[];
    /** Spinner over the chart while the first bars of a symbol/timeframe load. Default true. */
    loadingIndicator?: boolean;
    /** Show the right panel (watchlist + symbol details). `string[]` limits the watchlist symbols. Default true. */
    watchlist?: boolean | string[];
    /** Show the top bar (symbol search, timeframes, chart type, indicators). Default true. */
    topbar?: boolean;
    /** Show the left drawing toolbar. Default true. */
    leftToolbar?: boolean;
    /** Show the bottom bar (ranges, clock, %/log/auto). Default true. */
    bottomBar?: boolean;
    /** Text shown at the right of the top bar. Default none. */
    brand?: string | null;
    /** Prefix for localStorage (UI state + drawings). `null` disables persistence. Default "openchartscandle". */
    storageKey?: string | null;
    /** Indicators added when there is no saved state. Default: SMA 50. */
    indicators?: {
        type: string;
        params?: Params;
    }[];
    /**
     * Indicators of a simulation / strategy, with the settings it used. They show in the "Indicadores" dialog
     * under "Da simulação", each with a checkbox to show or hide it, and are not saved with the user's own.
     * Same as calling `setSimulationIndicators` after creating the terminal.
     */
    simulationIndicators?: SimulationIndicator[];
    /** Heading of that section of the dialog. Default "Da simulação". */
    simulationTitle?: string;
    /** Initial chart type when there is no saved state. */
    chartType?: ChartType;
    /** Symbol search button. Default true. */
    symbolSearch?: boolean;
    /**
     * Timeframe buttons + menu. `true` = all `timeframes`; `string[]` = only these ids (e.g. ['1','5','60','1D']); `false` hides.
     * Without the top bar (`minimal`) it is a small selector at the top right of the chart. Default true.
     */
    timeframeSelector?: boolean | string[];
    /** Chart type menu. `true` = all; `ChartType[]` = only these; `false` hides. Default true. */
    chartTypes?: boolean | ChartType[];
    /** "Indicadores" button. `true` = all built-in; `string[]` = only these types; `false` hides. Default true. */
    indicatorPicker?: boolean | string[];
    /** Undo / redo buttons. Default true. */
    undoRedo?: boolean;
    /** Screenshot button. Default true. */
    screenshot?: boolean;
    /** Fullscreen button. Default true. */
    fullscreen?: boolean;
    /** Drawing tools in the left toolbar. `true` = all; `string[]` = only these tool ids. Default true. */
    drawingTools?: boolean | string[];
    /** Legend with OHLC and indicator values. Default true. */
    legend?: boolean;
    /** Range buttons (1D, 5D, 1M…) in the bottom bar. Default true. */
    rangeButtons?: boolean;
    /** Colors of the chart AND the interface (background, grid, candles, borders, text…). */
    theme?: Partial<Theme>;
    /** Only the chart: turns off top bar, toolbars, bottom bar, watchlist and legend (each can be re-enabled). */
    minimal?: boolean;
    /** Smaller bars and buttons, for cards and small containers. */
    compact?: boolean;
    /** CSS border around the whole terminal, e.g. '1px solid #2a2e39'. */
    border?: string;
    /** Corner radius in px. */
    radius?: number;
    /** Price scale on the right. Default true. */
    priceAxis?: boolean;
    /** Time scale at the bottom. Default true. */
    timeAxis?: boolean;
    /** Crosshair. Default true. */
    crosshair?: boolean;
    /** Dotted line + label at the last price. Default true. */
    lastPriceLine?: boolean;
    /** Colors of trade entries/exits (`chart.setTrades`). */
    tradeColors?: Partial<TradeColors>;
    /** What is drawn for each trade: entries, exits and the line between them. Default all on. */
    tradeDisplay?: Partial<TradeDisplay>;
    /**
     * Panel under the chart with the list of trades, the Ambas / Entradas / Saídas buttons, the "Linha"
     * switch and a field to jump to a trade by id. `true` or options. Default false.
     */
    tradeList?: boolean | TradeListOptions;
    /** Height of the trade list panel in px. Default 200. */
    tradeListHeight?: number;
    /** Zoom/scroll with the mouse wheel. Set false inside scrollable pages. Default true. */
    mouseWheel?: boolean;
    /** Enable global keyboard shortcuts (Alt+T, Del, Ctrl+Z…). Default true. */
    keyboard?: boolean;
}
export declare class Terminal {
    readonly chart: Chart;
    readonly root: HTMLElement;
    /** The trade list panel (option `tradeList`), or null. */
    tradeList: TradeList | null;
    /** Resolves when the first symbol finished loading. */
    readonly ready: Promise<void>;
    /** The timeframe changed (selector, `setTimeframe`, or a symbol without the previous one). */
    readonly timeframeChanged: Emitter<Timeframe>;
    /** Another symbol is shown. */
    readonly symbolChanged: Emitter<SymbolInfo>;
    /** `getBars` requests in progress (true) or all finished (false). */
    readonly loadingChanged: Emitter<boolean>;
    /** A `getBars` request failed. The library shows no message: show it in your app (and maybe `reload()`). */
    readonly error: Emitter<unknown>;
    /** The time zone of the axis changed (clock menu or `setTimezone`). */
    readonly timezoneChanged: Emitter<TimeZoneId>;
    private state;
    private opts;
    private datafeed;
    private symbols;
    private quotes;
    private timeframes;
    private tf;
    private els;
    private watchRows;
    private floating;
    private legend;
    private loading;
    private tfTyping;
    private tfTypingEl;
    private tfTypingTimer;
    private loadToken;
    private firstLoad;
    private unsubBars;
    private unsubQuotes;
    private timers;
    private keyHandler;
    private toolGroups;
    constructor(container: HTMLElement, options: TerminalOptions);
    private save;
    /** Remove the terminal, its listeners and subscriptions. */
    destroy(): void;
    private build;
    private start;
    private emitError;
    /**
     * Load (or reload) a symbol with the current timeframe. `time` keeps that instant in the view
     * (timeframe change); otherwise the chart opens on the latest bars.
     */
    private load;
    /** Load the current symbol and timeframe again (e.g. after an `error`), keeping the instant in view. */
    reload(): Promise<void>;
    /** Instant to keep when the bars are replaced: the center of the view, unless it is on the latest bars. */
    private keepTime;
    /** The symbol's own timeframes may not include the current one: take the closest. */
    private fitTimeframe;
    private builtinAllowed;
    private openIndicators;
    private sim;
    /**
     * The indicators of a simulation, with its settings. They replace the previous simulation's; an indicator
     * with the same `id`, type and params keeps its place, visibility and any change made in its settings.
     * Returns the problems found (unknown type or keys, wrong values), also written to the console: an
     * indicator with an unknown type is left out, wrong keys are ignored and the rest is used.
     */
    setSimulationIndicators(list: SimulationIndicator[]): string[];
    /** The simulation's indicators, with their current settings and whether each is on the chart. */
    getSimulationIndicators(): {
        id: string;
        type: string;
        label: string;
        params: Params;
        shown: boolean;
    }[];
    /** Put a simulation indicator on the chart or take it off (its settings are kept for when it comes back). */
    showSimulationIndicator(id: string, on: boolean): void;
    private removeIndicator;
    /** Change colors of the chart and the interface at runtime. */
    applyTheme(patch: Partial<Theme>): void;
    private cssVars;
    private applyCssTheme;
    private openSymbolSearch;
    private chartTypeList;
    private buildTopbar;
    /** Timeframes offered by the selector: the symbol's own list, or `timeframes` (respects `timeframeSelector: string[]`). */
    private selectableTimeframes;
    private currentSymbolInfo;
    /** Small timeframe selector over the chart when there is no top bar. */
    private syncTfFloat;
    private syncTopbar;
    private showTimeframeMenu;
    private buildLeftToolbar;
    private groupButton;
    private toolAllowed;
    private currentGroupTool;
    private syncLeftToolbar;
    private setMagnet;
    private buildBottomBar;
    private syncBottomToggles;
    private updateClock;
    private openTimezoneMenu;
    private validZone;
    /** Time zone of the axis, the crosshair and the clock ('local', 'UTC', 'Europe/Lisbon', 'exchange'…). Throws a RangeError for an unknown name. */
    setTimezone(tz: TimeZoneId): void;
    /** The chosen time zone. */
    get timezone(): TimeZoneId;
    private buildRightPanel;
    private watchlistSymbols;
    private buildWatchlistRows;
    private toggleWatchlist;
    private updateWatchActive;
    private precisionOf;
    private updateWatchRow;
    /** Quote of the active symbol: from the datafeed, or derived from the last 24h of loaded bars. */
    private activeQuote;
    private renderDetails;
    private renderFloating;
    private makeDraggable;
    private positionFloating;
    private drawingMenuItems;
    private showContextMenu;
    /** Switch to another symbol of the datafeed. */
    setSymbol(symbol: string): Promise<void>;
    /**
     * Switch timeframe by id or name ("1", "5", "60", "1h", "4h", "1D"…). The instant in the center of the
     * chart stays in the center (March 2022 on 1h → March 2022 on 4h), loading the bars needed to get there.
     */
    setTimeframe(t: Timeframe | string): Promise<void>;
    /** Currently selected timeframe. */
    get timeframe(): Timeframe;
    private setChartType;
    private removeAllIndicators;
    private syncUndo;
    private screenshot;
    private onKey;
    /** TradingView-style: type "15" + Enter to switch interval, "4h", "D", "W". */
    private tfTypingKey;
    private applyTfTyping;
    private cancelTfTyping;
}
