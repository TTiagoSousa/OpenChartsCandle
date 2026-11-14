import type { SankeyInfo, SankeyLink, SankeyNode, SankeyNodeInfo, SankeyOptions, SankeyTheme } from './types';
export declare const sankeyDarkTheme: SankeyTheme;
export declare const sankeyLightTheme: SankeyTheme;
export declare const SANKEY_COLORS: string[];
/**
 * Sankey chart: flows between nodes, in columns from left to right (or rows from top to bottom), with node
 * heights proportional to their value, links colored by source, target or a gradient, adjacency highlight,
 * draggable nodes, tooltip and animated updates.
 */
export declare class SankeyChart {
    readonly root: HTMLElement;
    readonly canvas: HTMLCanvasElement;
    private ctx;
    private titleEl;
    private bodyEl;
    private plotEl;
    private tooltipEl;
    private opts;
    private theme;
    private res;
    private vnodes;
    private vlinks;
    private byLayoutNode;
    private byLayoutLink;
    private hover;
    /** nodes moved by hand: name → top as a fraction of the column height */
    private manual;
    private width;
    private height;
    private dpr;
    /** area of the nodes in the canvas (screen) and its extent in the flow frame */
    private area;
    private horiz;
    private mode;
    private progress;
    private animStart;
    private raf;
    private handlers;
    private ro;
    private destroyed;
    constructor(container: HTMLElement, options?: SankeyOptions);
    /** Replace the nodes and links. Nodes with the same name (and links between the same nodes) move to their new place. */
    setData(data: {
        nodes: SankeyNode[];
        links: SankeyLink[];
    }, animate?: boolean): void;
    /** Change options after creation (a new orientation plays the entry animation again). */
    setOptions(patch: SankeyOptions, animate?: boolean): void;
    /** Links left out of the layout: self-links and links that would close a cycle. */
    getIgnoredLinks(): {
        index: number;
        source: string;
        target: string;
        reason: 'cycle' | 'self';
    }[];
    /** Put back the nodes moved by hand. */
    resetLayout(): void;
    on(event: 'hover', handler: (info: SankeyInfo | null) => void): () => void;
    on(event: 'click', handler: (info: SankeyInfo) => void): () => void;
    on(event: 'drag', handler: (info: SankeyNodeInfo) => void): () => void;
    resize(): void;
    screenshot(): string;
    destroy(): void;
    private emit;
    private applyLook;
    private duration;
    private focus;
    private fmt;
    private font;
    private measure;
    private layoutOpts;
    /** Style, label and info of every node, from the layout (columns are known before the sizes). */
    private decorate;
    private nodeInfo;
    private textWidth;
    /** New layout. `mode`: how the change shows (entry animation, move from the old places, or at once). */
    private relayout;
    private loop;
    /** Screen rectangle of a node. */
    private rect;
    /** Screen point of a (flow, stack) point. */
    private pt;
    private linkPath;
    /** What lights up with the hover (null = nothing hovered). */
    private lit;
    private draw;
    private drawLink;
    private drawNode;
    private drawLabels;
    private infoOf;
    private hitTest;
    private setHover;
    private bind;
    private showTooltip;
}
export declare function createSankeyChart(container: HTMLElement, options?: SankeyOptions): SankeyChart;
