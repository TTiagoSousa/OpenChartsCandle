import type { SeriesData } from './data';
import type { PriceScale, TimeScale } from './scales';
import type { Bar, Point, Rect, SymbolInfo } from './types';
/**
 * Everything a renderer needs to map data <-> pixels inside one pane.
 * The canvas context is already translated to the pane origin and clipped,
 * using media (CSS pixel) coordinates; `dpr` is available for crisp lines.
 */
export declare class PaneView {
    ctx: CanvasRenderingContext2D;
    rect: Rect;
    dpr: number;
    ts: TimeScale;
    ps: PriceScale;
    data: SeriesData;
    precision: number;
    from: number;
    to: number;
    /** The chart's symbol (its exchange, time zone and sessions). */
    symbol: SymbolInfo;
    constructor(ctx: CanvasRenderingContext2D, rect: Rect, dpr: number, ts: TimeScale, ps: PriceScale, data: SeriesData, precision: number, from: number, to: number, 
    /** The chart's symbol (its exchange, time zone and sessions). */
    symbol?: SymbolInfo);
    get bars(): Bar[];
    get width(): number;
    get height(): number;
    timeToX(t: number): number;
    xToTime(x: number): number;
    priceToY(p: number): number;
    yToPrice(y: number): number;
    toXY(p: Point): {
        x: number;
        y: number;
    };
    fmt(p: number): string;
    get tick(): number;
    get tf(): number;
}
