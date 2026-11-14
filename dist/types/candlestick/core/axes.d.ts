import type { SeriesData } from './data';
import type { PriceScale, TimeScale } from './scales';
import { TimeZone } from './timezone';
export interface TimeTick {
    x: number;
    label: string;
    weight: number;
}
/**
 * Choose time-axis marks greedily by importance, keeping a minimum pixel spacing.
 * Intraday bars are shown in `tz`; daily and longer bars by their calendar date.
 */
export declare function computeTimeTicks(ts: TimeScale, data: SeriesData, tz?: TimeZone, minSpacing?: number): TimeTick[];
export declare function computePriceTicks(ps: PriceScale, height: number, precision: number, spacing?: number): number[];
