/**
 * openchartscandle/candlestick — gráficos de velas ao estilo TradingView
 * (motor Canvas, Terminal com barras e ferramentas, desenhos, indicadores, trades).
 */
import { Chart, ChartOptions } from './core/chart';
import { darkTheme, defaultTheme, lightTheme, resolveTheme, theme, Theme } from './core/theme';
import { SimulationIndicator, Terminal, TerminalOptions } from './ui/terminal';

/**
 * Create a bare chart (canvas only: candles, scales, crosshair, drawings, indicators).
 * You feed it with `chart.setData(bars, tf)` and `chart.update(bar)`.
 */
export function createChart(container: HTMLElement, options: ChartOptions = {}): Chart {
  return new Chart(container, options);
}

/**
 * Create the full trading terminal (top bar, drawing toolbar, legend, watchlist…)
 * driven by a `Datafeed`.
 */
export function createTerminal(container: HTMLElement, options: TerminalOptions): Terminal {
  return new Terminal(container, options);
}

/**
 * Change the default colors used by charts created AFTER this call.
 * For an existing chart use `chart.applyTheme(patch)` (or the `theme` option).
 */
export function setTheme(patch: Partial<Theme>): void {
  Object.assign(defaultTheme, resolveTheme(patch, defaultTheme));
}

export { Chart, Terminal, darkTheme, lightTheme, theme };
export type { ChartOptions, SimulationIndicator, TerminalOptions, Theme };
export type { ContextMenuEvent, CursorMode, Pane } from './core/chart';
export type { BarsRequest, BarsResult, Datafeed } from './datafeed';
export type { DataSourceOptions, HistoryRequest, HistoryResult, HistorySource } from './core/history';
export type { TimeframeFeed } from './core/timeframes';
export { TIMEFRAMES, parseTimeframe, timeframeById } from './core/types';
export type { Bar, ChartType, Point, Quote, SymbolInfo, Timeframe } from './core/types';
export { aggregate, bucketStart, normalizeBars } from './core/data';
export { TIMEZONES } from './core/timezone';
export type { TimeZoneId } from './core/timezone';
export { EXCHANGE_SESSIONS, findExchange, parseSessionRanges, resolveSessions } from './core/sessions';
export type { ExchangeSessions, SessionHours, SessionPart } from './core/sessions';
export type { TimeRange } from './core/time-ranges';
export { tradePnl, tradeStats } from './core/trades';
export type { Marker, Trade, TradeClickEvent, TradeColors, TradeDisplay, TradePoint, TradeStats } from './core/trades';
export { TradeList, createTradeList } from './ui/trade-list';
export type { TradeListOptions } from './ui/trade-list';
export { INDICATORS, Indicator, checkIndicatorParams, createIndicator } from './indicators/indicators';
export type { IndicatorEntry, LegendValue, ParamDef, Params, Visibility } from './indicators/indicators';
export { ALL_TOOLS, TOOL_GROUPS, toolById } from './drawings/registry';
export type { ToolDef, ToolGroup } from './drawings/registry';
export { DrawingManager, localDrawingStorage } from './drawings/manager';
export type { DrawingStorage, MagnetMode } from './drawings/manager';
export type { Drawing, DrawingOptions, FibLevel, LineDash, SerializedDrawing } from './drawings/base';
