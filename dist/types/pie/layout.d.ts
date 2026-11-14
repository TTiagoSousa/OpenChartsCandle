import type { PieDatum, PieSlice } from './types';
export declare const DEFAULT_COLORS: string[];
export declare const OTHERS_COLOR = "#787b86";
/**
 * Turn raw data into slices: colors (stable per key), sorting, grouping of small
 * slices into "Outros", hidden/selected flags and percentages of the visible total.
 */
export declare function prepareSlices(data: PieDatum[], o: {
    sort: 'none' | 'desc' | 'asc';
    groupBelow: number;
    othersLabel: string;
    colors: string[];
}, hidden: Set<string>, selected: Set<string>, ring?: number, ringName?: string): PieSlice[];
export interface SliceGeom {
    a0: number;
    a1: number;
    /** outer radius factor 0–1 (rose charts) */
    r: number;
}
/**
 * Angles (radians) of every slice; hidden slices get a zero-width arc at their position.
 * `minAngle` keeps tiny slices visible (others shrink to compensate);
 * `clockwise = false` mirrors the order inside [start, end].
 * Rose charts: `true` = equal angles, radius by √value (area-like); `'area'` = equal angles, radius by value;
 * `'radius'` = angle and radius both by value.
 */
export declare function computeAngles(slices: PieSlice[], start: number, end: number, rose: boolean | 'area' | 'radius', minAngle?: number, clockwise?: boolean): SliceGeom[];
/** Bounding box of a unit circle arc from a0 to a1 (plus the center), for fitting half-donuts etc. */
export declare function arcBounds(a0: number, a1: number): {
    minX: number;
    maxX: number;
    minY: number;
    maxY: number;
};
/** Center and radius so the arc fits the box with the given margins. */
export declare function fit(width: number, height: number, a0: number, a1: number, margin: {
    x: number;
    y: number;
}): {
    cx: number;
    cy: number;
    radius: number;
};
/** Normalise an angle into [start, start + 2π). */
export declare function normAngle(a: number, start: number): number;
export interface LabelBox {
    index: number;
    /** anchor on the slice edge */
    ax: number;
    ay: number;
    /** text position */
    x: number;
    y: number;
    right: boolean;
    /** height of the label (multi-line / rich labels); default: the minimum gap */
    h?: number;
}
/** Spread outside labels vertically on each side so they never overlap. */
export declare function layoutOutsideLabels(items: LabelBox[], minGap: number, top: number, bottom: number): LabelBox[];
