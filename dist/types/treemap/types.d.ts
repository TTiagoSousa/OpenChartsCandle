/** A value: a number, or several dimensions (`[size, 2011, growth…]`); the first one is the area by default. */
export type TreeValue = number | number[];
/** One node of the tree. Parents get their size from the children. */
export interface TreeNode {
    name: string;
    value?: TreeValue;
    children?: TreeNode[];
    /** stable id for animations; defaults to the path of names */
    id?: string;
    /** fixed color for this node (and its children, unless a level recolors them) */
    color?: string;
    /** anything else you want back in events and formatters */
    data?: unknown;
    /** look of this node only (wins over its level) */
    itemStyle?: TreemapItemStyle;
    /** label of this node only (wins over its level) */
    label?: boolean | TreemapLabelOptions;
}
/** A length in px, or `'40%'` (of half the smaller side for radii, of the width / height for a center). */
export type TreemapLength = number | string;
/** Look of a node: on a level (`levels[i].itemStyle`) or on one node (`TreeNode.itemStyle`). */
export interface TreemapItemStyle {
    /** fill (wins over the palette, the level colors and the visualMap) */
    color?: string;
    /** rounded corners in px; on a sunburst `[inner, outer]` corners can differ */
    borderRadius?: number | [number, number];
    /** outline drawn over the fill (px, default 0) */
    borderWidth?: number;
    /** color of the outline (default: the background) */
    borderColor?: string;
    /** opacity of the fill, 0–1 (the outline and the label stay solid) */
    opacity?: number;
}
/** What stays lit when a node is hovered: the rest fades. */
export type TreemapFocus = 'ancestor' | 'descendant' | 'relative' | 'self' | 'none';
export type TreemapType = 'treemap' | 'sunburst';
export interface TreemapLabelOptions {
    show?: boolean;
    /** text of the label; '\n' for several lines */
    formatter?: (info: TreemapNodeInfo) => string;
    /** second line with the value (default false) */
    showValue?: boolean;
    /** treemap: 'top-left' (default) or 'center'; sunburst: 'inside' (default) or 'outside' (past the outer edge) */
    position?: 'top-left' | 'center' | 'inside' | 'outside';
    fontSize?: number;
    fontWeight?: number | 'normal' | 'bold';
    color?: string;
    /** sunburst: direction of the text, or degrees (0 = horizontal, counterclockwise); default `sunburst.labelRotate` */
    rotate?: 'radial' | 'tangential' | 'none' | number;
    /** sunburst: sectors narrower than this (degrees) get no label */
    minAngle?: number;
    /** sunburst, radial text: 'left' = from the inner edge, 'right' = up to the outer edge (default 'center') */
    align?: 'left' | 'center' | 'right';
    /** sunburst: px from the edge for `align` and `position: 'outside'` (default 4) */
    distance?: number;
}
export interface TreemapUpperLabelOptions {
    show?: boolean;
    /** height of the parent's header in px (default 20) */
    height?: number;
    formatter?: (info: TreemapNodeInfo) => string;
    color?: string;
}
/**
 * Look of the nodes at one depth (`levels[0]` = top-level nodes, `levels[1]` = their children…).
 * Colors: `color` maps the nodes of the level over a list (by index, value or id); `colorSaturation`,
 * `colorLightness` and `colorAlpha` vary the inherited color between siblings.
 */
export interface TreemapLevel {
    /** px between nodes of this level */
    gap?: number;
    /** frame inside nodes of this level, around their children (px) */
    borderWidth?: number;
    /** color of the frame and of the gaps between the children */
    borderColor?: string;
    color?: string[];
    colorMappingBy?: 'index' | 'value' | 'id';
    colorSaturation?: [number, number];
    colorLightness?: [number, number];
    colorAlpha?: [number, number];
    /** which dimension of `value` drives the color mapping (default: the size dimension) */
    visualDimension?: number;
    visualMin?: number;
    visualMax?: number;
    /** header with the name of the nodes of this level that show children */
    upperLabel?: boolean | TreemapUpperLabelOptions;
    label?: boolean | TreemapLabelOptions;
    /** look of the nodes of this level (borders, rounded corners, opacity, a fixed color) */
    itemStyle?: TreemapItemStyle;
    /**
     * Sunburst: inner and outer radius of this ring (px or '%' of half the smaller side). Counted from the
     * center as shown (`levels[0]` = first ring, also when zoomed); rings without them share the room left.
     */
    r0?: TreemapLength;
    r?: TreemapLength;
}
export interface TreemapSunburstOptions {
    /** hole in the middle: fraction of the radius (default 0.15), or '20%' of half the smaller side */
    innerRadius?: number | string;
    /** outer radius: fraction of half the smaller side (default 0.95), or '90%' */
    radius?: number | string;
    /** center `[x, y]`: px or '%' of the width / height (default the middle) */
    center?: [TreemapLength, TreemapLength];
    /** px between sectors (default 1) */
    gap?: number;
    /** extra angle between sibling sectors, in degrees (default 0) */
    padAngle?: number;
    /** rounded corners of every sector in px, or `[inner, outer]` (default 0) */
    borderRadius?: number | [number, number];
    /** direction of the labels, or degrees (default 'radial'); `label.rotate` overrides it per level / node */
    labelRotate?: 'radial' | 'tangential' | 'none' | number;
    /** degrees, 0 = top, clockwise (default 0) */
    startAngle?: number;
    /** show the total in the hole when not zoomed (default true) */
    centerLabel?: boolean;
}
/** Color every node by a value along a gradient, with a color bar. */
export interface TreemapVisualMap {
    /** gradient from the lowest to the highest value */
    colors: string[];
    /** default: the smallest and largest value of all the nodes */
    min?: number;
    max?: number;
    /** which dimension of `value` (default the size dimension) */
    dimension?: number;
    /** color bar (default true) */
    show?: boolean;
    /** where the color bar goes (default 'left') */
    position?: 'left' | 'right' | 'bottom';
    /** text at the `[high, low]` ends (default the formatted max and min) */
    text?: [string, string];
}
export interface TreemapTheme {
    background: string;
    text: string;
    muted: string;
    /** label color on light tiles */
    labelDark: string;
    /** label color on dark tiles */
    labelLight: string;
    tooltipBg: string;
    tooltipText: string;
    tooltipBorder: string;
    font: string;
}
/** What events and formatters receive about a node. */
export interface TreemapNodeInfo {
    id: string;
    name: string;
    /** names from the top level down to this node */
    path: string[];
    /** 0 = top-level node */
    depth: number;
    /** size (area) */
    value: number;
    /** every dimension; for parents, the sum of the children */
    values: number[];
    /** share of the parent (0–1) */
    percent: number;
    /** share of everything (0–1) */
    totalPercent: number;
    color: string;
    isLeaf: boolean;
    node: TreeNode | null;
}
export interface TreemapOptions {
    data: TreeNode[];
    type?: TreemapType;
    theme?: 'dark' | 'light' | Partial<TreemapTheme>;
    /** background; 'transparent' for cards */
    background?: string;
    /** palette of the top-level nodes */
    colors?: string[];
    /** default px between nodes (default 1; 2 between top-level nodes) */
    gap?: number;
    levels?: TreemapLevel[];
    /** how many levels below the current root are shown at once; click to go deeper */
    leafDepth?: number;
    /** nodes with a smaller area (px²) are not drawn (default 4) */
    visibleMin?: number;
    /** order of the siblings (default 'desc') */
    sort?: 'desc' | 'asc' | false;
    /** which dimension of `value` is the area (default 0) */
    sizeDimension?: number;
    /** names of the value dimensions, shown in the tooltip */
    dimensions?: string[];
    label?: boolean | TreemapLabelOptions;
    /** headers with the parent's name (all levels; `levels[i].upperLabel` overrides) */
    upperLabel?: boolean | TreemapUpperLabelOptions;
    /** path back up when zoomed (default true) */
    breadcrumb?: boolean | {
        position?: 'top' | 'bottom';
    };
    /** name of the root in the breadcrumb and tooltip (default 'Total') */
    rootName?: string;
    /** click a parent to zoom into it (default true) */
    drilldown?: boolean;
    sunburst?: TreemapSunburstOptions;
    /** what stays lit on hover (default 'relative' on a sunburst = ancestors and descendants, 'none' on a treemap) */
    emphasis?: {
        focus?: TreemapFocus; /** opacity of the faded nodes (default 0.35) */
        blurOpacity?: number;
    };
    /** color the nodes by value with a gradient and show a color bar */
    visualMap?: TreemapVisualMap;
    tooltip?: boolean | {
        show?: boolean;
        formatter?: (info: TreemapNodeInfo) => string;
    };
    valueFormatter?: (value: number, dimension: number) => string;
    animation?: boolean | {
        duration?: number;
    };
}
export type TreemapEvent = 'click' | 'hover' | 'zoom';
