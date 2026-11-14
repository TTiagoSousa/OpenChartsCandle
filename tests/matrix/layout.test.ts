import { describe, expect, it } from 'vitest';
import {
  matrixGridCells,
  matrixHeader,
  matrixIndexAt,
  matrixIsGrid,
  matrixMedia,
  matrixOffsets,
  matrixParseLength,
  matrixPlace,
  matrixResolve,
  matrixSizes,
} from '../../src/matrix/layout';

const YEARS = [
  { value: '2024', children: [{ value: 'T1', children: ['Jan', 'Fev', 'Mar'] }, { value: 'T2', children: ['Abr', 'Mai', 'Jun'] }] },
  { value: '2025', children: ['T1', 'T2'] },
  'Total',
];

describe('matrix headers', () => {
  it('parents span their leaves and leaves above the bottom span down', () => {
    const h = matrixHeader(YEARS);
    expect(h.levels).toBe(3);
    expect(h.leaves.map((l) => l.name)).toEqual(['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'T1', 'T2', 'Total']);
    const y2024 = h.nodes.find((n) => n.name === '2024')!;
    expect([y2024.start, y2024.span, y2024.level, y2024.depth]).toEqual([0, 6, 0, 1]);
    const t2 = h.nodes.find((n) => n.path.join('/') === '2024/T2')!;
    expect([t2.start, t2.span, t2.level]).toEqual([3, 3, 1]);
    // 2025 › T1 is a leaf on level 1: it covers levels 1 and 2
    const t1b = h.leaves[6];
    expect(t1b.path).toEqual(['2025', 'T1']);
    expect([t1b.level, t1b.depth]).toEqual([1, 2]);
    // 'Total' is a leaf on level 0: it covers all 3 levels
    expect([h.leaves[8].level, h.leaves[8].depth]).toEqual([0, 3]);
  });

  it('a count gives plain leaves', () => {
    const h = matrixHeader(3);
    expect(h.leaves.map((l) => l.name)).toEqual(['0', '1', '2']);
    expect(h.levels).toBe(1);
    expect(matrixHeader([]).levels).toBe(0);
  });
});

describe('matrix sizes', () => {
  it('parses lengths', () => {
    expect(matrixParseLength(40, 200)).toEqual({ px: 40, fr: 0 });
    expect(matrixParseLength('25%', 200)).toEqual({ px: 50, fr: 0 });
    expect(matrixParseLength('2fr', 200)).toEqual({ px: 0, fr: 2 });
    expect(matrixParseLength('auto', 200)).toEqual({ px: 0, fr: 1 });
    expect(matrixParseLength(undefined, 200)).toEqual({ px: 0, fr: 1 });
  });

  it('fixed first, the rest shared by weight', () => {
    expect(matrixSizes([100, '1fr', '3fr'], 500)).toEqual([100, 100, 300]);
    expect(matrixSizes(['50%', undefined], 300)).toEqual([150, 150]);
  });

  it('fixed sizes shrink when they do not fit; flex keeps its minimum', () => {
    expect(matrixSizes([200, 200], 200)).toEqual([100, 100]);
    expect(matrixSizes([300, '1fr'], 200, 40)).toEqual([160, 40]);
  });

  it('offsets are whole px and add up', () => {
    const { offsets, sizes } = matrixOffsets([33.3, 33.3, 33.4], 10);
    expect(offsets).toEqual([10, 43, 77, 110]);
    expect(sizes.reduce((a, b) => a + b, 0)).toBe(100);
  });

  it('finds the leaf under a position', () => {
    const offs = [0, 10, 30, 60];
    expect(matrixIndexAt(offs, 0)).toBe(0);
    expect(matrixIndexAt(offs, 9.9)).toBe(0);
    expect(matrixIndexAt(offs, 10)).toBe(1);
    expect(matrixIndexAt(offs, 59)).toBe(2);
    expect(matrixIndexAt(offs, 60)).toBe(-1);
    expect(matrixIndexAt(offs, -1)).toBe(-1);
  });
});

describe('matrix cells', () => {
  const xh = matrixHeader(YEARS);
  const yh = matrixHeader(['A', 'B', 'C']);

  it('resolves coords by index, name, parent, path and range', () => {
    expect(matrixResolve(2, xh)).toEqual([2, 2]);
    expect(matrixResolve('Mai', xh)).toEqual([4, 4]);
    expect(matrixResolve('2024', xh)).toEqual([0, 5]);
    expect(matrixResolve('2024/T2', xh)).toEqual([3, 5]);
    // a leaf name wins over a parent with the same name
    expect(matrixResolve('T1', xh)).toEqual([6, 6]);
    expect(matrixResolve(['Fev', 'Abr'], xh)).toEqual([1, 3]);
    expect(matrixResolve('Nada', xh)).toBeNull();
    expect(matrixResolve(99, xh)).toBeNull();
  });

  it('places cells, merged cells win and the grid points to them', () => {
    const { cells, grid, nx } = matrixPlace(
      [
        { coord: [0, 0], value: 1 },
        { coord: [1, 0], value: 2 },
        { coord: ['2024/T2', 'B'], value: 'merged' },
        { coord: [0, 'A'], colSpan: 2, rowSpan: 2, value: 'big' },
        { coord: [4, 'B'], value: 'covered' },
      ],
      xh,
      yh,
    );
    // the two single cells under 'big' are dropped, and so is the one under 'merged'
    expect(cells.map((c) => c.cell.value)).toEqual(['big', 'merged']);
    const big = cells[0];
    expect([big.x0, big.x1, big.y0, big.y1]).toEqual([0, 1, 0, 1]);
    expect(grid[1 * nx + 1]).toBe(0);
    expect(grid[1 * nx + 5]).toBe(1);
    expect(grid[0 * nx + 5]).toBe(-1);
  });

  it('a later merged cell replaces an overlapping one', () => {
    const { cells } = matrixPlace(
      [
        { coord: [[0, 2], 0], value: 'a' },
        { coord: [[2, 3], [0, 1]], value: 'b' },
      ],
      xh,
      yh,
    );
    expect(cells.map((c) => c.cell.value)).toEqual(['b']);
  });

  it('spans are clamped to the grid', () => {
    const { cells } = matrixPlace([{ coord: ['Total', 'C'], colSpan: 5, rowSpan: 5 }], xh, yh);
    expect([cells[0].x1, cells[0].y1]).toEqual([8, 2]);
  });

  it('value grids become cells', () => {
    expect(matrixIsGrid([[1, 2], [3]])).toBe(true);
    expect(matrixIsGrid([{ coord: [0, 0] }])).toBe(false);
    expect(matrixGridCells([[1, null], [undefined, 4]]).map((c) => [c.coord, c.value])).toEqual([
      [[0, 0], 1],
      [[1, 1], 4],
    ]);
  });
});

describe('matrix media', () => {
  it('matches the rules by size', () => {
    const rules = [
      { query: { maxWidth: 700 }, option: {} },
      { query: { maxWidth: 400 }, option: {} },
      { query: { minAspectRatio: 2 }, option: {} },
    ];
    expect(matrixMedia(rules, 900, 600)).toEqual([]);
    expect(matrixMedia(rules, 600, 600)).toEqual([0]);
    expect(matrixMedia(rules, 380, 100)).toEqual([0, 1, 2]);
    expect(matrixMedia(undefined, 10, 10)).toEqual([]);
  });
});
