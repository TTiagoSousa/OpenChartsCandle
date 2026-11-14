import type { BoxplotHoverInfo, BoxplotOptions, BoxplotSeries, BoxplotTheme } from './types';
export declare const boxplotDarkTheme: BoxplotTheme;
export declare const boxplotLightTheme: BoxplotTheme;
export declare const BOXPLOT_COLORS: string[];
/**
 * Box-and-whisker chart: one box per category and series (precomputed or computed from raw values), grouped side
 * by side, vertical or horizontal, with outliers, mean marker, jittered raw points, legend, tooltip and animations.
 */
export declare class BoxplotChart {
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
    private list;
    private hiddenKeys;
    private models;
    private categories;
    private hover;
    private plot;
    private scale;
    private catRot;
    private catStep;
    private width;
    private height;
    private dpr;
    private animStart;
    private raf;
    private handlers;
    private ro;
    private destroyed;
    constructor(container: HTMLElement, options?: BoxplotOptions);
    get series(): BoxplotSeries[];
    /** Replace every series; boxes with the same series key and category move to their new values. */
    setSeries(series: BoxplotSeries[], animate?: boolean): void;
    /** Change options after creation. */
    setOptions(patch: BoxplotOptions, animate?: boolean): void;
    /** Show / hide a series. */
    toggle(id: string, hidden?: boolean): void;
    on(event: 'hover', handler: (info: BoxplotHoverInfo | null) => void): () => void;
    on(event: 'click', handler: (info: BoxplotHoverInfo) => void): () => void;
    on(event: 'toggle', handler: (e: {
        id: string;
        hidden: boolean;
    }) => void): () => void;
    resize(): void;
    screenshot(): string;
    destroy(): void;
    private keyOf;
    private emit;
    private get horizontal();
    private applyLook;
    /** The items of a series, one per category: `data`, or `samples` as items. */
    private items;
    /** The numbers of one item (null = no box). */
    private boxOf;
    private rebuild;
    private duration;
    private progress;
    private loop;
    private pointsCfg;
    private legendCfg;
    private renderLegend;
    private measure;
    /** Smallest and biggest value of every box (hidden series too, so toggling does not rescale). */
    private extent;
    private valueScale;
    private fmtTick;
    private catLabel;
    private layout;
    /** Where each box sits along the category axis. */
    private placeBoxes;
    private font;
    /** px of a value along the value axis. */
    private vpos;
    /** Canvas point of (position along the category axis, value). */
    private xy;
    private seg;
    private draw;
    private drawGrid;
    private drawAxes;
    private drawBox;
    private symbol;
    private fmt;
    private info;
    /** What is under the mouse: the closest outlier or point, else a box (whiskers included). */
    private hitTest;
    private bind;
    private showTooltip;
}
export declare function createBoxplotChart(container: HTMLElement, options?: BoxplotOptions): BoxplotChart;
