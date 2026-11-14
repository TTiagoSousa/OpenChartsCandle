import type { Bar } from '../core/types';
export interface VPRow {
    lo: number;
    hi: number;
    up: number;
    down: number;
}
export interface VPResult {
    rows: VPRow[];
    poc: number;
    vaLow: number;
    vaHigh: number;
    max: number;
    total: number;
}
/**
 * Distribute each bar's volume over the price rows it spans (uniform intrabar assumption). `rowCount` rows
 * over the range, or, with `rowStep` > 0, rows of that size in price aligned to multiples of it (TradingView's
 * "Ticks por linha": `rowStep` = ticks × tick size).
 */
export declare function computeVolumeProfile(bars: Bar[], from: number, to: number, rowCount: number, vaPct?: number, rowStep?: number): VPResult | null;
/**
 * The developing POC and value area: for each bar `from`..`to`, the POC (middle of its row), VAH (top of the
 * value area) and VAL (bottom) of the bars from `from` up to it, on the rows of the session's profile `vp`.
 */
export declare function developingProfile(bars: Bar[], from: number, to: number, vp: VPResult, vaPct?: number): {
    poc: number[];
    vah: number[];
    val: number[];
};
export declare const VP_COLORS: {
    up: string;
    down: string;
    upOut: string;
    downOut: string;
    poc: string;
};
/** Draw horizontal histogram rows. `anchorX` is where bars start; `dir` 1 = grow right, -1 = grow left. */
export declare function drawProfile(ctx: CanvasRenderingContext2D, vp: VPResult, priceToY: (p: number) => number, anchorX: number, maxWidth: number, dir: 1 | -1, pocFromX: number, pocToX: number): void;
