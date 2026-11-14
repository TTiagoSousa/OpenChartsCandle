import { describe, expect, it } from 'vitest';
import type { Bar } from '../../src/candlestick/core/types';
import { createIndicator, smaInto } from '../../src/candlestick/indicators/indicators';

describe('SMA', () => {
  it('computes a rolling average with NaN warm-up', () => {
    const out: number[] = [];
    const src = [1, 2, 3, 4, 5, 6];
    smaInto(out, (i) => src[i], src.length, 3, 0);
    expect(out.slice(0, 2).every(Number.isNaN)).toBe(true);
    expect(out.slice(2)).toEqual([2, 3, 4, 5]);
  });

  it('incremental recompute matches a full recompute', () => {
    const bars: Bar[] = Array.from({ length: 300 }, (_, i) => {
      const c = 100 + Math.sin(i / 7) * 5 + i * 0.1;
      return { time: i * 60, open: c, high: c + 1, low: c - 1, close: c, volume: 1 };
    });
    const live = createIndicator('sma', { length: 20 })! as unknown as { compute(b: Bar[], f: number): void; values: number[] };
    live.compute(bars.slice(0, 250), 0);
    const grown = bars.slice(0, 251);
    live.compute(grown, 249); // what Chart.update() does on a new bar
    const full = createIndicator('sma', { length: 20 })! as unknown as { compute(b: Bar[], f: number): void; values: number[] };
    full.compute(grown, 0);
    for (let i = 19; i < 251; i++) expect(live.values[i]).toBeCloseTo(full.values[i]);
  });
});
