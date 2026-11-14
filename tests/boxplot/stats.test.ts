import { describe, expect, it } from 'vitest';
import { boxplotAggregate, boxplotQuantile, boxplotStats } from '../../src/boxplot/stats';

describe('boxplot stats', () => {
  it('quantiles interpolate between the closest ranks (type 7)', () => {
    const v = [1, 2, 3, 4];
    expect(boxplotQuantile(v, 0)).toBe(1);
    expect(boxplotQuantile(v, 1)).toBe(4);
    expect(boxplotQuantile(v, 0.5)).toBe(2.5);
    expect(boxplotQuantile(v, 0.25)).toBe(1.75);
    expect(boxplotQuantile([7], 0.3)).toBe(7);
    expect(boxplotQuantile([], 0.5)).toBeNaN();
  });

  it('box, whiskers at 1.5 × IQR and outliers', () => {
    const s = boxplotStats([1, 2, 3, 4, 5, 6, 7, 8, 9, 100])!;
    expect(s.q1).toBe(3.25);
    expect(s.median).toBe(5.5);
    expect(s.q3).toBe(7.75);
    expect(s.iqr).toBe(4.5);
    // fences: -3.5 and 14.5 → the whiskers stop at the last values inside
    expect(s.low).toBe(1);
    expect(s.high).toBe(9);
    expect(s.outliers).toEqual([100]);
    expect(s.min).toBe(1);
    expect(s.max).toBe(100);
    expect(s.count).toBe(10);
    expect(s.mean).toBe(14.5);
  });

  it('whisker option: another k, or the full range', () => {
    const v = [1, 2, 3, 4, 5, 6, 7, 8, 9, 100];
    expect(boxplotStats(v, { whisker: 'range' })!.high).toBe(100);
    expect(boxplotStats(v, { whisker: 'range' })!.outliers).toEqual([]);
    expect(boxplotStats(v, { whisker: 0.1 })!.outliers).toEqual([1, 2, 9, 100]);
    expect(boxplotStats(v, { whisker: 0.1 })!.low).toBe(3);
  });

  it('ignores non-numbers, unsorted input, empty input', () => {
    const s = boxplotStats([5, null, 1, NaN, 3, undefined])!;
    expect(s.count).toBe(3);
    expect(s.median).toBe(3);
    expect(s.low).toBe(1);
    expect(s.high).toBe(5);
    expect(boxplotStats([])).toBeNull();
    expect(boxplotStats([null, NaN])).toBeNull();
  });

  it('Michelson–Morley experiment 1', () => {
    const e1 = [850, 740, 900, 1070, 930, 850, 950, 980, 980, 880, 1000, 980, 930, 650, 760, 810, 1000, 1000, 960, 960];
    const s = boxplotStats(e1)!;
    expect(s.q1).toBe(850);
    expect(s.median).toBe(940);
    expect(s.q3).toBe(980);
    expect(s.low).toBe(740);
    expect(s.high).toBe(1070);
    expect(s.outliers).toEqual([650]);
  });

  it('aggregates rows into categories and series', () => {
    const rows = [
      { c: 'B', s: 'x', v: 1 },
      { c: 'A', s: 'x', v: 2 },
      { c: 'A', s: 'y', v: 3 },
      { c: 'A', s: 'x', v: 4 },
      { c: 'B', s: 'x', v: NaN },
    ];
    const r = boxplotAggregate(rows, { category: 'c', value: 'v', series: 's' });
    expect(r.categories).toEqual(['B', 'A']);
    expect(r.series).toEqual([
      { name: 'x', samples: [[1], [2, 4]] },
      { name: 'y', samples: [null, [3]] },
    ]);
    const one = boxplotAggregate(rows, { category: (x) => x.c, value: (x) => x.v * 10, name: 'Tudo', sort: (a, b) => a.localeCompare(b) });
    expect(one.categories).toEqual(['A', 'B']);
    expect(one.series).toEqual([{ name: 'Tudo', samples: [[20, 30, 40], [10]] }]);
  });
});
