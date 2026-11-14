/** X value: timestamp (seconds or ms), plain number, or category label. */
export type LineX = number | string;

export interface LinePoint {
  x: LineX;
  /** null = gap in the line */
  y: number | null;
}

/** 'step' = 'step-end' (the step happens at the next point); 'step-start' at the current one; 'step-middle' halfway */
export type LineCurve = 'linear' | 'smooth' | 'step' | 'step-start' | 'step-middle' | 'step-end';
export type PointShape = 'circle' | 'square' | 'diamond' | 'triangle';

export interface PointOptions {
  /** Radius px. Default 4 */
  size?: number;
  shape?: PointShape;
  /** Filled with the background, colored border. Default false */
  hollow?: boolean;
  /** Fill color (default: series color) */
  color?: string;
  /** Border color (default: none, or the series color when hollow) */
  borderColor?: string;
  borderWidth?: number;
}

export interface LineSeries {
  /** Stable key (default: name) */
  id?: string;
  name: string;
  /** Points, or just y values (x = category / index) */
  data: LinePoint[] | (number | null)[];
  color?: string;
  /** Line width px. Default 2. 0 = no line (only the area) */
  width?: number;
  /** Dash pattern, e.g. [6, 4] */
  dash?: number[];
  /** Overrides the chart `curve` */
  curve?: LineCurve;
  /**
   * Fill under the line. true or { opacity, gradient }. `gradient: ['#80FFA5', '#01BFEC']`
   * fades between your own colors (top → bottom) instead of the series color.
   */
  area?: boolean | {
    opacity?: number;
    gradient?: boolean | string[];
    /** Fill only these x ranges, e.g. [['2026-01-05', '2026-01-12']] or [[2, 5]] for categories */
    ranges?: [LineX, LineX][];
  };
  /**
   * Shaded band around the line (confidence interval, min–max…). `lower` / `upper` have one
   * value per point, in the same order as `data`.
   */
  band?: { lower: (number | null)[]; upper: (number | null)[]; color?: string; opacity?: number };
  /** Color the line by value levels, e.g. air quality: [{ to: 50, color: 'green' }, { from: 50, to: 100, color: 'yellow' }…] */
  valuePieces?: { from?: number; to?: number; color: string }[];
  /** Soft shadow under the line. true or { color, blur, offsetY } */
  shadow?: boolean | { color?: string; blur?: number; offsetY?: number };
  /** Recolor parts of the line: x ranges with their own color (e.g. peak hours in red) */
  pieces?: { from: LineX; to: LineX; color: string }[];
  /**
   * Line color changing along the line: colors from low to high value (`by: 'value'`, default)
   * or from the first to the last point (`by: 'x'`). min / max fix the value range.
   */
  lineGradient?: { colors: string[]; by?: 'value' | 'x'; min?: number; max?: number };
  /** Name (or your own text) after the last point of the line */
  endLabel?: boolean | { format?: (name: string, value: number) => string; color?: string };
  /** Automatic marks: pins on the highest / lowest point and a line at the average */
  marks?: { max?: boolean; min?: boolean; average?: boolean };
  /** Point markers. true or { size, shape, hollow, color (fill), borderColor, borderWidth } */
  points?: boolean | PointOptions;
  /** Y axis of the series. Default 'left' */
  axis?: 'left' | 'right';
  /** Start hidden (toggle in the legend) */
  hidden?: boolean;
  /** Show the value above each point */
  labels?: boolean;
  /** Sort points by x (default true). false keeps the data order: the path may go back (x, y plots, loops) */
  sortByX?: boolean;
  /**
   * Points can be dragged with the mouse: 'y' (value only), 'xy' (both), true = 'xy' on number
   * axes and 'y' otherwise. Emits 'change' with the new value.
   */
  draggable?: boolean | 'y' | 'xy';
}

export interface LineTheme {
  background: string;
  text: string;
  muted: string;
  grid: string;
  axis: string;
  crosshair: string;
  tooltipBg: string;
  tooltipText: string;
  tooltipBorder: string;
  font: string;
}

export interface AxisOptions {
  /** Default true */
  show?: boolean;
  /** Title next to the axis */
  title?: string;
  /** Format tick labels */
  format?: (v: number) => string;
  /** Grid lines. Default true for x and left y, false for right y */
  grid?: boolean;
  /** Fixed range */
  min?: number;
  max?: number;
  /** Include 0 in the range. Default false */
  beginAtZero?: boolean;
  /** Approximate number of ticks. Default automatic */
  ticks?: number;
  /** Y axis upside down: the smallest value on top (rankings: 1st place on top). Default false */
  inverse?: boolean;
  /** Logarithmic scale: true (base 10) or the base, e.g. 3. Only positive values are drawn */
  log?: boolean | number;
}

export interface XAxisOptions extends Omit<AxisOptions, 'format' | 'beginAtZero' | 'inverse'> {
  /** Format tick labels (receives the x value: seconds for time, index for categories) */
  format?: (x: number, category?: string) => string;
  /** Color of the tick labels */
  color?: string;
  /**
   * Hidden x ranges (axis breaks): the time between `from` and `to` takes no space, e.g. the night
   * and the lunch break of an intraday chart. A dashed line marks each break.
   */
  breaks?: { from: LineX; to: LineX }[];
}

/** Second row of x labels on top of the plot, at the same positions as the bottom axis. */
export interface X2AxisOptions {
  show?: boolean;
  /** Labels by category index (e.g. the months of another year) */
  categories?: string[];
  /** Or a formatter of the x value */
  format?: (x: number) => string;
  title?: string;
  /** Label color (e.g. the color of the series that uses it) */
  color?: string;
}

/** Slider under the chart to choose the visible x range (like a navigator). */
export interface ZoomOptions {
  /** Show the slider. Default false (wheel and drag still work) */
  slider?: boolean;
  /** Initial visible range in % of the data (0–100) */
  start?: number;
  end?: number;
}

export interface LineAnnotations {
  /** Horizontal reference lines */
  y?: { value: number; label?: string; color?: string; dash?: number[]; axis?: 'left' | 'right' }[];
  /** Vertical lines (x in the same unit as the data) */
  x?: { value: LineX; label?: string; color?: string; dash?: number[] }[];
  /** Horizontal bands (e.g. target zone) */
  bands?: { from: number; to: number; label?: string; color?: string; axis?: 'left' | 'right' }[];
  /** Straight segments between two points, e.g. from the lowest to the highest value */
  segments?: { from: { x: LineX; y: number }; to: { x: LineX; y: number }; label?: string; color?: string; dash?: number[]; axis?: 'left' | 'right' }[];
  /** Vertical bands over an x range (e.g. 'Pico da manhã' from 07:30 to 10:00) */
  xBands?: { from: LineX; to: LineX; label?: string; color?: string }[];
}

export interface LineOptions {
  series?: LineSeries[];
  /** Labels for the x axis when series data are plain numbers */
  categories?: string[];
  /** Default: detected (string x → category, numbers > 1e9 → time, else number) */
  xType?: 'time' | 'category' | 'number';

  // ----- defaults for every series -----
  /** Default 'linear' */
  curve?: LineCurve;
  /** Area under every line. Default false */
  area?: boolean | { opacity?: number; gradient?: boolean | string[] };
  /** Point markers on every line. Default false (shown on hover) */
  points?: boolean | PointOptions;
  /** Stack series (with areas, unless `area: false`). 'percent' = 100% stacked. Default false */
  stacked?: boolean | 'percent';
  /** Connect over null values instead of breaking the line. Default false */
  spanGaps?: boolean;
  /** Palette */
  colors?: string[];

  // ----- container -----
  /** 'transparent' for cards. Shortcut for theme.background */
  background?: string;
  /** Space around everything, px. Default 8 */
  padding?: number;
  theme?: 'dark' | 'light' | Partial<LineTheme>;

  // ----- axes -----
  xAxis?: XAxisOptions;
  yAxis?: AxisOptions;
  /** Right axis, used by series with axis: 'right' */
  y2Axis?: AxisOptions;
  /** Second row of x labels on top */
  x2Axis?: X2AxisOptions;

  // ----- legend / tooltip / crosshair -----
  legend?: {
    show?: boolean;
    position?: 'top' | 'bottom' | 'right' | 'left';
    /** Click toggles a series. Default true */
    interactive?: boolean;
    marker?: 'line' | 'circle' | 'square';
    align?: 'start' | 'center' | 'end';
    fontSize?: number;
  };
  tooltip?: {
    show?: boolean;
    /** 'shared' = every series at the hovered x; 'single' = nearest point. Default 'shared' */
    mode?: 'shared' | 'single';
    formatter?: (ctx: LineTooltipContext) => string;
    /** Sort entries by value. Default false */
    sort?: boolean;
  };
  crosshair?: { show?: boolean; color?: string; dash?: number[]; horizontal?: boolean };

  // ----- extras -----
  annotations?: LineAnnotations;
  /** Wheel zoom + drag pan on the x axis (double-click resets); { slider: true } adds a range slider. Default false */
  zoom?: boolean | ZoomOptions;
  /** Keep only the last N points per series when using appendPoint. Default unlimited */
  maxPoints?: number;
  /** Opacity of the other series when one is highlighted. Default 0.25 */
  hoverDim?: number;
  /** Format values in tooltip/labels */
  valueFormatter?: (v: number, series: LineSeries) => string;
  /** Default true */
  animation?: boolean | { duration?: number };
  emptyText?: string;

  // ----- special modes -----
  /** Mini chart preset: no axes, grid, legend or crosshair, tiny padding (tables, KPIs, matrices) */
  sparkline?: boolean;
  /** Magnifying lens under the mouse that widens the x axis around it. true or { radius px, strength } */
  fisheye?: boolean | { radius?: number; strength?: number };
  /**
   * Polar coordinates: x is the angle and y the radius. xAxis.min / max set the angle range
   * (e.g. 0–360). startAngle in degrees (90 = top), clockwise by default.
   */
  polar?: boolean | { startAngle?: number; clockwise?: boolean };
  /** Draw your own shapes and text on top of the chart, with helpers to convert values to pixels */
  graphic?: (ctx: CanvasRenderingContext2D, api: LineGraphicApi) => void;
}

/** Helpers given to `graphic` */
export interface LineGraphicApi {
  /** Plot area in px */
  plot: { x: number; y: number; w: number; h: number };
  width: number;
  height: number;
  theme: LineTheme;
  /** x value → px */
  x: (v: LineX) => number;
  /** y value → px */
  y: (v: number, axis?: 'left' | 'right') => number;
  /** px → values */
  toData: (px: number, py: number) => { x: number; y: number };
}

export interface LineHoverPoint {
  series: LineSeries;
  seriesIndex: number;
  index: number;
  x: number;
  y: number;
  color: string;
  /** y after stacking (what is drawn) */
  drawnY: number;
}

export interface LineTooltipContext {
  /** x value (seconds for time, index for categories) */
  x: number;
  /** formatted x */
  label: string;
  points: LineHoverPoint[];
}

/** 'plotclick' = any click inside the plot (with the values under the mouse); 'change' = a point was dragged */
export type LineEvent = 'hover' | 'click' | 'toggle' | 'zoom' | 'plotclick' | 'change';
