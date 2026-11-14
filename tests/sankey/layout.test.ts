import { describe, expect, it } from 'vitest';
import { sankeyLayout, sankeyLinkBreadths, type SankeyLayoutNode } from '../../src/sankey/layout';

const names = (...n: string[]): { name: string }[] => n.map((name) => ({ name }));
const L = (source: string, target: string, value: number): { source: string; target: string; value: number } => ({ source, target, value });

/** a → b → d, a → c → d, e → d (e is a short branch), d → f */
const nodes = names('a', 'b', 'c', 'd', 'e', 'f');
const links = [L('a', 'b', 5), L('a', 'c', 3), L('b', 'd', 5), L('c', 'd', 3), L('e', 'd', 2), L('d', 'f', 10)];
const opts = { width: 600, height: 400, nodeWidth: 20, nodeGap: 10 };
const by = (res: { nodes: SankeyLayoutNode[] }): Map<string, SankeyLayoutNode> => new Map(res.nodes.map((n) => [n.name, n]));

describe('sankey layout', () => {
  it('depth is the longest path from a source; values are max(in, out)', () => {
    const n = by(sankeyLayout(nodes, links, opts));
    expect(n.get('a')!.depth).toBe(0);
    expect(n.get('b')!.depth).toBe(1);
    expect(n.get('d')!.depth).toBe(2);
    expect(n.get('e')!.depth).toBe(0);
    expect(n.get('f')!.depth).toBe(3);
    expect(n.get('d')!.value).toBe(10);
    expect(n.get('d')!.inValue).toBe(10);
    expect(n.get('a')!.value).toBe(8);
    expect(n.get('a')!.inValue).toBe(0);
  });

  it('a fixed node value wins when it is bigger', () => {
    const n = by(sankeyLayout([{ name: 'x', value: 20 }, { name: 'y' }], [L('x', 'y', 4)], opts));
    expect(n.get('x')!.value).toBe(20);
    expect(n.get('y')!.value).toBe(4);
  });

  it('alignment: justify / left / right', () => {
    const just = by(sankeyLayout(nodes, links, { ...opts, nodeAlign: 'justify' }));
    const left = by(sankeyLayout(nodes, links, { ...opts, nodeAlign: 'left' }));
    const right = by(sankeyLayout(nodes, links, { ...opts, nodeAlign: 'right' }));
    // e starts the flow, so it stays in column 0 with left/justify, and goes next to d with right
    expect(left.get('e')!.layer).toBe(0);
    expect(just.get('e')!.layer).toBe(0);
    expect(right.get('e')!.layer).toBe(1);
    // a sink that ends early: only justify pushes it to the last column
    const n2 = [...nodes, { name: 'g' }];
    const l2 = [...links, L('a', 'g', 1)];
    expect(by(sankeyLayout(n2, l2, { ...opts, nodeAlign: 'left' })).get('g')!.layer).toBe(1);
    expect(by(sankeyLayout(n2, l2, { ...opts, nodeAlign: 'justify' })).get('g')!.layer).toBe(3);
    expect(by(sankeyLayout(n2, l2, { ...opts, nodeAlign: 'right' })).get('g')!.layer).toBe(3);
  });

  it('columns span the width, nodes have the node width', () => {
    const res = sankeyLayout(nodes, links, opts);
    const n = by(res);
    expect(res.columns).toBe(4);
    expect(n.get('a')!.x0).toBe(0);
    expect(n.get('f')!.x1).toBeCloseTo(600);
    for (const v of res.nodes) expect(v.x1 - v.x0).toBe(20);
  });

  it('heights are proportional to the value and nodes of a column never overlap', () => {
    const res = sankeyLayout(nodes, links, opts);
    for (const v of res.nodes) expect(v.y1 - v.y0).toBeCloseTo(v.value * res.ky, 6);
    const cols = new Map<number, SankeyLayoutNode[]>();
    for (const v of res.nodes) cols.set(v.layer, [...(cols.get(v.layer) ?? []), v]);
    for (const c of cols.values()) {
      c.sort((a, b) => a.y0 - b.y0);
      for (let i = 1; i < c.length; i++) expect(c[i].y0).toBeGreaterThanOrEqual(c[i - 1].y1 + res.gap - 1e-6);
      for (const v of c) {
        expect(v.y0).toBeGreaterThanOrEqual(-1e-6);
        expect(v.y1).toBeLessThanOrEqual(400 + 1e-6);
      }
    }
  });

  it('the fullest column fills the height', () => {
    const res = sankeyLayout(nodes, links, opts);
    // columns 0 (a, e: 10) and 1 (b, c: 8): column 0 has the most value + gaps
    const col0 = res.nodes.filter((v) => v.layer === 0);
    const used = col0.reduce((s, v) => s + v.y1 - v.y0, 0) + res.gap * (col0.length - 1);
    expect(used).toBeCloseTo(400, 6);
  });

  it('links are stacked in the order of the other end, inside their nodes', () => {
    const res = sankeyLayout(nodes, links, opts);
    for (const v of res.nodes) {
      for (let i = 1; i < v.sourceLinks.length; i++) expect(v.sourceLinks[i].target.y0).toBeGreaterThanOrEqual(v.sourceLinks[i - 1].target.y0);
      for (let i = 1; i < v.targetLinks.length; i++) expect(v.targetLinks[i].source.y0).toBeGreaterThanOrEqual(v.targetLinks[i - 1].source.y0);
      const out = v.sourceLinks.reduce((s, l) => s + l.width, 0);
      if (v.sourceLinks.length) {
        expect(v.sourceLinks[0].y0 - v.sourceLinks[0].width / 2).toBeGreaterThanOrEqual(v.y0 - 1e-6);
        const lastL = v.sourceLinks[v.sourceLinks.length - 1];
        expect(lastL.y0 + lastL.width / 2).toBeLessThanOrEqual(v.y0 + out + 1e-6);
      }
    }
    for (const l of res.links) expect(l.width).toBeCloseTo(l.value * res.ky, 6);
  });

  it('relaxation untangles a crossing given in the data order', () => {
    // two separate flows, listed so the first guess crosses them
    const n = names('a', 'b', 'x', 'y');
    const l = [L('a', 'y', 5), L('b', 'x', 5)];
    const res = by(sankeyLayout(n, l, { ...opts, iterations: 32 }));
    expect(res.get('a')!.y0 < res.get('b')!.y0).toBe(res.get('y')!.y0 < res.get('x')!.y0);
    // with no iterations, the data order is kept
    const raw = by(sankeyLayout(n, l, { ...opts, iterations: 0 }));
    expect(raw.get('a')!.y0).toBeLessThan(raw.get('b')!.y0);
    expect(raw.get('x')!.y0).toBeLessThan(raw.get('y')!.y0);
  });

  it('a node depth override moves it to that column', () => {
    const n = by(sankeyLayout([...names('a', 'b'), { name: 'c', depth: 3 }], [L('a', 'b', 1), L('b', 'c', 1)], opts));
    expect(n.get('c')!.layer).toBe(3);
  });

  it('cycles and self-links are left out and reported', () => {
    const res = sankeyLayout(names('a', 'b', 'c'), [L('a', 'b', 2), L('b', 'c', 2), L('c', 'a', 1), L('b', 'b', 1)], opts);
    expect(res.links.map((l) => l.index)).toEqual([0, 1]);
    expect(res.ignored).toEqual([
      { index: 2, source: 'c', target: 'a', reason: 'cycle' },
      { index: 3, source: 'b', target: 'b', reason: 'self' },
    ]);
    expect(by(res).get('c')!.depth).toBe(2);
  });

  it('links by index, and clear errors for unknown or duplicated nodes', () => {
    const res = sankeyLayout(names('a', 'b'), [{ source: 0, target: 1, value: 3 }], opts);
    expect(res.links[0].source.name).toBe('a');
    expect(() => sankeyLayout(names('a'), [L('a', 'zz', 1)], opts)).toThrow(/unknown node "zz"/);
    expect(() => sankeyLayout(names('a', 'a'), [], opts)).toThrow(/duplicated/);
  });

  it('sankeyLinkBreadths follows nodes moved by hand', () => {
    const res = sankeyLayout(names('s', 'p', 'q'), [L('s', 'p', 1), L('s', 'q', 1)], opts);
    const n = by(res);
    const [p, q] = [n.get('p')!, n.get('q')!];
    const first = n.get('s')!.sourceLinks[0].target;
    // swap p and q
    const dp = q.y0 - p.y0;
    p.y0 += dp;
    p.y1 += dp;
    q.y0 -= dp;
    q.y1 -= dp;
    sankeyLinkBreadths(res.nodes);
    expect(n.get('s')!.sourceLinks[0].target).not.toBe(first);
  });

  it('empty input', () => {
    const res = sankeyLayout([], [], opts);
    expect(res.nodes).toEqual([]);
    expect(res.columns).toBe(0);
  });
});
