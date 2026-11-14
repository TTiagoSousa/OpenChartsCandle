import { describe, expect, it } from 'vitest';
import { SeriesData, aggregate, bucketStart, normalizeBars } from '../../src/candlestick/core/data';
import type { Bar } from '../../src/candlestick/core/types';

const bar = (time: number, close: number, volume = 1): Bar => ({ time, open: close, high: close + 1, low: close - 1, close, volume });

describe('normalizeBars', () => {
  it('sorts, dedupes and converts milliseconds to seconds', () => {
    const t = 1_760_000_000;
    const out = normalizeBars([bar((t + 60) * 1000, 3), bar(t, 1), bar(t * 1000, 2)]);
    expect(out.map((b) => b.time)).toEqual([t, t + 60]);
    expect(out[0].close).toBe(2); // last duplicate wins
  });
});

describe('bucketStart / aggregate', () => {
  it('aligns weeks to Monday 00:00 UTC', () => {
    const wed = Date.UTC(2026, 9, 14, 15) / 1000; // Wednesday
    expect(new Date(bucketStart(wed, 604800) * 1000).toISOString()).toBe('2026-10-12T00:00:00.000Z');
  });

  it('aggregates 1m bars into 5m OHLCV', () => {
    const base = [0, 60, 120, 180, 240, 300].map((t, i) => bar(t, 10 + i, 2));
    const out = aggregate(base, 300);
    expect(out).toHaveLength(2);
    expect(out[0]).toMatchObject({ time: 0, open: 10, close: 14, high: 15, low: 9, volume: 10 });
    expect(out[1]).toMatchObject({ time: 300, open: 15, close: 15 });
  });
});

describe('SeriesData', () => {
  it('update replaces the last bar or appends a newer one', () => {
    const d = new SeriesData(60, [bar(0, 1), bar(60, 2)]);
    expect(d.update(bar(60, 5))).toBe(1);
    expect(d.bars[1].close).toBe(5);
    expect(d.update(bar(120, 6))).toBe(2);
    expect(d.length).toBe(3);
    expect(d.update(bar(0, 9))).toBe(-1); // older bars are ignored
  });

  it('maps time <-> fractional index, extrapolating past both ends and across gaps', () => {
    const d = new SeriesData(60, [bar(0, 1), bar(60, 1), bar(600, 1)]); // gap between 60 and 600
    expect(d.timeToIndex(60)).toBe(1);
    expect(d.timeToIndex(330)).toBeCloseTo(1.5);
    expect(d.timeToIndex(720)).toBe(4);
    expect(d.timeToIndex(-60)).toBe(-1);
    for (const fi of [-2, 0, 0.5, 1.25, 2, 3.5]) expect(d.timeToIndex(d.indexToTime(fi))).toBeCloseTo(fi);
  });
});

describe('parseTimeframe / indexAt', () => {
  it('reads ids and names', async () => {
    const { parseTimeframe } = await import('../../src/candlestick/core/types');
    expect(parseTimeframe('60')?.seconds).toBe(3600);
    expect(parseTimeframe('1h')?.id).toBe('60');
    expect(parseTimeframe('4h')?.id).toBe('240');
    expect(parseTimeframe('1D')?.id).toBe('1D');
    expect(parseTimeframe('W')?.seconds).toBe(604800);
    expect(parseTimeframe('2h')).toMatchObject({ id: '120', seconds: 7200 });
    expect(parseTimeframe('3D')).toMatchObject({ id: '3D', seconds: 3 * 86400, short: '3D' });
    expect(parseTimeframe('xyz')).toBeNull();
  });

  it('indexAt returns the bar that contains the instant', async () => {
    const { SeriesData } = await import('../../src/candlestick/core/data');
    const d = new SeriesData(3600, [0, 3600, 7200].map((time) => ({ time, open: 1, high: 1, low: 1, close: 1, volume: 0 })));
    expect(d.indexAt(3600 + 37 * 60)).toBe(1);
    expect(d.indexAt(7200 + 3599)).toBe(2);
    expect(d.indexAt(-1)).toBe(-1);
    expect(d.prepend([{ time: -3600, open: 1, high: 1, low: 1, close: 1, volume: 0 }, { time: 0, open: 9, high: 9, low: 9, close: 9, volume: 0 }])).toBe(1);
    expect(d.bars[1].open).toBe(1); // existing bars win over repeated ones
  });
});
