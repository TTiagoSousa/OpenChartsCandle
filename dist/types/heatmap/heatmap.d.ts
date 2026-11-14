import type { HeatmapCell, HeatmapDatum, HeatmapOptions, HeatmapTheme } from './types';
export declare const heatmapDarkTheme: HeatmapTheme;
export declare const heatmapLightTheme: HeatmapTheme;
/** Default colors of the visualMap (low → high): blue → yellow → red. */
export declare const HEATMAP_COLORS: string[];
/**
 * Cartesian heatmap: x and y categories (or numeric bins) with a value per cell colored by a visualMap
 * (gradient with draggable range handles, or pieces that toggle), labels, row / column emphasis, tooltip,
 * zoom & pan. Drawn with one fill color per bucket, so 20 000+ cells stay fast.
 */
export declare class HeatmapChart {
    readonly root: HTMLElement;
    readonly canvas: HTMLCanvasElement;
    private ctx;
    /** cached cells / axes; the hover is drawn on top of it */
    private layer;
    private lctx;
    private dirty;
    private titleEl;
    private bodyEl;
    private plotEl;
    private vmEl;
    private tooltipEl;
    private opts;
    private theme;
    private grid;
    private vmin;
    private vmax;
    private range;
    private pieces;
    private off;
    private lut;
    private ink;
    private bucket;
    private order;
    private start;
    private plot;
    private view;
    private xPlan;
    private yStep;
    private xMaxW;
    private yMaxW;
    private xLabelMax;
    private hover;
    private drag;
    private justDragged;
    private width;
    private height;
    private dpr;
    private animStart;
    private raf;
    private handlers;
    private ro;
    private destroyed;
    constructor(container: HTMLElement, options?: HeatmapOptions);
    /** Replace the cells (`[x, y, value]` or objects). */
    setData(data: HeatmapDatum[], animate?: boolean): void;
    /** Replace the cells with a matrix: `matrix[row][column]`. */
    setMatrix(matrix: (number | null)[][], animate?: boolean): void;
    /** Change options after creation. */
    setOptions(patch: HeatmapOptions, animate?: boolean): void;
    /** The cell at column x and row y (box in px relative to the chart), or null. */
    cellAt(x: number, y: number): HeatmapCell | null;
    /** Color of a value on the visualMap. */
    colorOf(v: number): string;
    /** Back to the whole grid after zooming. */
    resetZoom(): void;
    on(event: 'click', handler: (cell: HeatmapCell) => void): () => void;
    on(event: 'hover', handler: (cell: HeatmapCell | null) => void): () => void;
    on(event: 'zoom', handler: (view: {
        x: [number, number];
        y: [number, number];
    }) => void): () => void;
    resize(): void;
    screenshot(): string;
    destroy(): void;
    private emit;
    private applyLook;
    private vm;
    private colors;
    private emptyColor;
    private fmt;
    private rebuild;
    /** Color bucket of every cell, the bucket colors and the drawing order. */
    private recolor;
    /** A cell switched off by the legend (piece off, or out of the handles' range). */
    private hidden;
    private fillOf;
    private renderVisual;
    private bindVisual;
    private measure;
    private font;
    private axisText;
    /** Widest label of each axis. */
    private measureLabels;
    /** Plot box, label rotation and thinning. */
    private layout;
    /** Every how many categories a label is shown, at the current zoom. */
    private steps;
    private cellSize;
    /** Left edge of column i, px. */
    private colX;
    /** Top edge of row j, px (row 0 at the bottom unless inverse). */
    private rowY;
    /** Cell index under a point, or -1. */
    private indexAt;
    private info;
    private duration;
    private progress;
    private loop;
    private draw;
    /** Everything but the hover, on the cached layer. */
    private render;
    private drawCells;
    private drawLabels;
    private drawAxes;
    /** Hovered cell, and its row / column with `emphasis`. */
    private drawHover;
    private zoomable;
    /** Keep the view inside the grid, at least one cell wide. */
    private clampView;
    private afterZoom;
    private bind;
    private showTooltip;
}
export declare function createHeatmapChart(container: HTMLElement, options?: HeatmapOptions): HeatmapChart;
