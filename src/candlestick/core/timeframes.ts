import { SeriesData, bucketStart } from './data';
import type { HistoryRequest, HistoryResult } from './history';
import type { Bar, Timeframe } from './types';

/**
 * Bars of other timeframes, for indicators with their own `timeframe` (e.g. the 4h MA on a 1h chart).
 * Same contract as the chart's data source: the `countBack` newest bars before `request.to`, or a plain
 * `Bar[]` with the whole history. The Terminal builds it from its `Datafeed`.
 */
export interface TimeframeFeed {
  getBars(timeframe: Timeframe, request: HistoryRequest): Promise<HistoryResult | Bar[]>;
  /** Realtime bars of that timeframe (the forming one on every change). Return an unsubscribe function. */
  subscribeBars?(timeframe: Timeframe, onBar: (bar: Bar) => void): () => void;
}

/**
 * For each chart bar, the index of the bar of the other timeframe whose value it shows, or -1. No look-ahead:
 * - a larger timeframe gives the last of its bars closed when the chart bar opens: on 1h, the 4h bar that
 *   closed at 12:00 for the 12:00 to 15:00 bars, the next one from the 16:00 bar on (steps);
 * - a smaller one gives its last bar closed when the chart bar closes (the forming chart bar: the last closed).
 * The newest bar of the other timeframe only counts once it is closed. `live`: its bars reach now; when they
 * don't, chart bars after them get -1 (not loaded yet) instead of an old value.
 */
export function mapTimeframe(chart: Bar[], chartTf: number, own: Bar[], ownTf: number, live: boolean): Int32Array {
  const n = chart.length;
  const m = own.length;
  const out = new Int32Array(n).fill(-1);
  if (!n || !m) return out;
  const higher = ownTf > chartTf;
  // closed: a newer bar exists, or a chart bar opened at or after its end
  const usable = own[m - 1].time + ownTf <= chart[n - 1].time ? m : m - 1;
  let k = -1;
  for (let i = 0; i < n; i++) {
    const limit = chart[i].time + (higher ? 0 : chartTf);
    while (k + 1 < usable && own[k + 1].time + ownTf <= limit) k++;
    if (k < 0) continue;
    if (k === m - 1 && !live && limit >= own[k].time + 2 * ownTf) continue;
    out[i] = k;
  }
  return out;
}

/**
 * The bars of one other timeframe, loaded in blocks around what the chart shows: one window, extended to
 * the left (older blocks) and to the right (up to now, then realtime), replaced by a new window after a
 * far jump. One request at a time.
 */
export class TimeframeSeries {
  data: SeriesData;
  /** Nothing older to load. */
  noMoreBack = false;
  /** The bars reach now: realtime bars are applied. */
  live = false;
  private whole = false;
  private busy = false;
  private dead = false;
  private retryAt = 0;
  private fwdCursor = 0;
  private first = true;
  /** `to` of the last window that came back empty: not asked again. */
  private emptyWindow = NaN;
  private held: Bar[] = [];
  private readonly ctrl = new AbortController();
  private unsub: (() => void) | null;

  /**
   * `changed(from)`: bars from index `from` changed (0 = replaced or older bars added).
   * `idle()`: a request finished (the chart checks again whether more is needed).
   */
  constructor(
    readonly tf: Timeframe,
    private readonly feed: TimeframeFeed,
    private readonly changed: (from: number) => void,
    private readonly idle: () => void,
    private readonly failed: (err: unknown) => void,
  ) {
    this.data = new SeriesData(tf.seconds);
    this.unsub = feed.subscribeBars?.(tf, (bar) => this.onLive(bar)) ?? null;
  }

  destroy(): void {
    this.dead = true;
    this.ctrl.abort();
    this.unsub?.();
    this.unsub = null;
  }

  /**
   * Make the bars cover `[from, to)` (unix seconds), at most `maxBars` of them (keeping the newest part).
   * Called on every frame: starts at most one request.
   */
  ensure(from: number, to: number, countBack: number, maxBars: number): void {
    if (this.busy || this.dead || this.whole || performance.now() < this.retryAt) return;
    const T = this.tf.seconds;
    const edge = bucketStart(Date.now() / 1000, T) + T;
    const end = Math.min(edge, bucketStart(to, T) + T);
    let start = bucketStart(from, T);
    if ((end - start) / T > maxBars) start = end - maxBars * T;
    const d = this.data;
    const n = d.length;
    if (!n || start > d.bars[n - 1].time + maxBars * T || end < d.bars[0].time - maxBars * T) {
      if (end !== this.emptyWindow) void this.run('window', end, countBack, edge);
      return;
    }
    const first = d.bars[0].time;
    const last = d.bars[n - 1].time;
    if (start < first && !this.noMoreBack) void this.run('back', first, countBack, edge);
    else if (!this.live && end > last + T) {
      const reach = Math.max(last, this.fwdCursor) + (countBack + 1) * T;
      void this.run('forward', Math.min(edge, reach), countBack, edge);
    }
  }

  private async run(kind: 'window' | 'back' | 'forward', to: number, countBack: number, edge: number): Promise<void> {
    this.busy = true;
    try {
      const firstRequest = this.first;
      this.first = false;
      const r = await this.feed.getBars(this.tf, { to, countBack, signal: this.ctrl.signal, firstRequest });
      if (this.dead) return;
      if (Array.isArray(r)) {
        // the whole history at once
        this.data = new SeriesData(this.tf.seconds, r);
        this.noMoreBack = this.live = this.whole = true;
        this.changed(0);
      } else {
        const bars = r?.bars ?? [];
        if (kind === 'window') {
          this.data = new SeriesData(this.tf.seconds, bars);
          this.noMoreBack = !!r?.noMore || !bars.length;
          this.live = to >= edge;
          this.fwdCursor = to;
          this.emptyWindow = bars.length ? NaN : to;
          this.changed(0);
        } else if (kind === 'back') {
          const k = this.data.prepend(bars);
          if (r?.noMore || !k) this.noMoreBack = true;
          if (k) this.changed(0);
        } else {
          const a = this.data.append(bars);
          this.fwdCursor = to;
          if (to >= edge) this.live = true;
          if (a) this.changed(a.from);
        }
      }
      if (this.live) this.flush();
    } catch (err) {
      if (!this.dead && !this.ctrl.signal.aborted) {
        this.retryAt = performance.now() + 3000;
        this.failed(err);
      }
    } finally {
      this.busy = false;
      if (!this.dead) this.idle();
    }
  }

  private onLive(bar: Bar): void {
    if (this.dead) return;
    if (!this.live || this.busy) {
      // keep the latest ones for when the bars reach now
      this.held.push(bar);
      if (this.held.length > 50) this.held.shift();
      return;
    }
    const from = this.data.update(bar);
    if (from >= 0) this.changed(from);
  }

  private flush(): void {
    if (!this.held.length) return;
    let from = Infinity;
    for (const b of this.held.splice(0)) {
      const f = this.data.update(b);
      if (f >= 0) from = Math.min(from, f);
    }
    if (from !== Infinity) this.changed(from);
  }
}
