import { describe, expect, it } from 'vitest';
import { gradientAt, mix } from '../../src/shared/color';
import { squarify } from '../../src/treemap/layout';
import { collapse, contains, lerpShape, sample } from '../../src/treemap/shape';
import { buildTree, fromPaths, treeTotal } from '../../src/treemap/tree';

describe('squarify', () => {
  const box = { x: 0, y: 0, w: 600, h: 400 };
  const values = [6, 6, 4, 3, 2, 2, 1];
  const boxes = squarify(values, box);
  const total = values.reduce((a, b) => a + b, 0);

  it('areas are proportional to the values', () => {
    boxes.forEach((b, i) => expect(b.w * b.h).toBeCloseTo((values[i] / total) * 600 * 400, 3));
  });

  it('boxes stay inside and do not overlap', () => {
    for (const b of boxes) {
      expect(b.x).toBeGreaterThanOrEqual(-1e-9);
      expect(b.y).toBeGreaterThanOrEqual(-1e-9);
      expect(b.x + b.w).toBeLessThanOrEqual(600 + 1e-9);
      expect(b.y + b.h).toBeLessThanOrEqual(400 + 1e-9);
    }
    for (let i = 0; i < boxes.length; i++)
      for (let j = i + 1; j < boxes.length; j++) {
        const a = boxes[i];
        const b = boxes[j];
        const ox = Math.min(a.x + a.w, b.x + b.w) - Math.max(a.x, b.x);
        const oy = Math.min(a.y + a.h, b.y + b.h) - Math.max(a.y, b.y);
        expect(ox <= 1e-6 || oy <= 1e-6).toBe(true);
      }
  });

  it('keeps the aspect ratios reasonable', () => {
    for (const b of boxes) expect(Math.max(b.w / b.h, b.h / b.w)).toBeLessThan(4);
  });

  it('zero and negative values get empty boxes', () => {
    const r = squarify([3, 0, -2, 1], box);
    expect(r[1].w * r[1].h).toBe(0);
    expect(r[2].w * r[2].h).toBe(0);
    expect(r[0].w * r[0].h + r[3].w * r[3].h).toBeCloseTo(600 * 400, 3);
  });
});

describe('tree', () => {
  const data = [
    { name: 'A', children: [{ name: 'a1', value: 3 }, { name: 'a2', value: 7 }] },
    { name: 'B', value: [5, 1, 9] },
    { name: 'C', value: 0 },
  ];

  it('sums children, sorts descending and drops empty nodes', () => {
    const t = buildTree(data);
    expect(t.size).toBe(15);
    expect(t.children.map((c) => c.name)).toEqual(['A', 'B']);
    expect(t.children[0].children.map((c) => c.name)).toEqual(['a2', 'a1']);
    expect(t.children[0].path).toEqual(['A']);
    expect(t.children[0].children[0].id).toBe('A/a2');
    expect(t.height).toBe(2);
  });

  it('uses another dimension as the size', () => {
    const t = buildTree(data, { sizeDimension: 2 });
    expect(t.children[0].name).toBe('B');
    expect(t.children[0].size).toBe(9);
  });

  it('fromPaths builds the folders', () => {
    const tree = fromPaths([
      { path: 'src/app/main.ts', value: 10 },
      { path: 'src/app/util.ts', value: 5 },
      { path: 'src/index.ts', value: 1 },
      { path: 'README.md', value: 2 },
    ]);
    expect(tree.map((n) => n.name)).toEqual(['src', 'README.md']);
    expect(tree[0].children!.map((n) => n.name)).toEqual(['app', 'index.ts']);
    expect(treeTotal(tree)).toBe(18);
  });
});

describe('shapes and colors', () => {
  const rect = { k: 'r' as const, x: 0, y: 0, w: 100, h: 50 };
  const sector = { k: 's' as const, cx: 0, cy: 0, r0: 10, r1: 50, a0: 0, a1: Math.PI / 2 };

  it('rect and sector sample to the same number of points', () => {
    expect(sample(rect).length).toBe(sample(sector).length);
  });

  it('morphs through a polygon and lands on the target', () => {
    expect(lerpShape(rect, sector, 0.5).k).toBe('p');
    expect(lerpShape(rect, sector, 1)).toBe(sector);
    expect(collapse(rect)).toEqual({ k: 'r', x: 50, y: 25, w: 0, h: 0 });
  });

  it('hit tests sectors', () => {
    expect(contains(sector, 20, 20)).toBe(true);
    expect(contains(sector, -20, 20)).toBe(false);
    expect(contains(sector, 3, 3)).toBe(false);
  });

  it('mixes colors', () => {
    expect(mix('#000000', '#ffffff', 0.5)).toBe('rgb(128, 128, 128)');
    expect(gradientAt(['#ff0000', '#00ff00', '#0000ff'], 0.5)).toBe('rgb(0, 255, 0)');
  });
});
