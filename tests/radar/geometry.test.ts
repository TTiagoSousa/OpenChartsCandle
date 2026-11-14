import { describe, expect, it } from 'vitest';
import { axisAngle, niceMax, pointInPolygon, polar, valueRadius } from '../../src/radar/geometry';

describe('radar geometry', () => {
  it('niceMax rounds the outer ring up', () => {
    expect(niceMax(87)).toBe(100);
    expect(niceMax(100)).toBe(100);
    expect(niceMax(4300)).toBe(5000);
    expect(niceMax(0)).toBe(1);
    expect(niceMax(-5)).toBe(1);
  });

  it('axes start on top and go clockwise', () => {
    const n = 4;
    const p = (i: number, cw = true) => polar(0, 0, 10, axisAngle(i, n, 90, cw));
    expect(p(0).x).toBeCloseTo(0);
    expect(p(0).y).toBeCloseTo(-10); // top (canvas y grows down)
    expect(p(1).x).toBeCloseTo(10); // then right
    expect(p(2).y).toBeCloseTo(10); // bottom
    expect(p(1, false).x).toBeCloseTo(-10); // counterclockwise: left
    expect(polar(0, 0, 10, axisAngle(0, 3, 0)).x).toBeCloseTo(10); // startAngle 0 = right
  });

  it('values map from the center (min) to the ring (max), clamped', () => {
    expect(valueRadius(50, 0, 100, 200)).toBe(100);
    expect(valueRadius(150, 0, 100, 200)).toBe(200);
    expect(valueRadius(-1, 0, 100, 200)).toBe(0);
    expect(valueRadius(null, 0, 100, 200)).toBe(0);
    expect(valueRadius(15, 10, 20, 100)).toBe(50);
  });

  it('point in polygon', () => {
    const sq = [
      { x: 0, y: 0 },
      { x: 10, y: 0 },
      { x: 10, y: 10 },
      { x: 0, y: 10 },
    ];
    expect(pointInPolygon(5, 5, sq)).toBe(true);
    expect(pointInPolygon(15, 5, sq)).toBe(false);
  });
});
