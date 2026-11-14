import { describe, expect, it } from 'vitest';
import { arcBounds, computeAngles, fit, layoutOutsideLabels, normAngle, prepareSlices } from '../../src/pie/layout';

const data = [
  { label: 'A', value: 50 },
  { label: 'B', value: 30 },
  { label: 'C', value: 15 },
  { label: 'D', value: 3 },
  { label: 'E', value: 2 },
];
const base = { sort: 'none' as const, groupBelow: 0, othersLabel: 'Outros', colors: ['#1', '#2', '#3', '#4', '#5'] };

describe('prepareSlices', () => {
  it('computes percentages and keeps colors by original position when sorting', () => {
    const s = prepareSlices(data, { ...base, sort: 'asc' }, new Set(), new Set());
    expect(s.map((x) => x.label)).toEqual(['E', 'D', 'C', 'B', 'A']);
    expect(s.find((x) => x.label === 'A')!.color).toBe('#1');
    expect(s.find((x) => x.label === 'A')!.percent).toBe(50);
  });

  it('groups small slices into "Outros"', () => {
    const s = prepareSlices(data, { ...base, groupBelow: 5 }, new Set(), new Set());
    const others = s[s.length - 1];
    expect(others.grouped).toBe(true);
    expect(others.value).toBe(5);
    expect(others.children!.map((c) => c.label)).toEqual(['D', 'E']);
  });

  it('hidden slices are excluded from the total', () => {
    const s = prepareSlices(data, base, new Set(['A']), new Set(['B']));
    expect(s[0].percent).toBe(0);
    expect(s[1].percent).toBe(60);
    expect(s[1].selected).toBe(true);
  });

  it('ignores zero, negative and invalid values', () => {
    const s = prepareSlices([{ label: 'x', value: 0 }, { label: 'y', value: -1 }, { label: 'z', value: NaN }, { label: 'ok', value: 1 }], base, new Set(), new Set());
    expect(s.map((x) => x.label)).toEqual(['ok']);
  });
});

describe('angles and fitting', () => {
  it('angles are proportional and cover the span', () => {
    const s = prepareSlices(data, base, new Set(), new Set());
    const g = computeAngles(s, 0, Math.PI * 2, false);
    expect(g[0].a1 - g[0].a0).toBeCloseTo(Math.PI);
    expect(g[g.length - 1].a1).toBeCloseTo(Math.PI * 2);
  });

  it('rose: equal angles, radius by value', () => {
    const s = prepareSlices(data, base, new Set(), new Set());
    const g = computeAngles(s, 0, Math.PI * 2, true);
    expect(g[0].a1 - g[0].a0).toBeCloseTo(g[4].a1 - g[4].a0);
    expect(g[0].r).toBe(1);
    expect(g[4].r).toBeLessThan(0.5);
  });

  it('minAngle keeps tiny slices visible and still fills the span', () => {
    const s = prepareSlices([{ label: 'big', value: 999 }, { label: 'tiny', value: 1 }], base, new Set(), new Set());
    const g = computeAngles(s, 0, Math.PI * 2, false, 0.2);
    expect(g[1].a1 - g[1].a0).toBeCloseTo(0.2);
    expect(g[1].a1).toBeCloseTo(Math.PI * 2);
  });

  it('counter-clockwise mirrors the order inside the span', () => {
    const s = prepareSlices(data, base, new Set(), new Set());
    const cw = computeAngles(s, 0, Math.PI * 2, false);
    const ccw = computeAngles(s, 0, Math.PI * 2, false, 0, false);
    expect(ccw[0].a1).toBeCloseTo(Math.PI * 2);
    expect(ccw[0].a1 - ccw[0].a0).toBeCloseTo(cw[0].a1 - cw[0].a0);
  });

  it('half donut fits twice as wide as tall', () => {
    const b = arcBounds(-Math.PI, 0);
    expect(b).toEqual({ minX: -1, maxX: 1, minY: -1, maxY: 0 });
    const f = fit(400, 400, -Math.PI, 0, { x: 0, y: 0 });
    expect(f.radius).toBe(200);
    expect(f.cy).toBeCloseTo(300); // centre lower than the middle
  });

  it('normAngle wraps into [start, start + 2π)', () => {
    expect(normAngle(-Math.PI / 2 - 0.1, -Math.PI / 2)).toBeCloseTo(Math.PI * 1.5 - 0.1);
  });
});

describe('outside labels', () => {
  it('never overlap on the same side', () => {
    const items = [0, 1, 2, 3].map((i) => ({ index: i, ax: 0, ay: 0, x: 100, y: 50, right: true }));
    layoutOutsideLabels(items, 16, 0, 1000);
    const ys = items.map((l) => l.y).sort((a, b) => a - b);
    for (let i = 1; i < ys.length; i++) expect(ys[i] - ys[i - 1]).toBeGreaterThanOrEqual(16);
  });
});

describe('rose modes and label heights', () => {
  const s = prepareSlices([{ label: 'a', value: 10 }, { label: 'b', value: 30 }], { sort: 'none', groupBelow: 0, othersLabel: 'Outros', colors: ['#1'] }, new Set(), new Set());

  it("'area' keeps equal angles with a linear radius", () => {
    const g = computeAngles(s, 0, Math.PI * 2, 'area');
    expect(g[0].a1 - g[0].a0).toBeCloseTo(Math.PI);
    expect(g[1].r).toBe(1);
    expect(g[0].r).toBeCloseTo(0.15 + 0.85 / 3);
  });

  it("'radius' uses the value for the angle and the radius", () => {
    const g = computeAngles(s, 0, Math.PI * 2, 'radius');
    expect(g[1].a1 - g[1].a0).toBeCloseTo(Math.PI * 1.5);
    expect(g[0].r).toBeLessThan(1);
  });

  it('spreads taller labels further apart', () => {
    const items = [
      { index: 0, ax: 0, ay: 0, x: 0, y: 100, right: true, h: 40 },
      { index: 1, ax: 0, ay: 0, x: 0, y: 105, right: true, h: 40 },
    ];
    layoutOutsideLabels(items, 16, 0, 1000);
    expect(items[1].y - items[0].y).toBeGreaterThanOrEqual(42);
  });

  it('slices know their ring', () => {
    const r = prepareSlices([{ label: 'x', value: 1 }], { sort: 'none', groupBelow: 0, othersLabel: 'Outros', colors: ['#1'] }, new Set(), new Set(), 2, 'Anel');
    expect(r[0].ring).toBe(2);
    expect(r[0].ringName).toBe('Anel');
  });
});
