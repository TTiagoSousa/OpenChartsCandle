/** A max that reads well on the outer ring: 87 → 100, 4300 → 5000. */
export declare function niceMax(v: number): number;
/** Angle (radians, math convention: counterclockwise from the right) of axis i of n. */
export declare function axisAngle(i: number, n: number, startAngle?: number, clockwise?: boolean): number;
/** Point at distance r along an angle, on a canvas (y grows down). */
export declare function polar(cx: number, cy: number, r: number, a: number): {
    x: number;
    y: number;
};
/** Distance from the center of a value: min → 0, max → R (clamped). */
export declare function valueRadius(v: number | null, min: number, max: number, R: number): number;
export declare function pointInPolygon(x: number, y: number, pts: {
    x: number;
    y: number;
}[]): boolean;
