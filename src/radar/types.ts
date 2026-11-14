/** One axis of the radar. */
export interface RadarIndicator {
  name: string;
  /** Value at the outer ring. Default: the biggest value on this axis (rounded up) */
  max?: number;
  /** Value at the center. Default 0 */
  min?: number;
  /** Color of the axis name */
  color?: string;
}

/** One polygon of a series (a series with several, e.g. one per day, is toggled as a whole). */
export interface RadarItem {
  name?: string;
  /** One value per indicator, in the same order; null = no value (the polygon goes through the center) */
  value: (number | null)[];
  color?: string;
}

export type RadarSymbol = 'circle' | 'square' | 'diamond' | 'triangle' | 'none';

export interface RadarSeries {
  /** Stable key (default: name) */
  id?: string;
  name: string;
  /** One polygon (values per indicator) or several items */
  data: (number | null)[] | RadarItem[];
  /** Index of the radar it belongs to (with `radars`). Default 0 */
  radar?: number;
  color?: string;
  /** Line width px. Default 2; 0 = only the area */
  width?: number;
  /** Dash pattern, e.g. [6, 4] */
  dash?: number[];
  /** Fill inside the polygon: true or { opacity, gradient } (gradient: from the center to the edge) */
  area?: boolean | { opacity?: number; gradient?: boolean | string[] };
  /** Points on the vertices. Default true (circle, 4 px) */
  points?: boolean | { size?: number; symbol?: RadarSymbol; hollow?: boolean };
  /** Value next to each vertex */
  labels?: boolean | { format?: (v: number, indicator: RadarIndicator) => string; color?: string };
  /** Start hidden (toggle in the legend) */
  hidden?: boolean;
}

/** One radar (its axes, size and look). */
export interface RadarCoord {
  indicators: RadarIndicator[];
  /** Center in % of the chart ([50, 50] = middle) */
  center?: [number, number];
  /** Radius in % of half the smallest side. Default 70 */
  radius?: number;
  /** Ring shape. Default 'polygon' */
  shape?: 'polygon' | 'circle';
  /** Angle of the first axis in degrees (90 = top). Default 90 */
  startAngle?: number;
  /** Axes go clockwise. Default true */
  clockwise?: boolean;
  /** Number of rings. Default 5 */
  splitNumber?: number;
  /** Filled bands between rings: true (theme colors) or your colors, alternating from the center */
  splitArea?: boolean | { colors?: string[] };
  /** Ring lines. Default true */
  splitLine?: boolean | { color?: string; width?: number; dash?: number[] };
  /** Lines from the center to each axis. Default true */
  axisLine?: boolean | { color?: string };
  /** Names at the end of the axes */
  axisName?: boolean | {
    color?: string;
    fontSize?: number;
    format?: (name: string, indicator: RadarIndicator) => string;
    /** Box behind the name */
    background?: string;
    borderRadius?: number;
    padding?: number;
  };
  /** Values of the rings along the first axis. Default false */
  axisLabel?: boolean | { format?: (v: number) => string; color?: string };
  /** Title above this radar (with `radars`) */
  title?: string;
}

export interface RadarTheme {
  background: string;
  text: string;
  muted: string;
  /** Ring and axis lines */
  grid: string;
  /** Alternating ring bands (splitArea: true) */
  bands: [string, string];
  tooltipBg: string;
  tooltipText: string;
  tooltipBorder: string;
  font: string;
}

export interface RadarOptions extends Partial<Omit<RadarCoord, 'title'>> {
  series?: RadarSeries[];
  /** Several radars in one chart; each series picks one with `radar`. Without it, the top-level radar options are used */
  radars?: RadarCoord[];
  /** Palette */
  colors?: string[];
  /**
   * Color the items of each series by their position, from the first to the last (e.g. years), with a color
   * bar showing the first and last item names.
   */
  visualMap?: { colors: string[]; show?: boolean; title?: string };
  legend?: boolean | { show?: boolean; position?: 'top' | 'bottom' | 'left' | 'right'; interactive?: boolean };
  tooltip?: boolean | { show?: boolean; formatter?: (info: RadarHoverInfo) => string };
  valueFormatter?: (v: number, indicator: RadarIndicator) => string;
  /** Opacity of the other polygons while one is hovered. Default 0.25 */
  hoverDim?: number;
  title?: string | { text: string; subtext?: string; align?: 'left' | 'center' | 'right' };
  /** 'transparent' for cards. Shortcut for theme.background */
  background?: string;
  /** Space around everything, px. Default 10 */
  padding?: number;
  theme?: 'dark' | 'light' | Partial<RadarTheme>;
  /** Default true */
  animation?: boolean | { duration?: number };
}

export interface RadarHoverInfo {
  series: RadarSeries;
  seriesIndex: number;
  /** Item index inside the series */
  index: number;
  name: string;
  value: (number | null)[];
  color: string;
  indicators: RadarIndicator[];
}

export type RadarEvent = 'hover' | 'click' | 'toggle';
