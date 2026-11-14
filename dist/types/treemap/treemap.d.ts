import type { TreeNode, TreemapNodeInfo, TreemapOptions, TreemapTheme, TreemapType } from './types';
export declare const treemapDarkTheme: TreemapTheme;
export declare const treemapLightTheme: TreemapTheme;
export declare const TREEMAP_COLORS: string[];
/** Diverging red → grey → green, for changes (e.g. a market map colored by % change). */
export declare const CHANGE_COLORS: string[];
/**
 * Treemap and sunburst of a tree: squarified rectangles or rings of sectors, colors by level
 * (palette, saturation / lightness or a gradient by value), labels and parent headers,
 * click to zoom in with breadcrumb, tooltip and animated transitions (zoom, data, treemap ↔ sunburst).
 */
export declare class TreemapChart {
    readonly root: HTMLElement;
    readonly canvas: HTMLCanvasElement;
    private ctx;
    private tooltipEl;
    private crumbsEl;
    private vmEl;
    /** value range of the visualMap */
    private vmRange;
    /** center and hole of the sunburst as laid out */
    private hole;
    private opts;
    private theme;
    private tree;
    private zoom;
    private items;
    private tracks;
    private animStart;
    private animDur;
    private raf;
    private hovered;
    private width;
    private height;
    private dpr;
    private area;
    private handlers;
    private ro;
    constructor(container: HTMLElement, options: TreemapOptions);
    get type(): TreemapType;
    /** The node the chart is zoomed into (null = everything). */
    get zoomed(): TreemapNodeInfo | null;
    /** New data: nodes with the same id move to their new place. */
    setData(data: TreeNode[], animate?: boolean): void;
    /** Change options after creation (sizes, colors and shapes animate). */
    setOptions(patch: Partial<TreemapOptions>, animate?: boolean): void;
    /** Switch between treemap and sunburst; every node morphs into its new shape. */
    setType(type: TreemapType, animate?: boolean): void;
    /** Zoom into a node by id (the path of names joined by '/' unless the data gives ids); null = everything. */
    zoomTo(id: string | null, animate?: boolean): void;
    /** One level up. */
    zoomOut(animate?: boolean): void;
    /** Info about a node by id. */
    node(id: string): TreemapNodeInfo | null;
    on(event: 'click', handler: (info: TreemapNodeInfo) => void): () => void;
    on(event: 'hover', handler: (info: TreemapNodeInfo | null) => void): () => void;
    on(event: 'zoom', handler: (info: TreemapNodeInfo | null) => void): () => void;
    screenshot(): string;
    destroy(): void;
    private emit;
    private applyLook;
    private level;
    private rebuild;
    /** Colors: palette for the top level, inherited below, then each level's mapping. */
    private colorize;
    private info;
    private fmt;
    /** Label options of a node: global, then its level, then its own. */
    private labelFor;
    /** itemStyle of a node: its level's, then its own. */
    private styleFor;
    /** Corners, outline and opacity of a node as an Item. */
    private decorate;
    private upperOpts;
    private get showCrumbs();
    private resize;
    private computeArea;
    /** Where the visualMap's color bar is, or null when there is none. */
    private vmShown;
    private renderVisual;
    /** Marker on the color bar at the hovered node's value. */
    private markVisual;
    private layoutTreemap;
    private layoutSunburst;
    /**
     * New layout. With `animate`, every node goes from where it is now to its new shape;
     * `pivot` (zoom) makes the nodes that leave or appear fly out of / into the zoomed node.
     */
    private relayout;
    private progress;
    /** What is on screen right now (mid-animation included). */
    private currentShapes;
    private zoomNode;
    private renderCrumbs;
    private draw;
    /** Hovering a node fades what is outside its focus (sunburst: its ancestors and descendants by default). */
    private dimFor;
    /** Outline of an item: rounded when its style asks for it. */
    private trace;
    private drawItem;
    private textColor;
    private fit;
    private labelText;
    private drawHeader;
    private drawLeafLabel;
    private drawSectorLabel;
    private drawHover;
    /** Sunburst not zoomed: total in the hole. */
    private drawCenter;
    /** Deepest node under the point; `header` when it is a parent's header. */
    private hit;
    private bind;
    /** Where a click zooms to: a header → that parent; the hub → one level up; a tile → its branch under the current root. */
    private target;
    private hideTooltip;
    private showTooltip;
}
/** Create a treemap (or sunburst with `type: 'sunburst'`) inside `container`. */
export declare function createTreemap(container: HTMLElement, options: TreemapOptions): TreemapChart;
