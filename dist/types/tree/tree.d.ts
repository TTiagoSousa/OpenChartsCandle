import type { TreeChartHoverInfo, TreeChartNode, TreeChartOptions, TreeChartSpec, TreeChartTheme } from './types';
export declare const treeDarkTheme: TreeChartTheme;
export declare const treeLightTheme: TreeChartTheme;
export declare const TREE_COLORS: string[];
/**
 * Tree chart: a hierarchy as a tidy tree from left to right, right to left, top to bottom, bottom to top or
 * radial, with curved or elbow edges, nodes that open and close with a click (animated), several trees in one
 * chart, labels that avoid each other, tooltip, zoom and pan.
 */
export declare class TreeChart {
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
    private specs;
    private trees;
    private hiddenKeys;
    private hover;
    private width;
    private height;
    private dpr;
    private view;
    private animStart;
    private raf;
    private handlers;
    private ro;
    private destroyed;
    constructor(container: HTMLElement, options?: TreeChartOptions);
    /** Replace the data: one tree, or several trees. Nodes with the same path keep their place and state. */
    setData(data: TreeChartNode | TreeChartSpec[], animate?: boolean): void;
    /** Change options after creation. */
    setOptions(patch: TreeChartOptions, animate?: boolean): void;
    /** Open or close a node, given as the node object of the data or its path of names (from the root). */
    setCollapsed(target: TreeChartNode | string[], collapsed: boolean, treeIndex?: number): void;
    /** Open every node (or only down to `depth`, closing the deeper ones). */
    expandAll(depth?: number): void;
    /** Close every node from `depth` down (default 1: only the root and its children show). */
    collapseAll(depth?: number): void;
    /** Show / hide a tree (by name or index). */
    toggle(id: string | number, hidden?: boolean): void;
    /** Back to no zoom and no pan. */
    resetView(): void;
    on(event: 'hover', handler: (info: TreeChartHoverInfo | null) => void): () => void;
    on(event: 'click', handler: (info: TreeChartHoverInfo) => void): () => void;
    on(event: 'toggle', handler: (e: {
        id: string;
        index: number;
        hidden: boolean;
    }) => void): () => void;
    on(event: 'collapse', handler: (e: {
        node: TreeChartNode;
        collapsed: boolean;
    }) => void): () => void;
    resize(): void;
    screenshot(): string;
    destroy(): void;
    private keyOf;
    private emit;
    /** The trees: `trees`, or the top-level options; the top-level look is the default of each tree. */
    private specList;
    private find;
    private applyLook;
    private rebuild;
    private duration;
    private loop;
    private legendCfg;
    private renderLegend;
    private measure;
    private font;
    /** The label config of a node: the tree's, then the leaves', then the node's own. */
    private labelOf;
    private labelText;
    private labelWidth;
    private symbolSize;
    /** New targets for every node; with `animate`, they move there from where they are. */
    private relayout;
    private labelRotation;
    private sx;
    private sy;
    /** Nodes lit by the hover (null = no hover). */
    private lit;
    private draw;
    private drawEdge;
    private drawSymbol;
    private drawLabels;
    private info;
    private hitTest;
    private bind;
    private showTooltip;
}
export declare function createTreeChart(container: HTMLElement, options?: TreeChartOptions): TreeChart;
