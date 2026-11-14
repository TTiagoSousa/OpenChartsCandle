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
  months: { year: number; month: number; at: number }[];
}

const pad = (n: number): string => String(n).padStart(2, '0');

/** 'YYYY-MM-DD' of a local date. */
export function dayKey(d: Date): string {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

/** A day as a local date at midnight, or null. Numbers are timestamps (seconds below 1e11, else ms). */
export function parseDay(v: CalendarDate): Date | null {
  if (v instanceof Date) return isNaN(+v) ? null : new Date(v.getFullYear(), v.getMonth(), v.getDate());
  if (typeof v === 'number') {
    if (!isFinite(v)) return null;
    const d = new Date(v < 1e11 ? v * 1000 : v);
    return new Date(d.getFullYear(), d.getMonth(), d.getDate());
  }
  const m = v.trim().match(/^(\d{4})(?:-(\d{1,2})(?:-(\d{1,2}))?)?/);
  if (!m) return null;
  return new Date(+m[1], m[2] ? +m[2] - 1 : 0, m[3] ? +m[3] : 1);
}

/** First and last day of a range: a year, 'YYYY', 'YYYY-MM', or [from, to]. */
export function rangeDays(r: CalendarRange): [Date, Date] {
  if (Array.isArray(r)) {
    const a = parseDay(r[0]);
    const b = parseDay(r[1]);
    if (!a || !b) throw new Error(`calendar: invalid range ${JSON.stringify(r)}`);
    return a <= b ? [a, b] : [b, a];
  }
  if (typeof r === 'number') return [new Date(r, 0, 1), new Date(r, 11, 31)];
  const m = r.trim().match(/^(\d{4})(?:-(\d{1,2}))?$/);
  if (!m) {
    const d = parseDay(r);
    if (!d) throw new Error(`calendar: invalid range ${r}`);
    return [d, d];
  }
  const y = +m[1];
  if (!m[2]) return [new Date(y, 0, 1), new Date(y, 11, 31)];
  const mo = +m[2] - 1;
  return [new Date(y, mo, 1), new Date(y, mo + 1, 0)];
}

/**
 * The grid of one calendar. Horizontal: a column per week and a row per weekday (GitHub). Vertical: a row
 * per week and a column per weekday (a wall calendar).
 */
export function buildGrid(range: CalendarRange, index: number, orient: 'horizontal' | 'vertical', firstDay: 0 | 1): Grid {
  const [start, end] = rangeDays(range);
  const first = (start.getDay() - firstDay + 7) % 7;
  const days: GridDay[] = [];
  const months: Grid['months'] = [];
  const horizontal = orient === 'horizontal';
  // step by calendar day (not by 86400 s) so DST changes do not skip or repeat a day
  for (let i = 0, d = start; d <= end; i++, d = new Date(start.getFullYear(), start.getMonth(), start.getDate() + i)) {
    const k = i + first;
    const weekday = k % 7;
    const week = Math.floor(k / 7);
    days.push({ key: dayKey(d), date: d, weekday, week, col: horizontal ? week : weekday, row: horizontal ? weekday : week });
    if (d.getDate() === 1 || i === 0) months.push({ year: d.getFullYear(), month: d.getMonth(), at: weekday === 0 ? week : week + 1 });
  }
  // a month starting in the last week has no full week: its label stays on that last week
  const weeks = days.length ? days[days.length - 1].week + 1 : 0;
  for (const m of months) m.at = Math.min(m.at, weeks - 1);
  const y0 = start.getFullYear();
  const y1 = end.getFullYear();
  return {
    index,
    start,
    end,
    days,
    cols: horizontal ? weeks : 7,
    rows: horizontal ? 7 : weeks,
    year: y0 === y1 ? String(y0) : `${y0}–${y1}`,
    months,
  };
}

/** Edges of a cell that border another month or the outside: [top, right, bottom, left]. */
export function monthEdges(day: GridDay, at: Map<string, GridDay>): [boolean, boolean, boolean, boolean] {
  const other = (c: number, r: number): boolean => {
    const n = at.get(`${c},${r}`);
    return !n || n.date.getMonth() !== day.date.getMonth() || n.date.getFullYear() !== day.date.getFullYear();
  };
  return [other(day.col, day.row - 1), other(day.col + 1, day.row), other(day.col, day.row + 1), other(day.col - 1, day.row)];
}
