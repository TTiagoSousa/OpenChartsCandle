/**
 * openchartscandle/heatmap — mapas de calor cartesianos: categorias (ou intervalos numéricos) em x e y, um valor
 * por célula com cores por gradiente ou por peças, legenda com pegas que filtram, etiquetas, destaque da linha
 * e da coluna, tooltip, zoom e milhares de células. Inclui a matriz de correlação para ativos.
 */
export { HEATMAP_COLORS, HeatmapChart, createHeatmapChart, heatmapDarkTheme, heatmapLightTheme } from './heatmap';
export { heatmapCorrelation, heatmapReturns } from './grid';
export type {
  HeatmapAxis,
  HeatmapCell,
  HeatmapDatum,
  HeatmapEvent,
  HeatmapKey,
  HeatmapLabelOptions,
  HeatmapOptions,
  HeatmapPiece,
  HeatmapTheme,
  HeatmapVisualMap,
} from './types';
