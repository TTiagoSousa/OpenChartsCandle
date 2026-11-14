import { describe, expect, it } from 'vitest';
import { average, cumulative, ema, exponentialTrend, linearTrend, sma, wma } from '../../src/bar/overlays';

describe('moving averages', () => {
  it('sma averages the last N values', () => {
    expect(sma([1, 2, 3, 4, 5], 3)).toEqual([null, null, 2, 3, 4]);
  });

  it('sma gives null when the window has a gap', () => {
    expect(sma([1, null, 3, 4, 5], 2)).toEqual([null, null, null, 3.5, 4.5]);
  });

  it('wma weighs recent values more', () => {
    // (1·1 + 2·2 + 3·3) / 6
    expect(wma([1, 2, 3], 3)[2]).toBeCloseTo(14 / 6);
  });

  it('ema starts at the SMA and then follows with alpha 2/(n+1)', () => {
    const r = ema([2, 4, 6, 8], 3);
    expect(r.slice(0, 2)).toEqual([null, null]);
    expect(r[2]).toBeCloseTo(4);
    expect(r[3]).toBeCloseTo(8 * 0.5 + 4 * 0.5);
  });

  it('ema reacts faster than sma', () => {
    const data = [10, 10, 10, 10, 20];
    expect(ema(data, 4)[4]!).toBeGreaterThan(sma(data, 4)[4]!);
  });
});

describe('trends', () => {
  it('linear trend recovers a straight line', () => {
    const t = linearTrend([1, 3, 5, 7]);
    expect(t.slope).toBeCloseTo(2);
    expect(t.intercept).toBeCloseTo(1);
    expect(t.r2).toBeCloseTo(1);
    expect(t.values[3]).toBeCloseTo(7);
  });

  it('linear trend skips nulls but keeps their position', () => {
    const t = linearTrend([0, null, 2, 3]);
    expect(t.values[1]).toBeCloseTo(1);
  });

  it('exponential trend recovers the growth rate', () => {
    const t = exponentialTrend([100, 110, 121, 133.1]);
    expect(t.growth).toBeCloseTo(0.1);
    expect(t.values[3]).toBeCloseTo(133.1);
    expect(t.r2).toBeCloseTo(1);
  });

  it('exponential trend ignores non-positive values', () => {
    const t = exponentialTrend([-5, 100, 200]);
    expect(t.growth).toBeCloseTo(1);
  });
});

describe('cumulative and average', () => {
  it('running total and Pareto percent', () => {
    expect(cumulative([5, 3, 2])).toEqual([5, 8, 10]);
    expect(cumulative([5, 3, 2], true)).toEqual([50, 80, 100]);
  });

  it('average is flat', () => {
    expect(average([1, null, 3])).toEqual([2, 2, 2]);
  });
});
