/** Helpers shared by several chart families (no DOM, no family-specific code). */
export declare function niceStep(raw: number): number;
/** Nice axis range + ticks covering [min, max]. */
export declare function niceScale(min: number, max: number, count: number): {
    min: number;
    max: number;
    ticks: number[];
    step: number;
};
/** 1.2K, 3.4M… for axis labels. */
export declare function formatCompact(v: number, maxDecimals?: number): string;
