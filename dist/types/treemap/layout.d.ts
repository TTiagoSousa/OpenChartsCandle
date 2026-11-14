/** Rectangle in px. */
export interface Box {
    x: number;
    y: number;
    w: number;
    h: number;
}
/**
 * Squarified treemap (Bruls, Huizing, van Wijk): splits `box` into rectangles with areas
 * proportional to `values`, as close to squares as possible. Keeps the order of `values`
 * (sort them descending for the best result); values ≤ 0 get an empty box.
 */
export declare function squarify(values: number[], box: Box): Box[];
/** Shrink a box on every side (never below zero size). */
export declare function inset(b: Box, d: number): Box;
