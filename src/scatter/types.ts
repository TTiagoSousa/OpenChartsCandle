/** One value of a point: number, category label or missing. */
export type ScatterValue = number | string | null;

export type ScatterSymbol = 'circle' | 'rect' | 'roundRect' | 'triangle' | 'diamond' | 'pin' | 'arrow' | 'star' | 'cross';

/** A point given as an object (tuples `[x, y, ...]` also work). */
export interface ScatterPoint {
  x: number | string;
  y?: number | string;
  /** Extra values (size, color…), after x and y: `values[0]` is dimension 2 */
  values?: ScatterValue[];
  /**
   * Stable key for animations, unique in the whole chart: after setSeries the point with the same
   * id moves to its new place, even into another series. Default: the name (or the index) in its series
   */
  id?: string | number;
  name?: string;
  /** Diameter px (wins over the series `symbolSize`) */
  size?: number;
  color?: string;
  symbol?: ScatterSymbol;
  opacity?: number;
  /** Text next to the point (with series `labels`) */
  label?: string;
  /** Ripple rings around this point */
  effect?: boolean;
  /** Draw a rectangle from y0 to y instead of a symbol (a slice of a bar) */
  y0?: number;
  /** Width of that rectangle px */
  width?: number;
  /** Anything of yours, given back in events and the tooltip */
  data?: unknown;
}

export type ScatterDatum = ScatterValue[] | ScatterPoint;

export interface ScatterLabelOptions {
  show?: boolean;
  /** Text: a function of the point, or the dimension index to show. Default: the point name / label */
  content?: number | ((p: ScatterPointInfo) => string);
  /** Next to the point. Default 'top' */
  position?: 'top' | 'right' | 'bottom' | 'left' | 'inside';
  /**
   * Line up every label along an edge of the plot with a line to its point:
   * 'top' (a row on top, moved sideways to avoid overlaps) or 'right' (a column on the right)
   */
  layout?: 'top' | 'right';
  /** Hide labels that still overlap. Default true */
  hideOverlap?: boolean;
  color?: string;
  fontSize?: number;
  fontWeight?: number | string;
}

export interface ScatterEffect {
  /** Seconds per ripple. Default 3 */
  period?: number;
  /** Size of the ripple at its end, times the symbol. Default 2.5 */
  scale?: number;
  /** Rings at once. Default 3 */
  count?: number;
  /** 'stroke' rings or 'fill' discs. Default 'stroke' */
  type?: 'stroke' | 'fill';
}

export type ScatterRegressionType = 'linear' | 'exponential' | 'logarithmic' | 'polynomial';

export interface ScatterRegressionOptions {
  type: ScatterRegressionType;
  /** Polynomial order. Default 2 */
  order?: number;
  /** Show the formula (and R²) at the end of the curve. Default true */
  label?: boolean | 'formula' | 'r2';
  color?: string;
  width?: number;
  dash?: number[];
}

export interface ScatterMarks {
  /** Pins on the highest / lowest y */
  max?: boolean;
  min?: boolean;
  /** Dashed line at the average: true / 'y' (horizontal), 'x' (vertical) or 'both' */
  average?: boolean | 'x' | 'y' | 'both';
  /** Shaded box from the min to the max of x and y; a string is its label */
  area?: boolean | string;
}

export interface ScatterSeries {
  /** Stable key (default: name) */
  id?: string;
  name: string;
  data: ScatterDatum[];
  color?: string;
  /** Default 'circle' */
  symbol?: ScatterSymbol | ((values: ScatterValue[], index: number) => ScatterSymbol);
  /** Diameter px, or a function of the values. Default 10 (4 for large series) */
  symbolSize?: number | ((values: ScatterValue[], index: number) => number);
  /** Default 0.85 */
  opacity?: number;
  borderColor?: string;
  borderWidth?: number;
  /** Bubbles with a light spot (3D look) */
  gradient?: boolean;
  /** Soft shadow under each symbol. true or { color, blur, offsetY } */
  shadow?: boolean | { color?: string; blur?: number; offsetY?: number };
  /** Ripple rings around every point (or only the points with `effect: true`) */
  effect?: boolean | ScatterEffect;
  labels?: boolean | ScatterLabelOptions;
  /** Fitted curve over the points, with its formula */
  regression?: ScatterRegressionType | ScatterRegressionOptions;
  /** Max / min pins, average lines and the data range box */
  marks?: ScatterMarks;
  /** Convex hull around the points (clusters). true or { opacity } */
  hull?: boolean | { opacity?: number };
  /** Join the points in data order with a line */
  line?: boolean | { width?: number; dash?: number[]; color?: string };
  /** Width of the `y0` rectangles: px or '60%' of the category. Default '50%' */
  barWidth?: number | string;
  /** Fast drawing for many points (no borders, gradient or shadow). Default: on above 4000 points */
  large?: boolean;
  /** 'lighter' adds colors where points overlap (glow, nebula) */
  blend?: 'normal' | 'lighter';
  /** Start hidden (toggle in the legend) */
  hidden?: boolean;
  /** Not in the legend */
  legend?: boolean;
}

export interface ScatterAxisOptions {
  /** Default true */
  show?: boolean;
  /** Default 'value' ('category' when the values are strings) */
  type?: 'value' | 'log' | 'category';
  /** Categories in order (default: in order of appearance) */
  categories?: string[];
  title?: string;
  format?: (v: number, category?: string) => string;
  /** Fixed range, or 'dataMin' / 'dataMax' for the exact data range */
  min?: number | 'dataMin';
  max?: number | 'dataMax';
  /** Include 0 in the range. Default false */
  beginAtZero?: boolean;
  /** Approximate number of ticks */
  ticks?: number;
  /** Grid lines. Default true (false when the axis is hidden) */
  grid?: boolean;
  /** Dashed grid lines */
  gridDash?: number[];
  /** Upside down */
  inverse?: boolean;
  /** Log base when type 'log'. Default 10 */
  logBase?: number;
  /** Category axes: points in the middle of each band (true, default) or on the ticks */
  boundaryGap?: boolean;
  /** Spread the points of each category sideways over this many px (beeswarm) */
  jitter?: number;
  /** With jitter: allow overlaps (random spread) or not (points side by side). Default false */
  jitterOverlap?: boolean;
  /** Label color */
  color?: string;
  /** Rotate the tick labels (degrees) */
  rotate?: number;
  /** Axis on the other side (top / right) */
  opposite?: boolean;
  /** Line along the axis. Default true for x */
  line?: boolean;
}

/** Map a value of each point to a color, size or opacity, with an optional control on the chart. */
export interface ScatterVisualMap {
  /** Dimension of the values: 0 = x, 1 = y, 2… = extras. Default 2 (or 1 without extras) */
  dimension?: number;
  /** Default: range of the data */
  min?: number;
  max?: number;
  /** Colors from low to high */
  colors?: string[];
  /** Diameters [low, high] px */
  sizes?: [number, number];
  /** Opacity [low, high] */
  opacity?: [number, number];
  /** Pieces instead of a continuous scale (each with its own color / size) */
  pieces?: { min?: number; max?: number; value?: number; label?: string; color?: string; size?: number }[];
  /** Only these series (indexes). Default all */
  series?: number[];
  /** Show the control. Default true */
  show?: boolean;
  /** Default 'right' */
  position?: 'right' | 'left' | 'bottom' | 'top';
  title?: string;
  /** Drag the ends (or click the pieces) to filter. Default true */
  interactive?: boolean;
  /** Points outside the chosen range: 'dim' (default) or 'hide' */
  outOfRange?: 'dim' | 'hide';
  /** Text of the numbers on the control */
  format?: (v: number) => string;
  /** Initial range */
  range?: [number, number];
}

export interface ScatterTheme {
  background: string;
  text: string;
  muted: string;
  grid: string;
  axis: string;
  tooltipBg: string;
  tooltipText: string;
  tooltipBorder: string;
  font: string;
}

/** A point as given to formatters and events. */
export interface ScatterPointInfo {
  series: ScatterSeries;
  seriesIndex: number;
  dataIndex: number;
  /** x, y and the extra values */
  values: ScatterValue[];
  x: number | string;
  y: number | string | null;
  name?: string;
  color: string;
  /** Diameter px */
  size: number;
  data?: unknown;
}

/** Helpers given to `graphic` and `underlay`. */
export interface ScatterGraphicApi {
  plot: { x: number; y: number; w: number; h: number };
  width: number;
  height: number;
  theme: ScatterTheme;
  /** value → px */
  x: (v: number | string) => number;
  y: (v: number | string) => number;
  /** x, y → px (polar aware) */
  point: (x: number | string, y: number | string) => { x: number; y: number };
  /** px → values */
  toData: (px: number, py: number) => { x: number; y: number };
}

export interface ScatterOptions {
  series?: ScatterSeries[];
  /** Names of the dimensions (x, y, extras) for the tooltip, e.g. ['PIB', 'Esperança de vida', 'População'] */
  dimensions?: string[];
  /** Palette */
  colors?: string[];
  title?: string | { text: string; subtext?: string; align?: 'left' | 'center' | 'right' };

  // ----- container -----
  background?: string;
  /** Space around everything, px. Default 8 */
  padding?: number;
  theme?: 'dark' | 'light' | Partial<ScatterTheme>;

  // ----- axes -----
  xAxis?: ScatterAxisOptions;
  yAxis?: ScatterAxisOptions;
  /** Same px per unit on both axes (maps, geometry) */
  aspect?: 'equal' | number;
  /**
   * Polar coordinates: x is the angle and y the radius. startAngle in degrees (90 = top),
   * clockwise by default; innerRadius 0–1.
   */
  polar?: boolean | { startAngle?: number; clockwise?: boolean; innerRadius?: number };

  // ----- color / size by value -----
  visualMap?: ScatterVisualMap | ScatterVisualMap[];

  // ----- legend / tooltip -----
  legend?: { show?: boolean; position?: 'top' | 'bottom' | 'right' | 'left'; align?: 'start' | 'center' | 'end'; interactive?: boolean };
  tooltip?: { show?: boolean; formatter?: (p: ScatterPointInfo) => string };
  /** Size multiplier of the point under the mouse. Default 1.35 */
  hoverScale?: number;
  /** Opacity of the other series while one is highlighted (legend hover). Default 0.15 */
  hoverDim?: number;

  // ----- interaction -----
  /** Wheel zoom + drag pan (double-click resets): true (both axes), 'x' or 'y'. Default false */
  zoom?: boolean | 'x' | 'y';
  /** Drag a rectangle to select points ('brush' event); the others fade */
  brush?: boolean;

  // ----- extras -----
  /** Draw under the points (maps, backgrounds), with helpers to convert values to pixels */
  underlay?: (ctx: CanvasRenderingContext2D, api: ScatterGraphicApi) => void;
  /** Draw on top of the points */
  graphic?: (ctx: CanvasRenderingContext2D, api: ScatterGraphicApi) => void;
  /** Format values in the tooltip and labels: (value, dimension) */
  valueFormatter?: (v: number, dimension: number) => string;
  /**
   * Default true. duration in ms; delay of each point (entry animation) as ms or a function
   * of the point index; 'x' delays the points from left to right.
   */
  animation?: boolean | { duration?: number; delay?: number | 'x' | ((index: number) => number) };
  emptyText?: string;
}

/** 'hover' / 'click' on points, 'toggle' a series, 'brush' a selection, 'zoom' the view. */
export type ScatterEvent = 'hover' | 'click' | 'toggle' | 'brush' | 'zoom';
