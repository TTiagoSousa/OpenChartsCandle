import { Indicator, type Params } from './base';
export * from './base';
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
