import { describe, expect, it } from 'vitest';
import type { Bar } from '../../src/candlestick/core/types';
import { createIndicator, maInto, stdevAt } from '../../src/candlestick/indicators/indicators';

const NA = NaN;
const series = [NA, NA, 1, 2, 3, 4, 5, 6];
const src = (i: number): number => series[i];
const vol = (i: number): number => (i % 2 ? 2 : 1);
const run = (type: Parameters<typeof maInto>[5], len = 3, from = 0, out: number[] = []): number[] => {
  maInto(out, src, vol, series.length, len, type, from);
  return out;
};
const near = (a: number[], b: number[]): void => {
  expect(a.length).toBe(b.length);
  a.forEach((x, i) => (isNaN(b[i]) ? expect(x).toBeNaN() : expect(x).toBeCloseTo(b[i], 10)));
};

describe('moving averages of a series that starts with NaN (Pine ta.*)', () => {
  it('SMA, WMA and VWMA need len values in a row', () => {
    near(run('sma'), [NA, NA, NA, NA, 2, 3, 4, 5]);
    near(run('wma'), [NA, NA, NA, NA, (1 + 4 + 9) / 6, (2 + 6 + 12) / 6, (3 + 8 + 15) / 6, (4 + 10 + 18) / 6]);
    // volumes 1, 2, 1, 2 … (odd indices are 2)
    near(run('vwma').slice(4), [(1 * 1 + 2 * 2 + 3 * 1) / 4, (2 * 2 + 3 * 1 + 4 * 2) / 5, (3 + 8 + 5) / 4, (8 + 5 + 12) / 5]);
  });

  it('EMA starts at the first value, RMA at the SMA of the first len', () => {
    const a = 0.5;
    const ema = [NA, NA, 1];
    for (let i = 3; i < 8; i++) ema.push(a * series[i] + (1 - a) * ema[i - 1]);
    near(run('ema'), ema);
    const rma = [NA, NA, NA, NA, 2];
    for (let i = 5; i < 8; i++) rma.push(series[i] / 3 + (2 / 3) * rma[i - 1]);
    near(run('rma'), rma);
  });

  it('a live update only from the last bar gives the same values', () => {
    for (const t of ['sma', 'ema', 'rma', 'wma', 'vwma'] as const) near(run(t, 3, 7, run(t)), run(t));
  });

  it('population standard deviation like ta.stdev', () => {
    expect(stdevAt(src, 4, 3)).toBeCloseTo(Math.sqrt(2 / 3), 10);
    expect(stdevAt(src, 3, 3)).toBeNaN();
  });
});

describe('RSI smoothing', () => {
  const bars: Bar[] = Array.from({ length: 300 }, (_, i) => {
    const c = 100 + 10 * Math.sin(i / 7) + (i % 5);
    return { time: i * 60, open: c, high: c + 1, low: c - 1, close: c, volume: 1 + (i % 3) };
  });

  it('none by default: no extra lines, legend has only the RSI', () => {
    const rsi = createIndicator('rsi')!;
    rsi.compute(bars, 0);
    expect(rsi.params.maType).toBe('none');
    expect(rsi.lines[0].every((v) => isNaN(v))).toBe(true);
    expect(rsi.title()).toBe('RSI 14 close');
  });

  it('only the simple and the exponential average', () => {
    const rsi = createIndicator('rsi')!;
    expect(rsi.schema.find((f) => f.key === 'maType')!.options).toEqual(['none', 'sma', 'ema']);
    expect(rsi.schema.some((f) => f.key === 'bbMult')).toBe(false);
    expect('bbMult' in rsi.params).toBe(false);
    // a saved state with an average that was taken out gets the SMA
    for (const t of ['sma_bb', 'rma', 'wma', 'vwma']) expect(createIndicator('rsi', { maType: t, bbMult: 2 })!.params).not.toHaveProperty('bbMult');
    expect(createIndicator('rsi', { maType: 'sma_bb' })!.params.maType).toBe('sma');
    expect(createIndicator('rsi', { maType: 'wma' })!.params.maType).toBe('sma');
  });

  it('SMA: the average of the last maLength RSI values', () => {
    const rsi = createIndicator('rsi', { maType: 'sma', maLength: 14 })!;
    rsi.compute(bars, 0);
    const [ma] = rsi.lines;
    const i = 200;
    expect(ma[i]).toBeCloseTo(rsi.raw.slice(i - 13, i + 1).reduce((a, b) => a + b, 0) / 14, 10);
    // first RSI at 14, first average 13 bars later
    expect(ma[26]).toBeNaN();
    expect(ma[27]).toBeCloseTo(rsi.raw.slice(14, 28).reduce((a, b) => a + b, 0) / 14, 10);
    expect(rsi.title()).toBe('RSI 14 close SMA 14');
    expect(rsi.legend(i, null as never)).toHaveLength(2);
  });

  it('the average follows live updates and an unknown type falls back to none', () => {
    const rsi = createIndicator('rsi', { maType: 'ema' })!;
    rsi.compute(bars.slice(0, 299), 0);
    rsi.compute(bars, 298);
    const full = createIndicator('rsi', { maType: 'ema' })!;
    full.compute(bars, 0);
    expect(rsi.lines[0][299]).toBeCloseTo(full.lines[0][299], 10);
    expect(rsi.legend(299, null as never)).toHaveLength(2);
    expect(createIndicator('rsi', { maType: 'hma' })!.params.maType).toBe('none');
  });
});
