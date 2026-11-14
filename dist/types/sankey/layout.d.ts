/**
 * Sankey layout (in the spirit of d3-sankey, as ECharts uses): nodes in columns by their longest path, node
 * heights proportional to their value, then a few passes of weighted-centre relaxation (right to left and left
 * to right) with collision resolution, so the links cross as little as possible.
 *
 * Coordinates are in a "flow frame": `x` runs along the flow (columns), `y` along the stack of each column.
 * A vertical chart just swaps the two axes when drawing.
 */
export type SankeyNodeAlign = 'justify' | 'left' | 'right';
export interface SankeyLayoutNodeInput {
    name: string;
    /** Minimum value of the node (its value is max(this, incoming, outgoing)) */
    value?: number;
    /** Column override */
    depth?: number;
}
export interface SankeyLayoutLinkInput {
    /** Name or index of a node */
    source: string | number;
    target: string | number;
    value: number;
}
export interface SankeyLayoutNode {
    /** Index in the input */
    index: number;
    name: string;
    /** max(incoming, outgoing, the node's own value) */
    value: number;
    inValue: number;
    outValue: number;
    /** Longest path from a source */
    depth: number;
    /** Longest path to a sink */
    height: number;
    /** Column it is drawn in */
    layer: number;
    x0: number;
    x1: number;
    y0: number;
    y1: number;
    /** Outgoing links, ordered by where they arrive */
    sourceLinks: SankeyLayoutLink[];
    /** Incoming links, ordered by where they come from */
    targetLinks: SankeyLayoutLink[];
}
export interface SankeyLayoutLink {
    /** Index in the input */
    index: number;
    source: SankeyLayoutNode;
    target: SankeyLayoutNode;
    value: number;
    width: number;
    /** Centre of the link at its source / target node */
    y0: number;
    y1: number;
}
export interface SankeyLayoutOptions {
    /** Extent along the flow */
    width: number;
    /** Extent along the columns */
    height: number;
    /** Default 20 */
    nodeWidth?: number;
    /** Default 8 */
    nodeGap?: number;
    /** Default 'justify' */
    nodeAlign?: SankeyNodeAlign;
    /** Relaxation passes. 0 keeps the order of the data. Default 32 */
    iterations?: number;
}
export interface SankeyLayoutResult {
    nodes: SankeyLayoutNode[];
    /** Laid-out links (without the ignored ones) */
    links: SankeyLayoutLink[];
    /** Links left out: self-links and links that close a cycle (index in the input) */
    ignored: {
        index: number;
        source: string;
        target: string;
        reason: 'cycle' | 'self';
    }[];
    /** Number of columns */
    columns: number;
    /** Pixels per unit of value */
    ky: number;
    /** Gap between nodes actually used */
    gap: number;
}
/** Lay out a sankey. Throws on duplicated node names and on links to unknown nodes. */
export declare function sankeyLayout(nodeInput: SankeyLayoutNodeInput[], linkInput: SankeyLayoutLinkInput[], opts: SankeyLayoutOptions): SankeyLayoutResult;
/** After moving nodes by hand: order the links of every node by the other end and place them again. */
export declare function sankeyLinkBreadths(nodes: SankeyLayoutNode[]): void;
