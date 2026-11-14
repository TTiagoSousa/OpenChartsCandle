import { describe, expect, it } from 'vitest';
import { findExchange, parseSessionRanges, resolveSessions, splitSessions, type SessionFilter } from '../../src/candlestick/core/sessions';
import { TimeZone } from '../../src/candlestick/core/timezone';
import type { Bar, SymbolInfo } from '../../src/candlestick/core/types';
import { type Visibility, checkIndicatorParams, createIndicator, timeframeUnit, visibleOn } from '../../src/candlestick/indicators/indicators';
import { computeVolumeProfile, developingProfile } from '../../src/candlestick/indicators/volume-profile';

// Monday 2 March 2026, 04:00 in New York (EST, UTC-5) = 09:00 UTC; 30-minute bars for two days
const start = Date.UTC(2026, 2, 2, 9, 0) / 1000;
const bars: Bar[] = Array.from({ length: 96 }, (_, i) => {
  const c = 100 + (i % 7);
  return { time: start + i * 1800, open: c - 0.5 + (i % 2), high: c + 1, low: c - 1, close: c, volume: 100 + i };
});
const ny = new TimeZone('America/New_York');
const nyse = findExchange('NASDAQ')!;
const parts = (names: ('pre' | 'regular' | 'post' | 'overnight')[]): SessionFilter => names.map((part) => ({ part, ranges: parseSessionRanges(nyse[part]!)! }));
const nyHour = (t: number): string => {
  const d = ny.wall(t);
  return `${String(d.getUTCHours()).padStart(2, '0')}${String(d.getUTCMinutes()).padStart(2, '0')}`;
};

describe('session hours', () => {
  it('reads HHMM-HHMM ranges, several with commas', () => {
    expect(parseSessionRanges('0930-1600')).toEqual([[570, 960]]);
    expect(parseSessionRanges('0900-1130, 1230-1530')).toEqual([[540, 690], [750, 930]]);
    expect(parseSessionRanges('09:30-16:00')).toEqual([[570, 960]]);
    expect(parseSessionRanges('0000-2400')).toEqual([[0, 1440]]);
    expect(parseSessionRanges('9h-16h')).toBeNull();
    expect(parseSessionRanges('0960-1000')).toBeNull();
  });

  it('finds the exchange of a symbol', () => {
    expect(resolveSessions('', { symbol: 'AAPL', precision: 2, exchange: 'nasdaq' }).timezone).toBe('America/New_York');
    expect(resolveSessions('', { symbol: 'BTCUSDT', precision: 2, exchange: 'BINANCE' }).hours.regular).toBe('0000-2400');
    expect(resolveSessions('', { symbol: 'X', precision: 2, type: 'crypto' }).timezone).toBe('UTC');
    // the symbol's own hours, in its zone
    const own: SymbolInfo = { symbol: 'Y', precision: 2, exchange: 'NYSE', timezone: 'Europe/Lisbon', sessions: { regular: '0800-1630' } };
    expect(resolveSessions('', own)).toEqual({ hours: { regular: '0800-1630' }, timezone: 'Europe/Lisbon' });
    // an exchange chosen in the settings wins
    expect(resolveSessions('B3', own).timezone).toBe('America/Sao_Paulo');
    expect(resolveSessions('', { symbol: 'Z', precision: 2 }).hours.regular).toBe('0000-2400');
  });

  it('each part of the day is a session (pre, market, post, overnight)', () => {
    const spans = splitSessions(bars, 0, 1800, ny, parts(['regular', 'pre', 'post', 'overnight']), false);
    expect(spans.slice(0, 4).map((s) => [s.part, nyHour(bars[s.from].time), nyHour(bars[s.to].time)])).toEqual([
      ['pre', '0400', '0900'],
      ['regular', '0930', '1530'],
      ['post', '1600', '1930'],
      ['overnight', '2000', '0330'],
    ]);
    // the overnight from 20:00 belongs to the next trading day
    expect(spans[3].day).toBe(spans[4].day);
    expect(spans[3].day).toBe(spans[0].day + 1);
  });

  it('all the parts together, or only one', () => {
    const all = splitSessions(bars, 0, 1800, ny, parts(['regular', 'pre', 'post', 'overnight']), true);
    expect(all[0]).toMatchObject({ from: 0, part: 'all' });
    expect(nyHour(bars[all[0].to].time)).toBe('1930'); // the day ends where the overnight of the next one starts
    const regular = splitSessions(bars, 0, 1800, ny, parts(['regular']), false);
    expect(regular).toHaveLength(2);
    expect(regular.every((s) => s.to - s.from + 1 === 13)).toBe(true);
  });

  it('custom hours, and a live update splits only from the last session', () => {
    const filter: SessionFilter = [{ part: 'custom', ranges: parseSessionRanges('1000-1200')! }];
    const spans = splitSessions(bars, 0, 1800, ny, filter, false);
    expect(spans.map((s) => [nyHour(bars[s.from].time), nyHour(bars[s.to].time)])).toEqual([
      ['1000', '1130'],
      ['1000', '1130'],
    ]);
    expect(splitSessions(bars, spans[1].from, 1800, ny, filter, false)).toEqual([spans[1]]);
  });
});

describe('volume profile rows', () => {
  it('rows of a size in price (ticks per row), aligned to it', () => {
    const vp = computeVolumeProfile(bars, 0, 9, 0, 0.7, 0.5)!;
    expect(vp.rows[0].lo).toBe(99);
    expect(vp.rows[1].lo - vp.rows[0].lo).toBeCloseTo(0.5, 10);
    expect(vp.rows[vp.rows.length - 1].hi).toBeGreaterThan(107);
    const sum = vp.rows.reduce((a, r) => a + r.up + r.down, 0);
    expect(sum).toBeCloseTo(bars.slice(0, 10).reduce((a, b) => a + b.volume, 0), 6);
  });

  it('the developing POC / VA ends at the session profile', () => {
    const vp = computeVolumeProfile(bars, 5, 30, 24)!;
    const dev = developingProfile(bars, 5, 30, vp);
    expect(dev.poc).toHaveLength(26);
    const last = dev.poc.length - 1;
    expect(dev.poc[last]).toBeCloseTo((vp.rows[vp.poc].lo + vp.rows[vp.poc].hi) / 2, 10);
    expect(dev.vah[last]).toBeCloseTo(vp.rows[vp.vaHigh].hi, 10);
    expect(dev.val[last]).toBeCloseTo(vp.rows[vp.vaLow].lo, 10);
  });
});

describe('SVP indicator', () => {
  const symbol: SymbolInfo = { symbol: 'AAPL', precision: 2, exchange: 'NASDAQ' };
  const view = { symbol, tf: 1800, tick: 0.01, fmt: (x: number) => x.toFixed(2) } as never;

  it('legend: POC of the session under the crosshair; nothing outside the sessions', () => {
    const svp = createIndicator('svp', { session: 'regular', rowsLayout: 'rows' })!;
    svp.compute(bars, 0);
    const [poc] = svp.legend(15, view);
    expect(poc.color).toBe('#ff9800');
    const vp = computeVolumeProfile(bars, 11, 23, 24)!; // 09:30–15:30
    expect(poc.text).toBe(((vp.rows[vp.poc].lo + vp.rows[vp.poc].hi) / 2).toFixed(2));
    expect(svp.legend(11, view)[0].text).toBe(poc.text);
    expect(svp.legend(30, view)).toEqual([]); // 19:00, after the market
    expect(svp.legend(5, view)).toEqual([]); // 06:30, before it
    expect(svp.title()).toBe('SVP HD Mercado 24 Alta/Baixa 70');
  });

  it('VAH / VAL in the legend when shown; values that are not offered take the default', () => {
    const svp = createIndicator('svp', { showVah: true, showVal: true, session: 'nope', pocStyle: 'wavy', rowsLayout: 'rows' })!;
    expect(svp.params.session).toBe('each');
    expect(svp.params.pocStyle).toBe('solid');
    svp.compute(bars, 0);
    expect(svp.legend(15, view)).toHaveLength(3);
  });

  it('checks the custom hours that come from outside', () => {
    expect(checkIndicatorParams('svp', { session: 'custom', customSession: '0930-1600' })).toEqual([]);
    expect(checkIndicatorParams('svp', { customSession: '9h30' })[0]).toContain('horário inválido');
    expect(checkIndicatorParams('svp', { session: 'diario' })[0]).toContain('não é válido');
  });
});

describe('visibility on timeframes', () => {
  it('unit and count of a timeframe', () => {
    expect(timeframeUnit(30)).toEqual({ unit: 'seconds', n: 30 });
    expect(timeframeUnit(900)).toEqual({ unit: 'minutes', n: 15 });
    expect(timeframeUnit(14400)).toEqual({ unit: 'hours', n: 4 });
    expect(timeframeUnit(86400)).toEqual({ unit: 'days', n: 1 });
    expect(timeframeUnit(604800)).toEqual({ unit: 'weeks', n: 1 });
    expect(timeframeUnit(30 * 86400)).toEqual({ unit: 'months', n: 1 });
  });

  it('shows only on the allowed timeframes', () => {
    const vis: Visibility = { minutes: { on: true, min: 1, max: 15 }, days: { on: false, min: 1, max: 366 } };
    expect(visibleOn(vis, 300)).toBe(true);
    expect(visibleOn(vis, 1800)).toBe(false);
    expect(visibleOn(vis, 86400)).toBe(false);
    expect(visibleOn(vis, 3600)).toBe(true); // hours left out: all
    expect(visibleOn(null, 1800)).toBe(true);
    const ma = createIndicator('sma')!;
    ma.visibility = vis;
    ma.chartTimeframe = 1800;
    expect(ma.shown).toBe(false);
    ma.chartTimeframe = 60;
    expect(ma.shown).toBe(true);
    expect(ma.toJSON().visibility).toEqual(vis);
  });

  it('the profile settings: TradingView tabs and the custom session as times', () => {
    const svp = createIndicator('svp')!;
    expect(svp.params.rowsLayout).toBe('auto');
    expect(svp.params.extendPoc).toBe(true);
    expect(svp.title()).toBe('SVP HD Cada Alta/Baixa 70');
    expect(createIndicator('svp', { inputsInTitle: false })!.title()).toBe('SVP HD');
    expect(svp.schema.find((f) => f.key === 'customSession')!.type).toBe('session');
    expect(checkIndicatorParams('svp', { customSession: '25:00-26:00' })[0]).toContain('horário inválido');
  });
});
