/** Pure layout of bars: stacking, groups and positions inside a category band. Testable without DOM. */
export interface StackInput {
    key: string;
    /** stack group (series with the same group stack together) */
    group: string;
    values: (number | null)[];
    hidden: boolean;
    /** value axis (series on different axes never stack together). Default 'left' */
    axis?: string;
}
export interface Segment {
    /** start and end of the bar on the value axis (start = baseline or previous stack top) */
    from: number;
    to: number;
    /** slot (group) index inside the category */
    slot: number;
}
export interface StackResult {
    /** segments[series][category] (null = nothing drawn) */
    segments: (Segment | null)[][];
    /** number of side-by-side slots */
    slots: number;
    /** min/max reached on the value axis */
    min: number;
    max: number;
    /** total per category (visible series, absolute values for percent) */
    totals: number[];
    /** min / max per value axis */
    ranges: Record<string, {
        min: number;
        max: number;
    }>;
}
/**
 * Stack or group series. Positive and negative values stack separately (like most libraries),
 * so a negative value never "eats" a positive bar.
 */
export declare function computeStacks(series: StackInput[], categories: number, mode: false | true | 'percent'): StackResult;
/** Position of a slot inside a category band (pixels along the category axis). */
export declare function slotRect(bandStart: number, bandSize: number, slot: number, slots: number, categoryGap: number, barGap: number, maxBarWidth?: number): {
    start: number;
    size: number;
};
/** Category order after sorting by total of visible values. */
export declare function sortOrder(totals: number[], sort: 'none' | 'asc' | 'desc'): number[];
