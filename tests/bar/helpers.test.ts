import { describe, expect, it } from 'vitest';
import { colorScale, fromDataset, waterfall } from '../../src/bar/helpers';

describe('waterfall', () => {
  it('floats each step on the running total', () => {
    const w = waterfall([100, 50, -30, 20]);
    expect(w.base).toEqual([0, 100, 120, 120]);
    expect(w.up).toEqual([100, 50, null, 20]);
    expect(w.down).toEqual([null, null, 30, null]);
    expect(w.totals).toEqual([100, 150, 120, 140]);
  });

  it('can start from an initial total', () => {
    const w = waterfall([-200, 300], 1000);
    expect(w.base).toEqual([0, 800, 800]);
    expect(w.up).toEqual([1000, null, 300]);
    expect(w.down).toEqual([null, 200, null]);
  });
});

describe('colorScale', () => {
  it('interpolates between colors', () => {
    const f = colorScale(0, 100, ['#000000', '#ffffff']);
    expect(f(0)).toBe('rgb(0, 0, 0)');
    expect(f(50)).toBe('rgb(128, 128, 128)');
    expect(f(200)).toBe('rgb(255, 255, 255)');
  });
});

describe('fromDataset', () => {
  const table = [
    ['produto', '2024', '2025'],
    ['Chá', 43.3, 85.8],
    ['Café', 83.1, 73.4],
  ];

  it('reads series by column', () => {
    const d = fromDataset(table);
    expect(d.categories).toEqual(['Chá', 'Café']);
    expect(d.series.map((s) => s.name)).toEqual(['2024', '2025']);
    expect(d.series[1].data).toEqual([85.8, 73.4]);
  });

  it('reads series by row', () => {
    const d = fromDataset(table, { seriesLayoutBy: 'row' });
    expect(d.categories).toEqual(['2024', '2025']);
    expect(d.series.map((s) => s.name)).toEqual(['Chá', 'Café']);
    expect(d.series[0].data).toEqual([43.3, 85.8]);
  });

  it('picks the category column by name (encode)', () => {
    const d = fromDataset([['score', 'amount', 'product'], [89.3, 58212, 'Chá'], [57.1, 78254, 'Café']], { category: 'product', series: ['amount'] });
    expect(d.categories).toEqual(['Chá', 'Café']);
    expect(d.series).toEqual([{ name: 'amount', data: [58212, 78254] }]);
  });

  it('accepts a list of objects', () => {
    const d = fromDataset([{ produto: 'Chá', vendas: 10 }, { produto: 'Café', vendas: 20 }], { category: 'produto' });
    expect(d.categories).toEqual(['Chá', 'Café']);
    expect(d.series[0]).toEqual({ name: 'vendas', data: [10, 20] });
  });
});
