import { beforeAll, describe, expect, it } from 'vitest';
import type { Chart as ChartT } from '../../src/candlestick/core/chart';
import type { HistoryRequest, HistoryResult } from '../../src/candlestick/core/history';
import type { Bar } from '../../src/candlestick/core/types';

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

/** Run animation frames and pending requests until everything is quiet. */
async function settle(chart: ChartT): Promise<void> {
  for (let i = 0; i < 2000; i++) {
    await new Promise((r) => setTimeout(r, 0));
    const cbs = frames.splice(0);
    cbs.forEach((cb) => cb(performance.now()));
    if (!cbs.length && !chart.isLoading) return;
  }
}

// ---- a gateway with 5 years of bars, served in blocks of at most 1000 ----
const NOW = Math.floor(Date.now() / 1000);
const START = Math.floor((NOW - 5 * 365 * 86400) / 86400) * 86400;
const priceAt = (t: number): number => 100 + 20 * Math.sin(t / 86400 / 30) + 5 * Math.sin(t / 3600);

function gateway(tf: number, opts: { delay?: number; ignoreSignal?: boolean; tag?: number } = {}) {
  const log: { to: number; countBack: number }[] = [];
  const source = async (req: HistoryRequest): Promise<HistoryResult> => {
    log.push({ to: req.to, countBack: req.countBack });
    await new Promise((r) => setTimeout(r, opts.delay ?? 0));
    if (req.signal.aborted && !opts.ignoreSignal) throw new DOMException('aborted', 'AbortError');
    const bars: Bar[] = [];
    // the newest bar is the one of NOW, even if the clock moved on to the next one during the test
    let t = Math.floor((Math.min(req.to, Math.floor(NOW / tf) * tf + tf) - 1) / tf) * tf;
    while (bars.length < Math.min(req.countBack, 1000) && t >= START) {
      const p = opts.tag ?? priceAt(t);
      bars.push({ time: t, open: p, high: p + 1, low: p - 1, close: p, volume: 1 });
      t -= tf;
    }
    return { bars: bars.reverse(), noMore: t < START };
  };
  return { source, log };
}

const isContiguous = (bars: Bar[], tf: number): boolean => bars.every((b, i) => i === 0 || b.time - bars[i - 1].time === tf);

describe('history paging (setDataSource)', () => {
  it('loads the latest block first, then older blocks while dragging to the start, without jumps or duplicates', async () => {
    const chart = makeChart();
    const tf = 3600;
    const gw = gateway(tf);
    expect(await chart.setDataSource(gw.source, tf)).toBe(true);
    expect(chart.bars.length).toBe(1000);
    expect(gw.log[0].countBack).toBe(1000);

    const total = Math.floor((NOW - START) / tf);
    for (let i = 0; i < 200 && !chart.history.noMoreBack; i++) {
      // the view stays put: the same bar is at the same x before and after a block arrives
      const t0 = chart.bars[0].time + 5 * tf;
      chart.scrollBars(1e9); // drag all the way to the past
      await settle(chart);
      const x = (t: number): number => chart.ts.indexToX(chart.data.indexAt(t));
      const before = x(t0);
      const n = chart.bars.length;
      chart.ts.baseIndex = n - 1;
      await chart.history.loadBack();
      chart.ts.baseIndex = chart.bars.length - 1;
      if (chart.bars.length > n) expect(x(t0)).toBeCloseTo(before, 6);
    }
    expect(chart.history.noMoreBack).toBe(true);
    expect(isContiguous(chart.bars, tf)).toBe(true);
    expect(chart.bars.length).toBeGreaterThanOrEqual(total - 1);
    const requests = gw.log.length;
    chart.scrollBars(1e9);
    await settle(chart);
    expect(gw.log.length).toBe(requests); // noMore: no more requests
    chart.destroy();
  });

  it('keeps the instant in the center when switching 1m → 1h → 1D → 1m', async () => {
    const chart = makeChart();
    await chart.setDataSource(gateway(60).source, 60);
    const target = Date.UTC(2023, 2, 15, 12, 0) / 1000;
    if (target < START) return;
    await chart.goToTime(target, { animate: false });
    await settle(chart);
    let center = chart.centerTime();
    expect(Math.abs(center - target)).toBeLessThan(120);
    for (const tf of [3600, 86400, 60]) {
      const keep = chart.centerTime();
      expect(await chart.setDataSource(gateway(tf).source, tf, { time: keep })).toBe(true);
      await settle(chart);
      center = chart.centerTime();
      expect(Math.abs(center - keep)).toBeLessThanOrEqual(tf * 1.5);
      expect(isContiguous(chart.bars, tf)).toBe(true);
    }
    chart.destroy();
  });

  it('goToTrade reaches a trade from 3 years ago with only the latest block loaded (1m)', async () => {
    const chart = makeChart();
    const gw = gateway(60);
    await chart.setDataSource(gw.source, 60);
    const entry = Math.floor((NOW - 3 * 365 * 86400) / 60) * 60 + 37;
    chart.setTrades([{ id: 'old', side: 'long', entryTime: entry, entryPrice: 100, exitTime: entry + 3600, exitPrice: 101 }]);
    expect(await chart.goToTrade('old', 'entry', { animate: false })).toBe(true);
    await settle(chart);
    expect(chart.bars[0].time).toBeLessThanOrEqual(entry);
    expect(Math.abs(chart.centerTime() - entry)).toBeLessThan(180);
    expect(chart.bars.length).toBeLessThan(10000); // a window around the date, not 1.5M bars
    expect(chart.isScrolledBack()).toBe(true); // far from the live edge
    // the trade snaps to the bar that contains it
    expect(chart.bars[chart.data.indexAt(entry)].time).toBe(entry - 37);
    chart.destroy();
  });

  it('realtime: same time updates, newer appends, older is ignored; the view stays when looking at the past', async () => {
    const chart = makeChart();
    const tf = 60;
    await chart.setDataSource(gateway(tf).source, tf);
    const last = chart.bars[chart.bars.length - 1];
    chart.update({ ...last, close: 999, high: 999 });
    expect(chart.bars[chart.bars.length - 1].close).toBe(999);
    const n = chart.bars.length;
    chart.update({ ...last, time: last.time - tf, close: 1 });
    expect(chart.bars.length).toBe(n);

    chart.scrollBars(300); // look at the past
    await settle(chart);
    const t0 = chart.bars[n - 400].time;
    const x = (): number => chart.ts.indexToX(chart.data.indexAt(t0));
    const before = x();
    chart.update({ ...last, time: last.time + tf });
    chart.ts.baseIndex = chart.bars.length - 1;
    expect(chart.bars.length).toBe(n + 1);
    expect(x()).toBeCloseTo(before, 6);
    chart.destroy();
  });

  it('never shows bars of a previous source, even if it ignores the AbortSignal', async () => {
    const chart = makeChart();
    const slow = gateway(60, { delay: 30, ignoreSignal: true, tag: 1 });
    const fast = gateway(60, { tag: 2 });
    const p1 = chart.setDataSource(slow.source, 60);
    const p2 = chart.setDataSource(fast.source, 60);
    expect(await p2).toBe(true);
    expect(await p1).toBe(false);
    await new Promise((r) => setTimeout(r, 60));
    await settle(chart);
    expect(chart.bars.every((b) => b.close === 2)).toBe(true);
    chart.destroy();
  });

  it('an old-style source (Bar[] with everything) is asked once', async () => {
    const chart = makeChart();
    let calls = 0;
    const bars: Bar[] = Array.from({ length: 300 }, (_, i) => ({ time: 1_700_000_000 + i * 60, open: 1, high: 2, low: 0.5, close: 1, volume: 1 }));
    await chart.setDataSource(async () => (calls++, bars), 60);
    chart.scrollBars(1e9);
    await settle(chart);
    expect(chart.bars.length).toBe(300);
    expect(calls).toBe(1);
    expect(chart.history.noMoreBack).toBe(true);
    chart.destroy();
  });

  it('resync fills the gap after a lost connection and keeps following the newest bar', async () => {
    const chart = makeChart();
    const tf = 60;
    const gw = gateway(tf);
    await chart.setDataSource(gw.source, tf);
    // pretend the last 30 minutes were missed
    chart.replaceData(chart.bars.slice(0, -30), tf, true);
    chart.resync();
    await settle(chart);
    expect(chart.history.liveGap).toBe(false);
    expect(chart.bars[chart.bars.length - 1].time).toBe(Math.floor(NOW / tf) * tf);
    expect(isContiguous(chart.bars, tf)).toBe(true);
    expect(chart.isScrolledBack()).toBe(false);
    chart.destroy();
  });

  it('errors go to historyError and the chart shows nothing of its own', async () => {
    const chart = makeChart();
    const errors: unknown[] = [];
    chart.historyError.on((e) => errors.push(e));
    const ok = await chart.setDataSource(async () => {
      throw new Error('gateway down');
    }, 60);
    expect(ok).toBe(false);
    expect(errors).toHaveLength(1);
    chart.destroy();
  });
});
