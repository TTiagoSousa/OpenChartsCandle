/**
 * openchartscandle/matrix — matrizes e grelhas: cabeçalhos com vários níveis nos dois lados, células unidas, valores,
 * cores por visualMap, desenho próprio em canvas, gráficos de outras famílias dentro das células, realce em cruz,
 * seleção, regras `media` (um dashboard que se reorganiza) e uma camada por cima de tudo.
 */
export { MATRIX_COLORS, MATRIX_VISUAL_COLORS, MatrixChart, createMatrixChart, matrixDarkTheme, matrixLightTheme } from './matrix';
export { matrixGridCells, matrixHeader, matrixIndexAt, matrixMedia, matrixOffsets, matrixPlace, matrixResolve, matrixSizes } from './layout';
export type { MatrixHeaderModel, MatrixHeaderNode, MatrixPlaced } from './layout';
export type { MatrixCell, MatrixCellInfo, MatrixCellKind, MatrixCellStyle, MatrixCoordPart, MatrixDimension, MatrixDrawApi, MatrixEvent, MatrixHeaderInput, MatrixHeaderItem, MatrixHeaderLevel, MatrixLabel, MatrixLength, MatrixMediaRule, MatrixMountCell, MatrixOptions, MatrixRect, MatrixRenderCell, MatrixTheme, MatrixValueGrid, MatrixVisualMap, MatrixVisualPiece, } from './types';
