/** One bar with its own style (any field left out uses the series style). */
export interface BarItem {
    value: number | null;
    color?: string;
    /** Gradient of this bar (tip → base) */
    gradient?: string[];
    borderColor?: string;
    borderWidth?: number;
    opacity?: number;
    /** Text of the value label of this bar */
    label?: string;
}
export type BarValue = number | null | BarItem;
export type BarAxisId = 'left' | 'right' | 'right2';
export interface BarSeries {
    /** Stable key (default: name) */
    id?: string;
    name: string;
    /** One value per category (null = no bar), or { value, color, … } to style a single bar */
    data: BarValue[];
    color?: string;
    /** Color of negative values (default: color) */
    negativeColor?: string;
    /** Gradient fill along the bar, from the tip to the base, e.g. ['#83bff6', '#188df0'] */
    gradient?: string[];
    borderColor?: string;
    borderWidth?: number;
    /** Series with the same `stack` key are stacked together (when `stacked` is on) */
    stack?: string;
    /** Value axis: 'left' (default), 'right' or 'right2' (a third axis further right) */
    axis?: BarAxisId;
    /** Full-length track behind every bar: true or its color */
    background?: boolean | string;
    /** Helper series (e.g. the invisible base of a waterfall): no tooltip, legend or hover */
    silent?: boolean;
    /** Automatic marks: pins on the highest / lowest bar and a line at the average */
    marks?: {
        max?: boolean;
        min?: boolean;
        average?: boolean;
    };
    /** Start hidden */
    hidden?: boolean;
}
export interface BarTheme {
    background: string;
    text: string;
    muted: string;
    grid: string;
    axis: string;
    /** Highlight of the hovered category */
    hover: string;
    tooltipBg: string;
    tooltipText: string;
    tooltipBorder: string;
    font: string;
}
export interface BarDatum {
    series: BarSeries;
    seriesIndex: number;
    categoryIndex: number;
    category: string;
    value: number;
    color: string;
    /** % of the category total (stacked percent) */
    percent: number;
    /** The item when the data point was given as { value, … } */
    item?: BarItem;
}
export type BarOverlayType = 'sma' | 'ema' | 'wma' | 'linear' | 'exponential' | 'average' | 'cumulative' | 'line';
/** A line drawn over the bars (moving average, trend, cumulative…). */
export interface BarOverlay {
    /**
     * - 'sma' / 'ema' / 'wma': simple, exponential or weighted moving average over `period` bars
     * - 'linear' / 'exponential': least-squares trend line (exponential = constant % growth)
     * - 'average': flat line at the mean
     * - 'cumulative': running total (`percent: true` = running % of the total, Pareto)
     * - 'line': your own values in `data` (e.g. a target or an indicator from the backend)
     */
    type: BarOverlayType;
    /** Stable key for toggle / legend (default: name) */
    id?: string;
    /** Legend / tooltip name (default: a name from the type, e.g. 'Média móvel (3)') */
    name?: string;
    /** Series used for the calculation (id or name), or 'total' = sum of the visible series. Default: first series */
    source?: string;
    /** Window of the moving averages. Default 3 */
    period?: number;
    /** Values for type 'line', one per category */
    data?: (number | null)[];
    /** Cumulative as % of the total (0–100). Default false */
    percent?: boolean;
    color?: string;
    /** Line width. Default 2 */
    width?: number;
    dash?: number[];
    /** Smooth curve (monotone). Default true for averages, false otherwise */
    smooth?: boolean;
    /** Dots on every point. Default false */
    points?: boolean;
    /** Value axis: 'left' (with the bars), 'right' or 'right2'. Default 'right' for cumulative, else 'left' */
    axis?: BarAxisId;
    /** Start hidden */
    hidden?: boolean;
}
export interface BarOverlayValue {
    overlay: BarOverlay;
    id: string;
    name: string;
    value: number | null;
    color: string;
}
export interface BarTooltipContext {
    categoryIndex: number;
    category: string;
    items: BarDatum[];
    total: number;
    /** values of the overlay lines at this category */
    overlays: BarOverlayValue[];
}
export interface BarAxisOptions {
    show?: boolean;
    title?: string;
    format?: (v: number) => string;
    grid?: boolean;
    min?: number;
    max?: number;
    ticks?: number;
}
/** Helpers given to `graphic` */
export interface BarGraphicApi {
    plot: {
        x: number;
        y: number;
        w: number;
        h: number;
    };
    width: number;
    height: number;
    theme: BarTheme;
    /** center of a category (index or name) along the category axis, px */
    category: (c: number | string) => number;
    /** a value on a value axis, px */
    value: (v: number, axis?: BarAxisId) => number;
    vertical: boolean;
}
export interface BarOptions {
    categories?: string[];
    series?: BarSeries[];
    /** 'vertical' = columns, 'horizontal' = bars. Default 'vertical' */
    orientation?: 'vertical' | 'horizontal';
    /** Stack series. 'percent' = 100% stacked. Default false (grouped) */
    stacked?: boolean | 'percent';
    /** Empty space between categories, 0–0.9 of the category width. Default 0.25 */
    categoryGap?: number;
    /** Space between bars of the same category, px. Default 3 */
    barGap?: number;
    /** Maximum bar thickness, px. Default none */
    maxBarWidth?: number;
    /** Rounded corners at the end of the bar, px. Default 3 */
    radius?: number;
    /** Sort categories by total. Default 'none' (changes animate: bars slide to their new place) */
    sort?: 'none' | 'asc' | 'desc';
    /** Show only the first N categories (after sorting), e.g. a top-10 race */
    limit?: number;
    /** 'total': each category is as wide as its total (Mekko / variable width). Default equal widths */
    widthBy?: 'equal' | 'total';
    colors?: string[];
    /** Color every bar from its value (e.g. green/red for P&L) */
    colorBy?: (value: number, categoryIndex: number, series: BarSeries) => string;
    background?: string;
    theme?: 'dark' | 'light' | Partial<BarTheme>;
    padding?: number;
    /** Category axis. ticks: marks at the category centers ('center') or between them ('edge') */
    categoryAxis?: {
        show?: boolean;
        title?: string;
        format?: (category: string, index: number) => string;
        grid?: boolean;
        ticks?: boolean | 'center' | 'edge';
    };
    /** Value axis (left). breaks: value ranges cut out of the axis (e.g. one huge bar) */
    valueAxis?: BarAxisOptions & {
        breaks?: {
            from: number;
            to: number;
        }[];
    };
    /** Second value axis for series / overlays with axis: 'right' (right side; on top for horizontal bars) */
    rightAxis?: BarAxisOptions;
    /** Third value axis (axis: 'right2'), drawn after the right axis */
    right2Axis?: BarAxisOptions;
    labels?: {
        show?: boolean;
        /** 'outside' (after the end), 'inside' (inside the end), 'center', 'base' (inside, at the base). Default 'outside' (stacked: 'center') */
        position?: 'outside' | 'inside' | 'center' | 'base';
        /** Rotation in degrees (e.g. 90 for vertical text inside thin columns) */
        rotate?: number;
        format?: (v: number, d: BarDatum) => string;
        color?: string;
        fontSize?: number;
    };
    legend?: {
        show?: boolean;
        position?: 'top' | 'bottom' | 'right' | 'left';
        interactive?: boolean;
        marker?: 'square' | 'circle';
        align?: 'start' | 'center' | 'end';
        fontSize?: number;
    };
    tooltip?: {
        show?: boolean;
        /** 'shared' = every series of the category, 'single' = the hovered bar. Default 'shared' */
        mode?: 'shared' | 'single';
        formatter?: (ctx: BarTooltipContext) => string;
        /** Show the category total. Default true when stacked */
        total?: boolean;
    };
    /** Moving averages, trends, cumulative or your own lines, drawn over the bars */
    overlays?: BarOverlay[];
    /**
     * Zoom on the categories: wheel zooms, drag pans, double-click resets.
     * { slider: true } adds a range slider (columns only); start / end in % of the categories.
     */
    zoom?: boolean | {
        slider?: boolean;
        start?: number;
        end?: number;
    };
    /** Drag a rectangle to select bars (event 'brush'); a click clears the selection */
    brush?: boolean;
    /**
     * Polar coordinates. categories: 'angle' (each category is a slice of the circle and the bars
     * grow outwards) or 'radius' (each category is a ring and the bars sweep around it).
     * Angles in degrees, 0 = top, clockwise.
     */
    polar?: boolean | {
        categories?: 'angle' | 'radius';
        startAngle?: number;
        endAngle?: number;
        innerRadius?: number;
        roundCap?: boolean;
    };
    /** Mini chart preset: no axes, grid or legend, tiny padding */
    sparkline?: boolean;
    /** Draw your own shapes and text on top of the chart */
    graphic?: (ctx: CanvasRenderingContext2D, api: BarGraphicApi) => void;
    /** Reference lines on the value axis */
    annotations?: {
        value: number;
        label?: string;
        color?: string;
        dash?: number[];
    }[];
    /** Opacity of other bars while one series is highlighted. Default 0.3 */
    hoverDim?: number;
    valueFormatter?: (v: number, series: BarSeries) => string;
    /** duration ms; stagger: extra delay per category, ms (bars appear one after the other) */
    animation?: boolean | {
        duration?: number;
        stagger?: number;
    };
    emptyText?: string;
}
export type BarEvent = 'hover' | 'click' | 'toggle' | 'zoom' | 'brush';
