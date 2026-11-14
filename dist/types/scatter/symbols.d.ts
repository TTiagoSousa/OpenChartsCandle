/**
 * Symbol outlines in a unit box (-0.5…0.5, y down), clockwise from the top. Every outline can be
 * resampled to the same number of points, so any symbol morphs smoothly into any other.
 */
import type { ScatterSymbol } from './types';
type Pts = [number, number][];
/** Outline of a symbol (unit box). */
export declare function symbolOutline(s: ScatterSymbol): Pts;
export declare const MORPH_POINTS = 48;
/** Outline resampled to MORPH_POINTS points evenly along its length, starting at the top. */
export declare function symbolSamples(s: ScatterSymbol): Pts;
/** Trace a symbol of w × h px centred on (x, y). */
export declare function traceSymbol(ctx: CanvasRenderingContext2D, s: ScatterSymbol, x: number, y: number, w: number, h: number): void;
/** Trace the shape halfway (t) between two symbols, each with its own size. */
export declare function traceMorph(ctx: CanvasRenderingContext2D, a: ScatterSymbol, ax: number, ay: number, aw: number, ah: number, b: ScatterSymbol, bx: number, by: number, bw: number, bh: number, t: number): void;
export {};
