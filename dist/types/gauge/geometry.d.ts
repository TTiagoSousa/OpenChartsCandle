import type { GaugeZone } from './types';
export interface Arc {
    /** radians, canvas convention (0 = right, clockwise) */
    start: number;
    end: number;
}
declare const SHAPES: {
    readonly speedometer: readonly [-120, 120];
    readonly semi: readonly [-90, 90];
    readonly full: readonly [0, 360];
};
/** Arc from a preset or custom degrees (0 = top, clockwise). */
export declare function gaugeArc(shape?: keyof typeof SHAPES, startAngle?: number, endAngle?: number): Arc;
export declare const clamp: (v: number, lo: number, hi: number) => number;
export declare function valueToAngle(v: number, min: number, max: number, arc: Arc): number;
/** Inverse of valueToAngle (for hover); angle normalized into the arc. Returns null outside the arc. */
export declare function angleToValue(angle: number, min: number, max: number, arc: Arc): number | null;
/** Major tick values: round numbers when they fit, else even divisions. */
export declare function gaugeTicks(min: number, max: number, count: number): number[];
export declare function zoneAt(v: number, zones?: GaugeZone[]): GaugeZone | null;
/** Bounding box of the arc on a unit circle (plus the hub), to fit the gauge in its container. */
export declare function arcBounds(arc: Arc): {
    minX: number;
    maxX: number;
    minY: number;
    maxY: number;
};
/** Spring-like easing that overshoots ~6% then settles (needle feel). */
export declare function springEase(t: number): number;
export {};
