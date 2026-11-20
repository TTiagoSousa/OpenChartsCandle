import { describe, expect, it } from 'vitest';
import { SeriesData } from '../../src/candlestick/core/data';
import { TimeScale } from '../../src/candlestick/core/scales';
import { drawTimeRanges } from '../../src/candlestick/core/time-ranges';
import { TimeZone, barDate, checkTimeZone, zonedTime } from '../../src/candlestick/core/timezone';
import type { Bar } from '../../src/candlestick/core/types';
import { formatCrosshairTime } from '../../src/candlestick/core/utils';
import type { PaneView } from '../../src/candlestick/core/view';
import { INDICATORS, createIndicator, rsiInto } from '../../src/candlestick/indicators/indicators';

type Computed = { compute(b: Bar[], f: number): void; values: number[]; overlay: boolean; range(a: number, b: number): [number, number] | null };

const bars: Bar[] = Array.from({ length: 400 }, (_, i) => {
  const c = 100 + Math.sin(i / 7) * 5 + Math.cos(i / 3) * 2 + i * 0.05;
  return { time: i * 60, open: c - 0.5, high: c + 1, low: c - 1, close: c, volume: 1 };
});
const close = (i: number): number => bars[i].close;

describe('SMA / RSI', () => {
  it('RSI uses Wilder smoothing and stays in 0–100', () => {
    const out: number[] = [];
    const g: number[] = [];
    const l: number[] = [];
    rsiInto(out, g, l, close, bars.length, 14, 0);
    expect(out[13]).toBeNaN();
    // reference: plain loop
    let ag = 0;
    let al = 0;
    for (let j = 1; j <= 14; j++) {
      const d = close(j) - close(j - 1);
      ag += Math.max(d, 0) / 14;
      al += Math.max(-d, 0) / 14;
    }
    expect(out[14]).toBeCloseTo(100 - 100 / (1 + ag / al), 9);
    for (let i = 15; i < bars.length; i++) {
      const d = close(i) - close(i - 1);
      ag = (ag * 13 + Math.max(d, 0)) / 14;
      al = (al * 13 + Math.max(-d, 0)) / 14;
    }
    expect(out[bars.length - 1]).toBeCloseTo(100 - 100 / (1 + ag / al), 9);
    expect(out.slice(14).every((v) => v >= 0 && v <= 100)).toBe(true);
    // only gains → 100
    const up: number[] = [];
    rsiInto(up, [], [], (i) => i, 30, 14, 0);
    expect(up[29]).toBe(100);
  });

  it('live ticks (compute from the changed bar) match a full recompute, for every type', () => {
    for (const type of ['sma', 'rsi']) {
      const live = createIndicator(type, { length: 14 }) as unknown as Computed;
      live.compute(bars.slice(0, 300), 0);
      const grown = bars.slice(0, 301).map((b) => ({ ...b }));
      grown[299].close += 3; // the forming bar changed, then a new one appeared
      live.compute(grown, 299);
      const full = createIndicator(type, { length: 14 }) as unknown as Computed;
      full.compute(grown, 0);
      for (let i = 0; i < 301; i++) {
        if (Number.isNaN(full.values[i])) expect(live.values[i]).toBeNaN();
        else expect(live.values[i]).toBeCloseTo(full.values[i], 9);
      }
    }
  });

  it('SMA, EMA and RSI, with their settings', () => {
    expect(INDICATORS.map((e) => e.type).slice(0, 4)).toEqual(['sma', 'ema', 'rsi', 'svp']);
    expect(createIndicator('zigzag')).toBeNull();
    const fields = (t: string): string[] => createIndicator(t)!.schema.map((f) => f.label);
    expect(fields('sma')).toEqual(['Período', 'Fonte', 'Deslocamento', 'Tempo gráfico', 'Cor', 'Espessura']);
    expect(fields('ema')).toEqual(fields('sma'));
    expect(fields('rsi')).toEqual([
      'Período IFR', 'Fonte', 'Tempo gráfico',
      'Tipo', 'Período',
      'RSI', 'Espessura do RSI', 'Média do RSI', 'Banda superior', 'Banda do meio', 'Banda inferior', 'Fundo entre as bandas',
    ]);
    const src = createIndicator('rsi')!.schema.find((f) => f.key === 'source')!;
    expect(src.options!.map((o) => src.optionLabels![o])).toEqual(['Abertura', 'Máxima', 'Mínima', 'Fechamento', 'Volume']);
    // a source that is no longer offered (saved state) falls back to the close
    expect(createIndicator('sma', { source: 'hl2' })!.params.source).toBe('close');
    expect(createIndicator('rsi', { source: 'high' })!.params.source).toBe('high');
    expect(createIndicator('ema', { source: 'volume' })!.params.source).toBe('volume');
  });

  it('the MA is drawn over the candles, RSI in its own pane scaled to its values and levels', () => {
    expect((createIndicator('sma') as unknown as Computed).overlay).toBe(true);
    const rsi = createIndicator('rsi') as unknown as Computed;
    expect(rsi.overlay).toBe(false);
    // no values yet: just the 30–70 band
    expect(rsi.range(0, 10)).toEqual([30, 70]);
    rsi.values.push(45, 82, 55, 12);
    expect(rsi.range(0, 2)).toEqual([30, 82]);
    expect(rsi.range(0, 3)).toEqual([12, 82]);
  });

  it('RSI values are cut to 2 decimals like TradingView', () => {
    const rsi = createIndicator('rsi') as unknown as { formatValue(v: number): string };
    // BTCUSDT 1D on Binance, 5 and 6 Feb 2018
    expect(rsi.formatValue(26.99568)).toBe('26.99');
    expect(rsi.formatValue(32.47791)).toBe('32.47');
    expect(rsi.formatValue(32.47)).toBe('32.47');
    expect(rsi.formatValue(100)).toBe('100.00');
  });
});

describe('time zone', () => {
  it('offsets of IANA zones follow daylight saving time', () => {
    const lis = new TimeZone('Europe/Lisbon');
    expect(lis.offset(Date.UTC(2024, 0, 15) / 1000)).toBe(0);
    expect(lis.offset(Date.UTC(2024, 6, 15) / 1000)).toBe(3600);
    const ny = new TimeZone('America/New_York');
    expect(ny.offset(Date.UTC(2024, 0, 15) / 1000)).toBe(-5 * 3600);
    expect(ny.offset(Date.UTC(2024, 6, 15) / 1000)).toBe(-4 * 3600);
    expect(new TimeZone('Asia/Kolkata').label(0)).toBe('UTC+5:30');
    expect(new TimeZone('UTC').offset(123)).toBe(0);
    // the DST change in Lisbon: 2024-03-31 01:00 UTC
    const change = Date.UTC(2024, 2, 31, 1, 0) / 1000;
    expect(lis.offset(change - 1)).toBe(0);
    expect(lis.offset(change)).toBe(3600);
  });

  it('wall clock, zonedTime and unknown names', () => {
    const ny = new TimeZone('America/New_York');
    const t = Date.UTC(2024, 6, 15, 13, 30) / 1000;
    expect(ny.wall(t).getUTCHours()).toBe(9);
    expect(zonedTime(ny, 2024, 6, 15, 9, 30)).toBe(t);
    expect(zonedTime(new TimeZone('Europe/Lisbon'), 2024, 0, 1)).toBe(Date.UTC(2024, 0, 1) / 1000);
    expect(() => checkTimeZone('Mars/Olympus')).toThrow(RangeError);
    expect(() => checkTimeZone('exchange')).not.toThrow();
  });

  it('the crosshair shows intraday times in the zone and daily bars by their date', () => {
    const t = Date.UTC(2024, 6, 15, 13, 30) / 1000;
    expect(formatCrosshairTime(t, 60, new TimeZone('UTC'))).toContain('13:30');
    expect(formatCrosshairTime(t, 60, new TimeZone('America/New_York'))).toContain('09:30');
    expect(formatCrosshairTime(t, 60, new TimeZone('Asia/Tokyo'))).toContain('22:30');
    // a daily bar at 00:00 UTC is the 15th in any zone (not the 14th in New York)
    const day = Date.UTC(2024, 6, 15) / 1000;
    expect(formatCrosshairTime(day, 86400, new TimeZone('America/New_York'))).toBe("Seg 15 Jul '24");
    // a daily bar at 00:00 in Tokyo (15:00 UTC the day before) is also the 15th
    expect(barDate(day - 9 * 3600).getUTCDate()).toBe(15);
  });
});

describe('time ranges', () => {
  function view(tf: number, n: number, spacing = 10): { v: PaneView; fills: number[][]; lines: number[] } {
    const data = new SeriesData(tf, Array.from({ length: n }, (_, i) => ({ time: 1_700_000_000 - (1_700_000_000 % tf) + i * tf, open: 1, high: 2, low: 0.5, close: 1, volume: 1 })));
    const ts = new TimeScale();
    ts.width = 1000;
    ts.barSpacing = spacing;
    ts.rightOffset = 0;
    ts.baseIndex = n - 1;
    const fills: number[][] = [];
    const lines: number[] = [];
    const ctx = new Proxy({} as Record<string, unknown>, {
      get: (o, k) => {
        if (k === 'fillRect') return (...a: number[]) => fills.push(a);
        if (k === 'moveTo') return (x: number) => lines.push(x);
        if (k === 'measureText') return () => ({ width: 40 });
        return k in o ? o[k as string] : () => {};
      },
      set: (o, k, val) => ((o[k as string] = val), true),
    });
    const v = { ctx, data, ts, dpr: 1, width: 1000, height: 400 } as unknown as PaneView;
    return { v, fills, lines };
  }

  it('a zone covers whole bars: from the bar that contains `from` to the one before `to`', () => {
    const { v, fills } = view(3600, 50);
    const t0 = v.data.bars[10].time;
    drawTimeRanges(v, [{ from: t0 + 1800, to: v.data.bars[20].time }], true); // 10:30 → 20:00 on 1h
    const [x, , w] = fills[0];
    expect(x).toBeCloseTo(v.ts.indexToX(10) - 5);
    expect(x + w).toBeCloseTo(v.ts.indexToX(19) + 5);
  });

  it('the same zone snaps to the containing bars on another timeframe; a line sits at the bar edge', () => {
    const { v, fills, lines } = view(60, 600, 1.5);
    const start = v.data.bars[100].time + 37; // inside a 1m bar
    drawTimeRanges(v, [{ from: start, to: start + 3600 }, { from: v.data.bars[300].time * 1000 }], false); // ms work too
    expect(fills[0][0]).toBeCloseTo(v.ts.indexToX(100) - 0.75);
    expect(fills[0][0] + fills[0][2]).toBeCloseTo(v.ts.indexToX(160) + 0.75);
    expect(Math.abs(lines[0] - (v.ts.indexToX(300) - 0.75))).toBeLessThanOrEqual(0.5);
  });

  it('allPanes: false keeps it out of the indicator panes', () => {
    const { v, fills } = view(60, 100);
    drawTimeRanges(v, [{ from: v.data.bars[10].time, to: v.data.bars[20].time, allPanes: false }], false);
    expect(fills).toHaveLength(0);
  });
});
