import { describe, expect, it } from 'vitest';
import { buildGrid, dayKey, monthEdges, parseDay, rangeDays } from '../../src/calendar/layout';

describe('dates', () => {
  it('parses days as local dates at midnight', () => {
    expect(dayKey(parseDay('2026-03-05')!)).toBe('2026-03-05');
    expect(dayKey(parseDay(new Date(2026, 2, 5, 17, 30))!)).toBe('2026-03-05');
    const t = new Date(2026, 2, 5, 12).getTime();
    expect(dayKey(parseDay(t)!)).toBe('2026-03-05'); // ms
    expect(dayKey(parseDay(t / 1000)!)).toBe('2026-03-05'); // seconds
    expect(parseDay('nope')).toBeNull();
  });

  it('ranges: a year, a month or two days', () => {
    expect(rangeDays(2026).map(dayKey)).toEqual(['2026-01-01', '2026-12-31']);
    expect(rangeDays('2026').map(dayKey)).toEqual(['2026-01-01', '2026-12-31']);
    expect(rangeDays('2026-02').map(dayKey)).toEqual(['2026-02-01', '2026-02-28']);
    expect(rangeDays('2024-02').map(dayKey)).toEqual(['2024-02-01', '2024-02-29']);
    expect(rangeDays(['2026-06-30', '2026-01-01']).map(dayKey)).toEqual(['2026-01-01', '2026-06-30']);
  });
});

describe('buildGrid', () => {
  it('a year has every day once, in order, one column per week', () => {
    const g = buildGrid(2026, 0, 'horizontal', 1);
    expect(g.days.length).toBe(365);
    expect(new Set(g.days.map((d) => d.key)).size).toBe(365);
    for (let i = 1; i < g.days.length; i++) expect(g.days[i].date.getTime()).toBeGreaterThan(g.days[i - 1].date.getTime());
    // 1 Jan 2026 is a Thursday: Monday first → weekday 3
    expect(g.days[0]).toMatchObject({ key: '2026-01-01', weekday: 3, week: 0, col: 0, row: 3 });
    // weekdays follow the calendar
    for (const d of g.days) expect(d.weekday).toBe((d.date.getDay() + 6) % 7);
    expect(g.rows).toBe(7);
    expect(g.cols).toBe(53);
    expect(g.year).toBe('2026');
  });

  it('a leap year and DST changes do not skip or repeat a day', () => {
    const g = buildGrid(2024, 0, 'horizontal', 1);
    expect(g.days.length).toBe(366);
    const keys = g.days.map((d) => d.key);
    expect(keys).toContain('2024-02-29');
    expect(keys).toContain('2024-03-31'); // DST in Europe
    expect(keys).toContain('2024-10-27');
  });

  it('vertical: a row per week and a column per weekday; Sunday first', () => {
    const g = buildGrid('2026-02', 0, 'vertical', 1);
    expect(g.days.length).toBe(28);
    // 1 Feb 2026 is a Sunday: last column of the first row; the 2nd starts the next row
    expect(g.days[0]).toMatchObject({ col: 6, row: 0 });
    expect(g.days[1]).toMatchObject({ key: '2026-02-02', col: 0, row: 1 });
    expect(g.cols).toBe(7);
    expect(g.rows).toBe(5);
    const s = buildGrid('2026-02', 0, 'vertical', 0);
    expect(s.days[0]).toMatchObject({ col: 0, row: 0 });
    expect(s.rows).toBe(4);
  });

  it('month labels sit on the first full week of each month', () => {
    const g = buildGrid(2026, 0, 'horizontal', 1);
    expect(g.months.length).toBe(12);
    // January starts on a Thursday (week 0): its first full week is week 1
    expect(g.months[0]).toMatchObject({ month: 0, at: 1 });
    // June 2026 starts on a Monday: its own week
    const june = g.days.find((d) => d.key === '2026-06-01')!;
    expect(g.months[5]).toMatchObject({ month: 5, at: june.week });
  });

  it('month outline: edges between months and on the border', () => {
    const g = buildGrid('2026-02', 0, 'vertical', 1);
    const at = new Map(g.days.map((d) => [`${d.col},${d.row}`, d]));
    // the 1st (top right corner): border on every side but the bottom
    expect(monthEdges(g.days[0], at)).toEqual([true, true, false, true]);
    // a day in the middle: no edge
    const mid = g.days.find((d) => d.key === '2026-02-11')!;
    expect(monthEdges(mid, at)).toEqual([false, false, false, false]);
  });
});
