import type { ParallelBrushEvent, ParallelHoverInfo, ParallelOptions, ParallelSeries, ParallelTheme } from './types';
export declare const parallelDarkTheme: ParallelTheme;
export declare const parallelLightTheme: ParallelTheme;
export declare const PARALLEL_COLORS: string[];
/**
 * Parallel coordinates: one axis per dimension and one polyline per row of data, colored by series or by the
 * value on one dimension (visualMap). Drag along an axis to brush a range (several axes = AND), drag an axis
 * name to move it, legend, tooltip and animations. Thousands of lines: drawn in batches by color and cached.
 */
export declare class ParallelChart {
    readonly root: HTMLElement;
    readonly canvas: HTMLCanvasElement;
    private ctx;
    private layer;
    private lctx;
    private titleEl;
    private bodyEl;
    private plotEl;
    private legendEl;
    private vmEl;
    private tooltipEl;
    private opts;
    private theme;
    private list;
    private hiddenKeys;
    private hiddenPieces;
    private models;
    private axes;
    private scales;
    /** dimension shown in each slot (axis reorder) */
    private order;
    private ranges;
    private D;
    private N;
    private T;
    private lineModel;
    private lineRow;
    private lineName;
    private lineValue;
    private lineColor;
    private linePiece;
    private visible;
    private active;
    private batches;
    private inactiveLines;
    private pos;
    private c0;
    private c1;
    private nameBoxes;
    private tickStride;
    /** max width of the tick labels of each slot (they are cut to it) */
    private labelMax;
    private hover;
    private drag;
    private dragged;
    private dirty;
    private width;
    private height;
    private dpr;
    private animStart;
    private raf;
    private handlers;
    private ro;
    private destroyed;
    constructor(container: HTMLElement, options?: ParallelOptions);
    get series(): ParallelSeries[];
    /** Dimensions in the order they are shown (changes when an axis is dragged). */
    get axisOrder(): number[];
    /** Replace every series (the brush is kept). */
    setSeries(series: ParallelSeries[], animate?: boolean): void;
    /** Change options after creation. */
    setOptions(patch: ParallelOptions, animate?: boolean): void;
    /** Show / hide a series. */
    toggle(id: string, hidden?: boolean): void;
    /** Brush ranges in axis units: `{ axis, from, to }` (value / log) or `{ axis, categories }`. Replaces the current ones. */
    setBrush(ranges: {
        axis: number;
        from?: number;
        to?: number;
        categories?: string[];
    }[]): void;
    clearBrush(): void;
    /** Current brush and selected rows. */
    getSelection(): ParallelBrushEvent;
    /** Show the dimensions in this order (a permutation of the axis indices). */
    setAxisOrder(order: number[]): void;
    on(event: 'hover', handler: (info: ParallelHoverInfo | null) => void): () => void;
    on(event: 'click', handler: (info: ParallelHoverInfo) => void): () => void;
    on(event: 'toggle', handler: (e: {
        id: string;
        hidden: boolean;
    }) => void): () => void;
    on(event: 'brush', handler: (e: ParallelBrushEvent) => void): () => void;
    on(event: 'axisorder', handler: (order: number[]) => void): () => void;
    resize(): void;
    screenshot(): string;
    destroy(): void;
    private keyOf;
    private emit;
    private emitBrush;
    private applyLook;
    private rebuild;
    /** A value of the visualMap dimension as a number (categories: their index). */
    private vmNumber;
    private vmRange;
    /** Visible / active flags and the draw batches. */
    private regroup;
    private duration;
    private progress;
    private loop;
    private legendCfg;
    private renderLegend;
    /** A legend that would take too much of a small chart becomes one scrolling row. */
    private compactLegend;
    private vmFmt;
    private renderVisual;
    private measure;
    private font;
    private nameFs;
    private labelCfg;
    private tickText;
    /** Cut a text to a width with an ellipsis. */
    private fit;
    private horizontal;
    private layout;
    private cross;
    private pt;
    /** Add the path of one line to the current path. */
    private trace;
    private paintLines;
    private renderLayer;
    private draw;
    private brushOn;
    private drawBrushes;
    private drawAxes;
    private drawHover;
    private info;
    /** Nearest active line to the mouse, between the two axes around it. */
    private hitTest;
    /** Slot of the axis whose brush area is under the point, or -1. */
    private axisAt;
    private nameAt;
    private tAt;
    private setRange;
    private bind;
    private setHover;
    private fmtValue;
    private showTooltip;
}
export declare function createParallelChart(container: HTMLElement, options?: ParallelOptions): ParallelChart;
