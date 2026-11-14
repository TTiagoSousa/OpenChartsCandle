import { bucketStart, type Bar, type BarsRequest, type BarsResult, type Datafeed, type SymbolInfo, type Timeframe } from 'openchartscandle/candlestick';

/**
 * A datafeed that works like a real market-data gateway:
 * - `getBars` serves at most 1000 bars per request (`to` exclusive + `countBack`), with latency and `noMore`;
 * - 5 years of 1-minute bars, generated on demand (the same candles on every reload);
 * - `subscribeBars` sends the forming bar once per second; `disconnect()` / `reconnect()` simulate a lost
 *   WebSocket, and on reconnect it calls `onResync` so the chart loads the bars it missed.
 */

const DAY = 86400;
const MIN_PER_DAY = 1440;
const YEARS = 5;
export const PAGED_BLOCK = 1000;

export interface PagedSymbol extends SymbolInfo {
  basePrice: number;
  /** daily log volatility */
  vol: number;
  seed: number;
}

export const PAGED_SYMBOLS: PagedSymbol[] = [
  { symbol: 'GWBTC', name: 'Gateway Bitcoin / Dollar', exchange: 'GATEWAY', type: 'crypto', currency: 'USD', precision: 2, basePrice: 30000, vol: 0.032, seed: 11, timeframes: ['1', '5', '15', '1h', '4h', '1D', '1W'] },
  { symbol: 'GWETH', name: 'Gateway Ether / Dollar', exchange: 'GATEWAY', type: 'crypto', currency: 'USD', precision: 2, basePrice: 1800, vol: 0.04, seed: 22, timeframes: ['1', '5', '15', '1h', '4h', '1D', '1W'] },
  { symbol: 'GWIDX', name: 'Gateway Index (só 1h e 1D)', exchange: 'GATEWAY', type: 'index', currency: 'USD', precision: 1, basePrice: 4200, vol: 0.011, seed: 33, timeframes: ['1h', '1D'] },
];

function mulberry(seed: number): () => number {
  let s = seed >>> 0;
  return () => {
    let t = (s = (s + 0x6d2b79f5) >>> 0);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function gauss(rnd: () => number): number {
  let u = 0;
  while (u === 0) u = rnd();
  return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * rnd());
}

interface DayMinutes {
  o: Float64Array;
  h: Float64Array;
  l: Float64Array;
  c: Float64Array;
  v: Float64Array;
}

/** Price path of one symbol: a daily random walk, and inside each day a bridge between the daily anchors. */
class PagedSeries {
  readonly start: number;
  private anchors: number[] = [];
  private days = new Map<number, DayMinutes>();
  private dayBars = new Map<number, Bar>();

  constructor(readonly info: PagedSymbol) {
    const now = Date.now() / 1000;
    this.start = Math.floor((now - YEARS * 365 * DAY) / DAY) * DAY;
    const n = Math.ceil((now - this.start) / DAY) + 2;
    const rnd = mulberry(info.seed * 1000003);
    let lp = Math.log(info.basePrice);
    let drift = 0;
    for (let d = 0; d <= n; d++) {
      if (d % 90 === 0) drift = gauss(rnd) * info.vol * 0.12;
      this.anchors.push(lp);
      lp += drift + gauss(rnd) * info.vol - 0.002 * (lp - Math.log(info.basePrice)) / 10;
    }
  }

  private round(p: number): number {
    const f = 10 ** this.info.precision;
    return Math.round(p * f) / f;
  }

  /** The 1440 minutes of day `d` (cached, the last 40 days used). */
  minutes(d: number): DayMinutes {
    let m = this.days.get(d);
    if (m) {
      this.days.delete(d);
      this.days.set(d, m);
      return m;
    }
    const rnd = mulberry(this.info.seed * 7919 + d * 31);
    const a = this.anchors[d];
    const b = this.anchors[d + 1];
    const sig = this.info.vol / Math.sqrt(MIN_PER_DAY);
    const walk = new Float64Array(MIN_PER_DAY + 1);
    for (let i = 1; i <= MIN_PER_DAY; i++) walk[i] = walk[i - 1] + gauss(rnd) * sig;
    const path = new Float64Array(MIN_PER_DAY + 1);
    for (let i = 0; i <= MIN_PER_DAY; i++) {
      const k = i / MIN_PER_DAY;
      path[i] = Math.exp(a + (b - a) * k + walk[i] - walk[MIN_PER_DAY] * k);
    }
    m = { o: new Float64Array(MIN_PER_DAY), h: new Float64Array(MIN_PER_DAY), l: new Float64Array(MIN_PER_DAY), c: new Float64Array(MIN_PER_DAY), v: new Float64Array(MIN_PER_DAY) };
    for (let i = 0; i < MIN_PER_DAY; i++) {
      const o = path[i];
      const c = path[i + 1];
      const wick = Math.abs(gauss(rnd)) * sig * 0.6;
      m.o[i] = this.round(o);
      m.c[i] = this.round(c);
      m.h[i] = this.round(Math.max(o, c) * (1 + wick));
      m.l[i] = this.round(Math.min(o, c) * (1 - wick));
      m.v[i] = Math.round(20 + rnd() * 80 + (Math.abs(c - o) / o / sig) * 40);
    }
    this.days.set(d, m);
    if (this.days.size > 40) this.days.delete(this.days.keys().next().value!);
    return m;
  }

  /** Bar covering [t, t + tf), cut at `now` (the forming bar). Null before the start or in the future. */
  bar(t: number, tf: number, now: number): Bar | null {
    if (t + tf <= this.start || t > now) return null;
    if (tf >= DAY) return this.bigBar(t, tf, now);
    return this.minuteBar(Math.max(t, this.start), Math.min(t + tf, now + 60), now, t);
  }

  /** Aggregate the minutes in [from, to); the minute that contains `now` is shown partially. */
  private minuteBar(from: number, to: number, now: number, time: number): Bar | null {
    let bar: Bar | null = null;
    for (let t = from; t < to; t += 60) {
      if (t > now) break;
      const d = Math.floor((t - this.start) / DAY);
      const i = Math.floor((t - this.start - d * DAY) / 60);
      const m = this.minutes(d);
      let { o, h, l, c, v } = { o: m.o[i], h: m.h[i], l: m.l[i], c: m.c[i], v: m.v[i] };
      if (now < t + 60) {
        // forming minute: the close walks from the open to the final close
        const f = (now - t) / 60;
        c = this.round(o + (c - o) * f);
        h = Math.max(o, c);
        l = Math.min(o, c);
        v = Math.round(v * f);
      }
      if (!bar) bar = { time, open: o, high: h, low: l, close: c, volume: v };
      else {
        if (h > bar.high) bar.high = h;
        if (l < bar.low) bar.low = l;
        bar.close = c;
        bar.volume += v;
      }
    }
    return bar;
  }

  private dayBar(d: number, now: number): Bar | null {
    const t = this.start + d * DAY;
    if (t > now) return null;
    if (t + DAY <= now) {
      let b = this.dayBars.get(d);
      if (!b) {
        b = this.minuteBar(t, t + DAY, now, t)!;
        this.dayBars.set(d, b);
      }
      return { ...b };
    }
    return this.minuteBar(t, t + DAY, now, t);
  }

  private bigBar(t: number, tf: number, now: number): Bar | null {
    let bar: Bar | null = null;
    for (let day = Math.max(t, this.start); day < t + tf; day += DAY) {
      const b = this.dayBar(Math.floor((day - this.start) / DAY), now);
      if (!b) break;
      if (!bar) bar = { ...b, time: t };
      else {
        bar.high = Math.max(bar.high, b.high);
        bar.low = Math.min(bar.low, b.low);
        bar.close = b.close;
        bar.volume += b.volume;
      }
    }
    return bar;
  }
}

export interface PagedStats {
  requests: number;
  bars: number;
  aborted: number;
  last: string;
}

/** `Datafeed` that serves 5 years of 1m bars in blocks of 1000. */
export class PagedDatafeed implements Datafeed {
  private series = new Map<string, PagedSeries>();
  private subs = new Set<{ tick: () => void; onResync?: () => void }>();
  private connected = true;
  /** Make the next `getBars` fail (to see the `error` event). */
  failNext = false;
  /** Milliseconds of latency per request. */
  latency = 250;
  readonly stats: PagedStats = { requests: 0, bars: 0, aborted: 0, last: '' };
  onStats: ((s: PagedStats) => void) | null = null;

  constructor(private symbols: PagedSymbol[] = PAGED_SYMBOLS) {}

  private get(symbol: string): PagedSeries {
    let s = this.series.get(symbol);
    if (!s) {
      const info = this.symbols.find((x) => x.symbol === symbol);
      if (!info) throw new Error(`Símbolo desconhecido: ${symbol}`);
      s = new PagedSeries(info);
      this.series.set(symbol, s);
    }
    return s;
  }

  getSymbols(): SymbolInfo[] {
    return this.symbols;
  }

  async getBars(symbol: string, tf: Timeframe, req: BarsRequest): Promise<BarsResult> {
    const s = this.get(symbol);
    this.stats.requests++;
    await new Promise<void>((resolve, reject) => {
      const timer = setTimeout(resolve, this.latency * (0.6 + Math.random() * 0.8));
      req.signal.addEventListener('abort', () => {
        clearTimeout(timer);
        this.stats.aborted++;
        this.onStats?.(this.stats);
        reject(new DOMException('Pedido cancelado', 'AbortError'));
      });
    });
    if (this.failNext) {
      this.failNext = false;
      throw new Error(`getBars falhou (${symbol} ${tf.short}): erro simulado do gateway`);
    }
    const now = Date.now() / 1000;
    const count = Math.min(req.countBack, PAGED_BLOCK);
    const bars: Bar[] = [];
    let t = bucketStart(Math.min(req.to, now + tf.seconds) - 1, tf.seconds);
    while (bars.length < count && t + tf.seconds > s.start) {
      const b = s.bar(t, tf.seconds, now);
      if (b) bars.push(b);
      t = bucketStart(t - 1, tf.seconds);
    }
    bars.reverse();
    const noMore = t + tf.seconds <= s.start;
    this.stats.bars += bars.length;
    this.stats.last = `${symbol} ${tf.short} · ${bars.length} velas até ${new Date(req.to * 1000).toISOString().slice(0, 16).replace('T', ' ')}${noMore ? ' · noMore' : ''}`;
    this.onStats?.(this.stats);
    return { bars, noMore };
  }

  subscribeBars(symbol: string, tf: Timeframe, onBar: (bar: Bar) => void, onResync?: () => void): () => void {
    const s = this.get(symbol);
    const sub = {
      tick: (): void => {
        if (!this.connected) return;
        const now = Date.now() / 1000;
        const b = s.bar(bucketStart(now, tf.seconds), tf.seconds, now);
        if (b) onBar(b);
      },
      onResync,
    };
    this.subs.add(sub);
    const id = window.setInterval(sub.tick, 1000);
    return () => {
      clearInterval(id);
      this.subs.delete(sub);
    };
  }

  /** Close of the 1-minute bar at `time` (to build example trades). */
  priceAt(symbol: string, time: number): number {
    return this.get(symbol).bar(Math.floor(time / 60) * 60, 60, Date.now() / 1000)?.close ?? NaN;
  }

    get isConnected(): boolean {
    return this.connected;
  }

  /** Stop sending realtime bars (lost WebSocket). */
  disconnect(): void {
    this.connected = false;
  }

  /** Send realtime bars again and ask the charts to load what they missed. */
  reconnect(): void {
    if (this.connected) return;
    this.connected = true;
    for (const sub of this.subs) sub.onResync?.();
  }
}
