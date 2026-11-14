/** One node of a tree (names are prefixed `TreeChart…` so they don't clash with the treemap's `TreeNode`). */
export interface TreeChartNode {
    name: string;
    /** Shown in the tooltip (and in the label with `label.format`) */
    value?: number | string;
    children?: TreeChartNode[];
    /** Start with the children hidden (click the node to open it) */
    collapsed?: boolean;
    /** Color of this node's symbol */
    color?: string;
    symbol?: TreeChartSymbol;
    symbolSize?: number;
    /** Color of the edge that comes into this node */
    lineColor?: string;
    /** Label of this node (merged over the tree's) */
    label?: TreeChartLabel;
}
/** `emptyCircle`: hollow when open or a leaf, filled when it has hidden children. */
export type TreeChartSymbol = 'emptyCircle' | 'circle' | 'rect' | 'roundRect' | 'diamond' | 'triangle' | 'none';
/** Where the root is: Left→Right, Right→Left, Top→Bottom, Bottom→Top. */
export type TreeChartOrient = 'LR' | 'RL' | 'TB' | 'BT';
export interface TreeChartLabel {
    show?: boolean;
    color?: string;
    fontSize?: number;
    fontWeight?: number | string;
    /** Text of the label. Default: the name */
    format?: (node: TreeChartNode) => string;
    /**
     * Side of the symbol. 'auto' (default): internal nodes on the root side, leaves on the far side; in a
     * radial tree, along the radius
     */
    position?: 'auto' | 'left' | 'right' | 'top' | 'bottom' | 'inside';
    /** Degrees. Default: 0, or along the depth axis in TB / BT trees ('auto') */
    rotate?: number | 'auto';
    /** Box behind the text */
    background?: string;
    /** Gap between the symbol and the text, px. Default 6 */
    distance?: number;
}
export interface TreeChartEdge {
    /** Default: the theme's */
    color?: string;
    /** Default 1.5 */
    width?: number;
    /** 0–1, how round the curves are. Default 0.5 */
    curveness?: number;
    dash?: number[];
}
/** One tree: its data, where it sits and how it looks. */
export interface TreeChartSpec {
    /** Name in the legend (with several trees) */
    name?: string;
    data: TreeChartNode;
    /** Default 'orthogonal' */
    layout?: 'orthogonal' | 'radial';
    /** Default 'LR' (orthogonal only) */
    orient?: TreeChartOrient;
    /** Default 'curve'. 'polyline' = elbow lines (orthogonal only) */
    edgeShape?: 'curve' | 'polyline';
    /** Space of the tree (labels included) in the chart: px or '%' of the chart. Default 10 px; the room of the labels is kept inside */
    left?: number | string;
    right?: number | string;
    top?: number | string;
    bottom?: number | string;
    /** Default 'emptyCircle' */
    symbol?: TreeChartSymbol;
    /** px. Default 7 */
    symbolSize?: number;
    /** Color of the symbols (default: the palette, one per tree) */
    color?: string;
    edge?: TreeChartEdge;
    label?: TreeChartLabel;
    /** Label of the leaves (merged over `label`) */
    leaves?: {
        label?: TreeChartLabel;
    };
    /** Levels open at the start (0 = only the root). Default: all; nodes with `collapsed` stay closed */
    initialDepth?: number;
    /** Click a node to open / close it. Default true */
    expandAndCollapse?: boolean;
    /** Start hidden (toggle in the legend) */
    hidden?: boolean;
}
export interface TreeChartTheme {
    background: string;
    text: string;
    muted: string;
    /** Edges */
    edge: string;
    /** Inside of the hollow symbols */
    symbolFill: string;
    tooltipBg: string;
    tooltipText: string;
    tooltipBorder: string;
    font: string;
}
export interface TreeChartOptions extends Partial<Omit<TreeChartSpec, 'data' | 'name' | 'hidden'>> {
    /** The tree (or use `trees` for several) */
    data?: TreeChartNode;
    /** Several trees in one chart, each with its own space (`left` / `top` …) and look */
    trees?: TreeChartSpec[];
    /** Palette (one color per tree) */
    colors?: string[];
    /** Shown with several trees. Click hides a tree */
    legend?: boolean | {
        show?: boolean;
        position?: 'top' | 'bottom';
        interactive?: boolean;
    };
    tooltip?: boolean | {
        show?: boolean;
        formatter?: (info: TreeChartHoverInfo) => string;
    };
    /** What lights up on hover: the path to the root, the subtree or nothing. Default 'ancestor' */
    emphasis?: 'ancestor' | 'descendant' | 'none';
    /** Zoom with the wheel and drag to move. Default false */
    roam?: boolean;
    title?: string | {
        text: string;
        subtext?: string;
        align?: 'left' | 'center' | 'right';
    };
    /** 'transparent' for cards. Shortcut for theme.background */
    background?: string;
    theme?: 'dark' | 'light' | Partial<TreeChartTheme>;
    /** Default true */
    animation?: boolean | {
        duration?: number;
    };
}
export interface TreeChartHoverInfo {
    node: TreeChartNode;
    name: string;
    value: number | string | undefined;
    /** Names from the root to this node */
    path: string[];
    depth: number;
    /** Index of the tree */
    treeIndex: number;
    /** The node has children */
    hasChildren: boolean;
    collapsed: boolean;
}
export type TreeChartEvent = 'hover' | 'click' | 'toggle' | 'collapse';
