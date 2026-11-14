/**
 * openchartscandle/radar — gráficos de radar (teia): vários indicadores em eixos à volta de um centro, um ou
 * vários polígonos por série, anéis em polígono ou círculo, faixas, vários radares no mesmo gráfico,
 * legenda, tooltip e animações.
 */
export { RADAR_COLORS, RadarChart, createRadarChart, radarDarkTheme, radarLightTheme } from './radar';
export { niceMax as radarNiceMax } from './geometry';
export { gradientAt as radarGradientAt } from '../shared/color';
export type { RadarCoord, RadarEvent, RadarHoverInfo, RadarIndicator, RadarItem, RadarOptions, RadarSeries, RadarSymbol, RadarTheme } from './types';
