import { describe, expect, it } from 'vitest';
import type { SectorShape } from '../../src/treemap/shape';
import { sectorCorners, sectorTextRoom, sunburstRings, sunLength, uprightAngle } from '../../src/treemap/sunburst';

const sector = (r0: number, r1: number, a0: number, a1: number): SectorShape => ({ k: 's', cx: 0, cy: 0, r0, r1, a0, a1 });

describe('sunLength', () => {
  it('reads px numbers, percentages and numeric strings', () => {
    expect(sunLength(40, 200)).toBe(40);
    expect(sunLength('25%', 200)).toBe(50);
    expect(sunLength('30px', 200)).toBe(30);
    expect(sunLength(undefined, 200)).toBeUndefined();
    expect(sunLength('abc', 200)).toBeUndefined();
  });
});

describe('sunburstRings', () => {
  it('splits the room evenly without specs', () => {
    expect(sunburstRings(3, 10, 100)).toEqual([
      [10, 40],
      [40, 70],
      [70, 100],
    ]);
  });

  it('uses fixed radii and shares the rest', () => {
    // ring 0 fixed, ring 1 auto up to ring 2's start, ring 2 thin with a fixed end
    const r = sunburstRings(3, 0, 100, [{ r0: 0, r: 30 }, {}, { r0: 80, r: 84 }]);
    expect(r).toEqual([
      [0, 30],
      [30, 80],
      [80, 84],
    ]);
  });

  it('rings with only an end share the room before it', () => {
    const r = sunburstRings(3, 0, 100, [{}, { r: 60 }, {}]);
    expect(r[0]).toEqual([0, 30]);
    expect(r[1]).toEqual([30, 60]);
    expect(r[2]).toEqual([60, 100]);
  });

  it('never gives a ring a negative thickness', () => {
    for (const [a, b] of sunburstRings(2, 50, 20)) expect(b).toBeGreaterThanOrEqual(a);
  });
});

describe('sectorCorners', () => {
  it('keeps the wanted radius when it fits', () => {
    expect(sectorCorners(sector(50, 100, 0, Math.PI / 2), [6, 6])).toEqual([6, 6]);
  });

  it('is at most half the ring thickness', () => {
    const [i, o] = sectorCorners(sector(90, 100, 0, Math.PI / 2), [20, 20]);
    expect(i).toBeLessThanOrEqual(5);
    expect(o).toBeLessThanOrEqual(5);
  });

  it('shrinks on thin sectors so the two corners do not cross', () => {
    const span = 0.05;
    const [, o] = sectorCorners(sector(50, 100, 0, span), [20, 20]);
    // the corner circle must fit inside the angle: asin(o / (r1 - o)) <= span / 2
    expect(Math.asin(o / (100 - o))).toBeLessThanOrEqual(span / 2 + 1e-9);
  });

  it('no corners on full rings or at the center', () => {
    expect(sectorCorners(sector(0, 100, 0, Math.PI * 2), [5, 5])).toEqual([0, 0]);
    // a sector touching the center has no inner corners
    expect(sectorCorners(sector(0, 100, 0, 1), [5, 5])[0]).toBe(0);
  });
});

describe('sectorTextRoom', () => {
  const s = sector(50, 100, 0, Math.PI / 4);
  const mid = Math.PI / 8;

  it('radial text gets the ring thickness', () => {
    const r = sectorTextRoom(s, mid);
    expect(r.along).toBeCloseTo(50, 6);
    expect(r.across).toBeCloseTo((Math.PI / 4) * 75, 6);
  });

  it('tangential text gets the arc length', () => {
    const r = sectorTextRoom(s, mid + Math.PI / 2);
    expect(r.along).toBeCloseTo((Math.PI / 4) * 75, 6);
    expect(r.across).toBeCloseTo(50, 6);
  });
});

describe('uprightAngle', () => {
  it('turns text on the left half', () => {
    expect(uprightAngle(0).flipped).toBe(false);
    expect(uprightAngle(Math.PI).flipped).toBe(true);
    expect(uprightAngle(Math.PI).angle).toBeCloseTo(Math.PI * 2);
    expect(uprightAngle(-Math.PI / 4).flipped).toBe(false);
  });
});
