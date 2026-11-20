import { describe, expect, it } from 'vitest';
import type { Bar } from '../../src/candlestick/core/types';
import { INDICATORS, checkIndicatorParams, createIndicator } from '../../src/candlestick/indicators/indicators';
import { STUDY_DEFS as BASE_DEFS, anchorPeriod } from '../../src/candlestick/indicators/studies';
import { EXTRA_STUDY_DEFS } from '../../src/candlestick/indicators/studies-extra';

const STUDY_DEFS = [...BASE_DEFS, ...EXTRA_STUDY_DEFS];

type Computed = { compute(b: Bar[], f: number): void; values: number[]; rawLines: number[][]; title(): string };

function makeBars(n: number, seed = 7, step = 3600): Bar[] {
  let s = seed;
  const rnd = (): number => ((s = (s * 16807) % 2147483647) / 2147483647);
  let c = 100;
  return Array.from({ length: n }, (_, i) => {
    const o = c;
    c = Math.max(1, c + (rnd() - 0.5) * 4);
    const high = Math.max(o, c) + rnd() * 2;
    const low = Math.min(o, c) - rnd() * 2;
    return { time: 1_700_000_000 + i * step, open: o, high, low, close: c, volume: 100 + Math.round(rnd() * 900) };
  });
}

const make = (type: string, params?: Record<string, number | string | boolean>): Computed => createIndicator(type, params) as unknown as Computed;

function expectSame(a: number[], b: number[]): void {
  expect(a.length).toBe(b.length);
  for (let i = 0; i < a.length; i++) {
    if (Number.isNaN(b[i])) expect(a[i], `bar ${i}`).toBeNaN();
    else expect(a[i], `bar ${i}`).toBeCloseTo(b[i], 8);
  }
}

function ema(src: number[], len: number): number[] {
  const a = 2 / (len + 1);
  const out: number[] = [];
  src.forEach((x, i) => (out[i] = i === 0 || !isFinite(out[i - 1]) ? x : a * x + (1 - a) * out[i - 1]));
  return out;
}

describe('studies (TradingView indicators)', () => {
  it('are all in the indicator list, with settings that check out', () => {
    const types = INDICATORS.map((e) => e.type);
    for (const def of STUDY_DEFS) {
      expect(types).toContain(def.type);
      const ind = createIndicator(def.type)!;
      expect(checkIndicatorParams(def.type, ind.params)).toEqual([]);
      // every line has a show / hide checkbox in the style tab
      for (const f of ind.schema.filter((x) => x.section === 'Estilo' && x.type === 'color' && !x.indent)) expect(f.toggle).toBeTruthy();
    }
  });

  it('a live tick and a new bar give the same values as computing everything again', () => {
    const bars = makeBars(400);
    for (const def of STUDY_DEFS) {
      const live = make(def.type);
      live.compute(bars.slice(0, 350), 0);
      // a tick on the last bar, then a new bar (what Chart.update() does)
      const ticked = bars.slice(0, 350);
      ticked[349] = { ...ticked[349], close: ticked[349].close + 1, high: ticked[349].high + 1 };
      live.compute(ticked, 349);
      const grown = [...ticked, bars[350]];
      live.compute(grown, 350);
      const full = make(def.type);
      full.compute(grown, 0);
      expect(live.rawLines.length, def.type).toBe(full.rawLines.length);
      live.rawLines.forEach((l, k) => expectSame(l, full.rawLines[k]));
    }
  });

  it('MACD: EMA 12 − EMA 26, signal EMA 9, histogram with four colours', () => {
    const bars = makeBars(300);
    const ind = make('macd');
    ind.compute(bars, 0);
    const close = bars.map((b) => b.close);
    const e12 = ema(close, 12);
    const e26 = ema(close, 26);
    const macd = close.map((_, i) => e12[i] - e26[i]);
    const sig = ema(macd, 9);
    const [hist, state, m, s] = ind.rawLines;
    for (let i = 0; i < 300; i++) {
      expect(m[i]).toBeCloseTo(macd[i], 9);
      expect(s[i]).toBeCloseTo(sig[i], 9);
      expect(hist[i]).toBeCloseTo(macd[i] - sig[i], 9);
    }
    expect(new Set(state.slice(1))).toEqual(new Set([0, 1, 2, 3]));
    expect(ind.title()).toBe('MACD 12 26 close 9 EMA EMA');
  });

  it('Bollinger Bands: SMA 20 ± 2 population standard deviations', () => {
    const bars = makeBars(100);
    const ind = make('bb');
    ind.compute(bars, 0);
    const [basis, upper, lower] = ind.rawLines;
    const i = 60;
    const w = bars.slice(i - 19, i + 1).map((b) => b.close);
    const mean = w.reduce((a, b) => a + b) / 20;
    const sd = Math.sqrt(w.reduce((a, b) => a + (b - mean) ** 2, 0) / 20);
    expect(basis[i]).toBeCloseTo(mean, 9);
    expect(upper[i]).toBeCloseTo(mean + 2 * sd, 9);
    expect(lower[i]).toBeCloseTo(mean - 2 * sd, 9);
    expect(basis[18]).toBeNaN();
  });

  it('oscillators stay in their ranges', () => {
    const bars = makeBars(400);
    const check = (type: string, lo: number, hi: number): void => {
      const ind = make(type);
      ind.compute(bars, 0);
      for (const line of ind.rawLines) for (const v of line) if (isFinite(v)) expect(v >= lo - 1e-9 && v <= hi + 1e-9, `${type} ${v}`).toBe(true);
    };
    check('stoch', 0, 100);
    check('stochrsi', 0, 100);
    check('mfi', 0, 100);
    check('willr', -100, 0);
    check('aroon', 0, 100);
    check('dmi', 0, 100);
  });

  it('momentum, ROC, Donchian and OBV', () => {
    const bars = makeBars(120);
    const mom = make('mom');
    mom.compute(bars, 0);
    expect(mom.values[50]).toBeCloseTo(bars[50].close - bars[40].close, 9);
    expect(mom.values[9]).toBeNaN();
    const roc = make('roc');
    roc.compute(bars, 0);
    expect(roc.values[50]).toBeCloseTo((100 * (bars[50].close - bars[41].close)) / bars[41].close, 9);
    const dc = make('dc');
    dc.compute(bars, 0);
    const [basis, up, lo] = dc.rawLines;
    const w = bars.slice(31, 51);
    expect(up[50]).toBe(Math.max(...w.map((b) => b.high)));
    expect(lo[50]).toBe(Math.min(...w.map((b) => b.low)));
    expect(basis[50]).toBeCloseTo((up[50] + lo[50]) / 2, 9);
    const obv = make('obv');
    obv.compute(bars, 0);
    let o = 0;
    for (let i = 1; i < 120; i++) o += Math.sign(bars[i].close - bars[i - 1].close) * bars[i].volume;
    expect(obv.values[119]).toBe(o);
  });

  it('VWAP starts again each day, at the bar’s typical price', () => {
    const bars = makeBars(72, 3, 3600);
    const ind = make('vwap');
    ind.compute(bars, 0);
    for (let i = 1; i < bars.length; i++) {
      if (anchorPeriod(bars[i].time, 'session') === anchorPeriod(bars[i - 1].time, 'session')) continue;
      const b = bars[i];
      expect(ind.values[i]).toBeCloseTo((b.high + b.low + b.close) / 3, 9);
    }
    expect(anchorPeriod(Date.UTC(2026, 10, 16) / 1000, 'week')).toBe(anchorPeriod(Date.UTC(2026, 10, 22, 23) / 1000, 'week')); // Monday … Sunday
    expect(anchorPeriod(Date.UTC(2026, 10, 16) / 1000, 'week')).not.toBe(anchorPeriod(Date.UTC(2026, 10, 15) / 1000, 'week'));
  });

  it('Supertrend: one line at a time, below the close in an up trend and above it in a down trend', () => {
    const bars = makeBars(400);
    const ind = make('supertrend');
    ind.compute(bars, 0);
    const [up, down] = ind.rawLines;
    for (let i = 20; i < 400; i++) {
      expect(isFinite(up[i]) !== isFinite(down[i])).toBe(true);
      if (isFinite(up[i])) expect(up[i]).toBeLessThanOrEqual(bars[i].close);
      else expect(down[i]).toBeGreaterThanOrEqual(bars[i].close);
    }
  });

  it('Parabolic SAR is always outside the bar', () => {
    const bars = makeBars(400);
    const ind = make('sar');
    ind.compute(bars, 0);
    for (let i = 2; i < 400; i++) expect(ind.values[i] <= bars[i].low || ind.values[i] >= bars[i].high).toBe(true);
  });

  it('Ichimoku: the cloud is drawn 25 bars ahead', () => {
    const bars = makeBars(200);
    const ind = createIndicator('ichimoku')!;
    (ind as unknown as Computed).compute(bars, 0);
    expect(ind.title()).toBe('Ichimoku 9 26 52 26');
    const v = { fmt: (x: number) => x.toFixed(2) } as never;
    // the legend on bar 100 shows Leading Span A computed 25 bars before
    const leadA = (ind as unknown as Computed).rawLines[3];
    expect(ind.legend(100, v)[3].text).toBe(leadA[75].toFixed(2));
  });

  it('a saved state with a value that is not offered takes the default', () => {
    expect(createIndicator('bb', { maType: 'hull' })!.params.maType).toBe('sma');
    expect(createIndicator('macd', { timeframe: '4h' })!.params.timeframe).toBe('240');
  });
});

describe('more studies', () => {
  const bars = makeBars(400, 11);
  const run = (type: string, params?: Record<string, number | string | boolean>): number[][] => {
    const ind = make(type, params);
    ind.compute(bars, 0);
    return ind.rawLines;
  };
  const close = bars.map((b) => b.close);

  it('DEMA and TEMA from EMAs of EMAs', () => {
    const e1 = ema(close, 9);
    const e2 = ema(e1, 9);
    const e3 = ema(e2, 9);
    const [dema] = run('dema');
    const [tema] = run('tema');
    for (let i = 0; i < 400; i++) {
      expect(dema[i]).toBeCloseTo(2 * e1[i] - e2[i], 9);
      expect(tema[i]).toBeCloseTo(3 * (e1[i] - e2[i]) + e3[i], 9);
    }
  });

  it('ADX is the DMI’s ADX', () => {
    expectSame(run('adx')[0], run('dmi')[0]);
  });

  it('LSMA follows a straight line exactly', () => {
    const line: Bar[] = Array.from({ length: 60 }, (_, i) => ({ time: i * 60, open: 10 + i, high: 11 + i, low: 9 + i, close: 10 + 2 * i, volume: 1 }));
    const ind = make('lsma');
    ind.compute(line, 0);
    expect(ind.values[40]).toBeCloseTo(90, 9);
    const off = make('lsma', { lrOffset: 5 });
    off.compute(line, 0);
    expect(off.values[40]).toBeCloseTo(80, 9);
  });

  it('A/D, BOP and %B', () => {
    const [ad] = run('ad');
    let t = 0;
    for (const b of bars) t += b.high === b.low ? 0 : ((2 * b.close - b.low - b.high) / (b.high - b.low)) * b.volume;
    expect(ad[399]).toBeCloseTo(t, 6);
    const [bop] = run('bop');
    expect(bop[10]).toBeCloseTo((bars[10].close - bars[10].open) / (bars[10].high - bars[10].low), 12);
    const [pctB] = run('bbr');
    const [basis, upper, lower] = run('bb');
    expect(pctB[100]).toBeCloseTo((close[100] - lower[100]) / (upper[100] - lower[100]), 9);
    expect(basis[100]).toBeCloseTo((upper[100] + lower[100]) / 2, 9);
  });

  it('bounded oscillators stay in their ranges', () => {
    const inRange = (type: string, lo: number, hi: number): void => {
      for (const line of run(type)) for (const v of line) if (isFinite(v)) expect(v >= lo - 1e-9 && v <= hi + 1e-9, `${type} ${v}`).toBe(true);
    };
    inRange('uo', 0, 100);
    inRange('chop', 0, 100);
    inRange('cmo', -100, 100);
    inRange('bop', -1, 1);
  });

  it('the Alligator lines are moved 8, 5 and 3 bars ahead', () => {
    const ind = createIndicator('alligator')!;
    (ind as unknown as Computed).compute(bars, 0);
    const v = { fmt: (x: number) => x.toFixed(4) } as never;
    const [jaw, teeth, lips] = (ind as unknown as Computed).rawLines;
    const legend = ind.legend(200, v);
    expect(legend.map((l) => l.text)).toEqual([jaw[192], teeth[195], lips[197]].map((x) => x.toFixed(4)));
  });
});
