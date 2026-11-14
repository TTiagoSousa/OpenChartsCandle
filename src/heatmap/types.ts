/** A position on an axis: the category index (0, 1, 2…), the category name, or a value with `bins`. */
export type HeatmapKey = number | string;

/** One cell of data: `[x, y, value]` (ECharts style) or an object. */
export type HeatmapDatum =
  | [x: HeatmapKey, y: HeatmapKey, value: number | null]
  | {
      x: HeatmapKey;
      y: HeatmapKey;
      /** null / missing = empty cell */
      value?: number | null;
      /** Own color for this cell (wins over the visualMap) */
      color?: string;
      /** Extra text for the tooltip */
      label?: string;
      /** Anything else you need in the tooltip */
      [key: string]: unknown;
    };

/** One cell as given to the tooltip, the events and `cellAt`. */
export interface HeatmapCell {
  /** Column (x category index) and row (y category index) */
  x: number;
  y: number;
  /** Names of the column and row, as shown on the axes */
  xName: string;
  yName: string;
  value: number | null;
  /** Fill color (visualMap / datum.color / empty) */
  color: string;
  /** The object given in `data`, when there was one */
  datum: Extract<HeatmapDatum, { x: HeatmapKey }> | null;
  /** Cell box in px relative to the chart (current zoom) */
  box: { x: number; y: number; w: number; h: number };
}

export interface HeatmapAxis {
  /** Category names, in order. Default: 0, 1, 2… (or the bins' values) */
  data?: (string | number)[];
  /**
   * Numeric bins instead of names: the first value and the step. Cells given as values (e.g. x = 12.5) go to
   * the bin `floor((v - min) / step)`; the labels are the bins' start values.
   */
  bins?: { min: number; step: number; count?: number };
  /** Title of the axis */
  name?: string;
  /** Show the labels. Default true */
  show?: boolean;
  /** Label text */
  format?: (name: string | number, index: number) => string;
  /** Rotation of the x labels in degrees, or 'auto' (default): 45° when they do not fit, then fewer labels */
  rotate?: number | 'auto';
  /** First category at the end: x from the right, y from the top. Default false (y starts at the bottom) */
  inverse?: boolean;
  color?: string;
  fontSize?: number;
}

export interface HeatmapPiece {
  min?: number;
  max?: number;
  /** An exact value (wins over min / max) */
  value?: number;
  color: string;
  label?: string;
}

export interface HeatmapVisualMap {
  /** Value range of the colors. Default: the data's min / max */
  min?: number;
  max?: number;
  /** Colors from low to high (continuous). Default HEATMAP_COLORS */
  colors?: string[];
  /** Fixed pieces instead of a gradient; a click on one in the legend hides / shows its cells */
  pieces?: HeatmapPiece[];
  /** Or N equal pieces between min and max, colored along `colors` */
  splitNumber?: number;
  /** Initial range of the handles (continuous). Default [min, max] */
  range?: [number, number];
  /** Draggable handles (continuous) / clickable pieces. Default true */
  interactive?: boolean;
  /** Show the legend. Default true */
  show?: boolean;
  /** Default 'bottom' */
  position?: 'bottom' | 'right';
  title?: string;
  format?: (v: number) => string;
}

export interface HeatmapLabelOptions {
  show?: boolean;
  /** Text of a cell. Default: the value with `valueFormatter`. Return '' for nothing */
  format?: (value: number, cell: HeatmapCell) => string;
  /** Default: black or white, whichever reads best on the cell */
  color?: string;
  /** Default: from the cell size (8–13) */
  fontSize?: number;
}

export interface HeatmapTheme {
  background: string;
  text: string;
  muted: string;
  /** Axis lines */
  axis: string;
  /** Fill of an empty cell (and of the cells filtered by the visualMap) */
  cell: string;
  /** Veil over the other rows / columns with `emphasis` */
  emphasis: string;
  tooltipBg: string;
  tooltipText: string;
  tooltipBorder: string;
  font: string;
}

export interface HeatmapOptions {
  xAxis?: HeatmapAxis;
  yAxis?: HeatmapAxis;
  /** Cells as `[x, y, value]` or objects; x and y are indexes, names or bin values */
  data?: HeatmapDatum[];
  /** Or a matrix: `matrix[row][column]`, row = y index, column = x index. null = empty */
  matrix?: (number | null)[][];
  visualMap?: HeatmapVisualMap | false;
  /** Cell look */
  cell?: {
    /** Space between cells, px. Default 0 */
    gap?: number;
    radius?: number;
    borderColor?: string;
    /** Default 0 */
    borderWidth?: number;
    /** Fill of empty / filtered cells; 'transparent' draws nothing. Default theme.cell */
    emptyColor?: string;
  };
  /** Square cells (the grid is centered). Default false */
  square?: boolean;
  /** Values inside the cells (only where they fit). Default off */
  label?: boolean | HeatmapLabelOptions;
  /** What stays lit under the mouse: the cell (default), or also its row, column or both (the rest is veiled) */
  emphasis?: 'cell' | 'row' | 'column' | 'cross' | false;
  /** Zoom with the wheel and pan by dragging (double click resets). Default false */
  zoom?: boolean | 'x' | 'y';

  title?: string | { text: string; subtext?: string; align?: 'left' | 'center' | 'right' };
  tooltip?: boolean | { show?: boolean; formatter?: (cell: HeatmapCell) => string };
  /** Value text in the tooltip and the labels */
  valueFormatter?: (v: number) => string;
  /** 'transparent' for cards. Shortcut for theme.background */
  background?: string;
  /** Space around the grid, px. Default 10 */
  padding?: number;
  theme?: 'dark' | 'light' | Partial<HeatmapTheme>;
  /** Default true */
  animation?: boolean | { duration?: number };
}

export type HeatmapEvent = 'click' | 'hover' | 'zoom';
