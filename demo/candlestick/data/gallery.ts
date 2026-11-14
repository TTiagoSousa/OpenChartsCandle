import type { Bar, ChartOptions, SymbolInfo, Trade } from 'openchartscandle/candlestick';

/**
 * Helpers of the candlestick gallery: fixed (seeded) bars, so every chart looks the same
 * each time, and trades "from outside" (a backend, a broker, a backtest) with their own ids.
 */

export const DEMO_SYMBOL: SymbolInfo = { symbol: 'DEMO', precision: 2, name: 'Ativo de demonstração' };

/** Seeded random numbers (mulberry32): the same seed always gives the same chart. */
export function seeded(seed: number): () => number {
  let s = seed >>> 0;
  return () => {
    let t = (s = (s + 0x6d2b79f5) >>> 0);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * `count` bars of `tf` seconds ending now-ish (aligned to a fixed date so the chart never changes).
 * The price walks with trend phases, so there are clear moves for trades and indicators.
 */
export function makeBars(count = 300, opts: { seed?: number; start?: number; tf?: number; vol?: number } = {}): Bar[] {
  const rnd = seeded(opts.seed ?? 7);
  const tf = opts.tf ?? 3600;
  const vol = opts.vol ?? 0.011;
  const t0 = Date.UTC(2026, 8, 1) / 1000;
  const gauss = (): number => Math.sqrt(-2 * Math.log(rnd() || 1e-9)) * Math.cos(2 * Math.PI * rnd());
  const bars: Bar[] = [];
  let price = opts.start ?? 100;
  let trend = 0;
  for (let i = 0; i < count; i++) {
    if (i % 40 === 0) trend = (rnd() - 0.5) * vol * 0.6;
    const open = price;
    const close = Math.max(1, open * (1 + trend + gauss() * vol));
    const high = Math.max(open, close) * (1 + Math.abs(gauss()) * vol * 0.45);
    const low = Math.min(open, close) * (1 - Math.abs(gauss()) * vol * 0.45);
    const r2 = (v: number): number => Math.round(v * 100) / 100;
    bars.push({ time: t0 + i * tf, open: r2(open), high: r2(high), low: r2(low), close: r2(close), volume: Math.round(500 + rnd() * 2000 + Math.abs(close - open) * 400) });
    price = close;
  }
  return bars;
}

/** Simple moving average of the closes (NaN until there are `len` bars). */
export function sma(bars: Bar[], len: number): number[] {
  const out: number[] = [];
  let sum = 0;
  for (let i = 0; i < bars.length; i++) {
    sum += bars[i].close;
    if (i >= len) sum -= bars[i - len].close;
    out.push(i >= len - 1 ? sum / len : NaN);
  }
  return out;
}

/**
 * Trades as they would arrive from outside (your backend, a broker export, a backtest):
 * each one has its own id ("T-1001"…). They come from a 10/30 moving-average cross;
 * `openLast` leaves the last one open; `idByTime` gives ids that don't change when new bars arrive.
 */
export function externalTrades(bars: Bar[], opts: { openLast?: boolean; qty?: number; firstId?: number; idByTime?: boolean } = {}): Trade[] {
  const fast = sma(bars, 10);
  const slow = sma(bars, 30);
  const trades: Trade[] = [];
  let id = opts.firstId ?? 1001;
  for (let i = 31; i < bars.length - 1; i++) {
    const prev = fast[i - 1] - slow[i - 1];
    const cur = fast[i] - slow[i];
    if (Math.sign(prev) === Math.sign(cur) || cur === 0) continue;
    const last = trades[trades.length - 1];
    if (last) {
      last.exitTime = bars[i].time;
      last.exitPrice = bars[i].close;
    }
    // a real backend keeps each id forever: with live data, derive it from the entry time
    const tid = opts.idByTime ? `T-${Math.round(bars[i].time / 60) % 1000000}` : `T-${id++}`;
    trades.push({ id: tid, side: cur > 0 ? 'long' : 'short', entryTime: bars[i].time, entryPrice: bars[i].close, qty: opts.qty });
  }
  if (!opts.openLast && trades.length) {
    const t = trades[trades.length - 1];
    if (t.exitPrice === undefined) trades.pop();
  }
  return trades;
}

/**
 * Common chart options of the gallery. Inside a gallery card the mouse wheel scrolls the page,
 * not the chart; drawings are not saved.
 */
export function chartOptions(el: HTMLElement, extra: ChartOptions = {}): ChartOptions {
  return { symbol: DEMO_SYMBOL, drawingStorage: null, mouseWheel: !el.closest('.gal-card'), ...extra };
}

/** True inside a small gallery card (to hide extra controls). */
export const inCard = (el: HTMLElement): boolean => el.closest('.gal-card') !== null;

/** A bar of buttons above the chart; returns the element where the chart goes. */
export function withBar(el: HTMLElement, ...controls: HTMLElement[]): HTMLElement {
  el.style.display = 'flex';
  el.style.flexDirection = 'column';
  const bar = document.createElement('div');
  bar.className = 'ex-toolbar';
  bar.append(...controls);
  const host = document.createElement('div');
  host.style.cssText = 'flex:1;min-height:0;position:relative';
  el.append(bar, host);
  return host;
}

/** Group of buttons where one is active. */
export function choice<T extends string>(items: [label: string, value: T][], value: T, onChange: (v: T) => void): HTMLElement {
  const g = document.createElement('div');
  g.style.cssText = 'display:inline-flex;gap:4px';
  const btns = items.map(([label, v]) => {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'ex-btn';
    b.textContent = label;
    b.classList.toggle('is-on', v === value);
    b.addEventListener('click', (e) => {
      e.preventDefault(); // inside a gallery card (a link) the click must not open the page
      e.stopPropagation();
      btns.forEach((x) => x.classList.toggle('is-on', x === b));
      onChange(v);
    });
    return b;
  });
  g.append(...btns);
  return g;
}

/** A plain button. */
export function button(label: string, onClick: () => void): HTMLButtonElement {
  const b = document.createElement('button');
  b.type = 'button';
  b.className = 'ex-btn';
  b.textContent = label;
  b.addEventListener('click', (e) => {
    e.preventDefault();
    e.stopPropagation();
    onClick();
  });
  return b;
}
