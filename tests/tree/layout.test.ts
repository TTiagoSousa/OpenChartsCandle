import { describe, expect, it } from 'vitest';
import { radialSeparation, tidyLayout, type TidyInput } from '../../src/tree/layout';

type N = TidyInput & { name: string; children: N[] };
const n = (name: string, ...children: N[]): N => ({ name, children });

describe('tidy tree layout', () => {
  it('a parent sits over the middle of its children', () => {
    const b = n('b');
    const c = n('c');
    const d = n('d');
    const a = n('a', b, c, d);
    const p = tidyLayout(a);
    expect(p.get(b)!.x).toBe(0);
    expect(p.get(c)!.x).toBe(1);
    expect(p.get(d)!.x).toBe(2);
    expect(p.get(a)!.x).toBe(1);
    expect(p.get(a)!.depth).toBe(0);
    expect(p.get(d)!.depth).toBe(1);
  });

  it('cousins are two units apart and subtrees do not overlap', () => {
    const tree = n('r', n('a', n('a1'), n('a2'), n('a3')), n('b', n('b1', n('x'), n('y'), n('z'))), n('c'));
    const p = tidyLayout(tree);
    const byName = new Map([...p].map(([k, v]) => [k.name, v]));
    // a3 and b1 have different parents
    expect(byName.get('b1')!.x - byName.get('a3')!.x).toBeGreaterThanOrEqual(2);
    // every level keeps its order with at least one unit between neighbours
    const levels = new Map<number, number[]>();
    for (const v of p.values()) levels.set(v.depth, [...(levels.get(v.depth) ?? []), v.x]);
    for (const xs of levels.values()) {
      const s = [...xs].sort((u, v) => u - v);
      for (let i = 1; i < s.length; i++) expect(s[i] - s[i - 1]).toBeGreaterThanOrEqual(1 - 1e-9);
    }
    expect(Math.min(...[...p.values()].map((v) => v.x))).toBe(0);
  });

  it('a single node and a chain stay at 0', () => {
    const leaf = n('only');
    expect(tidyLayout(leaf).get(leaf)!.x).toBe(0);
    const c = n('c');
    const chain = n('a', n('b', c));
    expect(tidyLayout(chain).get(c)).toEqual({ x: 0, depth: 2 });
  });

  it('radial separation shrinks with the depth', () => {
    const l1 = n('l1');
    const l2 = n('l2');
    const tree = n('r', n('a', n('a1', l1)), n('b', n('b1', l2)));
    const p = tidyLayout(tree, radialSeparation);
    // l1 and l2 are cousins at depth 3: 2 / 3 apart … but their parents are 2 / 2 apart, which wins
    expect(p.get(l2)!.x - p.get(l1)!.x).toBeCloseTo(1);
  });
});
