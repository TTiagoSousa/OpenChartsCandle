import type { SankeyNodeAlign } from './layout';
export type { SankeyNodeAlign };
/** One node of the sankey. Names must be unique (links point to them by name). */
export interface SankeyNode {
    name: string;
    /** Minimum value. By default the value is the larger of what comes in and what goes out */
    value?: number;
    /** Column of the node (0 = first), over the automatic one */
    depth?: number;
    itemStyle?: SankeyItemStyle;
    /** Label of this node (merged over the levels' and the chart's) */
    label?: SankeyLabel;
}
/** One flow between two nodes. */
export interface SankeyLink {
    /** Name (or index) of the node the flow leaves */
    source: string | number;
    /** Name (or index) of the node the flow reaches */
    target: string | number;
    value: number;
    lineStyle?: SankeyLineStyle;
}
export interface SankeyItemStyle {
    /** Fill. Default: the palette, one color per node (in data order) */
    color?: string;
    borderColor?: string;
    /** Default 0 */
    borderWidth?: number;
    /** Default 0 */
    borderRadius?: number;
    /** 0–1. Default 1 */
    opacity?: number;
}
/**
 * Color of the links: 'source' (the node it leaves), 'target' (the node it reaches), 'gradient' (from one to
 * the other) or any CSS color.
 */
export type SankeyLinkColor = 'source' | 'target' | 'gradient' | (string & {});
export interface SankeyLineStyle {
    /** Default 'source' */
    color?: SankeyLinkColor;
    /** 0–1. Default 0.35 */
    opacity?: number;
    /** 0–1, how round the links are (0 = straight). Default 0.5 */
    curveness?: number;
}
export interface SankeyLabel {
    /** Default true */
    show?: boolean;
    /**
     * Side of the node. 'auto' (default): after the node along the flow, 'right' (or 'bottom' in a vertical
     * sankey); the room for the labels of the last column is kept free
     */
    position?: 'auto' | 'left' | 'right' | 'top' | 'bottom' | 'inside';
    /** Default: the theme's text */
    color?: string;
    /** Default 12 */
    fontSize?: number;
    fontWeight?: number | string;
    /** Gap between the node and the text, px. Default 5 */
    distance?: number;
    /** Text of the label. Default: the name */
    formatter?: (info: SankeyNodeInfo) => string;
}
/** Look of every node (and the links that leave them) in one column. */
export interface SankeyLevel {
    /** Column (0 = first) */
    depth: number;
    itemStyle?: SankeyItemStyle;
    /** Links that leave the nodes of this column */
    lineStyle?: SankeyLineStyle;
    label?: SankeyLabel;
}
export interface SankeyTheme {
    background: string;
    text: string;
    muted: string;
    /** Default border of the nodes ('transparent' = none) */
    nodeBorder: string;
    tooltipBg: string;
    tooltipText: string;
    tooltipBorder: string;
    font: string;
}
export interface SankeyOptions {
    nodes?: SankeyNode[];
    links?: SankeyLink[];
    /** Flow from left to right (default) or from top to bottom */
    orient?: 'horizontal' | 'vertical';
    /** Column of the nodes: 'justify' (sinks in the last column, default), 'left' (by depth) or 'right' (by height) */
    nodeAlign?: SankeyNodeAlign;
    /** Thickness of the nodes, px. Default 20 */
    nodeWidth?: number;
    /** Gap between nodes of one column, px. Default 8 */
    nodeGap?: number;
    /** Relaxation passes that untangle the links. 0 keeps the order of the data. Default 32 */
    layoutIterations?: number;
    /** Drag the nodes along their column. Default true */
    draggable?: boolean;
    /** Space of the sankey in the chart: px or '%' of the chart. The room for the labels is added */
    left?: number | string;
    right?: number | string;
    top?: number | string;
    bottom?: number | string;
    itemStyle?: SankeyItemStyle;
    lineStyle?: SankeyLineStyle;
    label?: SankeyLabel;
    /** Look per column */
    levels?: SankeyLevel[];
    /** Palette of the nodes */
    colors?: string[];
    /**
     * What lights up on hover: 'adjacency' (the node, its links and neighbours; default), 'trajectory' (every
     * flow through it, up and down), 'self' or 'none'
     */
    emphasis?: 'adjacency' | 'trajectory' | 'self' | 'none' | {
        focus?: 'adjacency' | 'trajectory' | 'self' | 'none';
    };
    tooltip?: boolean | {
        show?: boolean;
        formatter?: (info: SankeyInfo) => string;
    };
    /** Format of the values in the tooltip. Default: pt-PT number */
    valueFormat?: (value: number) => string;
    title?: string | {
        text: string;
        subtext?: string;
        align?: 'left' | 'center' | 'right';
    };
    /** 'transparent' for cards. Shortcut for theme.background */
    background?: string;
    theme?: 'dark' | 'light' | Partial<SankeyTheme>;
    /** Default true */
    animation?: boolean | {
        duration?: number;
    };
}
export interface SankeyNodeInfo {
    dataType: 'node';
    node: SankeyNode;
    name: string;
    index: number;
    /** max(incoming, outgoing, own value) */
    value: number;
    inValue: number;
    outValue: number;
    /** Column */
    depth: number;
    color: string;
}
export interface SankeyLinkInfo {
    dataType: 'link';
    link: SankeyLink;
    index: number;
    source: string;
    target: string;
    value: number;
}
export type SankeyInfo = SankeyNodeInfo | SankeyLinkInfo;
export type SankeyEvent = 'hover' | 'click' | 'drag';
