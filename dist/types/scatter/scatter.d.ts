import type { ScatterDatum, ScatterOptions, ScatterPointInfo, ScatterSeries, ScatterTheme } from './types';
export declare const scatterDarkTheme: ScatterTheme;
export declare const scatterLightTheme: ScatterTheme;
export declare const SCATTER_COLORS: string[];
/** Default colors of a continuous visualMap (low → high). */
export declare const VISUAL_COLORS: string[];
/**
 * Scatter and bubble charts: value, log or category axes (or polar), symbols that morph, color /
 * size by value (visualMap with filters), jitter, regressions, marks, ripples, large datasets,
 * zoom & pan, brush selection, tooltip, legend and animated updates.
 */
export declare class ScatterChart {
    readonly root: HTMLElement;
    readonly canvas: HTMLCanvasElement;
    private ctx;
    private bodyEl;
    private plotEl;
    private legendEl;
    private tooltipEl;
    private titleEl;
    private opts;
    private theme;
    private list;
    private hiddenKeys;
    private models;
    /** points of the visible series */
    private items;
    /** removed points shrinking away */
    private ghosts;
    private ax;
    private ay;
    private viewX;
    private viewY;
    private plot;
    private width;
    private height;
    private dpr;
    private vms;
    private hover;
    private highlighted;
    private selection;
    private brushRect;
    private labelsCache;
    private grid;
    private animStart;
    private animEnd;
    private raf;
    private handlers;
    private ro;
    private colorCache;
    private drag;
    private destroyed;
    constructor(container: HTMLElement, options?: ScatterOptions);
    get series(): ScatterSeries[];
    /** Replace every series; points with the same key (id, name or index) move to their new place. */
    setSeries(series: ScatterSeries[], animate?: boolean): void;
    /** Change options after creation (animated unless `animate` is false). */
    setOptions(patch: ScatterOptions, animate?: boolean): void;
    /** Add points to a series without animation (streams, progressive loading). */
    appendData(id: string, data: ScatterDatum[]): void;
    /** Show / hide a series. */
    toggle(id: string, hidden?: boolean): void;
    /** Bring one series forward and fade the others (null clears). */
    highlight(id: string | null): void;
    /** Keep only the points that pass the filter in full color (null clears the selection). */
    select(filter: ((p: ScatterPointInfo) => boolean) | null): void;
    /** Range [low, high] of a continuous visualMap (index in `visualMap`). */
    setVisualRange(index: number, range: [number, number]): void;
    /** Visible range of the value axes (data units); omit an axis to keep it. */
    setZoom(z: {
        x?: [number, number];
        y?: [number, number];
    }): void;
    resetZoom(): void;
    /** Data → px (relative to the plot element). */
    toPixel(x: number | string, y: number | string): {
        x: number;
        y: number;
    };
    /** px → data. */
    toData(px: number, py: number): {
        x: number;
        y: number;
    };
    on(event: 'hover', handler: (p: ScatterPointInfo | null) => void): () => void;
    on(event: 'click', handler: (p: ScatterPointInfo) => void): () => void;
    on(event: 'toggle', handler: (e: {
        id: string;
        hidden: boolean;
    }) => void): () => void;
    on(event: 'brush', handler: (points: ScatterPointInfo[]) => void): () => void;
    on(event: 'zoom', handler: (e: {
        x: [number, number];
        y: [number, number];
    }) => void): () => void;
    screenshot(): string;
    destroy(): void;
    private keyOf;
    private emit;
    private rgbaOf;
    private applyLook;
    /** Category list of an axis: given, or in order of appearance. */
    private categories;
    private axisType;
    /** value of the user → number on the axis (category index, or the value) */
    private num;
    /** axis transform (log) */
    private T;
    private U;
    private normalize;
    private visualMaps;
    private applyVisual;
    private dimValue;
    private pieceOf;
    private applyRanges;
    private renderVisual;
    private bindVisual;
    /** room taken by the visualMap controls on each side */
    private visualRoom;
    private placeVisual;
    private duration;
    private rebuild;
    private progress;
    private current;
    private hasEffects;
    private loop;
    private measure;
    private resize;
    private get polarCfg();
    private domX;
    private domY;
    /** Domain and ticks of an axis from the visible points. */
    private scale;
    private ticksOf;
    private fmtTick;
    private font;
    private layout;
    /** x, y (axis numbers) → px */
    private pt;
    private polarGeom;
    /** px size of one category band on an axis */
    private band;
    private layoutItems;
    /** spread the points of each category (beeswarm or random) */
    private jitter;
    private fmtVal;
    private labelText;
    private layoutLabels;
    private api;
    private draw;
    private animating;
    private seriesAlpha;
    /** opacity multiplier of a point: highlight, selection, visualMap range */
    private alphaOf;
    private hidden;
    private drawItems;
    private drawRipple;
    /** many points: batched by color, squares when tiny */
    private drawLarge;
    private drawGhosts;
    private visiblePts;
    private drawHull;
    private drawLine;
    private drawRegression;
    private drawMarkArea;
    private drawMarks;
    private drawLabels;
    private gridDash;
    private drawGrid;
    private xTicks;
    private yTicks;
    private drawAxes;
    private drawPolarGrid;
    private drawHover;
    private info;
    private buildGrid;
    private hitTest;
    private dimName;
    private showTooltip;
    private hideTooltip;
    private zoomable;
    private afterZoom;
    private bind;
    private renderLegend;
}
export declare function createScatterChart(container: HTMLElement, options?: ScatterOptions): ScatterChart;
