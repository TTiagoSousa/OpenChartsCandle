import type { RadarHoverInfo, RadarOptions, RadarSeries, RadarTheme } from './types';
export declare const radarDarkTheme: RadarTheme;
export declare const radarLightTheme: RadarTheme;
export declare const RADAR_COLORS: string[];
/**
 * Radar chart: values of several indicators on axes around a center, one polygon per series (or many per
 * series), with polygon or circle rings, bands, several radars in one chart, legend, tooltip and animations.
 */
export declare class RadarChart {
    readonly root: HTMLElement;
    readonly canvas: HTMLCanvasElement;
    private ctx;
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
    private models;
    private coords;
    private hover;
    private width;
    private height;
    private dpr;
    private animStart;
    private raf;
    private handlers;
    private ro;
    private destroyed;
    constructor(container: HTMLElement, options?: RadarOptions);
    get series(): RadarSeries[];
    /** Replace every series; polygons with the same series key and position move to their new values. */
    setSeries(series: RadarSeries[], animate?: boolean): void;
    /** Change options after creation. */
    setOptions(patch: RadarOptions, animate?: boolean): void;
    /** Show / hide a series. */
    toggle(id: string, hidden?: boolean): void;
    on(event: 'hover', handler: (info: RadarHoverInfo | null) => void): () => void;
    on(event: 'click', handler: (info: RadarHoverInfo) => void): () => void;
    on(event: 'toggle', handler: (e: {
        id: string;
        hidden: boolean;
    }) => void): () => void;
    resize(): void;
    screenshot(): string;
    destroy(): void;
    private keyOf;
    private emit;
    private applyLook;
    /** The radars: `radars`, or the top-level radar options. */
    private radarList;
    private items;
    private rebuild;
    private duration;
    private progress;
    private loop;
    private legendCfg;
    private renderLegend;
    private renderVisual;
    private measure;
    private layout;
    private font;
    private ring;
    private drawGrid;
    private drawNames;
    private draw;
    private drawItem;
    private symbol;
    private fmt;
    private info;
    /** Polygon under the mouse: a vertex near it, or the smallest polygon around it. */
    private hitTest;
    private bind;
    private showTooltip;
}
export declare function createRadarChart(container: HTMLElement, options?: RadarOptions): RadarChart;
