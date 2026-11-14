import type { SeriesData } from './data';
import type { PriceScale, TimeScale } from './scales';
import type { Bar, Point, Rect, SymbolInfo } from './types';
import { formatPrice } from './utils';

/**
 * Everything a renderer needs to map data <-> pixels inside one pane.
 * The canvas context is already translated to the pane origin and clipped,
 * using media (CSS pixel) coordinates; `dpr` is available for crisp lines.
 */
export class PaneView {
  constructor(
    public ctx: CanvasRenderingContext2D,
    public rect: Rect,
    public dpr: number,
    public ts: TimeScale,
    public ps: PriceScale,
    public data: SeriesData,
    public precision: number,
    public from: number,
    public to: number,
    /** The chart's symbol (its exchange, time zone and sessions). */
    public symbol: SymbolInfo = { symbol: '', precision },
  ) {}

  get bars(): Bar[] {
    return this.data.bars;
  }
  get width(): number {
    return this.rect.w;
  }
  get height(): number {
    return this.rect.h;
  }

  timeToX(t: number): number {
    return this.ts.indexToX(this.data.timeToIndex(t));
  }
  xToTime(x: number): number {
    return this.data.indexToTime(this.ts.xToIndex(x));
  }
  priceToY(p: number): number {
    return this.ps.priceToY(p);
  }
  yToPrice(y: number): number {
    return this.ps.yToPrice(y);
  }
  toXY(p: Point): { x: number; y: number } {
    return { x: this.timeToX(p.time), y: this.priceToY(p.price) };
  }
  fmt(p: number): string {
    return formatPrice(p, this.precision);
  }
  get tick(): number {
    return Math.pow(10, -this.precision);
  }
  get tf(): number {
    return this.data.tf;
  }
}
