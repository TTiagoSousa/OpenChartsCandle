import type { Bar, Trade } from 'openchartscandle/candlestick';

/**
 * Simulated strategy for the demos: SMA crossover, always in the market.
 * - fast SMA crosses ABOVE slow → close short, open long
 * - fast SMA crosses BELOW slow → close long, open short
 * Signals use closed bars only; the entry/exit price is the close of the signal bar.
 */
export function smaCrossTrades(bars: Bar[], fast = 9, slow = 21, lookback = 400, qty = 1): Trade[] {
  const n = bars.length;
  if (n < slow + 2) return [];
  const sma = (len: number): number[] => {
    const out = new Array<number>(n).fill(NaN);
    let sum = 0;
    for (let i = 0; i < n; i++) {
      sum += bars[i].close;
      if (i >= len) sum -= bars[i - len].close;
      if (i >= len - 1) out[i] = sum / len;
    }
    return out;
  };
  const f = sma(fast);
  const s = sma(slow);
  const trades: Trade[] = [];
  let open: Trade | null = null;
  const start = Math.max(slow, n - lookback);
  // n - 1 is the forming bar: only act on closed bars
  for (let i = start; i < n - 1; i++) {
    const prev = f[i - 1] - s[i - 1];
    const cur = f[i] - s[i];
    if (!isFinite(prev) || !isFinite(cur) || Math.sign(prev) === Math.sign(cur) || cur === 0) continue;
    const side: Trade['side'] = cur > 0 ? 'long' : 'short';
    const b = bars[i];
    if (open) {
      open.exitTime = b.time;
      open.exitPrice = b.close;
    }
    open = { id: `t${b.time}`, side, entryTime: b.time, entryPrice: b.close, qty };
    trades.push(open);
  }
  return trades;
}
