/**
 * openchartscandle/scatter — gráficos de dispersão e de bolhas: eixos de valor, log, categorias ou
 * polares, símbolos que mudam de forma, cor e tamanho por valor (visualMap com filtro), jitter,
 * regressões, marcas, ondas, muitos pontos, zoom, seleção com brush e matriz de dispersão.
 */
export { SCATTER_COLORS, ScatterChart, VISUAL_COLORS, createScatterChart, scatterDarkTheme, scatterLightTheme } from './scatter';
export { ScatterMatrix, createScatterMatrix, type ScatterMatrixOptions } from './matrix';
export { beeswarm, convexHull, kmeans, regression, type KMeansResult, type KMeansStep, type Regression } from './stats';
export { gradientAt as scatterGradientAt } from '../shared/color';
export type {
  ScatterAxisOptions,
  ScatterDatum,
  ScatterEffect,
  ScatterEvent,
  ScatterGraphicApi,
  ScatterLabelOptions,
  ScatterMarks,
  ScatterOptions,
  ScatterPoint,
  ScatterPointInfo,
  ScatterRegressionOptions,
  ScatterRegressionType,
  ScatterSeries,
  ScatterSymbol,
  ScatterTheme,
  ScatterValue,
  ScatterVisualMap,
} from './types';
