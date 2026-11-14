/**
 * openchartscandle/parallel — coordenadas paralelas: um eixo por dimensão (valor, log ou categorias) e uma linha
 * por linha de dados, cores por série ou por uma dimensão (visualMap contínuo ou por intervalos), seleção
 * arrastando nos eixos (brush), eixos que se reordenam, milhares de linhas, legenda, tooltip e animações.
 */
export { PARALLEL_COLORS, ParallelChart, createParallelChart, parallelDarkTheme, parallelLightTheme } from './parallel';
export { buildParallelScale, parallelInRanges, parallelPieceIndex, parallelRangeValues, parallelSegmentAt } from './scale';
export type { ParallelScale, ParallelTRange } from './scale';
export type { ParallelAxis, ParallelBrushEvent, ParallelBrushRange, ParallelEvent, ParallelHoverInfo, ParallelItem, ParallelOptions, ParallelPiece, ParallelSeries, ParallelTheme, ParallelValue, ParallelVisualMap, } from './types';
