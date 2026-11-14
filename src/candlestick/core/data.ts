import type { Bar } from './types';

/** Start of the bucket (UTC) that contains `t` for a timeframe of `tf` seconds. Weeks start on Monday. */
export function bucketStart(t: number, tf: number): number {
  if (tf === 604800) {
    const MONDAY = 345600; // 1970-01-05 00:00 UTC
    return Math.floor((t - MONDAY) / tf) * tf + MONDAY;
  }
  return Math.floor(t / tf) * tf;
}

/**
 * Aggregate bars (typically 1m) into a larger timeframe.
 * Appends to `out` starting from `fromIdx` of `base`.
 */
export function aggregate(base: Bar[], tf: number, fromIdx = 0, out: Bar[] = []): Bar[] {
  let cur: Bar | null = null;
  for (let i = fromIdx; i < base.length; i++) {
    const b = base[i];
    const bs = bucketStart(b.time, tf);
    if (!cur || cur.time !== bs) {
      cur = { time: bs, open: b.open, high: b.high, low: b.low, close: b.close, volume: b.volume };
      out.push(cur);
    } else {
      if (b.high > cur.high) cur.high = b.high;
      if (b.low < cur.low) cur.low = b.low;
      cur.close = b.close;
      cur.volume += b.volume;
    }
  }
  return out;
}

/** Copy a bar, coercing numbers and converting millisecond timestamps to seconds. */
function toBar(b: Bar): Bar {
  const time = b.time > 1e11 ? Math.floor(b.time / 1000) : b.time;
  return { time, open: +b.open, high: +b.high, low: +b.low, close: +b.close, volume: +(b.volume ?? 0) };
}

/** Validate & normalise user supplied bars: sorted ascending, unique times, seconds. */
export function normalizeBars(bars: Bar[]): Bar[] {
  const out: Bar[] = [];
  const converted = bars.map(toBar).sort((a, b) => a.time - b.time); // stable: last duplicate wins
  for (const bar of converted) {
    if (out.length && out[out.length - 1].time === bar.time) out[out.length - 1] = bar;
    else out.push(bar);
  }
  return out;
}

/** The bars of the active timeframe plus time <-> logical index mapping. */
export class SeriesData {
  bars: Bar[] = [];

  constructor(public tf: number, bars: Bar[] = []) {
    this.bars = normalizeBars(bars);
  }

  get length(): number {
    return this.bars.length;
  }

  /**
   * Apply a realtime bar. Same time as the last bar replaces it, newer time appends.
   * Returns the first index that changed, or -1 if the bar was ignored (older than last).
   */
  update(bar: Bar): number {
    const b = toBar(bar);
    const n = this.bars.length;
    if (n === 0) {
      this.bars.push(b);
      return 0;
    }
    const last = this.bars[n - 1];
    if (b.time === last.time) {
      this.bars[n - 1] = b;
      return n - 1;
    }
    if (b.time > last.time) {
      this.bars.push(b);
      return n;
    }
    return -1;
  }

  /**
   * Add older bars at the start (history paging). Only bars older than the first one are used.
   * Returns how many were added.
   */
  prepend(bars: Bar[]): number {
    if (!this.bars.length) {
      this.bars = normalizeBars(bars);
      return this.bars.length;
    }
    const first = this.bars[0].time;
    const older = normalizeBars(bars).filter((b) => b.time < first);
    if (older.length) this.bars = older.concat(this.bars);
    return older.length;
  }

  /**
   * Add newer bars at the end (forward paging, resync). A bar with the time of the last one replaces it.
   * Returns the first index that changed and how many bars were added, or null if nothing changed.
   */
  append(bars: Bar[]): { from: number; added: number } | null {
    const n = this.bars.length;
    if (!n) {
      this.bars = normalizeBars(bars);
      return this.bars.length ? { from: 0, added: this.bars.length } : null;
    }
    const last = this.bars[n - 1].time;
    const newer = normalizeBars(bars).filter((b) => b.time >= last);
    if (!newer.length) return null;
    if (newer[0].time === last) this.bars[n - 1] = newer.shift()!;
    for (const b of newer) this.bars.push(b);
    return { from: n - 1, added: newer.length };
  }

  /**
   * Index of the bar that contains `t` (the last bar starting at or before it): 10:37 → the 10:00 bar on 1h.
   * Before the first bar or after the last one it counts whole periods of the timeframe.
   */
  indexAt(t: number): number {
    const b = this.bars;
    const n = b.length;
    if (n === 0) return 0;
    if (t < b[0].time) return Math.floor((t - b[0].time) / this.tf);
    if (t >= b[n - 1].time) return n - 1 + Math.floor((t - b[n - 1].time) / this.tf);
    let lo = 0;
    let hi = n - 1;
    while (hi - lo > 1) {
      const mid = (lo + hi) >> 1;
      if (b[mid].time <= t) lo = mid;
      else hi = mid;
    }
    return lo;
  }

  /** Fractional logical index for a timestamp (extrapolates beyond data). */
  timeToIndex(t: number): number {
    const b = this.bars;
    const n = b.length;
    if (n === 0) return 0;
    if (t <= b[0].time) return (t - b[0].time) / this.tf;
    if (t >= b[n - 1].time) return n - 1 + (t - b[n - 1].time) / this.tf;
    let lo = 0;
    let hi = n - 1;
    while (hi - lo > 1) {
      const mid = (lo + hi) >> 1;
      if (b[mid].time <= t) lo = mid;
      else hi = mid;
    }
    return lo + (t - b[lo].time) / (b[hi].time - b[lo].time);
  }

  indexToTime(fi: number): number {
    const b = this.bars;
    const n = b.length;
    if (n === 0) return 0;
    if (fi <= 0) return b[0].time + fi * this.tf;
    if (fi >= n - 1) return b[n - 1].time + (fi - (n - 1)) * this.tf;
    const i = Math.floor(fi);
    const f = fi - i;
    return b[i].time + f * (b[i + 1].time - b[i].time);
  }
}
