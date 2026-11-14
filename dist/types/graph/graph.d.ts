import type { GraphData, GraphHoverInfo, GraphLink, GraphNode, GraphOptions, GraphTheme } from './types';
export declare const graphDarkTheme: GraphTheme;
export declare const graphLightTheme: GraphTheme;
export declare const GRAPH_COLORS: string[];
/**
 * Graph (network) chart: nodes and links with force, circular or fixed layouts, categories with a
 * legend, curved edges with arrows and labels, adjacency highlight, tooltip, node dragging, zoom & pan,
 * numeric axes, drawing hooks and animated updates.
 */
export declare class GraphChart {
    readonly root: HTMLElement;
    readonly canvas: HTMLCanvasElement;
    private ctx;
    private titleEl;
    private bodyEl;
    private plotEl;
    private legendEl;
    private tooltipEl;
    private opts;
    private theme;
    private data;
    private cats;
    private hiddenCats;
    private nodeList;
    private linkList;
    private byId;
    private adj;
    private sim;
    private mode;
    private ax;
    private ay;
    private fit;
    private zoom;
    private panX;
    private panY;
    /** the user zoomed or panned: the force layout stops fitting itself to the box */
    private userMoved;
    private plot;
    private hover;
    private drag;
    private suppressClick;
    private width;
    private height;
    private dpr;
    private animStart;
    private growUntil;
    private raf;
    private handlers;
    private ro;
    private destroyed;
    constructor(container: HTMLElement, options?: GraphOptions);
    get nodes(): GraphNode[];
    get links(): GraphLink[];
    /**
     * Replace nodes and links (and categories). Nodes keep their place by id: with the force layout new
     * nodes start next to a neighbour and the layout warms up again; other layouts move to the new spots.
     */
    setData(data: GraphData, animate?: boolean): void;
    /** Change options after creation. */
    setOptions(patch: GraphOptions, animate?: boolean): void;
    /** Show / hide a category (by name). */
    toggle(category: string, hidden?: boolean): void;
    /** Back to the fitted view (no zoom or pan). */
    resetView(): void;
    /** Warm the force layout up again (alpha 0–1). */
    reheat(alpha?: number): void;
    /** Where a node is now, in node coordinates (data values with `axes`). */
    nodePosition(id: string): {
        x: number;
        y: number;
    } | null;
    on(event: 'hover', handler: (info: GraphHoverInfo | null) => void): () => void;
    on(event: 'click', handler: (info: GraphHoverInfo) => void): () => void;
    on(event: 'toggle', handler: (e: {
        category: string;
        hidden: boolean;
    }) => void): () => void;
    resize(): void;
    screenshot(): string;
    destroy(): void;
    private emit;
    private applyLook;
    private duration;
    /** Axis value → coordinate used for drawing (log10 on log axes). */
    private toAxis;
    private fromAxis;
    private rebuild;
    private placeForce;
    private hoverVisible;
    private isVisible;
    private legendCfg;
    private renderLegend;
    private measure;
    /** Range of each axis: given, or the data rounded to nice values. */
    private layoutAxes;
    private axisShown;
    private axisLabel;
    /** The drawing area: inside the padding, and the axis labels when there are axes. */
    private layoutPlot;
    private ticks;
    private maxRadius;
    /** The fit of the coordinates into the drawing area. */
    private fitTarget;
    private easeFit;
    private X;
    private Y;
    private invX;
    private invY;
    private nodeScale;
    private schedule;
    private frame;
    private font;
    private api;
    private draw;
    private drawGrid;
    private drawAxisLabels;
    private edgeOpacity;
    private arrowMode;
    /** Ends of an edge (pulled back to the node borders when there are arrows) and its control point. */
    private edgeGeom;
    private drawEdges;
    private addEdge;
    private addSymbol;
    private drawNodes;
    private labelCfg;
    private drawLabels;
    private edgeLabelText;
    private drawEdgeLabels;
    private fmt;
    private info;
    private hitTest;
    private sameHover;
    private roam;
    private draggable;
    private bind;
    private showTooltip;
}
export declare function createGraphChart(container: HTMLElement, options?: GraphOptions): GraphChart;
