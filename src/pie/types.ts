/** One entry of a pie chart. */
export interface PieDatum {
  label: string;
  value: number;
  /** Fixed color for this slice (otherwise taken from the palette) */
  color?: string;
  /** Stable key used for animations and selection (default: label) */
  id?: string;
  /** Texture drawn over the color (see `patterns`) */
  pattern?: PiePattern;
}

/** Textures for slices (accessibility, print). */
export type PiePattern = 'stripes' | 'diagonal' | 'dots' | 'grid' | 'cross' | 'checker' | 'zigzag' | 'none';

/** A piece of rich label text. */
export interface PieRichRun {
  text: string;
  color?: string;
  fontSize?: number;
  fontWeight?: number;
  /** background box behind the text */
  background?: string;
  /** padding of the box, px. Default 0 (3 when there is a background) */
  padding?: number;
  /** corner radius of the box, px. Default 3 */
  radius?: number;
}

/** One more ring of data around (or inside) the main pie: nested pies, sunburst-like donuts. */
export interface PieRing {
  /** shown in the tooltip */
  name?: string;
  data: PieDatum[];
  /** ratio of the outer radius, 0–1 */
  innerRadius: number;
  /** ratio of the outer radius, 0–1 */
  outerRadius: number;
  labels?: PieOptions['labels'];
  colors?: string[];
  padAngle?: number;
  cornerRadius?: number;
  rose?: PieOptions['rose'];
  sort?: PieOptions['sort'];
}

/** A computed slice (what events, tooltips and formatters receive). */
export interface PieSlice {
  id: string;
  label: string;
  value: number;
  /** Share of the visible total, 0–100 */
  percent: number;
  color: string;
  index: number;
  /** Hidden through the legend */
  hidden: boolean;
  /** 0 = main data, 1… = `rings[i - 1]` */
  ring: number;
  /** name of the ring (`name` of the ring, or of the chart's `seriesName`) */
  ringName?: string;
  selected: boolean;
  /** True for the "Outros" slice created by `groupBelow` */
  grouped: boolean;
  /** Data merged into "Outros" */
  children?: PieDatum[];
  datum: PieDatum;
}

export type PieLabelContent = 'percent' | 'value' | 'label' | 'label-percent' | 'label-value' | ((s: PieSlice) => string);

export interface PieTheme {
  /** Canvas background ('transparent' to inherit the page) */
  background: string;
  /** Main text (labels, center value) */
  text: string;
  /** Secondary text (center title, legend values) */
  muted: string;
  /** Leader lines of outside labels */
  line: string;
  /**
   * Border between slices. Default = background (looks like a gap).
   * With a transparent background the gap is cut out for real (transparent).
   */
  sliceBorder: string;
  /** Tooltip / legend colors */
  tooltipBg: string;
  tooltipText: string;
  tooltipBorder: string;
  font: string;
}

export interface PieOptions {
  data?: PieDatum[];

  // ----- container -----
  /**
   * Background of the chart. 'transparent' lets the card/page show through
   * (slice gaps are then cut out, also transparent). Shortcut for theme.background.
   */
  background?: string;
  /** Space around the chart, px. Default 0 */
  padding?: number;
  /** Size of the pie inside the available space, 0.3–1. Default 1 */
  scale?: number;
  /** Title above the chart */
  title?: string | { text: string; subtext?: string; align?: 'left' | 'center' | 'right'; color?: string };
  /** Name of the main data (shown in the tooltip next to ring names) */
  seriesName?: string;
  /** Text shown when there is nothing to draw. Default "Sem dados" */
  emptyText?: string;

  // ----- shape -----
  /** 0 = pie, 0.5–0.75 = donut. Ratio of the outer radius. Default 0 */
  innerRadius?: number;
  /** Outer radius of the main data, ratio of the available radius (for nested pies). Default 1 */
  outerRadius?: number;
  /** More rings of data (nested pies). The main data uses innerRadius / outerRadius. */
  rings?: PieRing[];
  /** Degrees, 0 = 3 o'clock, -90 = top. Default -90 */
  startAngle?: number;
  /** Degrees. Default startAngle + 360. Use -180 → 0 for a half donut (gauge). */
  endAngle?: number;
  /** Gap between slices, degrees. Default 0 */
  padAngle?: number;
  /** Rounded slice corners, px. Default 0 */
  cornerRadius?: number;
  /**
   * Nightingale/rose chart. `true` = equal angles, radius by √value; `'area'` = equal angles, radius by value;
   * `'radius'` = angle and radius both by value. Default false
   */
  rose?: boolean | 'area' | 'radius';
  /** Slices go clockwise. Default true */
  clockwise?: boolean;
  /** Minimum angle of a visible slice, degrees (tiny values stay visible). Default 0 */
  minSliceAngle?: number;
  /** Radial gradient on each slice. Default false */
  gradient?: boolean;
  /** Textures over the colors: true = a different one per slice, or your list (`PieDatum.pattern` wins). Default false */
  patterns?: boolean | PiePattern[];
  /** Drop shadow under the slices. Default none */
  shadow?: { color?: string; blur?: number; offsetY?: number } | false;
  /** Opacity of the other slices while one is hovered, 0–1 (1 = no dimming). Default 0.55 */
  hoverDim?: number;
  /** Border between slices, px. Default 1 */
  borderWidth?: number;

  // ----- data handling -----
  /** 'desc' | 'asc' | 'none'. Default 'none' */
  sort?: 'none' | 'desc' | 'asc';
  /** Slices below this % are merged into one "Outros" slice. Default 0 (off) */
  groupBelow?: number;
  /** Label of the grouped slice. Default "Outros" */
  othersLabel?: string;

  // ----- colors -----
  /** Palette used in order. */
  colors?: string[];
  /** 'dark' | 'light' or your own colors. Default 'dark' */
  theme?: 'dark' | 'light' | Partial<PieTheme>;

  // ----- labels -----
  labels?: {
    /** Default true */
    show?: boolean;
    /** 'inside' | 'outside' | 'auto' (inside when it fits). Default 'auto' */
    position?: 'inside' | 'outside' | 'auto';
    /** Default 'percent' (inside) / 'label-percent' (outside) */
    content?: PieLabelContent;
    /** Hide labels of slices smaller than this %. Default 3 */
    minPercent?: number;
    fontSize?: number;
    /** Font weight. Default 600 */
    fontWeight?: number;
    /** Text color of outside labels (inside labels pick black/white automatically). Default theme.text */
    color?: string;
    /** Force a color for inside labels too. */
    insideColor?: string;
    /** Length of the horizontal part of the leader line, px. Default 18 */
    lineLength?: number;
    /** Length of the radial part of the leader line, px. Default 12 */
    radialLength?: number;
    /**
     * Where outside labels go: 'line' (default, in two columns next to the pie), 'none' (right after the line)
     * or 'edge' (against the left / right edges of the chart).
     */
    alignTo?: 'line' | 'none' | 'edge';
    /** Distance to the edge with alignTo 'edge', px. Default 10 */
    edgeDistance?: number;
    /** Curved leader lines. Default false */
    lineSmooth?: boolean;
    /** Show the leader lines. Default true */
    showLine?: boolean;
    /** Rich text: lines of runs with their own color, size, weight and background. Wins over `content`. */
    rich?: (s: PieSlice) => PieRichRun[][];
  };

  // ----- legend -----
  legend?: {
    /** Default true */
    show?: boolean;
    /** Default 'right' */
    position?: 'right' | 'bottom' | 'left' | 'top';
    /** Click toggles the slice. Default true */
    interactive?: boolean;
    /** Show value and % next to the name. Default true */
    values?: boolean;
    /** Marker shape. Default 'square' */
    marker?: 'square' | 'circle' | 'line';
    /** Font size, px. Default 13 */
    fontSize?: number;
    /** Alignment of the items. Default 'center' */
    align?: 'start' | 'center' | 'end';
  };

  // ----- tooltip -----
  tooltip?: {
    /** Default true */
    show?: boolean;
    /** Return HTML for the tooltip */
    formatter?: (s: PieSlice, total: number) => string;
    /** Follow the mouse (true) or stay next to the slice (false). Default true */
    followCursor?: boolean;
    /** Default tooltip: show the value. Default true */
    showValue?: boolean;
    /** Default tooltip: show the percentage. Default true */
    showPercent?: boolean;
  };

  // ----- donut center -----
  center?: {
    /** Default true when innerRadius > 0 */
    show?: boolean;
    /** Small text under the value. Default "Total" */
    title?: string;
    /** Big text. Default: formatted total. */
    value?: string | ((total: number) => string);
    /** Show the hovered slice in the center. Default true */
    followHover?: boolean;
    /** Color of the big text. Default theme.text (hovered slice color while hovering) */
    valueColor?: string;
    /** Color of the small text. Default theme.muted */
    titleColor?: string;
    /** Multiplier of the automatic font size. Default 1 */
    fontScale?: number;
  };

  // ----- interaction & animation -----
  /** Slice moves out on hover, px. Default 8 */
  hoverOffset?: number;
  /** Click selects a slice (moves it out). Default true */
  selectable?: boolean;
  /** Distance of a selected slice, px. Default 14 */
  selectOffset?: number;
  /**
   * Animate on load and data changes. Default true.
   * `type: 'scale'` grows each slice from the center (with `easing: 'elastic'` and `stagger` ms between slices).
   */
  animation?: boolean | { duration?: number; type?: 'sweep' | 'scale'; easing?: 'cubic' | 'elastic'; stagger?: number | 'random' };

  // ----- formatting -----
  /** Format values (tooltip, labels, legend, center). */
  valueFormatter?: (v: number) => string;
  /** Format percentages. Default 1 decimal + "%" */
  percentFormatter?: (p: number) => string;
}

export type PieEvent = 'hover' | 'click' | 'select' | 'toggle';
