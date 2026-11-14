import type { PaneView } from './view';
/**
 * A vertical line (only `from`) or a shaded zone (`from` → `to`) on the time axis: the start of a
 * simulation, the warm-up of the indicators, excluded periods, sessions…
 * Times are unix seconds or milliseconds. Each edge snaps to the bar that contains it, in any timeframe.
 */
export interface TimeRange {
    /** To change or remove it later. Default: generated. */
    id?: string;
    /** Start: where the line is, or the first instant of the zone. */
    from: number;
    /** End of the zone (exclusive). Omit for a line. */
    to?: number;
    /** Default: the theme's accent color. */
    color?: string;
    /** Text at the bottom of the main pane, next to the line or inside the zone. */
    label?: string;
    /** Line style (and the edges of a zone with `border`). Default 'dashed' for lines. */
    lineStyle?: 'solid' | 'dashed' | 'dotted';
    /** Line width in px. Default 1. */
    lineWidth?: number;
    /** Fill opacity of a zone, 0–1. Default 0.12. */
    opacity?: number;
    /** Draw the edges of a zone. Default false. */
    border?: boolean;
    /** Also in the indicator panes below the chart. Default true. */
    allPanes?: boolean;
}
/** Zones and lines behind the bars. `main` also draws the labels. */
export declare function drawTimeRanges(v: PaneView, ranges: TimeRange[], main: boolean): void;
