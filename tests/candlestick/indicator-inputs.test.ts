import { describe, expect, it } from 'vitest';
import type { Bar } from '../../src/candlestick/core/types';
import { checkIndicatorParams, createIndicator, shiftSeries } from '../../src/candlestick/indicators/indicators';

const bars: Bar[] = Array.from({ length: 60 }, (_, i) => {
  const c = 100 + i + 3 * Math.sin(i);
  return { time: i * 60, open: c - 1, high: c + 2, low: c - 2, close: c, volume: 10 + (i % 4) };
});
const fakeView = { fmt: (x: number) => x.toFixed(2) } as never;

describe('SMA / EMA inputs', () => {
  it('EMA: alpha 2 / (n + 1) from the first value, live update = full compute', () => {
    const ema = createIndicator('ema', { length: 9 })!;
    ema.compute(bars, 0);
    const a = 2 / 10;
    let e = bars[0].close;
    for (let i = 1; i < 60; i++) e = a * bars[i].close + (1 - a) * e;
    expect(ema.raw[59]).toBeCloseTo(e, 10);
    const live = createIndicator('ema', { length: 9 })!;
    live.compute(bars.slice(0, 59), 0);
    live.compute(bars, 58);
    expect(live.raw[59]).toBeCloseTo(e, 10);
    expect(ema.title()).toBe('EMA 9 close');
    expect(ema.warmup()).toBe(90);
  });

  it('volume as the source', () => {
    const ma = createIndicator('sma', { length: 4, source: 'volume' })!;
    ma.compute(bars, 0);
    expect(ma.raw[3]).toBe((10 + 11 + 12 + 13) / 4);
  });

  it('offset moves the line right (past the last bar) or left', () => {
    expect(shiftSeries([1, 2, 3], null, 2).values).toEqual([NaN, NaN, 1, 2, 3]);
    expect(shiftSeries([1, 2, 3], null, -1).values).toEqual([2, 3, NaN]);
    const v = [1, 2, 3];
    expect(shiftSeries(v, null, 0).values).toBe(v);
    const ma = createIndicator('sma', { length: 2, offset: 3 })!;
    ma.compute(bars, 0);
    // the legend on bar 10 shows the value of bar 7
    expect(ma.legend(10, fakeView)[0].text).toBe(ma.raw[7].toFixed(2));
    expect(ma.title()).toBe('MA 2 close 3');
  });
});

describe('RSI style', () => {
  it('hiding the RSI line takes it out of the legend, axis and scale', () => {
    const rsi = createIndicator('rsi', { showRsi: false, maType: 'sma' })!;
    rsi.compute(bars, 0);
    expect(rsi.legend(59, fakeView)).toHaveLength(1);
    expect(rsi.axisLabels()).toHaveLength(1);
    const shown = createIndicator('rsi')!;
    shown.compute(bars, 0);
    expect(shown.legend(59, fakeView)).toHaveLength(1);
    expect(shown.params).toMatchObject({ showUpper: true, showMiddle: true, showLower: true, showBg: true, middle: 50 });
  });

  it('band rows carry a toggle, a colour and their level', () => {
    const f = createIndicator('rsi')!.schema.find((x) => x.label === 'Banda superior')!;
    expect(f).toMatchObject({ type: 'color', toggle: 'showUpper', numberKey: 'upper' });
  });
});

describe('settings that come from a simulation', () => {
  it('all right: no problems', () => {
    expect(checkIndicatorParams('rsi', { length: 14, upper: 65, lower: 35, maType: 'ema', maLength: 9, showBg: false, bgColor: 'rgba(0,0,0,0.1)', timeframe: '4h' })).toEqual([]);
    expect(checkIndicatorParams('ema', { length: 21, source: 'volume', offset: -2, color: '#fff', width: 2 })).toEqual([]);
  });

  it('says what is wrong', () => {
    expect(checkIndicatorParams('macd')[0]).toMatch(/tipo 'macd' desconhecido/);
    const p = checkIndicatorParams('rsi', { lenght: 14, upper: '70', maType: 'hull', lower: 120, timeframe: 'xx' });
    expect(p).toHaveLength(5);
    expect(p[0]).toMatch(/'lenght' não existe/);
    expect(p[1]).toMatch(/'upper' devia ser um número/);
    expect(p[2]).toMatch(/'maType' = "hull" não é válido/);
    expect(p[3]).toMatch(/'lower' = 120 fora do intervalo/);
    expect(p[4]).toMatch(/'timeframe' = "xx"/);
  });
});
