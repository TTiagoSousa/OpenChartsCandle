/** SVG path data → absolute commands (M, L, C, Q, Z), bounds and flattening. Pure, no DOM. */
export type CustomPathCommand = ['M', number, number] | ['L', number, number] | ['C', number, number, number, number, number, number] | ['Q', number, number, number, number] | ['Z'];
/** Parse SVG path data into absolute M / L / C / Q / Z commands (H, V, S, T and A are converted). */
export declare function customParsePath(d: string): CustomPathCommand[];
/** Replay commands on a canvas path, with every point mapped by `f`. */
export declare function customTracePath(ctx: Pick<CanvasRenderingContext2D, 'moveTo' | 'lineTo' | 'bezierCurveTo' | 'quadraticCurveTo' | 'closePath'>, cmds: CustomPathCommand[], f?: (x: number, y: number) => [number, number]): void;
/** Sub-paths as polylines (curves sampled in `steps` segments). */
export declare function customFlattenPath(cmds: CustomPathCommand[], steps?: number): {
    points: [number, number][];
    closed: boolean;
}[];
/** Bounding box of the path (curves sampled). */
export declare function customPathBounds(cmds: CustomPathCommand[]): {
    x: number;
    y: number;
    width: number;
    height: number;
};
