/**
 * openchartscandle/custom — séries próprias: cada item é desenhado por uma função `renderItem` que devolve formas
 * (retângulos, círculos, setores, polígonos, caminhos SVG, texto, grupos) num sistema cartesiano, polar ou em
 * píxeis, com tooltip, hover, click, arrastar, zoom, legenda e transições animadas (formas com o mesmo id
 * transformam-se umas nas outras).
 */
export { CUSTOM_COLORS, CustomChart, createCustomChart, customDarkTheme, customLightTheme } from './custom';
export { customFormatDate, customScale, customTimeTicks } from './scale';
export type { CustomScale, CustomTick } from './scale';
export { customFlattenPath, customParsePath, customPathBounds } from './path';
export type { CustomPathCommand } from './path';
export { customAlignRings, customHitTest, customLerpColor, customLerpNode, customPointInPolygon, customResample, customTruncate } from './shapes';
export type { CustomNode } from './shapes';
export { customEnclose, customHexagon, customHexbin, customHistogram, customPack, customPackSiblings } from './layouts';
export type { CustomBin, CustomCircle, CustomHexBin, CustomPackInput, CustomPackedNode } from './layouts';
export type {
  CustomArcElement,
  CustomAxis,
  CustomAxisType,
  CustomBarLayout,
  CustomCircleElement,
  CustomCoordInfo,
  CustomDragEvent,
  CustomEasing,
  CustomElement,
  CustomEllipseElement,
  CustomEvent,
  CustomEventParams,
  CustomGradient,
  CustomGraphicInfo,
  CustomGroupElement,
  CustomImageElement,
  CustomLabel,
  CustomLineElement,
  CustomOptions,
  CustomPaint,
  CustomPathElement,
  CustomPolarHelpers,
  CustomPolygonElement,
  CustomPolylineElement,
  CustomRectElement,
  CustomRenderApi,
  CustomRenderItem,
  CustomRenderParams,
  CustomSectorElement,
  CustomSeries,
  CustomShapeType,
  CustomStyle,
  CustomTextElement,
  CustomTheme,
  CustomTransitionProps,
} from './types';
