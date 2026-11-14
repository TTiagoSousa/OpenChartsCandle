import { describe, expect, it } from 'vitest';
import { beeswarm, convexHull, kmeans, regression } from '../../src/scatter/stats';
import { MORPH_POINTS, symbolSamples } from '../../src/scatter/symbols';

const ANSCOMBE_X = [10, 8, 13, 9, 11, 14, 6, 4, 12, 7, 5];
const ANSCOMBE_Y = [8.04, 6.95, 7.58, 8.81, 8.33, 9.96, 7.24, 4.26, 10.84, 4.82, 5.68];

describe('regression', () => {
  it('linear: Anscombe I gives y = 3 + 0.5x', () => {
    const r = regression('linear', ANSCOMBE_X.map((x, i) => [x, ANSCOMBE_Y[i]]));
    expect(r.coefficients[0]).toBeCloseTo(3.0, 2);
    expect(r.coefficients[1]).toBeCloseTo(0.5, 3);
    expect(r.r2).toBeCloseTo(0.6665, 3);
    expect(r.expression).toBe('y = 0.5001x + 3');
  });

  it('exponential, logarithmic and polynomial recover exact curves', () => {
    const xs = [1, 2, 3, 4, 5, 6, 7, 8];
    const e = regression('exponential', xs.map((x) => [x, 2 * Math.exp(0.3 * x)]));
    expect(e.coefficients[0]).toBeCloseTo(2, 6);
    expect(e.coefficients[1]).toBeCloseTo(0.3, 6);
    const l = regression('logarithmic', xs.map((x) => [x, 5 + 3 * Math.log(x)]));
    expect(l.predict(10)).toBeCloseTo(5 + 3 * Math.log(10), 6);
    const p = regression('polynomial', xs.map((x) => [x, x ** 3 - 2 * x + 1]), 3);
    expect(p.predict(10)).toBeCloseTo(981, 4);
    expect(p.r2).toBeCloseTo(1, 9);
  });

  it('ignores points the model cannot use', () => {
    const r = regression('logarithmic', [[0, 1], [-2, 3], [1, 1], [Math.E, 2]]);
    expect(r.predict(Math.E ** 2)).toBeCloseTo(3, 6);
  });
});

describe('kmeans', () => {
  const pts = [[0, 0], [0, 1], [1, 0], [10, 10], [10, 11], [11, 10]];
  it('finds separated groups and records every step', () => {
    const r = kmeans(pts, 2, { seed: 3 });
    expect(r.labels[0]).toBe(r.labels[1]);
    expect(r.labels[0]).toBe(r.labels[2]);
    expect(r.labels[3]).toBe(r.labels[4]);
    expect(r.labels[0]).not.toBe(r.labels[3]);
    expect(r.steps.length).toBeGreaterThan(0);
    const c = r.centroids[r.labels[3]];
    expect(c[0]).toBeCloseTo(31 / 3, 6);
  });

  it('is repeatable with the same seed', () => {
    expect(kmeans(pts, 3, { seed: 9 }).labels).toEqual(kmeans(pts, 3, { seed: 9 }).labels);
  });
});

describe('convexHull', () => {
  it('keeps only the outer points', () => {
    const h = convexHull([[0, 0], [2, 0], [2, 2], [0, 2], [1, 1], [1, 0.5]]);
    expect(h).toHaveLength(4);
    expect(h).not.toContainEqual([1, 1]);
  });
});

describe('beeswarm', () => {
  it('places equal values side by side without overlaps', () => {
    const along = [10, 10, 10, 10, 10];
    const off = beeswarm(along, along.map(() => 4), 100);
    expect(off[0]).toBe(0);
    for (let i = 0; i < off.length; i++)
      for (let j = i + 1; j < off.length; j++) expect(Math.abs(off[i] - off[j])).toBeGreaterThanOrEqual(8 - 1e-6);
  });

  it('stays within the maximum offset', () => {
    const along = new Array(30).fill(0);
    expect(Math.max(...beeswarm(along, along.map(() => 3), 20).map(Math.abs))).toBeLessThanOrEqual(20);
  });
});

describe('symbols', () => {
  it('every symbol resamples to the same number of points inside the unit box', () => {
    for (const s of ['circle', 'rect', 'roundRect', 'triangle', 'diamond', 'pin', 'arrow', 'star', 'cross'] as const) {
      const p = symbolSamples(s);
      expect(p).toHaveLength(MORPH_POINTS);
      for (const [x, y] of p) {
        expect(Math.abs(x)).toBeLessThanOrEqual(0.5 + 1e-9);
        expect(Math.abs(y)).toBeLessThanOrEqual(0.55);
      }
    }
  });
});
