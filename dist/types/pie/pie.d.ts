import type { PieDatum, PieEvent, PieOptions, PiePattern, PieSlice, PieTheme } from './types';
export declare const pieDarkTheme: PieTheme;
export declare const pieLightTheme: PieTheme;
/** Textures used in order with `patterns: true`. */
export declare const PIE_PATTERNS: PiePattern[];
/**
 * Pie / donut / half-donut / rose chart with nested rings, tooltip, interactive legend,
 * inside/outside labels (rich text, three alignments), center text, textures,
 * hover & selection and animations.
 */
export declare class PieChart {
    readonly root: HTMLElement;
    readonly canvas: HTMLCanvasElement;
    private ctx;
    private plot;
    private legendEl;
    private tooltipEl;
    private titleEl;
    private opts;
    private o;
    private layers;
    private hidden;
    /** selected slices by key (ring|id) */
    private selected;
    private hoverKey;
    /** current (animated) geometry per slice key */
    private geom;
    private from;
    private target;
    private delays;
    private offsets;
    private patternCache;
    private animStart;
    private raf;
    private lastFrame;
    private width;
    private height;
    private dpr;
    private titleH;
    private layoutCache;
    private handlers;
    private ro;
    private firstData;
    constructor(container: HTMLElement, options?: PieOptions);
    /** Replace the data (animated). */
    setData(data: PieDatum[]): void;
    /**
     * Change options after creation. Shape changes are animated unless `animate` is false
     * (use false for continuous input such as sliders).
     */
    setOptions(patch: PieOptions, animate?: boolean): void;
    /** Slices of the main data as currently shown (after sorting/grouping), in drawing order. */
    get slices(): PieSlice[];
    /** Sum of the visible slices of the main data. */
    get total(): number;
    /** Show/hide a slice in every ring (like clicking the legend). */
    toggle(id: string, hidden?: boolean): void;
    /** Select a slice of the main data (moves it out), or null to clear. */
    select(id: string | null): void;
    /** Highlight a slice as if hovered (null to clear). */
    highlight(id: string | null): void;
    on(event: PieEvent, handler: (s: PieSlice | null) => void): () => void;
    /** PNG data URL of the chart (without legend). */
    screenshot(): string;
    destroy(): void;
    private findSlice;
    private sliceByKey;
    private layerTotal;
    private emit;
    private selectKey;
    private applyDomOptions;
    private buildLayers;
    private recompute;
    private kick;
    private frame;
    private resize;
    private labelText;
    /** Text of a label as lines of runs (plain text, '\n' lines or rich). */
    private labelRuns;
    private measureRich;
    /** Draw a measured block; `x` is the left, right or middle edge depending on `align`, `y` the vertical middle. */
    private drawRich;
    /** Widest outside label (for the room left around the pie). */
    private outsideWidth;
    private geometry;
    /**
     * Path of one slice with angular padding and (exact) rounded corners.
     * The shape is a single closed path, so it can be filled once (correct with
     * semi-transparent colors) and stroked/cut for borders.
     */
    private slicePath;
    /** Texture tile for a slice color (light lines on dark colors and vice versa). */
    private pattern;
    private draw;
    private drawLabels;
    private drawCenter;
    /** Key (ring|id) of the slice under the point. */
    private sliceAt;
    /** hovering from the legend (same name lit in every ring) */
    private legendHover;
    private setHover;
    private showTooltip;
    private bind;
    private renderLegend;
}
export declare function createPieChart(container: HTMLElement, options?: PieOptions): PieChart;
