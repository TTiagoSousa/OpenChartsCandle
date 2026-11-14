import { type CustomPathCommand } from './path';
import type { CustomElement, CustomLabel, CustomPaint, CustomShapeType, CustomStyle, CustomTransitionProps } from './types';
export type Pt = [number, number];
/** Decomposed transform: translate · rotate · scale. */
export interface CustomTf {
    x: number;
    y: number;
    rot: number;
    sx: number;
    sy: number;
}
/** A drawable leaf. */
export interface CustomNode {
    key: string;
    type: CustomShapeType;
    shape: Record<string, any>;
    style: CustomStyle;
    emphasis?: CustomStyle;
    tf: CustomTf;
    /** cumulative opacity of the groups × style.opacity */
    opacity: number;
    /** uniform scale around the local center (enter / leave pops) */
    scale: number;
    z: number;
    order: number;
    si: number;
    di: number;
    silent?: boolean;
    label?: CustomLabel;
    enterFrom?: CustomTransitionProps;
    leaveTo?: CustomTransitionProps;
    info?: unknown;
    draggable?: boolean;
    cursor?: string;
    /** clip rect in px (series clip) */
    clip?: {
        x: number;
        y: number;
        width: number;
        height: number;
    } | null;
    /** measured text width (set when drawn) */
    textW?: number;
}
export declare const IDENTITY: CustomTf;
type Mat = [number, number, number, number, number, number];
export declare function tfMatrix(t: CustomTf): Mat;
export interface FlattenCtx {
    si: number;
    di: number;
    out: CustomNode[];
    clip?: CustomNode['clip'];
}
/** Parsed path (cached by its `d`). */
export declare function pathOf(d: string): {
    cmds: CustomPathCommand[];
    b: {
        x: number;
        y: number;
        width: number;
        height: number;
    };
};
/** Turn the element tree of one data item into flat nodes (in drawing order). */
export declare function customFlatten(el: CustomElement | null | undefined | false, fc: FlattenCtx, parent?: {
    m: Mat;
    opacity: number;
    style: CustomStyle;
    z: number;
    enter?: CustomTransitionProps;
    leave?: CustomTransitionProps;
}, path?: string): void;
export type TextMeasure = (text: string, font: string) => number;
export declare function fontOf(s: CustomStyle, family: string): string;
/** Bounding box of a node in its local space. */
export declare function customLocalBounds(n: CustomNode, measure?: TextMeasure, family?: string): {
    x: number;
    y: number;
    w: number;
    h: number;
};
/** Outline of a node as points in its local space (n ≈ number of samples for curves). */
export declare function localPolygon(nd: CustomNode, n?: number): Pt[];
/** Points evenly spaced along a ring (closed) or a line (open). */
export declare function customResample(pts: Pt[], n: number, closed?: boolean): Pt[];
/** Rotate `b` (and flip it when wound the other way) so that its points line up with `a` (same length). */
export declare function customAlignRings(a: Pt[], b: Pt[]): Pt[];
/** Outline of a node in world px (transform and pop scale applied). */
export declare function worldPolygon(nd: CustomNode, n?: number): Pt[];
/** World matrix of a node, with its pop scale around the local center. */
export declare function nodeMatrix(nd: CustomNode, measure?: TextMeasure, family?: string): Mat;
export declare function customPointInPolygon(x: number, y: number, pts: Pt[]): boolean;
/** Is the point (x, y) in px on the node? `tol` = extra px around thin shapes. */
export declare function customHitTest(nd: CustomNode, x: number, y: number, tol?: number, measure?: TextMeasure, family?: string): boolean;
/** Interpolate two colors (or switch gradients / 'none' at the middle). */
export declare function customLerpColor(a: CustomPaint | undefined, b: CustomPaint | undefined, t: number): CustomPaint | undefined;
/** Can a turn into b at all (text and images only fade)? */
export declare function customCanMorph(a: CustomNode, b: CustomNode): boolean;
/** State of a node at t (0 = a, 1 = b). Different shapes morph through polygons in world px. */
export declare function customLerpNode(a: CustomNode, b: CustomNode, t: number): CustomNode;
/** A node with transition props applied (enterFrom / leaveTo). */
export declare function customWithProps(n: CustomNode, p: CustomTransitionProps | undefined, fallback: CustomTransitionProps): CustomNode;
export interface DrawEnv {
    dpr: number;
    family: string;
    text: string;
    onImage: () => void;
}
/** Draw one node (its transform, opacity and style); returns nothing. Labels are drawn by `customDrawLabel`. */
export declare function customDrawNode(ctx: CanvasRenderingContext2D, n: CustomNode, env: DrawEnv, style?: CustomStyle): void;
/** World-space bounding box of a node (for labels). */
export declare function customWorldBounds(n: CustomNode, measure?: TextMeasure, family?: string): {
    x: number;
    y: number;
    w: number;
    h: number;
};
/** Fit text in a width: as is, cut with "…", or '' when even "…" does not fit. */
export declare function customTruncate(text: string, width: number, measure: (t: string) => number): string;
/** Draw the label of a node on its world box (not rotated / scaled with the node). */
export declare function customDrawLabel(ctx: CanvasRenderingContext2D, n: CustomNode, env: DrawEnv, readable: (fill: CustomPaint | undefined) => string): void;
export {};
