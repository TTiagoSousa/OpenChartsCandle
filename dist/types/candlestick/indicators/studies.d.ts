import type { Bar } from '../core/types';
import type { PaneView } from '../core/view';
import { Indicator, type AxisLabel, type LegendValue, type ParamDef, type Params } from './base';
type Src = (i: number) => number;
/** How a plot is drawn: a line (broken where there is no value), columns from 0, crosses, or not drawn (only for fills). */
export type PlotKind = 'line' | 'columns' | 'cross' | 'none';
export interface PlotDef {
    key: string;
    label: string;
    kind?: PlotKind;
    color: string;
    width?: number;
    /** Hidden by default (shown with the checkbox of the "Estilo" tab). */
    hidden?: boolean;
    /** More colours picked per bar by the plot's state (0 = `color`, 1 = the first of these…), e.g. the MACD histogram. */
    colors?: {
        label: string;
        color: string;
    }[];
    /** Label of the first colour when there are `colors` (default 'Cor'). */
    colorLabel?: string;
    /** Bars the plot is moved to the right (negative: to the left), e.g. the Ichimoku cloud. */
    offset?: (p: Params) => number;
}
export interface LevelDef {
    key: string;
    label: string;
    value: number;
    color: string;
    hidden?: boolean;
}
export interface FillDef {
    key: string;
    label: string;
    /** Two plots or two levels. */
    a: string;
    b: string;
    color: string;
    /** When `a` is below `b` (e.g. the red part of the Ichimoku cloud). */
    colorDown?: string;
    hidden?: boolean;
}
export interface StudyContext {
    bars: Bar[];
    n: number;
    /** First bar to compute (the ones before keep their values). */
    from: number;
    p: Params;
    /** The plot's values. */
    out: (key: string) => number[];
    /** The plot's state (which of its colours) per bar. */
    state: (key: string) => number[];
    /** A working series kept between calls (e.g. an ATR or an EMA used by the plots). */
    tmp: (name: string) => number[];
    /** A source of the bars ('close', 'hl2', 'hlc3'…). */
    src: (key: string) => Src;
    /** Seconds of the bars computed (the own timeframe, else the chart's; 0: not known). */
    tf: number;
}
export interface StudyDef {
    type: string;
    name: string;
    short: string;
    description: string;
    overlay: boolean;
    inputs: ParamDef[];
    defaults: Params;
    plots: PlotDef[];
    levels?: LevelDef[];
    fills?: FillDef[];
    /** 'price' (the symbol's precision), 'volume' (1.2M) or a number of decimals. */
    format?: 'price' | 'volume' | number;
    /** No "Tempo gráfico" input (e.g. the VWAP, anchored to its own periods). */
    noTimeframe?: boolean;
    warmup: (p: Params) => number;
    compute: (c: StudyContext) => void;
    /** Title in the legend (default: the short name and the inputs). */
    title?: (p: Params) => string;
}
export declare const STUDY_SOURCES: string[];
export declare const src: (label?: string) => ParamDef;
export declare const num: (key: string, label: string, min?: number, max?: number, step?: number, section?: string) => ParamDef;
export declare const MA_TYPES: string[];
export declare const MA_LABELS: Record<string, string>;
export type { Src };
export declare const maSelect: (key: string, label: string, options?: string[]) => ParamDef;
export declare const len: (p: Params, k: string) => number;
export declare function highest(s: Src, i: number, n: number): number;
export declare function lowest(s: Src, i: number, n: number): number;
export declare function sum(s: Src, i: number, n: number): number;
/** Pine's `ta.tr(handleNa)`: the first bar is high − low with `handleNa`, else no value. */
export declare function trueRange(bars: Bar[], i: number, handleNa?: boolean): number;
export declare function ma(c: StudyContext, out: number[], s: Src, length: number, type: string): void;
/** `out[i] = f(i)` from `from`. */
export declare function each(c: StudyContext, out: number[], f: (i: number) => number): void;
export declare const at: (a: number[]) => Src;
export declare const nz: (x: number) => number;
/** Warm-up of a moving average: the recursive ones never forget (10 × length makes the start negligible). */
export declare const maWarm: (type: string, n: number) => number;
export declare const GREY_HALF = "rgba(120,123,134,0.5)";
export declare const GREY = "#787b86";
export declare class Study extends Indicator {
    readonly def: StudyDef;
    readonly type: string;
    readonly name: string;
    readonly short: string;
    readonly overlay: boolean;
    readonly schema: ParamDef[];
    private series;
    private states;
    private work;
    /** Index of each plot / state in `rawLines` (and so in `lines`). */
    private index;
    constructor(def: StudyDef, params?: Params);
    title(): string;
    warmup(): number;
    compute(bars: Bar[], from: number): void;
    /** A plot's values per chart bar, moved by its offset. */
    private plotted;
    private stateAt;
    private plotColor;
    private plotShown;
    /** The values of a plot or a level, for a fill. */
    private side;
    draw(v: PaneView): void;
    private drawColumns;
    private drawCrosses;
    /** The area between two plots (bar by bar, so the colour can follow which one is above) or two levels. */
    private drawFill;
    range(from: number, to: number): [number, number] | null;
    formatValue(val: number, v: PaneView): string;
    legend(i: number, v: PaneView): LegendValue[];
    axisLabels(): AxisLabel[];
}
export declare const BLUE = "#2962ff";
export declare const ORANGE = "#ff6d00";
export declare const PURPLE = "#7e57c2";
export declare const BAND_BG = "rgba(33,150,243,0.1)";
export declare const oscLevels: (upper: number, middle: number, lower: number) => LevelDef[];
export declare const oscFill: (color?: string) => FillDef[];
export declare const zeroLevel: (label?: string) => LevelDef[];
/** A moving average of a source, moved by `offset` (WMA, VWMA, HMA). */
export declare function averageStudy(type: string, name: string, short: string, description: string, length: number, compute: (c: StudyContext, n: number) => void, warm: (n: number) => number): StudyDef;
export declare const STUDY_DEFS: StudyDef[];
/** The quarter, month… a bar's time (s, UTC) is in, for the VWAP's anchor. */
export declare function anchorPeriod(t: number, anchor: string): number;
/** The entry of the indicator list for a study. */
export declare const studyEntry: (def: StudyDef) => {
    type: string;
    name: string;
    description: string;
    create: (p?: Params) => Study;
};
