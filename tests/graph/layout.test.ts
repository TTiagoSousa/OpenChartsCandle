import { describe, expect, it } from 'vitest';
import {
  curveControl,
  distToQuad,
  distToSegment,
  edgeLengths,
  fitBox,
  ForceSimulation,
  graphCircularLayout,
  graphForceLayout,
  hideOverlaps,
  logTicks,
  sizeByValue,
  spiralPosition,
} from '../../src/graph/layout';

const dist = (a: { x: number; y: number }, b: { x: number; y: number }): number => Math.hypot(a.x - b.x, a.y - b.y);

describe('graph force layout', () => {
  it('springs pull linked nodes to about the edge length', () => {
    const pos = graphForceLayout([{ id: 'a' }, { id: 'b' }], [{ source: 'a', target: 'b' }], { edgeLength: 50, repulsion: 0, gravity: 0 });
    expect(dist(pos[0], pos[1])).toBeGreaterThan(45);
    expect(dist(pos[0], pos[1])).toBeLessThan(55);
  });

  it('repulsion spreads unlinked nodes and gravity keeps them around the center', () => {
    const nodes = Array.from({ length: 40 }, (_, i) => ({ id: `n${i}` }));
    const pos = graphForceLayout(nodes, []);
    let minD = Infinity;
    for (let i = 0; i < pos.length; i++) for (let j = i + 1; j < pos.length; j++) minD = Math.min(minD, dist(pos[i], pos[j]));
    expect(minD).toBeGreaterThan(5);
    const cx = pos.reduce((s, p) => s + p.x, 0) / pos.length;
    const cy = pos.reduce((s, p) => s + p.y, 0) / pos.length;
    expect(Math.abs(cx)).toBeLessThan(20);
    expect(Math.abs(cy)).toBeLessThan(20);
  });

  it('Barnes–Hut is close to the exact repulsion', () => {
    const make = () => Array.from({ length: 200 }, (_, i) => ({ ...spiralPosition(i, 8), vx: 0, vy: 0, fx: null, fy: null }));
    const exact = new ForceSimulation(make(), [], { theta: 0 });
    const approx = new ForceSimulation(make(), [], { theta: 0.9 });
    exact.tick();
    approx.tick();
    let err = 0;
    let mag = 0;
    exact.nodes.forEach((n, i) => {
      err += Math.hypot(n.vx - approx.nodes[i].vx, n.vy - approx.nodes[i].vy);
      mag += Math.hypot(n.vx, n.vy);
    });
    expect(err / mag).toBeLessThan(0.1);
  });

  it('fixed nodes stay put and the simulation cools down', () => {
    const sim = new ForceSimulation(
      [
        { x: 10, y: 20, vx: 0, vy: 0, fx: 10, fy: 20 },
        { x: 0, y: 0, vx: 0, vy: 0, fx: null, fy: null },
      ],
      [{ source: 0, target: 1, distance: 30 }],
    );
    sim.run(1000);
    expect(sim.running).toBe(false);
    expect(sim.nodes[0].x).toBe(10);
    expect(sim.nodes[0].y).toBe(20);
  });

  it('copes with nodes on the same spot and self links', () => {
    const sim = new ForceSimulation(
      Array.from({ length: 5 }, () => ({ x: 0, y: 0, vx: 0, vy: 0, fx: null, fy: null })),
      [{ source: 0, target: 0, distance: 30 }],
    );
    sim.run(50);
    for (const n of sim.nodes) expect(Number.isFinite(n.x) && Number.isFinite(n.y)).toBe(true);
  });

  it('collision keeps big nodes apart', () => {
    const sim = new ForceSimulation(
      Array.from({ length: 6 }, (_, i) => ({ x: i * 0.1, y: 0, vx: 0, vy: 0, fx: null, fy: null })),
      [],
      { repulsion: 0, gravity: 0.05, radius: Array(6).fill(10) },
    );
    sim.run(300);
    for (let i = 0; i < 6; i++) for (let j = i + 1; j < 6; j++) expect(dist(sim.nodes[i], sim.nodes[j])).toBeGreaterThan(17);
  });

  it('edge lengths by value: bigger value is shorter', () => {
    expect(edgeLengths([1, 5, 3], 40)).toEqual([40, 40, 40]);
    expect(edgeLengths([1, 5, 3], [20, 100])).toEqual([100, 20, 60]);
    expect(edgeLengths([undefined, 2], [20, 100])).toEqual([60, 60]);
  });
});

describe('graph circular layout', () => {
  it('puts nodes on the unit circle, starting on top, clockwise', () => {
    const pos = graphCircularLayout([{}, {}, {}, {}], { sort: 'none' });
    for (const p of pos) expect(Math.hypot(p.x, p.y)).toBeCloseTo(1);
    expect(pos[0].y).toBeCloseTo(-1); // top (y down)
    expect(pos[1].x).toBeCloseTo(1); // then right
  });

  it('groups by category, keeping the first-seen order', () => {
    const nodes = [{ category: 'b' }, { category: 'a' }, { category: 'b' }, { category: 'a' }];
    const pos = graphCircularLayout(nodes, { startAngle: 0, clockwise: false });
    const order = pos.map((p, i) => [Math.atan2(-p.y, p.x), i] as const).sort((a, b) => ((a[0] + 7) % (2 * Math.PI)) - ((b[0] + 7) % (2 * Math.PI)));
    // b nodes (0, 2) are next to each other, then a nodes (1, 3)
    const seq = order.map(([, i]) => nodes[i].category).join('');
    expect(['bbaa', 'aabb', 'abba', 'baab']).toContain(seq);
  });
});

describe('graph fit and geometry', () => {
  it('fitBox maps the extent into the box, keeping the aspect', () => {
    const f = fitBox([0, 0, 100, 50], { x: 0, y: 0, w: 200, h: 200 }, { aspect: 1 });
    expect(f.ax).toBe(2);
    expect(f.ay).toBe(2);
    expect(f.ax * 50 + f.bx).toBe(100); // centered
    expect(f.ay * 25 + f.by).toBe(100);
    const flip = fitBox([0, 0, 10, 10], { x: 0, y: 0, w: 100, h: 100 }, { flipY: true });
    expect(flip.ay * 10 + flip.by).toBe(0); // the top of the data at the top of the box
    const capped = fitBox([0, 0, 1, 1], { x: 0, y: 0, w: 100, h: 100 }, { maxScale: 2 });
    expect(capped.ax).toBe(2);
  });

  it('hideOverlaps keeps the first label of each overlapping group', () => {
    const keep = hideOverlaps([
      { x: 0, y: 0, w: 50, h: 10 },
      { x: 40, y: 5, w: 50, h: 10 },
      { x: 100, y: 0, w: 50, h: 10 },
      { x: 0, y: 200, w: 50, h: 10 },
      { x: 130, y: 5, w: 10, h: 10 },
    ]);
    expect(keep).toEqual([true, false, true, true, false]);
  });

  it('curves bend to opposite sides for opposite directions', () => {
    const a = curveControl(0, 0, 100, 0, 0.2);
    const b = curveControl(100, 0, 0, 0, 0.2);
    expect(a).toEqual({ x: 50, y: 20 });
    expect(b.y).toBe(-20);
    expect(distToQuad(50, 10, 0, 0, a.x, a.y, 100, 0)).toBeLessThan(0.5);
    expect(distToSegment(50, 10, 0, 0, 100, 0)).toBe(10);
    expect(distToSegment(-10, 0, 0, 0, 100, 0)).toBe(10);
  });

  it('log ticks and sizes by value', () => {
    expect(logTicks(1, 100)).toEqual([1, 2, 5, 10, 20, 50, 100]);
    expect(logTicks(1, 1e6)).toEqual([1, 10, 100, 1000, 1e4, 1e5, 1e6]);
    expect(sizeByValue(0, 0, 100, [10, 50])).toBe(10);
    expect(sizeByValue(100, 0, 100, [10, 50])).toBe(50);
    expect(sizeByValue(25, 0, 100, [10, 50])).toBe(30); // sqrt scale
    expect(sizeByValue(undefined, 0, 100, [10, 50])).toBe(30);
  });
});
