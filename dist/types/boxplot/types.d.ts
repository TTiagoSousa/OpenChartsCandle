/** A precomputed box: [min, Q1, median, Q3, max] (min and max are the ends of the whiskers). */
export type BoxplotValue = [min: number, q1: number, median: number, q3: number, max: number];
/** One box of a series (one per category): precomputed (`value`) or computed from raw `samples`. */
export interface BoxplotItem {
    /** Name in the tooltip (default: the category) */
    name?: string;
    /** Precomputed box */
    value?: BoxplotValue;
    /** Raw values: the library computes the box, the whiskers and the outliers */
    samples?: number[];
    /** Points beyond the whiskers (with `value`; with `samples` they are computed) */
    outliers?: number[];
    /** Mean marker position (with `value`; with `samples` it is computed) */
    mean?: number;
    color?: string;
}
export type BoxplotSymbol = 'circle' | 'square' | 'diamond' | 'cross';
export interface BoxplotSeries {
    /** Stable key (default: name) */
    id?: string;
    name: string;
    /** One box per category, in the order of `categories`; null = no box */
    data?: (BoxplotValue | BoxplotItem | null)[];
    /** Shortcut: raw values per category (same as data: [{ samples }]) */
    samples?: (number[] | null)[];
    color?: string;
    /** Box fill: opacity of the series color (0–1) or a CSS color. Default 0.2 */
    fill?: number | string;
    /** Line width px. Default 1.5 */
    width?: number;
    /** Mean marker (overrides the chart option) */
    mean?: boolean | {
        symbol?: BoxplotSymbol;
        size?: number;
        color?: string;
    };
    /** Outlier points. Default true */
    outliers?: boolean | {
        size?: number;
        symbol?: BoxplotSymbol;
        color?: string;
    };
    /** Raw values drawn as jittered points (only with samples; overrides the chart option) */
    points?: boolean | BoxplotPointsOptions;
    /** Start hidden (toggle in the legend) */
    hidden?: boolean;
}
export interface BoxplotPointsOptions {
    /** 'over' the box, or 'beside' it (the box moves to one side of its slot). Default 'over' */
    position?: 'over' | 'beside';
    /** Radius px. Default 2.5 */
    size?: number;
    /** Default 0.55 */
    opacity?: number;
    /** Spread as a fraction of the box width. Default 0.8 */
    jitter?: number;
    color?: string;
}
export interface BoxplotCategoryAxis {
    /** Default true */
    show?: boolean;
    title?: string;
    format?: (category: string, index: number) => string;
    /** Rotate the labels (degrees). Default: automatic when they do not fit */
    rotate?: number;
    /** Lines between categories. Default false */
    grid?: boolean;
    color?: string;
}
export interface BoxplotValueAxis {
    /** Default true */
    show?: boolean;
    title?: string;
    format?: (v: number) => string;
    /** Fixed range (default: nice values around the data) */
    min?: number;
    max?: number;
    /** Include 0 in the range. Default false */
    beginAtZero?: boolean;
    /** Approximate number of ticks */
    ticks?: number;
    /** Grid lines. Default true */
    grid?: boolean;
    gridDash?: number[];
    color?: string;
}
export interface BoxplotTheme {
    background: string;
    text: string;
    muted: string;
    grid: string;
    /** Axis lines */
    axis: string;
    tooltipBg: string;
    tooltipText: string;
    tooltipBorder: string;
    font: string;
}
export interface BoxplotOptions {
    /** Names of the categories (default: the item names of the first series, or 1, 2, 3…) */
    categories?: string[];
    series?: BoxplotSeries[];
    /** 'vertical' (categories along x, default) or 'horizontal' (categories along y, the first on top) */
    orient?: 'vertical' | 'horizontal';
    /** Whiskers of the boxes computed from samples: k × IQR (default 1.5), or 'range' (min–max, no outliers) */
    whisker?: number | 'range';
    categoryAxis?: BoxplotCategoryAxis;
    valueAxis?: BoxplotValueAxis;
    /** Part of each category band used by its boxes (0–1). Default 0.7 */
    bandWidth?: number;
    /** Box width limits in px. Default [7, 50] */
    boxWidth?: [min: number, max: number];
    /** Mean marker on every series. Default false */
    mean?: boolean;
    /** Raw values as jittered points on every series with samples. Default false */
    points?: boolean | BoxplotPointsOptions;
    /** Palette */
    colors?: string[];
    legend?: boolean | {
        show?: boolean;
        position?: 'top' | 'bottom' | 'left' | 'right';
        interactive?: boolean;
    };
    tooltip?: boolean | {
        show?: boolean;
        formatter?: (info: BoxplotHoverInfo) => string;
    };
    valueFormatter?: (v: number) => string;
    /** Opacity of the other series while one is hovered. Default 0.4 */
    hoverDim?: number;
    title?: string | {
        text: string;
        subtext?: string;
        align?: 'left' | 'center' | 'right';
    };
    /** 'transparent' for cards. Shortcut for theme.background */
    background?: string;
    /** Space around everything, px. Default 10 */
    padding?: number;
    theme?: 'dark' | 'light' | Partial<BoxplotTheme>;
    /** Default true */
    animation?: boolean | {
        duration?: number;
    };
}
/** The numbers of one box. */
export interface BoxplotBox {
    /** Lower whisker end */
    min: number;
    q1: number;
    median: number;
    q3: number;
    /** Upper whisker end */
    max: number;
    mean?: number;
    /** Number of samples (computed boxes) */
    count?: number;
    outliers: number[];
}
export interface BoxplotHoverInfo {
    series: BoxplotSeries;
    seriesIndex: number;
    category: string;
    categoryIndex: number;
    name: string;
    color: string;
    /** What is under the mouse: the box, an outlier or one raw point */
    kind: 'box' | 'outlier' | 'point';
    /** [min, Q1, median, Q3, max] */
    value: BoxplotValue;
    stats: BoxplotBox;
    /** The outlier or point value (kind 'outlier' / 'point') */
    point?: number;
}
export type BoxplotEvent = 'hover' | 'click' | 'toggle';
