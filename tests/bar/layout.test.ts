import { describe, expect, it } from 'vitest';
import { computeStacks, slotRect, sortOrder } from '../../src/bar/layout';

const s = (key: string, values: (number | null)[], group = 'all', hidden = false) => ({ key, group, values, hidden });

describe('computeStacks', () => {
  it('groups series side by side when not stacked', () => {
    const r = computeStacks([s('a', [1, -2]), s('b', [3, 4])], 2, false);
    expect(r.slots).toBe(2);
    expect(r.segments[0][1]).toEqual({ from: 0, to: -2, slot: 0 });
    expect(r.segments[1][0]).toEqual({ from: 0, to: 3, slot: 1 });
    expect(r.min).toBe(-2);
    expect(r.max).toBe(4);
  });

  it('stacks positives and negatives separately', () => {
    const r = computeStacks([s('a', [2]), s('b', [-1]), s('c', [3])], 1, true);
    expect(r.slots).toBe(1);
    expect(r.segments[0][0]).toEqual({ from: 0, to: 2, slot: 0 });
    expect(r.segments[1][0]).toEqual({ from: 0, to: -1, slot: 0 });
    expect(r.segments[2][0]).toEqual({ from: 2, to: 5, slot: 0 });
    expect([r.min, r.max]).toEqual([-1, 5]);
  });

  it('100% stacking sums to 100', () => {
    const r = computeStacks([s('a', [1, 0]), s('b', [3, 0])], 2, 'percent');
    expect(r.segments[1][0]!.to).toBeCloseTo(100);
    expect(r.segments[0][0]!.to).toBeCloseTo(25);
    expect(r.segments[0][1]!.to).toBe(0);
  });

  it('separate stack groups become slots; hidden series are skipped', () => {
    const r = computeStacks([s('a', [1], 'x'), s('b', [1], 'y'), s('c', [1], 'x', true)], 1, true);
    expect(r.slots).toBe(2);
    expect(r.segments[1][0]!.slot).toBe(1);
    expect(r.segments[2][0]).toBeNull();
    expect(r.totals[0]).toBe(2);
  });

  it('null values draw nothing', () => {
    expect(computeStacks([s('a', [null, 1])], 2, false).segments[0][0]).toBeNull();
  });
});

describe('slotRect', () => {
  it('centers the bars inside the band', () => {
    const r0 = slotRect(0, 100, 0, 2, 0.2, 0);
    const r1 = slotRect(0, 100, 1, 2, 0.2, 0);
    expect(r0).toEqual({ start: 10, size: 40 });
    expect(r1.start).toBe(50);
  });

  it('respects the max bar width', () => {
    const r = slotRect(0, 100, 0, 1, 0, 0, 20);
    expect(r).toEqual({ start: 40, size: 20 });
  });
});

describe('sortOrder', () => {
  it('sorts categories by total', () => {
    expect(sortOrder([3, 1, 2], 'asc')).toEqual([1, 2, 0]);
    expect(sortOrder([3, 1, 2], 'desc')).toEqual([0, 2, 1]);
    expect(sortOrder([3, 1, 2], 'none')).toEqual([0, 1, 2]);
  });
});
