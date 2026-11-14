import { describe, expect, it } from 'vitest';
import { customEnclose, customHexagon, customHexbin, customHistogram, customPack, customPackSiblings } from '../../src/custom/layouts';
import { customFlattenPath, customParsePath, customPathBounds } from '../../src/custom/path';
import { customScale, customTimeTicks, customTimeValue } from '../../src/custom/scale';
import { customAlignRings, customCanMorph, customFlatten, customHitTest, customLerpColor, customLerpNode, customPointInPolygon, customResample, customTruncate, customWithProps, type CustomNode } from '../../src/custom/shapes';
import type { CustomElement } from '../../src/custom/types';

const nodesOf = (el: CustomElement): CustomNode[] => {
  const out: CustomNode[] = [];
  customFlatten(el, { si: 0, di: 0, out });
  return out;
};

describe('custom scales', () => {
  it('value axis: nice range including zero, maps and inverts', () => {
    const s = customScale({}, [3, 97], [0, 200]);
    expect(s.type).toBe('value');
    expect(s.min).toBe(0);
    expect(s.max).toBe(100);
    expect(s.map(50)).toBe(100);
    expect(s.invert(150)).toBe(75);
    expect(s.ticks().map((t) => t.value)).toContain(100);
  });

  it('value axis without zero, inverse', () => {
    const s = customScale({ beginAtZero: false, inverse: true }, [52, 58], [0, 100]);
    expect(s.min).toBeGreaterThan(40);
    expect(s.map(s.min)).toBe(100);
    expect(s.map(s.max)).toBe(0);
  });

  it('category axis: bands in order of appearance, names or indices', () => {
    const s = customScale({}, ['Seg', 'Ter', 'Qua', 'Ter'], [0, 300]);
    expect(s.type).toBe('category');
    expect(s.categories).toEqual(['Seg', 'Ter', 'Qua']);
    expect(s.band()).toBe(100);
    expect(s.map('Ter')).toBe(150);
    expect(s.map(2)).toBe(250);
  });

  it('time axis: dates as ms, local date strings and ticks', () => {
    const a = customTimeValue('2024-03-05');
    expect(a).toBe(new Date(2024, 2, 5).getTime());
    const s = customScale({ type: 'time' }, ['2024-03-01', '2024-03-31'], [0, 300]);
    expect(s.min).toBe(new Date(2024, 2, 1).getTime());
    const ticks = customTimeTicks(s.min, s.max, 5);
    expect(ticks.length).toBeGreaterThan(2);
    expect(ticks.every((t) => t.value >= s.min && t.value <= s.max)).toBe(true);
  });

  it('log axis: powers of the base', () => {
    const s = customScale({ type: 'log' }, [3, 4200], [0, 400]);
    expect(s.min).toBe(1);
    expect(s.max).toBe(10000);
    expect(s.map(100)).toBeCloseTo(200);
    expect(s.ticks().map((t) => t.value)).toEqual([1, 10, 100, 1000, 10000]);
  });

  it('zoomed view', () => {
    const s = customScale({}, [0, 100], [0, 100], [20, 40]);
    expect(s.map(30)).toBe(50);
    expect(s.fullMax).toBe(100);
  });
});

describe('custom SVG paths', () => {
  it('parses relative, H/V and implicit lineto', () => {
    const c = customParsePath('m10 10 h20 v20 l-20 0 z M0 0 5 5');
    expect(c[0]).toEqual(['M', 10, 10]);
    expect(c[1]).toEqual(['L', 30, 10]);
    expect(c[2]).toEqual(['L', 30, 30]);
    expect(c[3]).toEqual(['L', 10, 30]);
    expect(c[4]).toEqual(['Z']);
    expect(c[6]).toEqual(['L', 5, 5]);
  });

  it('arcs become cubics that land on the end point (compact flags)', () => {
    const c = customParsePath('M0 0a10 10 0 01 20 0');
    const last = c[c.length - 1];
    expect(last[0]).toBe('C');
    expect(last.slice(-2)).toEqual([20, 0]);
    const b = customPathBounds(c);
    expect(b.width).toBeCloseTo(20, 1);
    expect(b.height).toBeCloseTo(10, 0);
  });

  it('smooth curves (S, T) and flattening', () => {
    const c = customParsePath('M0 0 C 0 10 10 10 10 0 S 20 -10 20 0 Q 25 5 30 0 T 40 0');
    expect(c.filter((x) => x[0] === 'C')).toHaveLength(2);
    expect(c.filter((x) => x[0] === 'Q')).toHaveLength(2);
    const f = customFlattenPath(c, 4);
    expect(f).toHaveLength(1);
    expect(f[0].points[f[0].points.length - 1]).toEqual([40, 0]);
  });
});

describe('custom hit-testing', () => {
  it('rect, circle and stroke-only lines', () => {
    const [r] = nodesOf({ type: 'rect', shape: { x: 10, y: 10, width: 40, height: -20 }, style: { fill: '#f00' } });
    expect(customHitTest(r, 20, 0)).toBe(true);
    expect(customHitTest(r, 20, 15)).toBe(false);
    const [c] = nodesOf({ type: 'circle', shape: { cx: 0, cy: 0, r: 10 }, style: { fill: '#f00' } });
    expect(customHitTest(c, 6, 6)).toBe(true);
    expect(customHitTest(c, 9, 9)).toBe(false);
    const [l] = nodesOf({ type: 'line', shape: { x1: 0, y1: 0, x2: 100, y2: 0 }, style: { stroke: '#fff' } });
    expect(customHitTest(l, 50, 2)).toBe(true);
    expect(customHitTest(l, 50, 8)).toBe(false);
  });

  it('sector angles and ring', () => {
    const [s] = nodesOf({ type: 'sector', shape: { cx: 0, cy: 0, r: 10, r0: 5, startAngle: 0, endAngle: Math.PI / 2 }, style: { fill: '#0f0' } });
    expect(customHitTest(s, 5, 5)).toBe(true);
    expect(customHitTest(s, 2, 2)).toBe(false);
    expect(customHitTest(s, -5, 5)).toBe(false);
    const [w] = nodesOf({ type: 'sector', shape: { cx: 0, cy: 0, r: 10, startAngle: -Math.PI / 4, endAngle: Math.PI / 4 }, style: { fill: '#0f0' } });
    expect(customHitTest(w, 8, -1)).toBe(true);
  });

  it('group transforms (translate + rotate) are applied', () => {
    const [r] = nodesOf({ type: 'group', x: 100, y: 100, rotation: Math.PI / 2, children: [{ type: 'rect', shape: { x: 0, y: -2, width: 50, height: 4 }, style: { fill: '#fff' } }] });
    expect(customHitTest(r, 100, 140)).toBe(true);
    expect(customHitTest(r, 140, 100)).toBe(false);
  });

  it('paths fitted into a box, polygons', () => {
    const [p] = nodesOf({ type: 'path', shape: { pathData: 'M0 0 L10 0 L10 10 L0 10 Z', x: 100, y: 100, width: 50, height: 50 }, style: { fill: '#fff' } });
    expect(customHitTest(p, 125, 125)).toBe(true);
    expect(customHitTest(p, 90, 125)).toBe(false);
    expect(customPointInPolygon(1, 1, [[0, 0], [4, 0], [0, 4]])).toBe(true);
    expect(customPointInPolygon(3, 3, [[0, 0], [4, 0], [0, 4]])).toBe(false);
  });

  it('clip and hidden nodes are not hit', () => {
    const out: CustomNode[] = [];
    customFlatten({ type: 'rect', shape: { x: 0, y: 0, width: 100, height: 100 }, style: { fill: '#fff' } }, { si: 0, di: 0, out, clip: { x: 0, y: 0, width: 50, height: 50 } });
    expect(customHitTest(out[0], 25, 25)).toBe(true);
    expect(customHitTest(out[0], 75, 75)).toBe(false);
    const [g] = nodesOf({ type: 'circle', shape: { cx: 0, cy: 0, r: 10 }, style: { fill: '#fff', opacity: 0 } });
    expect(customHitTest(g, 0, 0)).toBe(false);
  });
});

describe('custom transitions', () => {
  it('ids become keys; same shapes interpolate their numbers', () => {
    const [a] = nodesOf({ type: 'rect', id: 'k', shape: { x: 0, y: 0, width: 10, height: 10 }, style: { fill: '#000000' } });
    const [b] = nodesOf({ type: 'rect', id: 'k', shape: { x: 100, y: 0, width: 30, height: 10 }, style: { fill: '#ffffff' } });
    expect(a.key).toBe('#k');
    const m = customLerpNode(a, b, 0.5);
    expect(m.shape.x).toBe(50);
    expect(m.shape.width).toBe(20);
    expect(m.style.fill).toBe('rgb(128, 128, 128)');
  });

  it('a circle morphs into a sector through polygons', () => {
    const [a] = nodesOf({ type: 'circle', id: 1, shape: { cx: 0, cy: 0, r: 5 }, style: { fill: '#f00' } });
    const [b] = nodesOf({ type: 'sector', id: 1, shape: { cx: 100, cy: 100, r: 50, startAngle: 0, endAngle: 1 }, style: { fill: '#f00' } });
    expect(customCanMorph(a, b)).toBe(true);
    const m = customLerpNode(a, b, 0.5);
    expect(m.type).toBe('polygon');
    expect(m.shape.points).toHaveLength(40);
    expect(customLerpNode(a, b, 1)).toBe(b);
  });

  it('text does not morph into shapes; enter / leave props', () => {
    const [t] = nodesOf({ type: 'text', style: { text: 'a' } });
    const [r] = nodesOf({ type: 'rect', shape: { x: 0, y: 0, width: 1, height: 1 } });
    expect(customCanMorph(t, r)).toBe(false);
    const e = customWithProps(r, { opacity: 0, scale: 0, shape: { height: 0 } }, { opacity: 0 });
    expect(e.opacity).toBe(0);
    expect(e.scale).toBe(0);
    expect(e.shape.height).toBe(0);
    expect(e.shape.width).toBe(1);
  });

  it('resampling and ring alignment', () => {
    const sq: [number, number][] = [[0, 0], [10, 0], [10, 10], [0, 10]];
    const r = customResample(sq, 8);
    expect(r).toHaveLength(8);
    expect(r[1]).toEqual([5, 0]);
    const shifted = [...r.slice(3), ...r.slice(0, 3)];
    expect(customAlignRings(r, shifted)).toEqual(r);
  });

  it('colors interpolate, fade from none', () => {
    expect(customLerpColor('#000', '#fff', 0)).toBe('rgb(0, 0, 0)');
    expect(customLerpColor('none', '#ff0000', 0.5)).toBe('rgba(255, 0, 0, 0.5)');
  });

  it('truncates labels', () => {
    const m = (t: string): number => t.length * 6;
    expect(customTruncate('Olá', 100, m)).toBe('Olá');
    expect(customTruncate('abcdefghij', 30, m)).toBe('abcd…');
    expect(customTruncate('abc', 4, m)).toBe('');
  });
});

describe('custom layouts', () => {
  it('packs siblings without overlaps inside the enclosing circle', () => {
    const cs = [10, 8, 6, 6, 5, 4, 3, 3, 2, 1].map((r) => ({ x: 0, y: 0, r }));
    const R = customPackSiblings(cs);
    for (let i = 0; i < cs.length; i++) {
      expect(Math.hypot(cs[i].x, cs[i].y) + cs[i].r).toBeLessThanOrEqual(R + 1e-6);
      for (let j = i + 1; j < cs.length; j++) expect(Math.hypot(cs[i].x - cs[j].x, cs[i].y - cs[j].y)).toBeGreaterThanOrEqual(cs[i].r + cs[j].r - 1e-6);
    }
  });

  it('encloses circles', () => {
    const e = customEnclose([{ x: -5, y: 0, r: 1 }, { x: 5, y: 0, r: 1 }])!;
    expect(e.x).toBeCloseTo(0);
    expect(e.r).toBeCloseTo(6);
  });

  it('packs a hierarchy in a box', () => {
    const nodes = customPack({ name: 'root', children: [{ name: 'A', children: [{ name: 'a1', value: 4 }, { name: 'a2', value: 1 }] }, { name: 'B', value: 9 }] }, { width: 200, height: 100, padding: 2 });
    expect(nodes).toHaveLength(5);
    const root = nodes[0];
    expect(root.r).toBeCloseTo(50);
    expect(root.x).toBe(100);
    const a = nodes.find((n) => n.data.name === 'A')!;
    expect(a.value).toBe(5);
    for (const c of a.children) expect(Math.hypot(c.x - a.x, c.y - a.y) + c.r).toBeLessThanOrEqual(a.r + 1e-6);
    expect(nodes.find((n) => n.data.name === 'a1')!.path).toBe('root/A/a1');
  });

  it('histogram with nice bins', () => {
    const bins = customHistogram([0.5, 1.2, 1.7, 2.2, 9.9], { bins: 5 });
    expect(bins[0].x0).toBe(0);
    expect(bins.reduce((s, b) => s + b.count, 0)).toBe(5);
    expect(bins[bins.length - 1].x1).toBeGreaterThanOrEqual(9.9);
  });

  it('hexagonal bins', () => {
    const bins = customHexbin([[0, 0], [0.1, 0.1], [10, 10]], 2);
    expect(bins).toHaveLength(2);
    expect(bins.find((b) => b.points.length === 2)).toBeTruthy();
    expect(customHexagon(0, 0, 1)).toHaveLength(6);
  });
});
