import { TimeZone } from './timezone';
export declare const clamp: (v: number, lo: number, hi: number) => number;
/** Deterministic PRNG (mulberry32) with gaussian helper. */
export declare class Rng {
    private s;
    private spare;
    constructor(seed: number);
    next(): number;
    normal(): number;
}
export declare function randomNormal(): number;
export declare function roundTo(v: number, precision: number): number;
export declare function formatPrice(p: number, precision: number): string;
export declare function formatNumber(v: number, precision?: number): string;
export declare function formatVolume(v: number): string;
export declare function niceStep(raw: number): number;
/** Apply alpha to '#rgb', '#rrggbb', '#rrggbbaa' or 'rgb(a)(...)' colors. */
export declare function withAlpha(color: string, alpha: number): string;
export declare function parseColor(color: string): {
    r: number;
    g: number;
    b: number;
    a: number;
};
export declare function colorAlpha(color: string): number;
export declare function toHex(color: string): string;
export declare function distToSegment(px: number, py: number, x1: number, y1: number, x2: number, y2: number): number;
/** Distance to an infinite line / ray depending on extension flags. */
export declare function distToLine(px: number, py: number, x1: number, y1: number, x2: number, y2: number, extL: boolean, extR: boolean): number;
export declare function uid(prefix?: string): string;
export declare const pad2: (n: number) => string;
export declare const MONTHS: string[];
export declare const WEEKDAYS: string[];
/**
 * Date and time for the crosshair label, trade lists… Intraday in `tz` (default: the browser's time);
 * daily and longer bars (`tfSeconds` >= 1 day) only the calendar date of the bar.
 */
export declare function formatCrosshairTime(t: number, tfSeconds: number, tz?: TimeZone): string;
export declare function formatDuration(seconds: number): string;
export declare function formatCountdown(seconds: number): string;
export declare class Emitter<T = void> {
    private handlers;
    on(fn: (v: T) => void): () => void;
    emit(v: T): void;
    /** Number of listeners. */
    get size(): number;
}
export declare function storageGet<T>(key: string, fallback: T): T;
export declare function storageSet(key: string, value: unknown): void;
/** Snap pixel coordinate so that a line of the given width renders crisp. */
export declare function crisp(v: number, lineWidth: number, dpr: number): number;
