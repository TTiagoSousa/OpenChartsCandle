import { type Bar, type Timeframe } from '../core/types';
import type { PaneView } from '../core/view';
export type ParamType = 'number' | 'color' | 'bool' | 'select' | 'text' | 'session';
export interface ParamDef {
    key: string;
    label: string;
    type: ParamType;
    min?: number;
    max?: number;
    step?: number;
    options?: string[];
    /** Text shown for each option of a 'select' (default: the value). */
    optionLabels?: Record<string, string>;
    /** Heading shown above this field in the settings dialog (when it differs from the field before). */
    section?: string;
    /** The field is greyed out in the settings dialog when this is false (e.g. the band width without bands). */
    enabled?: (p: Params) => boolean;
    /** A boolean param shown as a checkbox before the label (show / hide this line), as in TradingView's style tab. */
    toggle?: string;
    /** A number param edited in the same row, after the colour (e.g. the level of a band); uses `min` / `max` / `step`. */
    numberKey?: string;
    /** A line style param ('solid' / 'dashed' / 'dotted') edited in the same row, after the colour. */
    dashKey?: string;
    /** Shown indented under the field before (a detail of it), as in TradingView's style tab. */
    indent?: boolean;
    /** For a 'text' field: the problem with a value, or null when it is right. */
    check?: (v: string) => string | null;
    /** Tab of the settings dialog: 'values' (Valores) or 'style' (Estilo). Default: 'style' in the "Estilo" section. */
    tab?: 'values' | 'style';
}
/** The units of the "Visibilidade" tab: the indicator shows on the timeframes of a unit from `min` to `max`. */
export declare const VISIBILITY_UNITS: readonly [{
    readonly key: 'seconds';
    readonly label: 'Segundos';
    readonly max: 59;
}, {
    readonly key: 'minutes';
    readonly label: 'Minutos';
    readonly max: 59;
}, {
    readonly key: 'hours';
    readonly label: 'Horas';
    readonly max: 24;
}, {
    readonly key: 'days';
    readonly label: 'Dias';
    readonly max: 366;
}, {
    readonly key: 'weeks';
    readonly label: 'Semanas';
    readonly max: 52;
}, {
    readonly key: 'months';
    readonly label: 'Meses';
    readonly max: 12;
}];
export type VisibilityUnit = (typeof VISIBILITY_UNITS)[number]['key'];
/** On which timeframes an indicator shows ("Visibilidade"): a unit left out shows on all of its timeframes. */
export type Visibility = Partial<Record<VisibilityUnit, {
    on: boolean;
    min: number;
    max: number;
}>>;
/** The unit and count of a timeframe: 900 s → minutes 15, 86400 → days 1, 604800 → weeks 1. */
export declare function timeframeUnit(seconds: number): {
    unit: VisibilityUnit;
    n: number;
};
export type Params = Record<string, number | string | boolean>;
export interface LegendValue {
    text: string;
    color: string;
}
export interface AxisLabel {
    price: number;
    color: string;
    text?: string;
}
/**
 * Simple moving average from index `from` onwards.
 * Full recompute uses a rolling sum; live ticks only recompute the last bars.
 */
export declare function smaInto(out: number[], src: (i: number) => number, n: number, len: number, from: number): void;
/**
 * Relative Strength Index with Wilder's smoothing (TradingView's `ta.rsi`): the first average gain/loss is
 * the SMA of the first `len` changes. `gain` / `loss` keep the smoothed averages so live ticks are cheap.
 */
export declare function rsiInto(out: number[], gain: number[], loss: number[], src: (i: number) => number, n: number, len: number, from: number): void;
export type MaType = 'sma' | 'ema' | 'rma' | 'wma' | 'vwma';
/**
 * Moving average of a series that may start with NaN (e.g. the RSI), from index `from` onwards, like Pine's
 * `ta.*`: the EMA starts at the first value, the RMA at the SMA of the first `len`, and SMA / WMA / VWMA need
 * `len` values in a row. `vol` is only read by the VWMA.
 */
export declare function maInto(out: number[], src: (i: number) => number, vol: (i: number) => number, n: number, len: number, type: MaType, from: number): void;
/** Population standard deviation of the last `len` values (Pine's `ta.stdev`), NaN while there are fewer. */
export declare function stdevAt(src: (i: number) => number, i: number, len: number): number;
/**
 * A line through the values. `points` (values of a larger timeframe): the line only goes through the bars where
 * it is true, the first bar of each new value, straight from one to the next, like the TradingView line.
 */
export declare function strokeSeries(v: PaneView, values: number[], color: string, width?: number, points?: ArrayLike<number> | null, past?: number): void;
export declare abstract class Indicator {
    id: string;
    visible: boolean;
    abstract readonly type: string;
    abstract readonly name: string;
    abstract readonly short: string;
    abstract readonly overlay: boolean;
    abstract readonly schema: ParamDef[];
    /** If true, contributes to main autoscale */
    readonly affectsScale: boolean;
    /** Set by the chart: call when the indicator's data changed outside of `compute`. */
    onDataChanged: (() => void) | null;
    params: Params;
    /** Values per bar given to `compute`: the chart's bars, or the bars of the indicator's own `timeframe`. */
    raw: number[];
    /**
     * Values per chart bar (what is drawn). The same array as `raw`, or, with an own `timeframe`, `raw` mapped
     * to the chart's bars without look-ahead (set by the chart).
     */
    values: number[];
    /** More lines computed with `raw` on the same bars (e.g. the RSI's moving average and bands). */
    rawLines: number[][];
    /** `rawLines` per chart bar, mapped like `values` (set by the chart). */
    lines: number[][];
    /** Set by the chart: its timeframe in seconds (the title shows the indicator's own when it differs). */
    chartTimeframe: number;
    /**
     * Set by the chart for a larger own timeframe: 1 on the chart bars where a new bar of that timeframe is first
     * used. The line joins those bars (no steps); `values` keeps the value on every bar for the legend.
     */
    points: Uint8Array | null;
    /** Id of the simulation indicator this is (`terminal.setSimulationIndicators`), or null: one of the user's. */
    origin: string | null;
    /** On which timeframes it shows (the "Visibilidade" tab); null: on all. */
    visibility: Visibility | null;
    /** Shown on the chart's timeframe: visible (the eye) and allowed by `visibility`. */
    get shown(): boolean;
    constructor(defaults: Params, params?: Params);
    /** Compute `raw` from bar `from` onwards (0 = everything). */
    abstract compute(bars: Bar[], from: number): void;
    /** Bars needed before the first one shown for the values to be ready (the chart loads them). */
    warmup(): number;
    /** The indicator's own timeframe (`params.timeframe`), or null: it follows the chart. */
    timeframe(): Timeframe | null;
    /** ' · 4h' when the indicator uses another timeframe than the chart. */
    protected timeframeSuffix(): string;
    abstract draw(v: PaneView): void;
    abstract legend(i: number, v: PaneView): LegendValue[];
    range(_from: number, _to: number): [number, number] | null;
    axisLabels(): AxisLabel[];
    title(): string;
    formatValue(val: number, v: PaneView): string;
    toJSON(): {
        type: string;
        params: Params;
        visible: boolean;
        visibility?: Visibility;
    };
}
/** Whether `visibility` lets an indicator show on a timeframe of `seconds` (0: not known yet, shows). */
export declare function visibleOn(visibility: Visibility | null, seconds: number): boolean;
/**
 * The values moved `offset` bars to the right (left when negative), like TradingView's "Deslocamento": a
 * positive offset draws past the last bar. Returns the same arrays when the offset is 0.
 */
export declare function shiftSeries(values: number[], points: ArrayLike<number> | null, offset: number): {
    values: number[];
    points: ArrayLike<number> | null;
};
export interface IndicatorEntry {
    type: string;
    name: string;
    description: string;
    create: (params?: Params) => Indicator;
}
export declare const INDICATORS: IndicatorEntry[];
export declare function createIndicator(type: string, params?: Params): Indicator | null;
/**
 * Problems with the params of an indicator that comes from outside (e.g. a simulation): unknown type, unknown
 * keys, wrong value types, values that a list does not offer, numbers out of range. Empty when all is right.
 */
export declare function checkIndicatorParams(type: string, params?: Params): string[];
