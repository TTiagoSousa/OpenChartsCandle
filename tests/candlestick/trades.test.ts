import { describe, expect, it } from 'vitest';
import { resolveTheme } from '../../src/candlestick/core/theme';
import { tradePnl, tradeStats, type Trade } from '../../src/candlestick/core/trades';

const trades: Trade[] = [
  { side: 'long', entryTime: 0, entryPrice: 100, exitTime: 60, exitPrice: 110, qty: 2 },  // +20 (+10%)
  { side: 'short', entryTime: 60, entryPrice: 110, exitTime: 120, exitPrice: 115 },       // -5  (-4.55%)
  { side: 'long', entryTime: 120, entryPrice: 115 },                                       // open
];

describe('trades', () => {
  it('computes P&L for long and short, absolute and %', () => {
    expect(tradePnl(trades[0], 0)).toEqual({ abs: 20, pct: 10 });
    const s = tradePnl(trades[1], 0);
    expect(s.abs).toBe(-5);
    expect(s.pct).toBeCloseTo(-4.545, 2);
  });

  it('open trades use the last price', () => {
    expect(tradePnl(trades[2], 120).abs).toBe(5);
  });

  it('stats: win rate over closed trades, totals include open ones', () => {
    const st = tradeStats(trades, 120);
    expect(st).toMatchObject({ total: 3, closed: 2, open: 1, wins: 1, losses: 1, winRate: 50, pnl: 20 });
  });
});

describe('resolveTheme', () => {
  it('wicks and borders follow up/down unless set', () => {
    const t = resolveTheme({ up: '#00ff00', down: '#ff0000', wickDown: '#000000' });
    expect(t.wickUp).toBe('#00ff00');
    expect(t.borderUp).toBe('#00ff00');
    expect(t.wickDown).toBe('#000000');
    expect(t.borderDown).toBe('#ff0000');
  });
});
