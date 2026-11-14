/** A day: 'YYYY-MM-DD', a Date, or a timestamp (seconds or ms). */
export type CalendarDate = string | number | Date;
/**
 * What a calendar shows: a year (2026), a month ('2026-10'), a day range (['2026-01-01', '2026-06-30']) or a
 * year as text ('2026').
 */
export type CalendarRange = number | string | [CalendarDate, CalendarDate];
export interface CalendarDatum {
    date: CalendarDate;
    /** null / missing = no value (empty cell) */
    value?: number | null;
    /** Own color for this day (wins over the visualMap) */
    color?: string;
    /** Extra text for the label / tooltip (e.g. a holiday name) */
    label?: string;
    /** Anything else you need in `renderCell` or the tooltip */
    [key: string]: unknown;
}
/** One day as drawn: given to `renderCell`, the tooltip, the events and `cellAt`. */
export interface CalendarCell {
    /** 'YYYY-MM-DD' */
    key: string;
    date: Date;
    /** 0 = the first day of the week (Monday by default) */
    weekday: number;
    /** Week column (horizontal) or row (vertical) inside its calendar */
    week: number;
    /** Index of the calendar (when there are several ranges) */
    calendar: number;
    value: number | null;
    datum: CalendarDatum | null;
    /** Fill color of the cell (visualMap / datum.color / empty) */
    color: string;
    /** Cell box in px, relative to the chart */
    x: number;
    y: number;
    w: number;
    h: number;
}
export interface CalendarTheme {
    background: string;
    text: string;
    muted: string;
    /** Fill of a day without value */
    cell: string;
    /** Lines between days */
    cellBorder: string;
    /** Line around each month */
    splitLine: string;
    tooltipBg: string;
    tooltipText: string;
    tooltipBorder: string;
    font: string;
}
export interface CalendarVisualMap {
    /** Value range of the colors. Default: the data's min / max */
    min?: number;
    max?: number;
    /** Colors from low to high (continuous) */
    colors?: string[];
    /** Or fixed pieces; a click on one in the legend hides / shows its days */
    pieces?: {
        min?: number;
        max?: number;
        value?: number;
        color: string;
        label?: string;
    }[];
    /** Show the legend. Default true */
    show?: boolean;
    /** Default 'bottom' */
    position?: 'bottom' | 'top' | 'right';
    title?: string;
    format?: (v: number) => string;
}
export interface CalendarLabelOptions {
    show?: boolean;
    /**
     * Text of a cell; one string per line. Default: the day of the month. Return '' to leave a cell empty.
     * e.g. (c) => [String(c.date.getDate()), c.datum?.label ?? '']
     */
    format?: (cell: CalendarCell) => string | string[];
    /** Default 'center' */
    position?: 'center' | 'top-left' | 'top';
    color?: string;
    fontSize?: number;
}
export interface CalendarOptions {
    /** One calendar, or several (years) one after the other. Default: the current year */
    range?: CalendarRange | CalendarRange[];
    /** 'horizontal' (default): a column per week, like GitHub; 'vertical': a row per week, like a wall calendar */
    orient?: 'horizontal' | 'vertical';
    /** First day of the week: 1 = Monday (default), 0 = Sunday */
    firstDay?: 0 | 1;
    /** Cell size in px: a number (square), [w, h], or 'auto' (default: fills the space) */
    cellSize?: number | [number, number] | 'auto';
    /** Space between the calendars, px. Default 28 */
    gap?: number;
    /** Day data: objects or [date, value] pairs */
    data?: (CalendarDatum | [CalendarDate, number | null])[];
    /**
     * How a value is drawn: 'heatmap' fills the cell (default), 'scatter' a circle sized by the value,
     * 'none' only the grid (use `renderCell` or labels).
     */
    type?: 'heatmap' | 'scatter' | 'none';
    /** Circle color for 'scatter' without visualMap. Default '#2962ff' */
    color?: string;
    /** 'scatter': radius from the smallest to the biggest value, as a fraction of half the cell. Default [0.15, 0.95] */
    symbolSize?: [number, number];
    /** 'scatter': the N biggest values pulse with ripples */
    effect?: {
        top: number;
        color?: string;
    };
    visualMap?: CalendarVisualMap | false;
    /** Weekday names. Default true (Seg, Ter… in Portuguese) */
    dayLabel?: boolean | {
        show?: boolean;
        names?: string[];
        color?: string;
    };
    /** Month names. Default true */
    monthLabel?: boolean | {
        show?: boolean;
        names?: string[];
        color?: string;
    };
    /** Year next to each calendar. Default true when there is more than one */
    yearLabel?: boolean | {
        show?: boolean;
        color?: string;
    };
    /** Line around each month. Default true */
    splitLine?: boolean | {
        show?: boolean;
        color?: string;
        width?: number;
    };
    /** Cell look */
    cell?: {
        color?: string;
        borderColor?: string;
        borderWidth?: number;
        radius?: number;
        gap?: number;
    };
    /** Text inside the cells. Default off */
    label?: boolean | CalendarLabelOptions;
    /** Draw your own content in a cell (pies, icons…), after its fill and before its label */
    renderCell?: (ctx: CanvasRenderingContext2D, cell: CalendarCell, api: CalendarGraphicApi) => void;
    /** Draw on top of everything (links between days, notes…) */
    graphic?: (ctx: CanvasRenderingContext2D, api: CalendarGraphicApi) => void;
    /** Keep redrawing every frame (for animations in `renderCell` / `graphic`). Default false */
    animate?: boolean;
    title?: string | {
        text: string;
        subtext?: string;
        align?: 'left' | 'center' | 'right';
    };
    tooltip?: boolean | {
        show?: boolean;
        formatter?: (cell: CalendarCell) => string;
    };
    /** Value text in the tooltip */
    valueFormatter?: (v: number) => string;
    /** 'transparent' for cards. Shortcut for theme.background */
    background?: string;
    /** Space around everything, px. Default 10 */
    padding?: number;
    theme?: 'dark' | 'light' | Partial<CalendarTheme>;
    /** Default true */
    animation?: boolean | {
        duration?: number;
    };
}
/** Helpers given to `renderCell` and `graphic` */
export interface CalendarGraphicApi {
    width: number;
    height: number;
    theme: CalendarTheme;
    /** The cell of a day, or null when it is not shown */
    cell: (date: CalendarDate) => CalendarCell | null;
    /** Every cell shown */
    cells: CalendarCell[];
    /** Color of a value on the visualMap */
    colorOf: (v: number) => string;
    /** Entry animation progress, 0–1 */
    progress: number;
    /** performance.now() of this frame (for your own animations with `animate`) */
    time: number;
}
export type CalendarEvent = 'click' | 'hover';
