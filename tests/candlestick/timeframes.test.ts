import { beforeAll, describe, expect, it } from 'vitest';
import type { Chart as ChartT } from '../../src/candlestick/core/chart';
import type { HistoryRequest, HistoryResult } from '../../src/candlestick/core/history';
import { mapTimeframe } from '../../src/candlestick/core/timeframes';
import type { Bar, Timeframe } from '../../src/candlestick/core/types';
import { createIndicator, rsiInto, smaInto } from '../../src/candlestick/indicators/indicators';

// ---- minimal DOM so a real Chart runs in node (canvas calls are no-ops) ----
const frames: FrameRequestCallback[] = [];
const anyStub = (): unknown =>
  new Proxy(function () {}, {
    get: (_t, k) => (k === Symbol.toPrimitive ? () => 0 : k === 'width' ? 10 : anyStub()),
    set: () => true,
    apply: () => anyStub(),
  });
const g = globalThis as Record<string, unknown>;
g.window = globalThis;
g.devicePixelRatio = 1;
g.requestAnimationFrame = (cb: FrameRequestCallback): number => frames.push(cb);
g.cancelAnimationFrame = (): void => {};
g.ResizeObserver = class {
  observe(): void {}
  disconnect(): void {}
};
g.getComputedStyle = (): unknown => ({ position: 'relative' });
g.document = { createElement: () => ({ style: {}, addEventListener() {}, getContext: () => anyStub(), remove() {} }) };

let Chart: typeof ChartT;
beforeAll(async () => {
  Chart = (await import('../../src/candlestick/core/chart')).Chart;
});

function makeChart(): ChartT {
  const el = { style: {}, appendChild() {}, getBoundingClientRect: () => ({ width: 1064, height: 600 }) } as unknown as HTMLElement;
  return new Chart(el, { drawingStorage: null });
}

/** Run frames and requests until nothing happens for a while (the other timeframes load outside `isLoading`). */
async function settle(chart: ChartT): Promise<void> {
  let quiet = 0;
  for (let i = 0; i < 5000 && quiet < 30; i++) {
    await new Promise((r) => setTimeout(r, 0));
    const cbs = frames.splice(0);
    cbs.forEach((cb) => cb(performance.now()));
    quiet = cbs.length || chart.isLoading ? 0 : quiet + 1;
  }
}

// ---- a gateway with 400 days of bars of any timeframe, served in blocks of at most 1000 ----
const NOW = Math.floor(Date.now() / 1000);
const START = Math.floor((NOW - 400 * 86400) / 86400) * 86400;
const priceAt = (t: number): number => 100 + 20 * Math.sin(t / 86400 / 9) + 6 * Math.sin(t / 3600 / 5) + 2 * Math.sin(t / 700);

function barsOf(tf: number, to: number, countBack: number): { bars: Bar[]; noMore: boolean } {
  const bars: Bar[] = [];
  let t = Math.floor((Math.min(to, Math.floor(NOW / tf) * tf + tf) - 1) / tf) * tf;
  while (bars.length < Math.min(countBack, 1000) && t >= START) {
    const o = priceAt(t);
    const c = priceAt(t + tf);
    bars.push({ time: t, open: o, high: Math.max(o, c) + 1, low: Math.min(o, c) - 1, close: c, volume: 1 });
    t -= tf;
  }
  return { bars: bars.reverse(), noMore: t < START };
}

/** Every bar of a timeframe, for the direct calculation. */
function allBars(tf: number): Bar[] {
  const out: Bar[] = [];
  for (let t = Math.ceil(START / tf) * tf; t <= Math.floor(NOW / tf) * tf; t += tf) {
    const o = priceAt(t);
    const c = priceAt(t + tf);
    out.push({ time: t, open: o, high: Math.max(o, c) + 1, low: Math.min(o, c) - 1, close: c, volume: 1 });
  }
  return out;
}

function feed() {
  const log: { tf: number; to: number; countBack: number }[] = [];
  const get = async (tf: number, req: HistoryRequest): Promise<HistoryResult> => {
    log.push({ tf, to: req.to, countBack: req.countBack });
    await new Promise((r) => setTimeout(r, 0));
    return barsOf(tf, req.to, req.countBack);
  };
  return { log, source: (tf: number) => (req: HistoryRequest) => get(tf, req), tfFeed: { getBars: (t: Timeframe, req: HistoryRequest) => get(t.seconds, req) } };
}

/** The visible bar indexes of the chart. */
function visible(chart: ChartT): number[] {
  const vr = chart.ts.visibleRange();
  const out: number[] = [];
  for (let i = Math.max(0, Math.ceil(vr.from)); i <= Math.min(chart.bars.length - 1, Math.floor(vr.to)); i++) out.push(i);
  return out;
}

const H = 3600;
const H4 = 4 * H;

describe('mapTimeframe (no look-ahead)', () => {
  const bar = (time: number): Bar => ({ time, open: 1, high: 1, low: 1, close: 1, volume: 1 });
  const day = Date.UTC(2024, 6, 15) / 1000;

  it('a larger timeframe: each bar shows the last one closed when it opens, in steps', () => {
    const chart = Array.from({ length: 12 }, (_, i) => bar(day + (8 + i) * H)); // 08:00 … 19:00
    const own = [bar(day + 4 * H), bar(day + 8 * H), bar(day + 12 * H), bar(day + 16 * H)]; // 04, 08, 12, 16 (forming)
    const map = Array.from(mapTimeframe(chart, H, own, H4, true));
    // 08–11 → the 04–08 bar; 12–15 → the 08–12 bar; 16–19 → the 12–16 bar; the forming 16–20 bar never counts
    expect(map).toEqual([0, 0, 0, 0, 1, 1, 1, 1, 2, 2, 2, 2]);
  });

  it('the forming bar of the larger timeframe counts once a chart bar opens after its end', () => {
    const chart = Array.from({ length: 9 }, (_, i) => bar(day + (12 + i) * H)); // 12:00 … 20:00
    const own = [bar(day + 8 * H), bar(day + 12 * H), bar(day + 16 * H)];
    expect(mapTimeframe(chart, H, own, H4, true)[8]).toBe(2); // 20:00 opens: the 16–20 bar is closed
  });

  it('a smaller timeframe: its last bar closed when the chart bar closes; the forming one never', () => {
    const chart = [bar(day + 10 * H), bar(day + 11 * H)]; // 11:00 is forming
    const own = Array.from({ length: 7 }, (_, i) => bar(day + 10 * H + i * 900)); // 10:00 … 11:30 (forming)
    expect(Array.from(mapTimeframe(chart, H, own, 900, true))).toEqual([3, 5]); // 10:45, then 11:15
  });

  it('after the loaded bars of a series that does not reach now: nothing, not an old value', () => {
    const chart = Array.from({ length: 6 }, (_, i) => bar(day + i * H4));
    const own = [bar(day), bar(day + 3 * H)]; // 1h bars loaded up to 03:00
    // the 00:00 4h bar closes at 04:00 with the 03:00 1h bar; after that the 1h bars are not loaded yet
    expect(Array.from(mapTimeframe(chart, H4, own, H, false))).toEqual([1, -1, -1, -1, -1, -1]);
    expect(Array.from(mapTimeframe(chart, H4, own, H, true))).toEqual([1, 1, 1, 1, 1, 1]);
  });
});

describe('indicators with their own timeframe (Chart + feed)', () => {
  it('MA 20 · 4h on a 1h chart = the MA of the 4h bars, last closed one, ready from the first visible bar', async () => {
    const chart = makeChart();
    const f = feed();
    chart.setTimeframeFeed(f.tfFeed);
    await chart.setDataSource(f.source(H), H);
    const ma = createIndicator('sma', { length: 20, timeframe: '4h' })!;
    chart.addIndicator(ma);
    await settle(chart);
    expect(ma.params.timeframe).toBe('240');
    expect(f.log.some((r) => r.tf === H4)).toBe(true);
    expect(f.log.every((r) => r.countBack <= 1000)).toBe(true); // in blocks

    const own = allBars(H4);
    const ref: number[] = [];
    smaInto(ref, (i) => own[i].close, own.length, 20, 0);
    const idx = visible(chart);
    expect(idx.length).toBeGreaterThan(50);
    for (const i of idx) {
      const t = chart.bars[i].time;
      let k = -1;
      for (let j = 0; j < own.length; j++) if (own[j].time + H4 <= t) k = j;
      expect(ma.values[i]).toBeCloseTo(ref[k], 9);
    }
    // steps: the value changes only on the bar that opens when a 4h bar has closed
    for (const i of idx.slice(1)) if (ma.values[i] !== ma.values[i - 1]) expect(chart.bars[i].time % H4).toBe(0);
    expect(ma.title()).toBe('MA 20 close · 4h');
    // the line joins only the first bar of each 4h value (on the hours multiple of 4), no steps
    const pts = ma.points!;
    for (const i of idx.slice(1)) expect(pts[i] === 1).toBe(chart.bars[i].time % H4 === 0);
    chart.destroy();
  });

  it('RSI 14 · 15m on a 1h chart = the RSI of the 15m bars at the close of each hour', async () => {
    const chart = makeChart();
    const f = feed();
    chart.setTimeframeFeed(f.tfFeed);
    await chart.setDataSource(f.source(H), H);
    const rsi = createIndicator('rsi', { timeframe: '15' })!;
    chart.addIndicator(rsi);
    await settle(chart);
    const own = allBars(900);
    const ref: number[] = [];
    rsiInto(ref, [], [], (i) => own[i].close, own.length, 14, 0);
    const pos = new Map(own.map((b, i) => [b.time, i]));
    const idx = visible(chart);
    for (const i of idx) {
      const t = chart.bars[i].time;
      // the last 15m bar of the hour; for the forming hour the last closed 15m bar
      const last = i === chart.bars.length - 1 ? Math.floor(NOW / 900) * 900 - 900 : t + H - 900;
      // warm-up of 10 × 14 bars: within 0.01 of the RSI computed on the whole history
      expect(Math.abs(rsi.values[i] - ref[pos.get(last)!])).toBeLessThan(0.01);
    }
    expect(rsi.title()).toBe('RSI 14 close · 15m');
    // a smaller timeframe has a new value on every chart bar: a normal line, not a staircase
    expect(rsi.points).toBeNull();
    chart.destroy();
  });

  it('the same timeframe as the chart gives exactly the values of today', async () => {
    const chart = makeChart();
    const f = feed();
    chart.setTimeframeFeed(f.tfFeed);
    await chart.setDataSource(f.source(H), H);
    const a = createIndicator('sma', { length: 30 })!;
    const b = createIndicator('sma', { length: 30, timeframe: '1h' })!;
    chart.addIndicator(a);
    chart.addIndicator(b);
    await settle(chart);
    expect(b.values).toEqual(a.values);
    expect(b.values).toBe(b.raw);
    expect(b.title()).toBe('MA 30 close');
    expect(f.log.every((r) => r.tf === H)).toBe(true); // nothing asked for another timeframe
    chart.destroy();
  });

  it('switching the timeframe in the settings recomputes; back to the chart’s gives today’s values', async () => {
    const chart = makeChart();
    const f = feed();
    chart.setTimeframeFeed(f.tfFeed);
    await chart.setDataSource(f.source(H), H);
    const ma = createIndicator('sma', { length: 10 })!;
    chart.addIndicator(ma);
    await settle(chart);
    const before = [...ma.values];
    ma.params.timeframe = '240';
    chart.updateIndicator(ma);
    await settle(chart);
    expect(ma.values).not.toEqual(before);
    ma.params.timeframe = '';
    chart.updateIndicator(ma);
    expect(ma.values).toEqual(before);
    chart.destroy();
  });

  it('warm-up without a timeframe: MA 600 is ready from the first visible bar (older blocks are loaded)', async () => {
    const chart = makeChart();
    const f = feed();
    await chart.setDataSource(f.source(H), H, { countBack: 300 });
    const ma = createIndicator('sma', { length: 600 })!;
    chart.addIndicator(ma);
    await settle(chart);
    const idx = visible(chart);
    expect(idx[0]).toBeGreaterThanOrEqual(599);
    for (const i of idx) expect(Number.isFinite(ma.values[i])).toBe(true);
    chart.destroy();
  });

  it('after goToTrade to an old date: both kinds are ready from the first visible bar', async () => {
    const chart = makeChart();
    const f = feed();
    chart.setTimeframeFeed(f.tfFeed);
    await chart.setDataSource(f.source(H), H, { maxJump: 2000 });
    const ma = createIndicator('sma', { length: 200 })!;
    const rsi4h = createIndicator('rsi', { length: 14, timeframe: '240' })!;
    chart.addIndicator(ma);
    chart.addIndicator(rsi4h);
    await settle(chart);
    const entry = Math.floor((NOW - 300 * 86400) / H) * H; // far: a window around it
    chart.setTrades([{ id: 'old', side: 'long', entryTime: entry, entryPrice: 100, exitTime: entry + H, exitPrice: 101 }]);
    expect(await chart.goToTrade('old', 'entry', { animate: false })).toBe(true);
    await settle(chart);
    const idx = visible(chart);
    expect(chart.bars[idx[0]].time).toBeLessThan(entry);
    for (const i of idx) {
      expect(Number.isFinite(ma.values[i])).toBe(true);
      expect(Number.isFinite(rsi4h.values[i])).toBe(true);
    }
    // the 4h RSI around the trade is the one computed on the whole 4h history
    const own = allBars(H4);
    const ref: number[] = [];
    rsiInto(ref, [], [], (i) => own[i].close, own.length, 14, 0);
    const i = chart.data.indexAt(entry);
    const k = own.findIndex((b) => b.time + H4 > entry) - 1;
    expect(Math.abs(rsi4h.values[i] - ref[k])).toBeLessThan(0.01);
    chart.destroy();
  });

  it('realtime: the forming 4h bar does not move the line; once it closes the next chart bar shows it', async () => {
    const chart = makeChart();
    let push: ((b: Bar) => void) | null = null;
    // a fixed 1h history ending at 15:00 today (UTC), served whole
    const day = Math.floor(NOW / 86400) * 86400 - 86400;
    const own: Bar[] = Array.from({ length: 40 }, (_, i) => ({ time: day - 36 * H4 + i * H4, open: 1, high: 1, low: 1, close: i, volume: 1 }));
    // own[39] = the 12–16 bar (forming)
    chart.setTimeframeFeed({ getBars: async () => own.slice(), subscribeBars: (_t, onBar) => ((push = onBar), () => {}) });
    const hours: Bar[] = Array.from({ length: 30 }, (_, i) => ({ time: day + 12 * H - 29 * H + i * H, open: 1, high: 1, low: 1, close: 1, volume: 1 })); // … 12:00
    chart.setData(hours, H);
    chart.update({ time: day + 15 * H, open: 1, high: 1, low: 1, close: 1, volume: 1 });
    const ma = createIndicator('sma', { length: 2, timeframe: '240' })!;
    chart.addIndicator(ma);
    await settle(chart);
    const last = (): number => ma.values[ma.values.length - 1];
    expect(last()).toBeCloseTo((37 + 38) / 2); // 15:00 shows the 08–12 bar
    push!({ ...own[39], close: 1000 }); // the forming 4h bar moves
    await settle(chart);
    expect(last()).toBeCloseTo((37 + 38) / 2);
    chart.update({ time: day + 16 * H, open: 1, high: 1, low: 1, close: 1, volume: 1 }); // 16:00 opens
    expect(last()).toBeCloseTo((38 + 1000) / 2);
    chart.destroy();
  });
});
