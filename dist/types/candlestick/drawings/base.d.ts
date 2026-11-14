import type { Point } from '../core/types';
import type { PaneView } from '../core/view';
export type LineDash = 'solid' | 'dashed' | 'dotted';
export interface DrawingOptions {
    color: string;
    width: number;
    dash: LineDash;
    fill: string;
    fillEnabled: boolean;
    extendLeft: boolean;
    extendRight: boolean;
    text: string;
    textColor: string;
    fontSize: number;
    showLabels: boolean;
    showPrice: boolean;
    levels: FibLevel[];
    [key: string]: unknown;
}
export interface FibLevel {
    value: number;
    color: string;
    enabled: boolean;
}
export declare const FIB_DEFAULTS: FibLevel[];
export interface Handle {
    x: number;
    y: number;
    /** css cursor when hovering this handle */
    cursor?: string;
}
export interface HitResult {
    kind: 'handle' | 'body';
    index: number;
    cursor: string;
}
export interface DrawState {
    selected: boolean;
    hovered: boolean;
    creating: boolean;
}
export interface AxisMarks {
    prices: {
        price: number;
        color?: string;
        text?: string;
        persistent?: boolean;
    }[];
    times: number[];
    priceBand?: [number, number];
    timeBand?: [number, number];
}
export interface SettingField {
    key: string;
    label: string;
    type: 'color' | 'width' | 'dash' | 'bool' | 'text' | 'number' | 'fill' | 'levels';
    min?: number;
    max?: number;
    step?: number;
}
export declare const HIT_TOLERANCE = 6;
export declare const HANDLE_RADIUS = 5.5;
export declare abstract class Drawing {
    id: string;
    points: Point[];
    opts: DrawingOptions;
    locked: boolean;
    hidden: boolean;
    abstract readonly type: string;
    abstract readonly title: string;
    /** clicks needed to create; 0 = freehand drag, -1 = open-ended (finish with dbl-click / Enter) */
    abstract readonly pointsNeeded: number;
    constructor(opts?: Partial<DrawingOptions>);
    /** per-type default option overrides */
    protected defaults(): Partial<DrawingOptions>;
    /** fields shown in the settings dialog */
    settings(): SettingField[];
    /** Called once after first point is placed (for single-click tools needing extra anchors). */
    init(_v: PaneView): void;
    /** Called on every creation pointer move with the in-progress points */
    abstract draw(v: PaneView, s: DrawState): void;
    handles(v: PaneView): Handle[];
    /** distance of (x,y) to the drawing body, or Infinity */
    abstract distance(v: PaneView, x: number, y: number): number;
    /** fill hit (e.g. inside rectangle) */
    insideFill(_v: PaneView, _x: number, _y: number): boolean;
    hitTest(v: PaneView, x: number, y: number, selected: boolean): HitResult | null;
    /** Move a handle to a new (snapped) data point. */
    moveHandle(index: number, p: Point, _v: PaneView, _shift: boolean): void;
    /** point being placed during creation (index into points) */
    setCreationPoint(index: number, p: Point, v: PaneView, shift: boolean): void;
    axisMarks(_v: PaneView): AxisMarks;
    clone(): Drawing;
    toJSON(): SerializedDrawing;
}
export interface SerializedDrawing {
    type: string;
    id: string;
    points: Point[];
    opts: DrawingOptions;
    locked: boolean;
    hidden: boolean;
}
export declare function bands(points: Point[]): {
    priceBand?: [number, number];
    timeBand?: [number, number];
};
export declare function defaultOptions(): DrawingOptions;
export declare function dashArray(d: LineDash, width: number): number[];
export declare function applyStroke(ctx: CanvasRenderingContext2D, color: string, width: number, dash?: LineDash): void;
/** Extend segment to pane borders in either direction. */
export declare function extendSegment(x1: number, y1: number, x2: number, y2: number, w: number, h: number, extL: boolean, extR: boolean): [number, number, number, number];
export declare function strokeLine(ctx: CanvasRenderingContext2D, x1: number, y1: number, x2: number, y2: number): void;
/** crisp horizontal line at y */
export declare function hLine(ctx: CanvasRenderingContext2D, v: PaneView, x1: number, x2: number, y: number, width: number): void;
export declare function vLine(ctx: CanvasRenderingContext2D, v: PaneView, x: number, y1: number, y2: number, width: number): void;
export declare function snapPx(v: number, width: number, dpr: number): number;
export declare function drawHandles(ctx: CanvasRenderingContext2D, hs: Handle[], color?: string): void;
export declare function drawArrowHead(ctx: CanvasRenderingContext2D, x1: number, y1: number, x2: number, y2: number, width: number): void;
export interface LabelOpts {
    bg?: string;
    color?: string;
    size?: number;
    align?: CanvasTextAlign;
    baseline?: CanvasTextBaseline;
    padX?: number;
    padY?: number;
    radius?: number;
    bold?: boolean;
}
/** Text with optional rounded background. Returns box. */
export declare function drawLabel(ctx: CanvasRenderingContext2D, text: string, x: number, y: number, o?: LabelOpts): {
    x: number;
    y: number;
    w: number;
    h: number;
};
export declare function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number): void;
