import type { BarDatum, BarOptions, BarOverlay, BarSeries, BarTheme, BarTooltipContext } from './types';
export declare const BAR_COLORS: string[];
/** Default colors of the lines over the bars (picked to stand out from the bar palette). */
export declare const OVERLAY_COLORS: string[];
export declare const barDarkTheme: BarTheme;
export declare const barLightTheme: BarTheme;
/**
 * Bar / column chart: grouped, stacked or 100% stacked series, negative values,
 * vertical or horizontal, polar, labels, shared tooltip, interactive legend, reference lines,
 * overlay lines, several value axes, axis breaks, zoom, brush, sorting races and animations.
 */
export declare class BarChart {
    readonly root: HTMLElement;
    readonly canvas: HTMLCanvasElement;
    private ctx;
    private plotEl;
    private legendEl;
    private tooltipEl;
    private opts;
    private theme;
    private categories;
    private seriesList;
    /** numeric values and styled items per series / category */
    private vals;
    private items;
    private hidden;
    private order;
    /** categories shown, in display order (sorted, limited) */
    private shown;
    private posOf;
    private prevPos;
    private stacks;
    private prev;
    private prevKeys;
    private scales;
    private prevScales;
    private used;
    private lines;
    private prevLines;
    /** value breaks of the left axis and the size each one keeps (value units) */
    private vbreaks;
    private breakGap;
    /** Mekko: cumulative widths (0–1) of the shown categories */
    private mekko;
    private plot;
    private width;
    private height;
    private dpr;
    private hoverCat;
    private hoverBar;
    private highlighted;
    private drawn;
    private progress;
    private elapsed;
    private animKind;
    private animStart;
    private raf;
    /** category zoom, in display positions [from, to) */
    private view;
    private drag;
    private sliderRect;
    private sliderDrag;
    private brushRect;
    private selected;
    private handlers;
    private ro;
    constructor(container: HTMLElement, options?: BarOptions);
    get series(): BarSeries[];
    /** Overlay lines with their computed values (one per category), e.g. to show the latest average elsewhere. */
    get overlayValues(): {
        id: string;
        name: string;
        color: string;
        values: (number | null)[];
    }[];
    /** Replace the lines drawn over the bars. */
    setOverlays(overlays: BarOverlay[], animate?: boolean): void;
    /** Replace categories and series (animated morph when the shape is the same). */
    setData(categories: string[], series: BarSeries[]): void;
    /** Change options after creation (animated unless `animate` is false). */
    setOptions(patch: BarOptions, animate?: boolean): void;
    /** Change one series (values, color…). */
    updateSeries(id: string, patch: Partial<BarSeries>): void;
    /** Set one value (e.g. realtime). */
    setValue(id: string, categoryIndex: number, value: number | null): void;
    toggle(id: string, hidden?: boolean): void;
    highlight(id: string | null): void;
    /** Zoom on the categories from `from` to `to` (indexes or names, both included). */
    setZoom(from: number | string, to: number | string): void;
    resetZoom(): void;
    /** Select bars (like the brush): list of { seriesIndex, categoryIndex }, or null to clear. */
    select(items: {
        seriesIndex: number;
        categoryIndex: number;
    }[] | null): void;
    on(event: 'hover', handler: (ctx: BarTooltipContext | null) => void): () => void;
    on(event: 'click', handler: (d: BarDatum) => void): () => void;
    on(event: 'toggle', handler: (e: {
        id: string;
        hidden: boolean;
    }) => void): () => void;
    on(event: 'zoom', handler: (range: {
        from: number;
        to: number;
    } | null) => void): () => void;
    on(event: 'brush', handler: (items: BarDatum[]) => void): () => void;
    screenshot(): string;
    destroy(): void;
    private keyOf;
    private emit;
    private get vertical();
    private axisOf;
    private axisOpts;
    private colorOf;
    private applyLook;
    private rebuild;
    private applyInitialZoom;
    private overlayKey;
    /** Values of the source series per category (null when hidden or missing). */
    private sourceValues;
    private computeLines;
    /** values of a line as currently drawn (mid-animation aware) */
    private lineNow;
    private fmtAxis;
    private fmtLine;
    /** segments as currently drawn (mid-animation aware) */
    private currentSegments;
    private get stagger();
    /** progress of one category (with the stagger delay of its position) */
    private catProgress;
    private animated;
    /** animated display position of a category (bars slide when the order changes) */
    private aPos;
    private duration;
    private tick;
    private resize;
    private fmtCategory;
    /** value range of an axis from the bars, overlays and reference lines on it */
    private domainOf;
    private layout;
    /** animated value range of an axis */
    private rangeOf;
    /** value with the left-axis breaks squeezed to a small gap */
    private vc;
    /** value → pixel along the value axis */
    private vPx;
    /** zoom window in display positions */
    private get viewRange();
    /** display position → band start & size along the category axis */
    private band;
    private draw;
    /** categories to draw, with their animated positions (only the ones in the zoom window) */
    private visibleCats;
    private barThickness;
    /** full-length tracks behind the bars (series `background`) */
    private drawBackgrounds;
    private drawBars;
    private drawGrid;
    /** zigzag cut across the plot where the value axis has a break */
    private drawBreaks;
    private fmtLabel;
    /** value shown in a label: counts up while the bars animate */
    private labelValue;
    private drawLabels;
    /** pins on the highest / lowest bar of a series and a line at its average */
    private drawMarks;
    /** Overlay lines (averages, trends…) with a dot on the hovered category. */
    private drawLines;
    private strokePath;
    private drawAnnotations;
    /** user drawing hook (`graphic`) */
    private drawGraphic;
    private drawAxes;
    private drawBrush;
    private sliderWindow;
    /** navigator: mini bars of the first series, the visible window and two handles */
    private drawSlider;
    private inSlider;
    private sliderMove;
    private clearHover;
    private get polarCfg();
    private polarGeom;
    /** value → fraction 0–1 of the value scale (left axis) */
    private vFrac;
    private sectorPath;
    private drawPolar;
    /** polar hit test: category under the mouse and the bar (sector) */
    private polarHit;
    private categoryAt;
    private context;
    private showTooltip;
    private overlayRows;
    private pointerHover;
    private bind;
    private renderLegend;
}
export declare function createBarChart(container: HTMLElement, options?: BarOptions): BarChart;
