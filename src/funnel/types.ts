/** One stage of a funnel. */
export interface FunnelItem {
  name: string;
  value: number;
  color?: string;
  /** Look of this stage (merged over the funnel's) */
  itemStyle?: FunnelItemStyle;
  /** Label of this stage (merged over the funnel's) */
  label?: FunnelLabel;
}

export interface FunnelItemStyle {
  /** Fill opacity 0–1. Default 1 */
  opacity?: number;
  /** 'transparent' / 'none' = only the outline */
  color?: string;
  borderColor?: string;
  /** px. Default 1 (in the background color, as a gap) */
  borderWidth?: number;
  /** Dash of the outline, e.g. [4, 3] */
  borderDash?: number[];
}

export type FunnelLabelPosition = 'inside' | 'insideLeft' | 'insideRight' | 'left' | 'right' | 'outside' | 'top' | 'bottom' | 'none';

export interface FunnelLabel {
  show?: boolean;
  /** Default 'outside' (to the right; below in a horizontal funnel) */
  position?: FunnelLabelPosition;
  /** Text of the label. Default: the name */
  format?: (info: FunnelHoverInfo) => string;
  color?: string;
  fontSize?: number;
  fontWeight?: number | string;
}

/** One funnel: its stages, where it sits and how it looks. */
export interface FunnelSpec {
  /** Name in the tooltip (and its title over the funnel with `showName`) */
  name?: string;
  data: FunnelItem[];
  /** Default 'descending' (widest on top). 'ascending' = a pyramid; 'none' keeps the order given */
  sort?: 'descending' | 'ascending' | 'none';
  /** Space between stages, px. Default 2 */
  gap?: number;
  /** Value at `minSize`. Default 0 */
  min?: number;
  /** Value at `maxSize`. Default the biggest value */
  max?: number;
  /** Width of `min`, in % of the funnel box (or px). Default '0%' */
  minSize?: number | string;
  /** Width of `max`, in % of the funnel box (or px). Default '100%' */
  maxSize?: number | string;
  /** Default 'vertical' (top to bottom). 'horizontal' = left to right */
  orient?: 'vertical' | 'horizontal';
  /** Which side the stages line up on. Default 'center' */
  funnelAlign?: 'center' | 'left' | 'right' | 'top' | 'bottom';
  /** Space of the funnel (labels included): px or '%' of the chart. Default 10 px */
  left?: number | string;
  right?: number | string;
  top?: number | string;
  bottom?: number | string;
  label?: FunnelLabel;
  /** Line from an outside label to its stage. Default true */
  labelLine?: boolean | { length?: number; color?: string };
  itemStyle?: FunnelItemStyle;
  /** Title of this funnel above it */
  showName?: boolean;
  /** Not hit by the mouse (an outline drawn under another funnel) */
  silent?: boolean;
}

export interface FunnelTheme {
  background: string;
  text: string;
  muted: string;
  /** Outline between stages (default: the background) */
  border: string;
  tooltipBg: string;
  tooltipText: string;
  tooltipBorder: string;
  font: string;
}

export interface FunnelOptions extends Partial<Omit<FunnelSpec, 'data' | 'name'>> {
  /** The stages (or use `funnels` for several) */
  data?: FunnelItem[];
  name?: string;
  /** Several funnels in one chart, each with its own space (`left` / `top` …) and look */
  funnels?: FunnelSpec[];
  /** Palette: one color per stage name, shared by every funnel */
  colors?: string[];
  /** Stage names; click hides a stage in every funnel. Default shown */
  legend?: boolean | { show?: boolean; position?: 'top' | 'bottom' | 'left' | 'right'; interactive?: boolean };
  tooltip?: boolean | { show?: boolean; formatter?: (info: FunnelHoverInfo) => string };
  valueFormatter?: (v: number) => string;
  /** Opacity of the other stages while one is hovered. Default 0.35 */
  hoverDim?: number;
  title?: string | { text: string; subtext?: string; align?: 'left' | 'center' | 'right' };
  /** 'transparent' for cards. Shortcut for theme.background */
  background?: string;
  theme?: 'dark' | 'light' | Partial<FunnelTheme>;
  /** Default true */
  animation?: boolean | { duration?: number };
}

export interface FunnelHoverInfo {
  item: FunnelItem;
  name: string;
  value: number;
  color: string;
  /** Index of the funnel */
  funnelIndex: number;
  funnelName: string | undefined;
  /** Position of the stage after sorting (0 = first) */
  index: number;
  /** value / first stage's value × 100 */
  percentOfFirst: number;
  /** value / previous stage's value × 100 (100 for the first) */
  percentOfPrevious: number;
  /** value / max × 100 */
  percent: number;
}

export type FunnelEvent = 'hover' | 'click' | 'toggle';
