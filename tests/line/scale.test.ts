import { describe, expect, it } from 'vitest';
import { detectXType, formatCompact, monotoneTangents, nearestIndex, niceScale, timeTicks } from '../../src/line/scale';

describe('niceScale', () => {
  it('covers the range with round ticks', () => {
    const s = niceScale(3, 97, 5);
    expect(s.min).toBe(0);
    expect(s.max).toBe(100);
    expect(s.ticks).toEqual([0, 20, 40, 60, 80, 100]);
  });

  it('handles a flat series', () => {
    const s = niceScale(50, 50, 4);
    expect(s.min).toBeLessThan(50);
    expect(s.max).toBeGreaterThan(50);
  });
});

describe('timeTicks', () => {
  it('daily range → day labels, one per day', () => {
    const start = new Date(2026, 9, 1).getTime() / 1000;
    const ticks = timeTicks(start, start + 6 * 86400, 7);
    expect(ticks).toHaveLength(7);
    expect(ticks[0].label).toBe('1 Out');
  });

  it('intraday range → HH:MM labels aligned to round times', () => {
    const start = new Date(2026, 9, 1, 9, 7).getTime() / 1000;
    const ticks = timeTicks(start, start + 3 * 3600, 6);
    expect(ticks.every((t) => /^\d\d:\d\d$/.test(t.label) || /Out/.test(t.label))).toBe(true);
    expect(new Date(ticks[0].value * 1000).getMinutes() % 30).toBe(0);
  });

  it('multi-year range → months / years', () => {
    const start = new Date(2020, 0, 1).getTime() / 1000;
    const ticks = timeTicks(start, new Date(2026, 0, 1).getTime() / 1000, 6);
    expect(ticks.some((t) => t.label === '2024')).toBe(true);
  });
});

describe('helpers', () => {
  it('formatCompact', () => {
    expect(formatCompact(1234567)).toBe('1.23M');
    expect(formatCompact(25000)).toBe('25K');
    expect(formatCompact(12.345)).toBe('12.35');
  });

  it('nearestIndex', () => {
    expect(nearestIndex([0, 10, 20, 30], 14)).toBe(1);
    expect(nearestIndex([0, 10, 20, 30], 16)).toBe(2);
    expect(nearestIndex([0, 10, 20, 30], 99)).toBe(3);
  });

  it('monotone curve never overshoots at a local max (flat tangent)', () => {
    const m = monotoneTangents([0, 1, 2], [0, 10, 0]);
    expect(m[1]).toBe(0);
  });

  it('detectXType', () => {
    expect(detectXType(['Jan', 'Fev'])).toBe('category');
    expect(detectXType([1760000000, 1760086400])).toBe('time');
    expect(detectXType([1, 2, 3])).toBe('number');
  });
});
