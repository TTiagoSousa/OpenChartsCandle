import type { Point } from '../core/types';
import type { PaneView } from '../core/view';
import { AxisMarks, DrawState, Drawing, DrawingOptions, Handle, SettingField } from './base';
export declare function snapTime(v: PaneView, x: number): number;
/** Constrain p relative to anchor to multiples of 45° in screen space. */
export declare function snapAngle(v: PaneView, anchor: Point, p: Point): Point;
export declare class TrendLine extends Drawing {
    readonly type: string;
    readonly title: string;
    readonly pointsNeeded = 2;
    arrow: boolean;
    settings(): SettingField[];
    protected defaults(): Partial<DrawingOptions>;
    draw(v: PaneView, s: DrawState): void;
    protected drawStats(v: PaneView, a: {
        x: number;
        y: number;
    }, b: {
        x: number;
        y: number;
    }): void;
    distance(v: PaneView, x: number, y: number): number;
    moveHandle(index: number, p: Point, v: PaneView, shift: boolean): void;
}
export declare class Ray extends TrendLine {
    readonly type = "ray";
    readonly title = "Raio";
    protected defaults(): Partial<DrawingOptions>;
}
export declare class ExtendedLine extends TrendLine {
    readonly type = "extended";
    readonly title = "Linha estendida";
    protected defaults(): Partial<DrawingOptions>;
}
export declare class InfoLine extends TrendLine {
    readonly type = "infoline";
    readonly title = "Linha de informa\u00E7\u00E3o";
    protected defaults(): Partial<DrawingOptions>;
}
export declare class ArrowLine extends TrendLine {
    readonly type = "arrow";
    readonly title = "Seta";
    arrow: boolean;
}
export declare class HorizontalLine extends Drawing {
    readonly type: string;
    readonly title: string;
    readonly pointsNeeded = 1;
    protected ray: boolean;
    protected defaults(): Partial<DrawingOptions>;
    settings(): SettingField[];
    private x;
    draw(v: PaneView): void;
    handles(v: PaneView): Handle[];
    distance(v: PaneView, x: number, y: number): number;
    moveHandle(_i: number, p: Point): void;
    setCreationPoint(_i: number, p: Point): void;
    axisMarks(): AxisMarks;
}
export declare class HorizontalRay extends HorizontalLine {
    readonly type = "hray";
    readonly title = "Raio horizontal";
    protected ray: boolean;
}
export declare class VerticalLine extends Drawing {
    readonly type = "vline";
    readonly title = "Linha vertical";
    readonly pointsNeeded = 1;
    protected defaults(): Partial<DrawingOptions>;
    draw(v: PaneView): void;
    handles(v: PaneView): Handle[];
    distance(v: PaneView, x: number): number;
    axisMarks(): AxisMarks;
}
export declare class CrossLine extends Drawing {
    readonly type = "crossline";
    readonly title = "Linha cruzada";
    readonly pointsNeeded = 1;
    protected defaults(): Partial<DrawingOptions>;
    draw(v: PaneView): void;
    distance(v: PaneView, x: number, y: number): number;
    axisMarks(): AxisMarks;
}
export declare class ParallelChannel extends Drawing {
    readonly type = "channel";
    readonly title = "Canal paralelo";
    readonly pointsNeeded = 3;
    protected defaults(): Partial<DrawingOptions>;
    settings(): SettingField[];
    private offset;
    private lines;
    draw(v: PaneView): void;
    handles(v: PaneView): Handle[];
    distance(v: PaneView, x: number, y: number): number;
    insideFill(v: PaneView, x: number, y: number): boolean;
    setCreationPoint(index: number, p: Point, v: PaneView, shift: boolean): void;
    moveHandle(index: number, p: Point, v: PaneView, shift: boolean): void;
}
declare abstract class FibBase extends Drawing {
    protected defaults(): Partial<DrawingOptions>;
    settings(): SettingField[];
    protected abstract levelPrice(level: number): number;
    protected abstract span(v: PaneView): [number, number];
    protected drawLevels(v: PaneView): void;
    distance(v: PaneView, x: number, y: number): number;
    insideFill(v: PaneView, x: number, y: number): boolean;
    axisMarks(v: PaneView): AxisMarks;
}
export declare class FibRetracement extends FibBase {
    readonly type = "fib";
    readonly title = "Retra\u00E7\u00E3o de Fibonacci";
    readonly pointsNeeded = 2;
    protected levelPrice(level: number): number;
    protected span(v: PaneView): [number, number];
    draw(v: PaneView): void;
}
export declare class FibExtension extends FibBase {
    readonly type = "fibext";
    readonly title = "Extens\u00E3o de Fibonacci baseada em tend\u00EAncia";
    readonly pointsNeeded = 3;
    protected defaults(): Partial<DrawingOptions>;
    protected levelPrice(level: number): number;
    protected span(v: PaneView): [number, number];
    draw(v: PaneView): void;
}
export declare class FibChannel extends Drawing {
    readonly type = "fibchannel";
    readonly title = "Canal de Fibonacci";
    readonly pointsNeeded = 3;
    protected defaults(): Partial<DrawingOptions>;
    settings(): SettingField[];
    private off;
    draw(v: PaneView): void;
    handles(v: PaneView): Handle[];
    distance(v: PaneView, x: number, y: number): number;
    setCreationPoint(index: number, p: Point, v: PaneView): void;
    moveHandle(index: number, p: Point, v: PaneView): void;
}
export declare class Rectangle extends Drawing {
    readonly type = "rect";
    readonly title = "Ret\u00E2ngulo";
    readonly pointsNeeded = 2;
    protected defaults(): Partial<DrawingOptions>;
    settings(): SettingField[];
    protected box(v: PaneView): {
        x1: number;
        y1: number;
        x2: number;
        y2: number;
    };
    draw(v: PaneView): void;
    handles(v: PaneView): Handle[];
    distance(v: PaneView, x: number, y: number): number;
    insideFill(v: PaneView, x: number, y: number): boolean;
    moveHandle(index: number, p: Point): void;
}
export declare class Ellipse extends Drawing {
    readonly type = "ellipse";
    readonly title = "Elipse";
    readonly pointsNeeded = 2;
    protected defaults(): Partial<DrawingOptions>;
    settings(): SettingField[];
    private geom;
    draw(v: PaneView): void;
    handles(v: PaneView): Handle[];
    distance(v: PaneView, x: number, y: number): number;
    insideFill(v: PaneView, x: number, y: number): boolean;
    moveHandle(index: number, p: Point, v: PaneView): void;
    setCreationPoint(index: number, p: Point): void;
}
export declare class Triangle extends Drawing {
    readonly type = "triangle";
    readonly title = "Tri\u00E2ngulo";
    readonly pointsNeeded = 3;
    protected defaults(): Partial<DrawingOptions>;
    settings(): SettingField[];
    draw(v: PaneView): void;
    distance(v: PaneView, x: number, y: number): number;
    insideFill(v: PaneView, x: number, y: number): boolean;
}
export declare class Brush extends Drawing {
    readonly type = "brush";
    readonly title = "Pincel";
    readonly pointsNeeded = 0;
    protected defaults(): Partial<DrawingOptions>;
    draw(v: PaneView): void;
    handles(): Handle[];
    distance(v: PaneView, x: number, y: number): number;
    axisMarks(): AxisMarks;
}
export declare class PathTool extends Drawing {
    readonly type = "path";
    readonly title = "Caminho";
    readonly pointsNeeded = -1;
    protected defaults(): Partial<DrawingOptions>;
    draw(v: PaneView): void;
    distance(v: PaneView, x: number, y: number): number;
}
export declare class TextNote extends Drawing {
    readonly type = "text";
    readonly title = "Texto";
    readonly pointsNeeded = 1;
    protected defaults(): Partial<DrawingOptions>;
    settings(): SettingField[];
    private box;
    draw(v: PaneView, s: DrawState): void;
    handles(v: PaneView): Handle[];
    distance(v: PaneView, x: number, y: number): number;
}
declare abstract class RangeBase extends Drawing {
    readonly pointsNeeded = 2;
    protected defaults(): Partial<DrawingOptions>;
    distance(v: PaneView, x: number, y: number): number;
    insideFill(v: PaneView, x: number, y: number): boolean;
    protected stats(v: PaneView): {
        dp: number;
        pct: number;
        ticks: number;
        bars: number;
        dt: number;
        vol: number;
    };
    protected color(v: PaneView): string;
}
export declare class PriceRange extends RangeBase {
    readonly type = "pricerange";
    readonly title = "Intervalo de pre\u00E7o";
    draw(v: PaneView): void;
}
export declare class DateRange extends RangeBase {
    readonly type = "daterange";
    readonly title = "Intervalo de data";
    draw(v: PaneView): void;
}
export declare class DatePriceRange extends RangeBase {
    readonly type = "datepricerange";
    readonly title = "Intervalo de data e pre\u00E7o";
    draw(v: PaneView): void;
}
export declare class Position extends Drawing {
    readonly long: boolean;
    readonly pointsNeeded = 1;
    readonly type: string;
    readonly title: string;
    constructor(long: boolean, opts?: Partial<DrawingOptions>);
    protected defaults(): Partial<DrawingOptions>;
    settings(): SettingField[];
    init(v: PaneView): void;
    setCreationPoint(index: number, p: Point, v: PaneView): void;
    private geo;
    draw(v: PaneView, st: DrawState): void;
    handles(v: PaneView): Handle[];
    moveHandle(index: number, p: Point, v: PaneView): void;
    distance(v: PaneView, x: number, y: number): number;
    insideFill(v: PaneView, x: number, y: number): boolean;
    axisMarks(): AxisMarks;
    toJSON(): ReturnType<Drawing['toJSON']>;
}
export declare class FixedRangeVP extends Drawing {
    readonly type = "frvp";
    readonly title = "Perfil de volume de intervalo fixo";
    readonly pointsNeeded = 2;
    protected defaults(): Partial<DrawingOptions>;
    settings(): SettingField[];
    private range;
    draw(v: PaneView, s: DrawState): void;
    distance(v: PaneView, x: number, y: number): number;
}
export declare class AnchoredVwap extends Drawing {
    readonly type = "avwap";
    readonly title = "VWAP ancorado";
    readonly pointsNeeded = 1;
    private cache;
    protected defaults(): Partial<DrawingOptions>;
    private series;
    draw(v: PaneView): void;
    handles(v: PaneView): Handle[];
    distance(_v: PaneView, x: number, y: number): number;
    axisMarks(): AxisMarks;
}
export {};
