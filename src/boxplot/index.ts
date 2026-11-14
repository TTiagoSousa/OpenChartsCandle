/**
 * openchartscandle/boxplot — caixas de bigodes: uma caixa por categoria e série (dada pronta ou calculada a partir
 * dos valores), várias séries lado a lado, na vertical ou na horizontal, com outliers, média, pontos dispersos,
 * legenda, tooltip e animações.
 */
export { BOXPLOT_COLORS, BoxplotChart, boxplotDarkTheme, boxplotLightTheme, createBoxplotChart } from './boxplot';
export { boxplotAggregate, boxplotQuantile, boxplotStats } from './stats';
export type { BoxplotStatsResult } from './stats';
export type {
  BoxplotBox,
  BoxplotCategoryAxis,
  BoxplotEvent,
  BoxplotHoverInfo,
  BoxplotItem,
  BoxplotOptions,
  BoxplotPointsOptions,
  BoxplotSeries,
  BoxplotSymbol,
  BoxplotTheme,
  BoxplotValue,
  BoxplotValueAxis,
} from './types';
