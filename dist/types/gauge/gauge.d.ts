import type { GaugeOptions, GaugeTheme, GaugeZone } from './types';
export declare const gaugeDarkTheme: GaugeTheme;
export declare const gaugeLightTheme: GaugeTheme;
/** Ready-made zones: green → yellow → red over [min, max] (e.g. RPM, risk). */
export declare function trafficZones(min: number, max: number, split?: [number, number]): GaugeZone[];
/**
 * Gauge / speedometer: needle and/or progress arc, colored zones or gradient track,
 * major and minor ticks, markers, value with unit and title, tooltip and spring animation.
 */
export declare class GaugeChart {
    readonly root: HTMLElement;
    readonly canvas: HTMLCanvasElement;
    private ctx;
    private tooltipEl;
    private opts;
    private theme;
    private target;
    private shown;
    private from;
    private animStart;
    private raf;
    private width;
    private height;
    private dpr;
    private cx;
    private cy;
    private radius;
    private arc;
    private lastZone;
    /** animated values of `pointers` / `rings` */
    private extraShown;
    private extraFrom;
    private hovered;
    private handlers;
    private ro;
    constructor(container: HTMLElement, options?: GaugeOptions);
    get value(): number;
    /** Move the needle (animated unless `animate` is false). Values outside min/max are clamped on the dial. */
    setValue(value: number, animate?: boolean): void;
    /** Change options after creation (needles, pointers and rings animate to new values). */
    setOptions(patch: GaugeOptions, animate?: boolean): void;
    on(event: 'change', handler: (value: number) => void): () => void;
    on(event: 'zone', handler: (zone: GaugeZone | null) => void): () => void;
    screenshot(): string;
    destroy(): void;
    private get min();
    private get max();
    private clampValue;
    private emit;
    private fmt;
    private updateAria;
    private applyLook;
    private duration;
    private ease;
    private extraTargets;
    /** animate the main value and every pointer / ring together */
    private animateTo;
    private resize;
    private get full();
    private layout;
    /** semi-like dial (nothing under the center) with a needle: the value goes below the hub */
    private get textBelowHub();
    private get thickness();
    private draw;
    /** several needles, then one hub on top */
    private drawPointers;
    private drawHub;
    /** zone names written on the dial, in the middle of each zone */
    private drawZoneLabels;
    /** a second scale inside the main one, on the same angles */
    private drawSecondaryScale;
    /** radii of the secondary scale: its arc (base) and its labels */
    private secondaryGeom;
    /** concentric progress rings, outer first, with the list of values in the center */
    private drawRings;
    private strokeArc;
    /** Arc with a round cap only on the requested ends (zones in the middle stay square). */
    private strokeArcCapped;
    private gradientFill;
    private drawTicks;
    private tickLine;
    private drawMarkers;
    private needleOpts;
    private drawNeedle;
    private drawText;
    /** labels and values of the pointers in a row under the hub */
    private drawPointerValues;
    private hitTest;
    private bind;
    private showTooltip;
}
export declare function createGauge(container: HTMLElement, options?: GaugeOptions): GaugeChart;
