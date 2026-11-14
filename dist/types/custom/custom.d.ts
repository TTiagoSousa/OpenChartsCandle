import type { CustomDragEvent, CustomEventParams, CustomOptions, CustomTheme } from './types';
export declare const customDarkTheme: CustomTheme;
export declare const customLightTheme: CustomTheme;
export declare const CUSTOM_COLORS: string[];
type Rect = {
    x: number;
    y: number;
    width: number;
    height: number;
};
/**
 * Custom series: every data item is drawn by a `renderItem(params, api)` function that returns shapes
 * (rect, circle, sector, polygon, path, text, group…) on a cartesian, polar or pixel coordinate system.
 * The chart draws them, hit-tests them (tooltip, hover, click, drag), and animates changes: elements with the
 * same id morph into each other (even a circle into a sector), new ones appear and removed ones fade.
 */
export declare class CustomChart {
    readonly root: HTMLElement;
    readonly canvas: HTMLCanvasElement;
    private ctx;
    private titleEl;
    private bodyEl;
    private plotEl;
    private legendEl;
    private tooltipEl;
    private resetEl;
    private opts;
    private theme;
    private width;
    private height;
    private dpr;
    private rect;
    private sx;
    private sy;
    private sa;
    private sr;
    private polarGeo;
    private view;
    private hidden;
    private nodes;
    private drawn;
    private drawnList;
    private leavingKeys;
    private trans;
    private hover;
    private t0;
    private raf;
    private handlers;
    private ro;
    private destroyed;
    private drag;
    private lastMouse;
    constructor(container: HTMLElement, options: CustomOptions);
    /** Change options (series, axes, look…). Elements with the same id morph to their new shape. */
    setOptions(patch: Partial<CustomOptions>, animate?: boolean): void;
    /** Replace the data of one series (default the first). */
    setData(data: unknown[], seriesIndex?: number, animate?: boolean): void;
    /** Run renderItem again (e.g. after outside state changed), with or without a transition. */
    refresh(animate?: boolean): void;
    /** Show / hide a series by name. */
    toggle(name: string, hidden?: boolean): void;
    /** Zoom an axis to [min, max] (data values). */
    zoomTo(axis: 'x' | 'y', min: unknown, max: unknown, animate?: boolean): void;
    resetZoom(animate?: boolean): void;
    /** Data → px ([x, y] in cartesian, [angle, radius] in polar). */
    convertToPixel(values: unknown[]): [number, number];
    /** px → data ([x, y] or [angle, radius]); categories come back as their names. */
    convertFromPixel(p: [number, number]): [unknown, unknown];
    /** The grid (cartesian) or plot rectangle, px. */
    getRect(): Rect;
    on(event: 'hover', handler: (p: CustomEventParams | null) => void): () => void;
    on(event: 'click', handler: (p: CustomEventParams) => void): () => void;
    on(event: 'toggle', handler: (e: {
        name: string;
        hidden: boolean;
    }) => void): () => void;
    on(event: 'zoom', handler: (e: {
        x: [number, number] | null;
        y: [number, number] | null;
    }) => void): () => void;
    on(event: 'dragstart' | 'drag' | 'dragend', handler: (e: CustomDragEvent) => void): () => void;
    resize(): void;
    screenshot(): string;
    destroy(): void;
    private emit;
    private emitZoom;
    private applyLook;
    private colorOf;
    private legendCfg;
    private renderLegend;
    private measure;
    private font;
    private textWidth;
    private visibleSeries;
    private valueOf;
    private dimsOf;
    private axisValues;
    private layout;
    private angleOf;
    private coord;
    private size;
    private coordInfo;
    private time;
    private progress;
    private polarHelpers;
    private makeApi;
    private render;
    private animCfg;
    private rebuild;
    private schedule;
    private frame;
    private draw;
    private readable;
    private emphasisStyle;
    private axisLabelInterval;
    private drawCartesianGrid;
    private drawCartesianAxes;
    private drawPolarGrid;
    private drawPolarLabels;
    private hitTest;
    private params;
    private local;
    private zoomAxes;
    private bind;
    private onDragMove;
    private setHover;
    private updateHover;
    private fmtValue;
    private tooltipHtml;
    private showTooltip;
}
export declare function createCustomChart(container: HTMLElement, options: CustomOptions): CustomChart;
export {};
