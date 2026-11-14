export type GraphSymbol = 'circle' | 'rect' | 'roundRect' | 'triangle' | 'diamond' | 'none';

export type GraphLabelPosition = 'right' | 'left' | 'top' | 'bottom' | 'inside';

export interface GraphLabelOptions {
  show?: boolean;
  /** Where the name goes, next to the symbol. Default 'right' */
  position?: GraphLabelPosition;
  color?: string;
  /** px. Default 11 */
  fontSize?: number;
  fontWeight?: number | string;
  /** Text of the label. Default the node name */
  format?: (node: GraphNode) => string;
  /** Outline in the background color, so labels read over the edges. Default true */
  halo?: boolean;
}

/** One node. */
export interface GraphNode {
  /** Unique key (links use it) */
  id: string;
  /** Text of the label and tooltip. Default: id */
  name?: string;
  value?: number;
  /** Index into `categories`, or a category name */
  category?: number | string;
  /** Position: px-like units for layout 'none' / 'force', data values with `axes` */
  x?: number;
  y?: number;
  /** Symbol diameter px (overrides `symbolSize`) */
  size?: number;
  color?: string;
  symbol?: GraphSymbol;
  /** Force layout: stays at x / y */
  fixed?: boolean;
  /** Show (true) or hide (false) this label, or its own label options */
  label?: boolean | GraphLabelOptions;
}

/** One edge (directed when `edge.arrow` is on). */
export interface GraphLink {
  /** Node id */
  source: string;
  target: string;
  value?: number;
  color?: string;
  /** px */
  width?: number;
  /** Bend: 0 = straight, 0.2 = a soft curve; negative bends to the other side */
  curveness?: number;
  /** Text in the middle of the edge (true = the value) */
  label?: string | boolean;
  /** Dash pattern, e.g. [4, 3] */
  dash?: number[];
}

export interface GraphCategory {
  name: string;
  color?: string;
  symbol?: GraphSymbol;
  /** Start hidden (toggle in the legend) */
  hidden?: boolean;
}

export interface GraphForceOptions {
  /** Push between nodes (Barnes–Hut). Default 60 */
  repulsion?: number;
  /** Length of the springs: a number, or [shortest, longest] where a bigger link value is shorter. Default 40 */
  edgeLength?: number | [number, number];
  /** Spring strength multiplier. Default 1 */
  edgeStrength?: number;
  /** Pull towards the center. Default 0.08 */
  gravity?: number;
  /** Share of the speed lost each tick, 0–1. Default 0.4 */
  friction?: number;
  /** Barnes–Hut accuracy: smaller is slower and more exact. Default 0.9 */
  theta?: number;
  /** Keep nodes from overlapping (true, or extra px between them). Default false */
  collide?: boolean | number;
  /** Animate the ticks. false = run the layout before the first frame. Default true */
  layoutAnimation?: boolean;
  /** Ticks run before the first frame (skips the explosion of big graphs). Default 0 */
  warmup?: number;
  /** Speed of cooling: ~300 ticks with the default 0.0228 */
  alphaDecay?: number;
}

export interface GraphCircularOptions {
  /** Labels along the radius, outside the circle. Default false */
  rotateLabel?: boolean;
  /** Order around the circle. Default 'category' */
  sort?: 'category' | 'value' | 'none';
  /** Angle of the first node, degrees (90 = top). Default 90 */
  startAngle?: number;
  clockwise?: boolean;
  /** Radius in % of half the smallest side. Default 75 (65 with rotated labels) */
  radius?: number;
}

export interface GraphAxis {
  /** Default: the data range, rounded */
  min?: number;
  max?: number;
  type?: 'value' | 'log';
  name?: string;
  /** Draw ticks and grid. false keeps the coordinates but draws nothing (maps). Default true */
  show?: boolean;
  format?: (v: number) => string;
  /** Grid lines. Default true */
  splitLine?: boolean;
}

export interface GraphEdgeOptions {
  /** 'source' / 'target' = the node color, or a color. Default the theme edge color */
  color?: 'source' | 'target' | string;
  /** px. Default 1 */
  width?: number;
  /** Default 1 (0.5 with 'source' / 'target') */
  opacity?: number;
  /** Default 0 */
  curveness?: number;
  /** Arrow at the target ('end'), at both ends, or none. Default false */
  arrow?: boolean | 'end' | 'both';
  /** px. Default 7 */
  arrowSize?: number;
  /** Text in the middle of each edge */
  label?: boolean | { show?: boolean; format?: (link: GraphLink) => string; color?: string; fontSize?: number };
}

export interface GraphTheme {
  background: string;
  text: string;
  muted: string;
  /** Axis grid lines */
  grid: string;
  /** Default edge color */
  edge: string;
  /** Line around the nodes */
  nodeBorder: string;
  tooltipBg: string;
  tooltipText: string;
  tooltipBorder: string;
  font: string;
}

/** Helpers given to `underlay` and `graphic`. */
export interface GraphGraphicApi {
  width: number;
  height: number;
  /** Drawing area (inside padding and axes) */
  plot: { x: number; y: number; w: number; h: number };
  theme: GraphTheme;
  /** Node coordinates (data values with `axes`) → px, following zoom and pan */
  toPixel: (x: number, y: number) => { x: number; y: number };
  /** px → node coordinates */
  fromPixel: (x: number, y: number) => { x: number; y: number };
  /** Where a node is drawn now (px) and its radius, or null when it is hidden */
  nodePosition: (id: string) => { x: number; y: number; r: number } | null;
  /** User zoom (1 = no zoom) */
  zoom: number;
  /** Entry animation progress, 0–1 */
  progress: number;
  /** performance.now() of this frame */
  time: number;
}

export interface GraphData {
  nodes: GraphNode[];
  links?: GraphLink[];
  categories?: (GraphCategory | string)[];
}

export interface GraphOptions {
  nodes?: GraphNode[];
  links?: GraphLink[];
  categories?: (GraphCategory | string)[];
  /** Default 'force', or 'none' when every node has x / y or with `axes` */
  layout?: 'none' | 'force' | 'circular';
  force?: GraphForceOptions;
  circular?: GraphCircularOptions;
  /**
   * Node x / y are data values on numeric axes (y grows up). With `show: false` on both, it is a plain
   * coordinate system (longitude / latitude for maps).
   */
  axes?: { x?: GraphAxis; y?: GraphAxis };
  /** Layout 'none': box of node coordinates to fit (default: the nodes), [x0, y0, x1, y1] */
  extent?: [number, number, number, number];
  /** px per y unit ÷ px per x unit. Default 1 for layout 'none' (no stretch); free with `axes` */
  aspect?: number;
  /** Default symbol. Default 'circle' */
  symbol?: GraphSymbol;
  /** Diameter px: a number, [min, max] by value (sqrt scale), or a function. Default 10 */
  symbolSize?: number | [number, number] | ((node: GraphNode) => number);
  /** Line around the nodes */
  nodeStyle?: { borderColor?: string; borderWidth?: number; opacity?: number };
  label?: boolean | (GraphLabelOptions & { hideOverlap?: boolean });
  edge?: GraphEdgeOptions;
  /** What stays lit while a node or edge is hovered. Default 'adjacency' */
  focus?: 'adjacency' | 'self' | 'none';
  /** Opacity of the rest while hovering. Default 0.12 */
  hoverDim?: number;
  /** Drag nodes. Default true (false with `axes`) */
  draggable?: boolean;
  /** Zoom with the wheel and pan by dragging the background. Default true */
  roam?: boolean | 'zoom' | 'move';
  /** Zoom range. Default [0.2, 12] */
  scaleLimit?: [number, number];
  /** How much the symbols grow with the zoom (0 = never, 1 = like the map). Default 0.5 */
  nodeScaleRatio?: number;
  /** Draw under the edges (maps, calendars…) */
  underlay?: (ctx: CanvasRenderingContext2D, api: GraphGraphicApi) => void;
  /** Draw on top of everything */
  graphic?: (ctx: CanvasRenderingContext2D, api: GraphGraphicApi) => void;
  /** Palette of the categories */
  colors?: string[];
  legend?: boolean | { show?: boolean; position?: 'top' | 'bottom' | 'left' | 'right'; interactive?: boolean };
  tooltip?: boolean | { show?: boolean; formatter?: (info: GraphHoverInfo) => string };
  valueFormatter?: (v: number) => string;
  title?: string | { text: string; subtext?: string; align?: 'left' | 'center' | 'right' };
  /** 'transparent' for cards. Shortcut for theme.background */
  background?: string;
  /** Space around everything, px. Default 10 */
  padding?: number;
  theme?: 'dark' | 'light' | Partial<GraphTheme>;
  /** Default true */
  animation?: boolean | { duration?: number };
}

export interface GraphHoverInfo {
  type: 'node' | 'link';
  /** Index in nodes / links */
  index: number;
  name: string;
  value?: number;
  color: string;
  node?: GraphNode;
  link?: GraphLink;
  source?: GraphNode;
  target?: GraphNode;
  /** Category name */
  category?: string;
  /** Number of links of the node */
  degree?: number;
}

export type GraphEvent = 'hover' | 'click' | 'toggle';
