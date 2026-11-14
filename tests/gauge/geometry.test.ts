import { describe, expect, it } from 'vitest';
import { angleToValue, arcBounds, gaugeArc, gaugeTicks, springEase, valueToAngle, zoneAt } from '../../src/gauge/geometry';

describe('gauge geometry', () => {
  it('semi dial goes from left to right through the top', () => {
    const arc = gaugeArc('semi');
    expect(arc.start).toBeCloseTo(-Math.PI);
    expect(arc.end).toBeCloseTo(0);
    expect(valueToAngle(50, 0, 100, arc)).toBeCloseTo(-Math.PI / 2);
  });

  it('clamps values outside the range', () => {
    const arc = gaugeArc('speedometer');
    expect(valueToAngle(-10, 0, 100, arc)).toBeCloseTo(arc.start);
    expect(valueToAngle(500, 0, 100, arc)).toBeCloseTo(arc.end);
  });

  it('angleToValue inverts valueToAngle and rejects the gap', () => {
    const arc = gaugeArc('speedometer');
    for (const v of [0, 25, 73, 100]) expect(angleToValue(valueToAngle(v, 0, 100, arc), 0, 100, arc)).toBeCloseTo(v);
    // straight down is in the gap of a 240° speedometer
    expect(angleToValue(Math.PI / 2, 0, 100, arc)).toBeNull();
  });

  it('ticks are round numbers covering the range', () => {
    expect(gaugeTicks(0, 100, 6)).toEqual([0, 20, 40, 60, 80, 100]);
    expect(gaugeTicks(0, 220, 12)).toEqual([0, 20, 40, 60, 80, 100, 120, 140, 160, 180, 200, 220]);
    const odd = gaugeTicks(0, 7, 4);
    expect(odd[0]).toBe(0);
    expect(odd[odd.length - 1]).toBe(7);
  });

  it('finds the zone of a value', () => {
    const zones = [
      { from: 0, to: 60, color: 'g' },
      { from: 60, to: 100, color: 'r' },
    ];
    expect(zoneAt(30, zones)?.color).toBe('g');
    expect(zoneAt(80, zones)?.color).toBe('r');
    expect(zoneAt(120, zones)).toBeNull();
  });

  it('semi dial bounds are the top half', () => {
    const b = arcBounds(gaugeArc('semi'));
    expect(b.minX).toBeCloseTo(-1);
    expect(b.maxX).toBeCloseTo(1);
    expect(b.minY).toBeCloseTo(-1);
    expect(b.maxY).toBeCloseTo(0);
  });

  it('spring easing overshoots then settles at 1', () => {
    const samples = Array.from({ length: 50 }, (_, i) => springEase(i / 49));
    expect(Math.max(...samples)).toBeGreaterThan(1);
    expect(springEase(1)).toBe(1);
    expect(springEase(0)).toBe(0);
  });
});
