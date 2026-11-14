import {
  aggregate,
  bucketStart,
  type Bar,
  type Datafeed,
  type Quote,
  type SymbolInfo,
  type Timeframe,
} from 'openchartscandle/candlestick';

/**
 * Market simulator used by the demos. It implements the library's `Datafeed`
 * interface exactly like a real source (Binance, your database…) would.
 */

const clamp = (v: number, lo: number, hi: number): number => (v < lo ? lo : v > hi ? hi : v);
const roundTo = (v: number, precision: number): number => Math.round(v * 10 ** precision) / 10 ** precision;

function randomNormal(): number {
  let u = 0;
  while (u === 0) u = Math.random();
  return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * Math.random());
}

/** Deterministic PRNG (mulberry32) with gaussian helper. */
class Rng {
  private s: number;
  private spare: number | null = null;
  constructor(seed: number) {
    this.s = seed >>> 0;
  }
  next(): number {
    let t = (this.s = (this.s + 0x6d2b79f5) >>> 0);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  }
  normal(): number {
    if (this.spare !== null) {
      const v = this.spare;
      this.spare = null;
      return v;
    }
    let u = 0;
    while (u === 0) u = this.next();
    const v = this.next();
    const r = Math.sqrt(-2 * Math.log(u));
    this.spare = r * Math.sin(2 * Math.PI * v);
    return r * Math.cos(2 * Math.PI * v);
  }
}

export interface SimSymbol extends SymbolInfo {
  basePrice: number;
  /** per-minute log volatility */
  vol: number;
  baseVolume: number;
  seed: number;
}

export const SIM_SYMBOLS: SimSymbol[] = [
  { symbol: 'SIMBTC', name: 'Simulated Bitcoin / Dollar', exchange: 'SIMEX', type: 'crypto', currency: 'USD', basePrice: 64250, vol: 0.0011, precision: 2, baseVolume: 38, seed: 101 },
  { symbol: 'SIMETH', name: 'Simulated Ether / Dollar', exchange: 'SIMEX', type: 'crypto', currency: 'USD', basePrice: 3180, vol: 0.0013, precision: 2, baseVolume: 420, seed: 202 },
  { symbol: 'SIMSOL', name: 'Simulated Solana / Dollar', exchange: 'SIMEX', type: 'crypto', currency: 'USD', basePrice: 148.5, vol: 0.0016, precision: 3, baseVolume: 5200, seed: 303 },
  { symbol: 'EURSIM', name: 'Euro / Sim Dollar', exchange: 'SIMFX', type: 'forex', currency: 'USD', basePrice: 1.0842, vol: 0.00012, precision: 5, baseVolume: 1800, seed: 404 },
  { symbol: 'XAUSIM', name: 'Gold Spot / Sim Dollar', exchange: 'SIMFX', type: 'commodity', currency: 'USD', basePrice: 2395.4, vol: 0.00035, precision: 2, baseVolume: 950, seed: 505 },
  { symbol: 'SIMNDX', name: 'Simulated Tech 100 Index', exchange: 'SIMIDX', type: 'index', currency: 'USD', basePrice: 18520, vol: 0.0005, precision: 2, baseVolume: 2600, seed: 606 },
  { symbol: 'ACME', name: 'Acme Corporation', exchange: 'SIMNYSE', type: 'stock', currency: 'USD', basePrice: 182.3, vol: 0.0007, precision: 2, baseVolume: 14000, seed: 707 },
  { symbol: 'SIMDOGE', name: 'Simulated Doge / Dollar', exchange: 'SIMEX', type: 'crypto', currency: 'USD', basePrice: 0.1234, vol: 0.0019, precision: 5, baseVolume: 2.1e6, seed: 808 },
];

const K = 4; // sub-steps per minute
const DAY = 86400;

interface MinuteGen {
  time: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
  path: number[];
}

/**
 * Deterministic market simulator. History is generated from a fixed epoch so the
 * same candles appear on every reload (drawings stay aligned), and the live minute
 * plays back its pre-generated path with random micro-ticks.
 */
export class SymbolFeed {
  readonly info: SimSymbol;
  readonly bars: Bar[] = [];
  private rng: Rng;
  private price: number;
  private lv = 0;
  private drift = 0;
  private regimeLeft = 0;
  private cur!: MinuteGen;
  private runHigh = 0;
  private runLow = 0;
  private runVol = 0;
  private logBase: number;

  constructor(info: SimSymbol) {
    this.info = info;
    this.rng = new Rng(info.seed * 7919 + 17);
    this.price = info.basePrice;
    this.logBase = Math.log(info.basePrice);
    const nowSec = Math.floor(Date.now() / 1000);
    const BLOCK = 60 * DAY;
    const start = Math.floor((nowSec - 120 * DAY) / BLOCK) * BLOCK;
    const curMin = Math.floor(nowSec / 60) * 60;
    for (let t = start; t < curMin; t += 60) {
      const m = this.genMinute(t);
      this.bars.push({ time: m.time, open: m.open, high: m.high, low: m.low, close: m.close, volume: m.volume });
    }
    this.startMinute(this.genMinute(curMin));
    this.update(Date.now());
  }

  get last(): Bar {
    return this.bars[this.bars.length - 1];
  }

  private round(p: number): number {
    return roundTo(p, this.info.precision);
  }

  private genMinute(t: number): MinuteGen {
    const rng = this.rng;
    const sigmaBase = this.info.vol;
    if (this.regimeLeft <= 0) {
      this.regimeLeft = 40 + Math.floor(rng.next() * 1800);
      this.drift = rng.normal() * sigmaBase * 0.025;
    }
    this.regimeLeft--;
    this.lv = clamp(0.9985 * this.lv + 0.028 * rng.normal(), -0.8, 0.9);
    const d = new Date(t * 1000);
    const hour = d.getUTCHours() + d.getUTCMinutes() / 60;
    const season = 1 + 0.6 * Math.exp(-((hour - 14.5) ** 2) / 3) + 0.25 * Math.exp(-((hour - 8) ** 2) / 2.5);
    const sigma = sigmaBase * Math.exp(this.lv) * (0.7 + 0.3 * season);

    const open = this.round(this.price);
    let p = this.price;
    const path = [open];
    const subSigma = sigma / Math.sqrt(K);
    const meanRev = -5e-5 * (Math.log(p) - this.logBase);
    for (let k = 0; k < K; k++) {
      let r = this.drift / K + meanRev / K + subSigma * rng.normal();
      if (rng.next() < 0.0006) r += rng.normal() * sigma * 2.2;
      p *= Math.exp(r);
      path.push(this.round(p));
    }
    const close = path[K];
    let high = Math.max(...path);
    let low = Math.min(...path);
    high = this.round(high + Math.abs(rng.normal()) * sigma * p * 0.28);
    low = this.round(low - Math.abs(rng.normal()) * sigma * p * 0.28);
    const move = Math.abs(Math.log(close / open)) / Math.max(sigma, 1e-9);
    const volume = this.info.baseVolume * Math.exp(this.lv * 1.3) * season * (0.45 + rng.next()) * (1 + 0.9 * move);
    this.price = p;
    return { time: t, open, high, low, close, volume, path };
  }

  private startMinute(m: MinuteGen): void {
    this.cur = m;
    this.runHigh = m.open;
    this.runLow = m.open;
    this.runVol = 0;
    this.bars.push({ time: m.time, open: m.open, high: m.open, low: m.open, close: m.open, volume: 0 });
  }

  /** Advance simulation to `nowMs`. Returns true when at least one new 1m bar was opened. */
  update(nowMs: number): boolean {
    const now = nowMs / 1000;
    let newBar = false;
    while (now >= this.cur.time + 60) {
      const c = this.cur;
      this.bars[this.bars.length - 1] = { time: c.time, open: c.open, high: c.high, low: c.low, close: c.close, volume: c.volume };
      this.startMinute(this.genMinute(c.time + 60));
      newBar = true;
    }
    const c = this.cur;
    const frac = clamp((now - c.time) / 60, 0, 1);
    const pos = frac * K;
    const i = Math.min(K - 1, Math.floor(pos));
    const f = pos - i;
    const base = c.path[i] + (c.path[i + 1] - c.path[i]) * f;
    const jitter = randomNormal() * (c.high - c.low) * 0.1;
    const price = this.round(clamp(base + jitter, c.low, c.high));
    this.runHigh = Math.max(this.runHigh, price);
    this.runLow = Math.min(this.runLow, price);
    this.runVol = Math.max(this.runVol, c.volume * frac * (0.85 + Math.random() * 0.3));
    this.bars[this.bars.length - 1] = {
      time: c.time, open: c.open, high: this.runHigh, low: this.runLow, close: price, volume: Math.min(this.runVol, c.volume),
    };
    return newBar;
  }

  /** Stats for the trailing 24h, used by the watchlist. */
  dayStats(): { last: number; change: number; changePct: number; high: number; low: number; volume: number; open: number } {
    const last = this.last;
    const from = last.time - DAY;
    let i = this.bars.length - 1;
    let high = -Infinity;
    let low = Infinity;
    let volume = 0;
    while (i >= 0 && this.bars[i].time > from) {
      const b = this.bars[i];
      if (b.high > high) high = b.high;
      if (b.low < low) low = b.low;
      volume += b.volume;
      i--;
    }
    const open = this.bars[Math.max(0, i + 1)].open;
    const change = last.close - open;
    return { last: last.close, change, changePct: (change / open) * 100, high, low, volume, open };
  }
}

/** `Datafeed` implementation backed by the simulator. */
export class SimDatafeed implements Datafeed {
  private feeds = new Map<string, SymbolFeed>();

  constructor(private symbols: SimSymbol[] = SIM_SYMBOLS) {}

  private feed(symbol: string): SymbolFeed {
    let f = this.feeds.get(symbol);
    if (!f) {
      const info = this.symbols.find((s) => s.symbol === symbol);
      if (!info) throw new Error(`Unknown symbol ${symbol}`);
      f = new SymbolFeed(info);
      this.feeds.set(symbol, f);
    }
    return f;
  }

  getSymbols(): SymbolInfo[] {
    return this.symbols;
  }

  async getBars(symbol: string, tf: Timeframe): Promise<Bar[]> {
    const f = this.feed(symbol);
    f.update(Date.now());
    return tf.seconds === 60 ? f.bars.map((b) => ({ ...b })) : aggregate(f.bars, tf.seconds);
  }

  subscribeBars(symbol: string, tf: Timeframe, onBar: (bar: Bar) => void): () => void {
    const f = this.feed(symbol);
    let bucket = bucketStart(f.last.time, tf.seconds);
    const id = window.setInterval(() => {
      f.update(Date.now());
      let j = f.bars.length - 1;
      while (j > 0 && f.bars[j - 1].time >= bucket) j--;
      const bars = aggregate(f.bars, tf.seconds, j);
      for (const b of bars) onBar(b);
      if (bars.length) bucket = bars[bars.length - 1].time;
    }, 250);
    return () => clearInterval(id);
  }

  subscribeQuotes(symbols: string[], onQuote: (q: Quote) => void): () => void {
    const ready: string[] = [];
    const pending = [...symbols];
    let stopped = false;
    const emit = (sym: string): void => {
      const f = this.feed(sym);
      f.update(Date.now());
      onQuote({ symbol: sym, ...f.dayStats() });
    };
    // generating a symbol's history takes a few ms: create them one by one
    const createNext = (): void => {
      if (stopped) return;
      const sym = pending.shift();
      if (!sym) return;
      this.feed(sym);
      ready.push(sym);
      emit(sym);
      setTimeout(createNext, 30);
    };
    createNext();
    const id = window.setInterval(() => ready.forEach(emit), 1000);
    return () => {
      stopped = true;
      clearInterval(id);
    };
  }
}
