import type { CustomAxis, CustomAxisType } from './types';
export interface CustomTick {
    value: number;
    label: string;
    /** a "bigger" boundary (new day, month, year) */
    major?: boolean;
}
export interface CustomScale {
    type: CustomAxisType;
    /** Domain in numbers (category: index space, time: ms) */
    min: number;
    max: number;
    /** Full domain without zoom */
    fullMin: number;
    fullMax: number;
    /** px of min → px of max (already swapped when inverse) */
    range: [number, number];
    categories: string[];
    /** Raw value → number (category index, time ms) */
    toNumber(v: unknown): number;
    /** Raw value → px */
    map(v: unknown): number;
    /** Number → px */
    mapNum(n: number): number;
    /** px → number */
    invert(px: number): number;
    /** px of one category band (0 for other axes) */
    band(): number;
    ticks(count?: number): CustomTick[];
    /** Label of a number (category name, date, compact value) */
    label(n: number): string;
}
/** Dates: numbers (ms), Date objects or strings ('2024-03-05', '2024-03-05 14:30' as local time). */
export declare function customTimeValue(v: unknown): number;
/** Time ticks for a range in ms (local time), labels adapted to the interval. */
export declare function customTimeTicks(min: number, max: number, maxTicks: number): CustomTick[];
/** Full date (and time when it is not midnight) for tooltips. */
export declare function customFormatDate(t: number): string;
/** Guess the axis type from raw values. */
export declare function customAxisType(values: unknown[], fallback?: CustomAxisType): CustomAxisType;
/**
 * A scale for an axis. `values` are the raw values of the data along it (for the range and the categories);
 * `range` the px of the start and the end; `view` a zoomed domain (numbers).
 */
export declare function customScale(axis: CustomAxis, values: unknown[], range: [number, number], view?: [number, number] | null, defaultTicks?: number): CustomScale;
