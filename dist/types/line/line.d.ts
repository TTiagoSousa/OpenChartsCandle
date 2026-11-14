import type { LineOptions, LinePoint, LineSeries, LineTheme, LineTooltipContext, LineX } from './types';
export declare const LINE_COLORS: string[];
export declare const lineDarkTheme: LineTheme;
export declare const lineLightTheme: LineTheme;
/**
 * Multi-series line / area chart: time, number or category x axis, dual y axis,
 * stacking, shared tooltip, crosshair, interactive legend, annotations, zoom & pan,
 * realtime appends and animations.
 */
export declare class LineChart {
    readonly root: HTMLElement;
    readonly canvas: HTMLCanvasElement;
    private ctx;
    private plotEl;
    private legendEl;
    private tooltipEl;
    private opts;
    private theme;
    private seriesList;
    private hiddenKeys;
    private model;
    private xType;
    private categories;
    private dataX;
    private view;
    private yLeft;
    private yRight;
    private plot;
    private width;
    private height;
    private dpr;
    private hover;
    private highlighted;
    private reveal;
    private morph;
    private animStart;
    private animKind;
    private fromTop;
    private fromLeft;
    private fromRight;
    private raf;
    private handlers;
    private ro;
    private drag;
    /** zoom slider under the plot */
    private sliderRect;
    private sliderDrag;
    /** axis breaks (real x units, sorted) */
    private breaks;
    /** fisheye focus (mouse x in px) */
    private lensX;
    /** point being dragged (series key + index in its data) */
    private pointDrag;
    constructor(container: HTMLElement, options?: LineOptions);
    /** zoom: { start, end } in % of the data */
    private applyInitialZoom;
    /** Current series (as given, with appended points). */
    get series(): LineSeries[];
    /** Replace every series. Same series with the same length morph smoothly to the new values. */
    setSeries(series: LineSeries[]): void;
    /** Change options after creation (animated unless `animate` is false). */
    setOptions(patch: LineOptions, animate?: boolean): void;
    /** Change one series (color, data, area…). */
    updateSeries(id: string, patch: Partial<LineSeries>): void;
    addSeries(s: LineSeries): void;
    removeSeries(id: string): void;
    /**
     * Realtime: add a point to a series (or replace the last one when x is equal).
     * With `maxPoints` the oldest points are dropped (sliding window).
     */
    appendPoint(id: string, point: LinePoint | number): void;
    /** Show/hide a series (like clicking the legend). */
    toggle(id: string, hidden?: boolean): void;
    /** Emphasise one series (others are dimmed). null to clear. */
    highlight(id: string | null): void;
    /** Zoom the x axis to [from, to] (same unit as the data). */
    setZoom(from: LineX, to: LineX): void;
    resetZoom(): void;
    /**
     * Show the crosshair (and tooltip) at x, as if the mouse were there. null hides it.
     * Used to link charts: chartA.on('hover', (c) => chartB.showHover(c?.x ?? null)).
     */
    showHover(x: LineX | null, tooltip?: boolean): void;
    on(event: 'hover', handler: (ctx: LineTooltipContext | null) => void): () => void;
    on(event: 'click', handler: (ctx: LineTooltipContext) => void): () => void;
    on(event: 'toggle', handler: (e: {
        id: string;
        hidden: boolean;
    }) => void): () => void;
    on(event: 'zoom', handler: (range: {
        from: number;
        to: number;
    } | null) => void): () => void;
    on(event: 'plotclick', handler: (e: {
        x: number;
        y: number;
        px: number;
        py: number;
    }) => void): () => void;
    on(event: 'change', handler: (e: {
        series: LineSeries;
        index: number;
        x: number;
        y: number;
    }) => void): () => void;
    screenshot(): string;
    destroy(): void;
    private keyOf;
    private emit;
    private applyLook;
    /** x value of the user's unit → internal numeric x */
    private xValue;
    private normalize;
    private stack;
    private domain;
    private rebuild;
    private duration;
    private tick;
    private resize;
    private get xView();
    private axisOpts;
    private fmtY;
    private layout;
    /** width needed on the right for end labels */
    private endLabelRoom;
    private endLabelText;
    /** last non-null point of a series (inside the view) */
    private lastPoint;
    private xToPx;
    private pxToX;
    /** x without the time hidden by axis breaks */
    private xc;
    /** inverse of xc */
    private xu;
    private insideBreak;
    private lensCfg;
    /** fisheye: widens the x axis around the mouse (continuous and monotone, so nothing crosses) */
    private lens;
    private unlens;
    /** px → y value (inverse of yToPx, log and inverse aware) */
    private pyToY;
    /** log base of an axis, or 0 when linear */
    private logBase;
    /** Convert a position in px (relative to the chart) to data values. */
    toData(px: number, py: number, axis?: 'left' | 'right'): {
        x: number;
        y: number;
    };
    /** Convert data values to a position in px (relative to the chart). */
    toPixel(x: LineX, y: number, axis?: 'left' | 'right'): {
        x: number;
        y: number;
    };
    /** animated y domain of an axis */
    private dom;
    private yToPx;
    /** pixel span of an x range (sorted) */
    private xSpan;
    /** drawn value of point i of a series (morph-aware) */
    private yAt;
    private xTicks;
    /** label for a hovered x */
    private xLabel;
    private draw;
    /** user drawing hook (`graphic`) */
    private drawGraphic;
    private get polarCfg();
    private polarGeom;
    /** (angle value, radius value) → px */
    private polarPt;
    private drawPolar;
    /** nearest point on screen (polar) */
    private polarHit;
    private drawGrid;
    private drawBands;
    /** visible index range of a series (one extra point each side for continuity) */
    /** index of the point closest to x (binary search, or a scan when the series keeps its data order) */
    private nearest;
    private range;
    /** split a series into drawable runs of screen points (breaks at nulls unless spanGaps) */
    private runs;
    private trace;
    private drawLine;
    /** color of a value (valuePieces), for tooltips and hover dots */
    private colorAt;
    /** shaded band between `band.lower` and `band.upper` */
    private drawBand;
    /** stroke gradient of `lineGradient` (by value: bottom → top, by x: left → right) */
    private lineGradient;
    private drawArea;
    private marker;
    private drawPoints;
    private fmtValue;
    private drawDataLabels;
    /** pins on max / min and a dashed average line */
    private drawMarks;
    /** names after the last point; labels that would overlap are pushed apart vertically */
    private drawEndLabels;
    private drawReferenceLines;
    private drawAxes;
    private verticalTitle;
    private drawHover;
    /** window position of the slider, in px */
    private sliderWindow;
    /** navigator: mini line of the first series, the visible window and two handles */
    private drawSlider;
    private inSlider;
    private sliderMove;
    private hitTest;
    /** shared hover: closest x among all series, then every series at that x */
    private sharedAt;
    private tooltipContext;
    /** second x label (x2Axis) for the tooltip head */
    private x2Label;
    private showTooltip;
    private bind;
    /** hover at a position (mouse or finger) */
    private pointerHover;
    /** zoom the view by k around a px position (pinch) */
    private zoomAround;
    /** draggable point under the mouse */
    private draggableAt;
    /** move the dragged point to the mouse and tell the app */
    private movePoint;
    private renderLegend;
}
export declare function createLineChart(container: HTMLElement, options?: LineOptions): LineChart;
