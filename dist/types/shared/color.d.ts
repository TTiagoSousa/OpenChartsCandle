/** Small color helpers (no DOM needed for hex / rgb / hsl strings). */
export type RGBA = [r: number, g: number, b: number, a: number];
export declare function parseColor(c: string): RGBA;
export declare function toColor([r, g, b, a]: RGBA): string;
export declare function rgbToHsl(r: number, g: number, b: number): [number, number, number];
export declare function hslToRgb(h: number, s: number, l: number): [number, number, number];
/** Mix two colors (t = 0 → a, 1 → b). */
export declare function mix(a: string, b: string, t: number): string;
/** Color at t (0–1) along a list of colors. */
export declare function gradientAt(colors: string[], t: number): string;
/** Set HSL saturation / lightness / alpha of a color (undefined keeps it). */
export declare function adjust(c: string, sat?: number, light?: number, alpha?: number): string;
/** Lighter (amount > 0) or darker (amount < 0) by changing the HSL lightness. */
export declare function shade(c: string, amount: number): string;
/** Relative luminance 0 (black) – 1 (white). */
export declare function luminance(c: string): number;
