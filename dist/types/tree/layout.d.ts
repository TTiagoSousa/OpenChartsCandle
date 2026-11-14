/**
 * Tidy tree layout (Reingold–Tilford, in the linear-time version of Buchheim, Jünger and Leipert, as d3 and
 * ECharts use): parents centered over their children, subtrees as close as `separation` allows, and the same
 * shape for the same subtree wherever it is.
 */
export interface TidyInput {
    children: TidyInput[];
}
/** Gap between two neighbours in units: 1 for siblings, 2 for cousins (and divided by the depth when radial). */
export type Separation = (a: {
    parent: unknown;
    depth: number;
}, b: {
    parent: unknown;
    depth: number;
}) => number;
export declare const defaultSeparation: Separation;
export declare const radialSeparation: Separation;
/**
 * Positions of every node along the breadth axis (in separation units, the leftmost at its own place) and
 * their depth. The input is only read.
 */
export declare function tidyLayout<T extends TidyInput>(root: T, separation?: Separation): Map<T, {
    x: number;
    depth: number;
}>;
