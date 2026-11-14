/**
 * Sunburst geometry: lengths in px or '%', ring radii per level, sectors with rounded corners
 * and the room a label has inside a sector.
 */
import type { SectorShape } from './shape';
import type { TreemapLength } from './types';
/** `40` → 40 px, `'40%'` → 40 % of `base`, `'40'` / `'40px'` → 40 px; anything else → undefined. */
export declare function sunLength(v: TreemapLength | undefined, base: number): number | undefined;
/**
 * Inner and outer radius of `count` rings between `inner` and `outer`. A ring takes its own `r0` / `r`
 * when given; the others start where the previous one ends and share evenly the room up to the next
 * fixed radius (or `outer`).
 */
export declare function sunburstRings(count: number, inner: number, outer: number, specs?: {
    r0?: number;
    r?: number;
}[]): [number, number][];
/**
 * Largest usable corner radii `[inner, outer]` of a sector: no more than half the ring's thickness,
 * and small enough that the two corners of one arc do not cross.
 */
export declare function sectorCorners(s: SectorShape, want: [number, number]): [number, number];
/** Path of an annular sector with rounded corners (falls back to sharp corners where they do not fit). */
export declare function traceRoundSector(ctx: CanvasRenderingContext2D, s: SectorShape, radius: [number, number]): void;
/**
 * Room for a line of text inside a sector whose text runs at `angle` (radians, canvas): `along` the text
 * and `across` it. Radial text gets the ring's thickness, tangential text the arc length; in between, a mix.
 */
export declare function sectorTextRoom(s: SectorShape, angle: number): {
    along: number;
    across: number;
};
/** Text angle that keeps a label upright: turns `angle` half a turn when the text would read upside down. */
export declare function uprightAngle(angle: number): {
    angle: number;
    flipped: boolean;
};
