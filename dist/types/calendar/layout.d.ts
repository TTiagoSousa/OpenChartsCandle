import type { CalendarDate, CalendarRange } from './types';
/** A day of one calendar, in grid units. */
export interface GridDay {
    key: string;
    date: Date;
    /** 0 = first day of the week */
    weekday: number;
    week: number;
    /** Grid position: column and row inside the calendar */
    col: number;
    row: number;
}
export interface Grid {
    index: number;
    start: Date;
    end: Date;
    days: GridDay[];
    cols: number;
    rows: number;
    /** Year shown next to the calendar ('2026', or '2025–2026' when it spans two) */
    year: string;
    /** Where each month starts: its first full week (column when horizontal, row when vertical) */
    months: {
        year: number;
        month: number;
        at: number;
    }[];
}
/** 'YYYY-MM-DD' of a local date. */
export declare function dayKey(d: Date): string;
/** A day as a local date at midnight, or null. Numbers are timestamps (seconds below 1e11, else ms). */
export declare function parseDay(v: CalendarDate): Date | null;
/** First and last day of a range: a year, 'YYYY', 'YYYY-MM', or [from, to]. */
export declare function rangeDays(r: CalendarRange): [Date, Date];
/**
 * The grid of one calendar. Horizontal: a column per week and a row per weekday (GitHub). Vertical: a row
 * per week and a column per weekday (a wall calendar).
 */
export declare function buildGrid(range: CalendarRange, index: number, orient: 'horizontal' | 'vertical', firstDay: 0 | 1): Grid;
/** Edges of a cell that border another month or the outside: [top, right, bottom, left]. */
export declare function monthEdges(day: GridDay, at: Map<string, GridDay>): [boolean, boolean, boolean, boolean];
