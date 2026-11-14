import { ScatterChart } from './scatter';
import type { ScatterTheme, ScatterValue } from './types';
export interface ScatterMatrixOptions {
    /** Rows of values, in the order of `dimensions` */
    rows: ScatterValue[][];
    /** Names of the numeric columns to cross (indexes into each row are 0, 1, 2…) */
    dimensions: string[];
    /** Index of the column with the group (color) of each row, e.g. the species */
    groupBy?: number;
    /** Which columns to show (default: every dimension except `groupBy`) */
    columns?: number[];
    colors?: string[];
    theme?: 'dark' | 'light' | Partial<ScatterTheme>;
    background?: string;
    /** Diameter px. Default 5 */
    symbolSize?: number;
    /** Drag in any cell to select rows in every cell. Default true */
    brush?: boolean;
    /** Space between cells px. Default 6 */
    gap?: number;
    format?: (v: number, dimension: number) => string;
    /** Legend of the groups. Default true when there are groups */
    legend?: boolean;
}
/**
 * Scatter matrix: every pair of columns in a grid of small scatter charts, colored by group, with
 * a brush that selects the same rows in every cell.
 */
export declare class ScatterMatrix {
    readonly root: HTMLElement;
    readonly charts: ScatterChart[];
    private grid;
    private legendEl;
    private handlers;
    private opts;
    private hidden;
    constructor(container: HTMLElement, options: ScatterMatrixOptions);
    private columns;
    private groups;
    private build;
    private applySelection;
    /** Highlight these rows (indexes) in every cell; null clears. */
    select(rows: number[] | null): void;
    /** Rows selected with the brush (indexes into `rows`). */
    on(event: 'brush', handler: (rows: number[]) => void): () => void;
    destroy(): void;
}
export declare function createScatterMatrix(container: HTMLElement, options: ScatterMatrixOptions): ScatterMatrix;
