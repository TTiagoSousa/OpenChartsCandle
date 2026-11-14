import type { CalendarCell, CalendarDate, CalendarOptions, CalendarTheme } from './types';
export declare const calendarDarkTheme: CalendarTheme;
export declare const calendarLightTheme: CalendarTheme;
/** Default colors of the visualMap (low → high). */
export declare const CALENDAR_COLORS: string[];
/**
 * Calendar chart: one or more years, months or day ranges as a grid of days (a column per week like
 * GitHub, or a row per week like a wall calendar), with a value per day as a heatmap or circles,
 * a visualMap legend, month outlines, labels, your own drawing per cell and a tooltip.
 */
export declare class CalendarChart {
    readonly root: HTMLElement;
    readonly canvas: HTMLCanvasElement;
    private ctx;
    private titleEl;
    private bodyEl;
    private plotEl;
    private vmEl;
    private tooltipEl;
    private opts;
    private theme;
    private data;
    private grids;
    private list;
    private byKey;
    private vmin;
    private vmax;
    private off;
    private top;
    private hover;
    private width;
    private height;
    private dpr;
    private animStart;
    private raf;
    private handlers;
    private ro;
    private destroyed;
    constructor(container: HTMLElement, options?: CalendarOptions);
    /** Every cell shown, in date order. */
    get cells(): CalendarCell[];
    /** Replace the day data. */
    setData(data: CalendarOptions['data'], animate?: boolean): void;
    /** Change options after creation. */
    setOptions(patch: CalendarOptions, animate?: boolean): void;
    /** The cell of a day (box in px relative to the chart), or null when it is not shown. */
    cellAt(date: CalendarDate): CalendarCell | null;
    /** Color of a value on the visualMap. */
    colorOf(v: number): string;
    on(event: 'click', handler: (cell: CalendarCell) => void): () => void;
    on(event: 'hover', handler: (cell: CalendarCell | null) => void): () => void;
    resize(): void;
    screenshot(): string;
    destroy(): void;
    private setDataInternal;
    private emit;
    private applyLook;
    private vm;
    private hasVisual;
    private pieceOf;
    private cellColor;
    private rebuild;
    private duration;
    private progress;
    private loop;
    private measure;
    private labels;
    /** Place every calendar and its cells in px. */
    private layout;
    private origins;
    /** Fill color of a cell: datum.color, the visualMap, or the empty color. */
    private fill;
    /** Circle color ('scatter'): the day's own, the visualMap's, or `color`. */
    private symbolColor;
    /** A value hidden by the legend (a piece switched off). */
    private filtered;
    private renderVisual;
    private api;
    private font;
    private draw;
    private rect;
    private ripple;
    private drawLabels;
    /** Readable text over the cell color. */
    private labelColor;
    /** Line around each month. */
    private drawSplit;
    private seg;
    /** Weekday, month and year names. */
    private drawAxisLabels;
    private bind;
    private showTooltip;
}
export declare function createCalendarChart(container: HTMLElement, options?: CalendarOptions): CalendarChart;
