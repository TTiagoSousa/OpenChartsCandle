import { describe, expect, it } from 'vitest';
import { axisLabelPlan, bucketOrder, buildHeatGrid, heatmapCorrelation, heatmapReturns, heatPieceOf, labelStep, splitPieces } from '../../src/heatmap/grid';

describe('heatmap grid', () => {
  it('triples by index or by name, sized by the axes', () => {
    const g = buildHeatGrid(
      [
        ['b', 'Seg', 5],
        [0, 1, 2],
        ['c', 'Ter', null],
        ['zz', 'Seg', 9], // unknown name: ignored
      ],
      undefined,
      { data: ['a', 'b', 'c'] },
      { data: ['Seg', 'Ter'] },
    );
    expect([g.nx, g.ny]).toEqual([3, 2]);
    expect(g.values[0 * 3 + 1]).toBe(5);
    expect(g.values[1 * 3 + 0]).toBe(2);
    expect(Number.isNaN(g.values[1 * 3 + 2])).toBe(true);
    expect([g.min, g.max]).toEqual([2, 5]);
  });

  it('without axis data the size comes from the biggest index; objects keep their datum', () => {
    const g = buildHeatGrid([{ x: 3, y: 1, value: 7, color: 'red' }, [0, 0, 1]], undefined);
    expect([g.nx, g.ny]).toEqual([4, 2]);
    expect(g.xNames).toEqual([0, 1, 2, 3]);
    expect(g.datums.get(1 * 4 + 3)?.color).toBe('red');
  });

  it('a matrix is matrix[row][column]', () => {
    const g = buildHeatGrid(undefined, [
      [1, 2, 3],
      [4, null, 6],
    ]);
    expect([g.nx, g.ny]).toEqual([3, 2]);
    expect(g.values[1 * 3 + 2]).toBe(6);
    expect(Number.isNaN(g.values[1 * 3 + 1])).toBe(true);
  });

  it('numeric bins put values in floor((v - min) / step)', () => {
    const g = buildHeatGrid([[12.5, 0, 1], [10, 0, 2], [19.99, 0, 3]], undefined, { bins: { min: 10, step: 5, count: 2 } });
    expect(g.nx).toBe(2);
    expect(g.xNames).toEqual([10, 15]);
    expect(g.values[0]).toBe(2);
    expect(g.values[1]).toBe(3);
  });

  it('empty data falls back to a 0–1 range', () => {
    const g = buildHeatGrid([], undefined);
    expect([g.nx, g.ny, g.min, g.max]).toEqual([0, 0, 0, 1]);
  });
});

describe('axis labels', () => {
  it('flat when they fit, then 45° or fewer', () => {
    expect(axisLabelPlan(60, 40, 11)).toEqual({ rotate: 0, step: 1 });
    // long names in thin columns: tilted shows more of them
    expect(axisLabelPlan(20, 80, 11)).toEqual({ rotate: 45, step: 2 });
    // short names: thinning alone is as good
    expect(axisLabelPlan(10, 14, 11).rotate).toBe(0);
    expect(axisLabelPlan(10, 14, 11).step).toBe(2);
    // fixed rotation
    expect(axisLabelPlan(20, 80, 11, 0)).toEqual({ rotate: 0, step: 5 });
    expect(axisLabelPlan(30, 80, 11, 90).step).toBe(1);
  });
});

describe('pieces and buckets', () => {
  const pieces = [{ max: 10, color: 'a' }, { min: 10, max: 20, color: 'b' }, { value: 99, color: 'c' }];
  it('finds the piece of a value', () => {
    expect(heatPieceOf(pieces, 5)).toBe(0);
    expect(heatPieceOf(pieces, 10)).toBe(1);
    expect(heatPieceOf(pieces, 20)).toBe(-1);
    expect(heatPieceOf(pieces, 20, 20)).toBe(1); // top of the range is inclusive
    expect(heatPieceOf(pieces, 99)).toBe(2);
  });

  it('splits a range into equal pieces', () => {
    const p = splitPieces(0, 100, 4, ['#000000', '#ffffff'], String);
    expect(p.map((x) => [x.min, x.max])).toEqual([[0, 25], [25, 50], [50, 75], [75, 100]]);
    expect(p[0].color).toBe('rgb(0, 0, 0)');
    expect(p[3].color).toBe('rgb(255, 255, 255)');
    expect(p[1].label).toBe('25 – 50');
  });

  it('orders cells by bucket and skips empty ones', () => {
    const { order, start } = bucketOrder(Int16Array.from([2, 0, -1, 2, 1, 0]), 3);
    expect([...start]).toEqual([0, 2, 3, 5]);
    expect([...order]).toEqual([1, 5, 4, 0, 3]);
  });
});

describe('correlation', () => {
  it('returns', () => {
    expect(heatmapReturns([100, 110, 99])).toEqual([0.10000000000000009, -0.09999999999999998]);
  });

  it('pearson matrix: symmetric, 1 on the diagonal, ±1 for linear series', () => {
    const a = [1, 2, 3, 4, 5];
    const b = [2, 4, 6, 8, 10];
    const c = [5, 4, 3, 2, 1];
    const d = [3, 3, 3, 3, 3];
    const m = heatmapCorrelation([a, b, c, d]);
    expect(m[0][0]).toBe(1);
    expect(m[0][1]).toBeCloseTo(1);
    expect(m[0][2]).toBeCloseTo(-1);
    expect(m[2][0]).toBe(m[0][2]);
    expect(m[0][3]).toBe(0); // constant series
    expect(m[3][3]).toBe(1);
  });

  it('skips positions where either value is missing', () => {
    const m = heatmapCorrelation([
      [1, 2, NaN, 3, 4],
      [2, 1, 50, 4, 3],
    ]);
    // pairs: (1,2) (2,1) (3,4) (4,3) → r = 0.6
    expect(m[0][1]).toBeCloseTo(0.6);
  });
});

describe('label steps', () => {
  it('round steps', () => {
    expect(labelStep(10, 20)).toBe(1);
    expect(labelStep(30, 20)).toBe(2);
    expect(labelStep(14, 3.9)).toBe(5);
    expect(labelStep(60, 9)).toBe(10);
  });
});
