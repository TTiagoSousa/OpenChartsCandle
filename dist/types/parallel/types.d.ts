/** A value on one dimension: a number (value / log axes), a category name, or null (no value: the line breaks). */
export type ParallelValue = number | string | null;
/** One parallel axis (one dimension of the data). */
export interface ParallelAxis {
    name: string;
    /** Default 'value' ('category' when `data` is given) */
    type?: 'value' | 'log' | 'category';
    /** Categories, in order from the start of the axis (category axes). Default: the names found in the data */
    data?: string[];
    /** Start of the axis: a number or 'dataMin'. Default: the smallest value, rounded down */
    min?: number | 'dataMin';
    /** End of the axis: a number or 'dataMax'. Default: the biggest value, rounded up */
    max?: number | 'dataMax';
    /** Round the automatic ends to nice numbers. Default true */
    nice?: boolean;
    /** Small values at the end instead of the start */
    inverse?: boolean;
    /** Number of intervals between ticks (value axes). Default 5 */
    splitNumber?: number;
    /** Text of the tick labels */
    formatter?: (value: number | string) => string;
    /** Color of the axis line and name */
    color?: string;
}
/** One line (one row of the data). */
export interface ParallelItem {
    name?: string;
    /** One value per axis, in the order of `axes` */
    value: ParallelValue[];
    color?: string;
}
export interface ParallelSeries {
    /** Stable key (default: name) */
    id?: string;
    name: string;
    /** Rows: arrays of values (one per axis) or items */
    data: (ParallelValue[] | ParallelItem)[];
    color?: string;
    /** Line width px. Default `lineWidth` (1.2) */
    width?: number;
    /** Line opacity 0–1. Default `opacity` */
    opacity?: number;
    /** Curves between axes instead of straight segments. Default `smooth` */
    smooth?: boolean | number;
    /** Start hidden (toggle in the legend) */
    hidden?: boolean;
}
/** A piece of a piecewise visualMap: a value (categories) or a range, min included and max excluded. */
export interface ParallelPiece {
    min?: number;
    max?: number;
    value?: number | string;
    color: string;
    label?: string;
}
/** Color every line by its value on one dimension. */
export interface ParallelVisualMap {
    /** Axis index (in the order of `axes`) */
    dimension: number;
    /** Continuous: colors from min to max */
    colors?: string[];
    /** Range of the gradient. Default: the range of that axis */
    min?: number;
    max?: number;
    /** Piecewise: one color per value or range (click a piece to hide its lines) */
    pieces?: ParallelPiece[];
    /** Show the color bar / pieces under the chart. Default true */
    show?: boolean;
    title?: string;
    /** Text of the bar ends and range pieces */
    format?: (v: number) => string;
}
export interface ParallelTheme {
    background: string;
    text: string;
    muted: string;
    /** Axis lines and ticks */
    axis: string;
    /** Lines outside the brush */
    inactive: string;
    brushFill: string;
    brushBorder: string;
    tooltipBg: string;
    tooltipText: string;
    tooltipBorder: string;
    font: string;
}
/** A brushed range of one axis. */
export interface ParallelBrushRange {
    /** Axis index (in the order of `axes`) */
    axis: number;
    name: string;
    /** Value range (value / log axes) */
    from?: number;
    to?: number;
    /** Categories inside the range (category axes) */
    categories?: string[];
}
export interface ParallelBrushEvent {
    ranges: ParallelBrushRange[];
    /** Selected rows per visible series (indices into the series data) */
    selected: {
        seriesIndex: number;
        name: string;
        indices: number[];
    }[];
    /** Number of selected lines */
    count: number;
    /** Number of visible lines */
    total: number;
}
export interface ParallelOptions {
    axes?: ParallelAxis[];
    series?: ParallelSeries[];
    /** 'horizontal': axes side by side, each one vertical (default); 'vertical': axes stacked, each one horizontal */
    layout?: 'horizontal' | 'vertical';
    /** Palette */
    colors?: string[];
    visualMap?: ParallelVisualMap;
    /** Default line width px. 1.2 */
    lineWidth?: number;
    /** Default line opacity. 0.75 */
    opacity?: number;
    /** Curves between axes: true or a tension 0–1. Default false */
    smooth?: boolean | number;
    /** Drag along an axis to select a range; lines outside become inactive. Default true */
    brush?: boolean | {
        fill?: string;
        border?: string;
    };
    /** Look of the lines outside the brush */
    inactive?: {
        color?: string;
        opacity?: number;
    };
    /** Drag an axis by its name to move it. Default true */
    axisReorder?: boolean;
    /** Tick labels. Default true */
    axisLabel?: boolean | {
        color?: string;
        fontSize?: number;
    };
    /** Axis names */
    axisName?: {
        color?: string;
        fontSize?: number;
    };
    legend?: boolean | {
        show?: boolean;
        position?: 'top' | 'bottom' | 'left' | 'right';
        interactive?: boolean;
    };
    tooltip?: boolean | {
        show?: boolean;
        formatter?: (info: ParallelHoverInfo) => string;
    };
    /** Text of the values in the tooltip */
    valueFormatter?: (v: number | string, axis: ParallelAxis) => string;
    title?: string | {
        text: string;
        subtext?: string;
        align?: 'left' | 'center' | 'right';
    };
    /** 'transparent' for cards. Shortcut for theme.background */
    background?: string;
    /** Space around the axes, px. Default 12 */
    padding?: number;
    theme?: 'dark' | 'light' | Partial<ParallelTheme>;
    /** Lines draw in from the first axis. Default true */
    animation?: boolean | {
        duration?: number;
    };
}
export interface ParallelHoverInfo {
    series: ParallelSeries;
    seriesIndex: number;
    /** Row index inside the series */
    index: number;
    name: string;
    value: ParallelValue[];
    color: string;
    axes: ParallelAxis[];
}
export type ParallelEvent = 'hover' | 'click' | 'toggle' | 'brush' | 'axisorder';
