import { describe, expect, it } from 'vitest';
import { buildParallelScale, parallelInRanges, parallelPieceIndex, parallelRangeValues, parallelSegmentAt } from '../../src/parallel/scale';

describe('parallel scales', () => {
  it('value axes get nice ends and ticks', () => {
    const s = buildParallelScale({ name: 'A' }, [3, 47, 12, null]);
    expect(s.type).toBe('value');
    expect(s.min).toBe(0);
    expect(s.max).toBe(50);
    expect(s.ticks.map((t) => t.value)).toEqual([0, 10, 20, 30, 40, 50]);
    expect(s.toT(25)).toBeCloseTo(0.5);
    expect(s.toT(null)).toBeNaN();
    expect(s.fromT(0.2)).toBeCloseTo(10);
  });

  it('fixed ends, dataMin / dataMax and nice: false', () => {
    const s = buildParallelScale({ name: 'A', min: 0, max: 200 }, [3, 47]);
    expect([s.min, s.max]).toEqual([0, 200]);
    const d = buildParallelScale({ name: 'A', min: 'dataMin', max: 'dataMax' }, [3, 47]);
    expect([d.min, d.max]).toEqual([3, 47]);
    const n = buildParallelScale({ name: 'A', nice: false }, [3, 47]);
    expect([n.min, n.max]).toEqual([3, 47]);
    expect(n.ticks.every((t) => t.t >= 0 && t.t <= 1)).toBe(true);
  });

  it('inverse flips positions', () => {
    const s = buildParallelScale({ name: 'A', inverse: true, min: 0, max: 10 }, []);
    expect(s.toT(0)).toBe(1);
    expect(s.toT(10)).toBe(0);
    expect(s.fromT(0)).toBe(10);
  });

  it('a single value still makes a range', () => {
    const s = buildParallelScale({ name: 'A' }, [5, 5]);
    expect(s.max).toBeGreaterThan(s.min);
    expect(s.toT(5)).toBeGreaterThan(0);
    expect(s.toT(5)).toBeLessThan(1);
  });

  it('category axes: given list or names found in the data', () => {
    const s = buildParallelScale({ name: 'G', data: ['Bom', 'Moderado', 'Mau'] }, []);
    expect(s.type).toBe('category');
    expect(s.toT('Bom')).toBe(0);
    expect(s.toT('Moderado')).toBe(0.5);
    expect(s.toT('Mau')).toBe(1);
    expect(s.toT('outro')).toBeNaN();
    const f = buildParallelScale({ name: 'G' }, ['b', 'a', 'b', null, 'c']);
    expect(f.categories).toEqual(['b', 'a', 'c']);
    expect(f.fromT(0.6)).toBe(1);
  });

  it('log axes cover whole decades', () => {
    const s = buildParallelScale({ name: 'Cap', type: 'log' }, [3, 4500, -1, 0]);
    expect(s.min).toBe(1);
    expect(s.max).toBe(10000);
    expect(s.toT(100)).toBeCloseTo(0.5);
    expect(s.toT(-1)).toBeNaN();
    expect(s.ticks.map((t) => t.value)).toEqual([1, 10, 100, 1000, 10000]);
  });
});

describe('parallel brush', () => {
  // three rows, two dims
  const T = [0.1, 0.9, 0.5, 0.5, 0.8, NaN];

  it('no ranges = every row', () => {
    expect([0, 1, 2].map((r) => parallelInRanges(T, r, 2, []))).toEqual([true, true, true]);
  });

  it('several ranges are AND, NaN never inside', () => {
    const one = [{ dim: 0, lo: 0.4, hi: 1 }];
    expect([0, 1, 2].map((r) => parallelInRanges(T, r, 2, one))).toEqual([false, true, true]);
    const two = [...one, { dim: 1, lo: 0, hi: 0.6 }];
    expect([0, 1, 2].map((r) => parallelInRanges(T, r, 2, two))).toEqual([false, true, false]);
  });

  it('ranges back to axis units', () => {
    const s = buildParallelScale({ name: 'A', min: 0, max: 100 }, []);
    expect(parallelRangeValues(s, 0.2, 0.5)).toEqual({ from: 20, to: 50 });
    const inv = buildParallelScale({ name: 'A', min: 0, max: 100, inverse: true }, []);
    expect(parallelRangeValues(inv, 0.2, 0.5)).toEqual({ from: 50, to: 80 });
    const c = buildParallelScale({ name: 'G', data: ['a', 'b', 'c', 'd', 'e'] }, []);
    expect(parallelRangeValues(c, 0.2, 0.6).categories).toEqual(['b', 'c']);
  });
});

describe('parallel helpers', () => {
  it('pieces: value match or min ≤ v < max', () => {
    const pieces = [{ max: 50, color: 'a' }, { min: 50, max: 100, color: 'b' }, { min: 100, color: 'c' }, { value: 'Mau', color: 'd' }];
    expect(parallelPieceIndex(pieces, 10)).toBe(0);
    expect(parallelPieceIndex(pieces, 50)).toBe(1);
    expect(parallelPieceIndex(pieces, 300)).toBe(2);
    expect(parallelPieceIndex(pieces, 'Mau')).toBe(3);
    expect(parallelPieceIndex(pieces, null)).toBe(-1);
    expect(parallelPieceIndex([{ min: 0, max: 1, color: 'x' }], 5)).toBe(-1);
  });

  it('segments: straight or eased, same ends', () => {
    expect(parallelSegmentAt(0, 1, 0.25, 0)).toBe(0.25);
    expect(parallelSegmentAt(0, 1, 0, 0.5)).toBe(0);
    expect(parallelSegmentAt(0, 1, 1, 0.5)).toBe(1);
    expect(parallelSegmentAt(0, 1, 0.5, 0.5)).toBeCloseTo(0.5);
    expect(parallelSegmentAt(0, 1, 0.25, 0.5)).toBeLessThan(0.25);
  });
});
