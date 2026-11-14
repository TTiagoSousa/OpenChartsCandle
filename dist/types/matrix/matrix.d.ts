import type { MatrixCell, MatrixCellInfo, MatrixCoordPart, MatrixOptions, MatrixRect, MatrixTheme } from './types';
export declare const matrixDarkTheme: MatrixTheme;
export declare const matrixLightTheme: MatrixTheme;
/** Palette for categories (visualMap pieces, legends). */
export declare const MATRIX_COLORS: string[];
/** Default continuous visualMap: blue (low) → pale → red (high). */
export declare const MATRIX_VISUAL_COLORS: string[];
/**
 * Matrix: a table-grid with multi-level headers on both sides whose cells hold values, colors, custom canvas
 * drawings or whole embedded charts. Merged cells, visualMap, cross highlight, selection, responsive `media`
 * rules (a dashboard layout that re-flows) and an overlay drawn over the cells.
 */
export declare class MatrixChart {
    readonly root: HTMLElement;
    readonly canvas: HTMLCanvasElement;
    private overlay;
    private ctx;
    private octx;
    private titleEl;
    private bodyEl;
    private plotEl;
    private hostsEl;
    private tooltipEl;
    private visualEl;
    private base;
    private opts;
    private mediaKey;
    private theme;
    private xh;
    private yh;
    private cols;
    private rows;
    /** x header level tops / heights and y header level lefts / widths */
    private xLevels;
    private yLevels;
    private bodyRect;
    private bodyItems;
    private headerItems;
    private cornerItem;
    private grid;
    private nx;
    private ny;
    private vm;
    private hiddenPieces;
    private hover;
    private selected;
    private hosts;
    private textColors;
    private width;
    private height;
    private dpr;
    private animStart;
    private progress;
    private raf;
    private reflowTimer;
    private handlers;
    private ro;
    private destroyed;
    constructor(container: HTMLElement, options?: MatrixOptions);
    /** Replace the body cells (a list of cells or values by row). */
    setData(data: MatrixCell[] | unknown[][], animate?: boolean): void;
    /** Change options after creation (merged over the current ones). */
    setOptions(patch: MatrixOptions, animate?: boolean): void;
    /** The options in effect (after the `media` rules). */
    getOptions(): MatrixOptions;
    /** A body cell by coord (names or leaf indices), or null. */
    getCell(x: MatrixCoordPart, y: MatrixCoordPart): MatrixCellInfo | null;
    /** Rect (px, inside the plot) of a body cell / range by coord, or null. */
    cellRect(x: MatrixCoordPart, y: MatrixCoordPart): MatrixRect | null;
    /** Every body cell. */
    getCells(): MatrixCellInfo[];
    getSelection(): MatrixCellInfo[];
    /** Select body cells by coord (replaces the selection). */
    setSelection(coords: [MatrixCoordPart, MatrixCoordPart][]): void;
    clearSelection(): void;
    /** Show / hide a visualMap piece (cells in it fade out). */
    togglePiece(index: number, hidden?: boolean): void;
    /** Redraw (e.g. after state used by `renderCell` / `graphic` changed). */
    refresh(): void;
    on(event: 'hover', handler: (cell: MatrixCellInfo | null) => void): () => void;
    on(event: 'click', handler: (cell: MatrixCellInfo) => void): () => void;
    on(event: 'select', handler: (cells: MatrixCellInfo[]) => void): () => void;
    on(event: 'media', handler: (e: {
        rules: number[];
    }) => void): () => void;
    resize(): void;
    /** PNG of the matrix, embedded canvases included. */
    screenshot(): string;
    destroy(): void;
    private emit;
    /** Media rules are matched on the container (not the plot), so a rule that hides the legend cannot flip-flop. */
    private activeMedia;
    private effective;
    private applyLook;
    private duration;
    private stagger;
    /** Header model from a dimension; without one, the count comes from the data. */
    private headerOf;
    private headerShown;
    private rebuild;
    private visualColor;
    private fmt;
    private textOf;
    private renderVisual;
    private measure;
    private font;
    private padding;
    private layout;
    private rangeRect;
    /** Rect actually painted (inset by half the gap). */
    private paintRect;
    private syncHosts;
    private placeHosts;
    private unmount;
    private loop;
    /** Animation state of an item: [opacity, scale]. */
    private anim;
    private api;
    private draw;
    private drawItem;
    private contrast;
    private drawLabel;
    /** Truncate with an ellipsis to fit `w`. */
    private fit;
    /** Hover highlight and selection (second canvas, cheap to redraw). */
    private drawOverlay;
    private hitTest;
    private setHover;
    private clickItem;
    private bind;
    private showTooltip;
}
export declare function createMatrixChart(container: HTMLElement, options?: MatrixOptions): MatrixChart;
