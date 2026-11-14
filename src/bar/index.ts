/**
 * openchartscandle/bar — gráficos de barras e colunas: séries agrupadas, empilhadas ou em 100%,
 * valores negativos, vertical ou horizontal, valores nas barras, tooltip, legenda interativa,
 * linhas de referência, médias móveis e tendências, vários eixos, polar, quebras no eixo, zoom,
 * seleção por área, corridas de barras, cascata, datasets e animações.
 */
export { BAR_COLORS, BarChart, OVERLAY_COLORS, barDarkTheme, barLightTheme, createBarChart } from './bar';
export { colorScale, fromDataset, waterfall } from './helpers';
export type { DatasetOptions, DatasetRow, WaterfallResult } from './helpers';
export { computeStacks, slotRect, sortOrder } from './layout';
export { average, cumulative, ema, exponentialTrend, linearTrend, sma, wma } from './overlays';
export type {
  BarAxisId, BarAxisOptions, BarDatum, BarEvent, BarGraphicApi, BarItem, BarOptions, BarOverlay, BarOverlayType, BarOverlayValue, BarSeries, BarTheme,
  BarTooltipContext, BarValue,
} from './types';
