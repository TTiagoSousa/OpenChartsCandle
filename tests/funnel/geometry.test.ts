import { describe, expect, it } from 'vitest';
import { funnelLength, funnelOrder, funnelShapes, funnelWidth, pointInPolygon } from '../../src/funnel/geometry';

describe('funnel geometry', () => {
  it('widths go linearly from min to max, clamped', () => {
    expect(funnelWidth(50, 0, 100, 0, 200)).toBe(100);
    expect(funnelWidth(150, 0, 100, 0, 200)).toBe(200);
    expect(funnelWidth(-5, 0, 100, 20, 200)).toBe(20);
    expect(funnelWidth(5, 5, 5, 0, 80)).toBe(80);
  });

  it('lengths in px or %', () => {
    expect(funnelLength('50%', 300, 0)).toBe(150);
    expect(funnelLength(12, 300, 0)).toBe(12);
    expect(funnelLength(undefined, 300, 7)).toBe(7);
  });

  it('sorts the stages', () => {
    expect(funnelOrder([20, 80, 40])).toEqual([1, 2, 0]);
    expect(funnelOrder([20, 80, 40], 'ascending')).toEqual([0, 2, 1]);
    expect(funnelOrder([20, 80, 40], 'none')).toEqual([0, 1, 2]);
  });

  it('a funnel ends each stage at the next width and the last at minSize', () => {
    const s = funnelShapes([100, 50, 20], { length: 320, gap: 10, min: 0, max: 100, minPx: 0, maxPx: 200, ascending: false });
    expect(s.map((x) => [x.w0, x.w1])).toEqual([
      [200, 100],
      [100, 40],
      [40, 0],
    ]);
    expect(s[0].a0).toBe(0);
    expect(s[2].a1).toBeCloseTo(320);
    expect(s[1].a0 - s[0].a1).toBeCloseTo(10);
  });

  it('a pyramid starts at the previous width', () => {
    const s = funnelShapes([20, 50, 100], { length: 300, gap: 0, min: 0, max: 100, minPx: 0, maxPx: 100, ascending: true });
    expect(s.map((x) => [x.w0, x.w1])).toEqual([
      [0, 20],
      [20, 50],
      [50, 100],
    ]);
  });

  it('point in polygon', () => {
    const t = [
      { x: 0, y: 0 },
      { x: 10, y: 0 },
      { x: 7, y: 10 },
      { x: 3, y: 10 },
    ];
    expect(pointInPolygon(5, 5, t)).toBe(true);
    expect(pointInPolygon(1, 9, t)).toBe(false);
  });
});
