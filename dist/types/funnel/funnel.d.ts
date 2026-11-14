import type { FunnelHoverInfo, FunnelItem, FunnelOptions, FunnelSpec, FunnelTheme } from './types';
export declare const funnelDarkTheme: FunnelTheme;
export declare const funnelLightTheme: FunnelTheme;
export declare const FUNNEL_COLORS: string[];
/**
 * Funnel chart: stages from the biggest to the smallest (or a pyramid), with gaps, outside or inside labels
 * with lines, several funnels in one chart (side by side or one over the other), legend that hides stages,
 * tooltip with the conversion from the first and the previous stage, and animations.
 */
export declare class FunnelChart {
    readonly root: HTMLElement;
    readonly canvas: HTMLCanvasElement;
    private ctx;
    private titleEl;
    private bodyEl;
    private plotEl;
    private legendEl;
    private tooltipEl;
    private opts;
    private theme;
    private funnels;
    private names;
    private hidden;
    private hover;
    private width;
    private height;
    private dpr;
    private animStart;
    private raf;
    private handlers;
    private ro;
    private destroyed;
    constructor(container: HTMLElement, options?: FunnelOptions);
    /** Replace the stages (one funnel) or the funnels; stages with the same name morph to their new size. */
    setData(data: FunnelItem[] | FunnelSpec[], animate?: boolean): void;
    /** Change options after creation. */
    setOptions(patch: FunnelOptions, animate?: boolean): void;
    /** Show / hide a stage (by name) in every funnel. */
    toggle(name: string, hidden?: boolean): void;
    on(event: 'hover', handler: (info: FunnelHoverInfo | null) => void): () => void;
    on(event: 'click', handler: (info: FunnelHoverInfo) => void): () => void;
    on(event: 'toggle', handler: (e: {
        name: string;
        hidden: boolean;
    }) => void): () => void;
    resize(): void;
    screenshot(): string;
    destroy(): void;
    private emit;
    private specList;
    private applyLook;
    private colorOf;
    private rebuild;
    private labelPosition;
    private labelOf;
    private labelText;
    private duration;
    private loop;
    private legendCfg;
    private renderLegend;
    private measure;
    private font;
    private lineLength;
    private layout;
    /** Offset across of a width, by the alignment. */
    private offset;
    private toXY;
    private draw;
    private styleOf;
    private drawStage;
    private drawLabel;
    private hitTest;
    private bind;
    private fmt;
    private showTooltip;
}
export declare function createFunnelChart(container: HTMLElement, options?: FunnelOptions): FunnelChart;
