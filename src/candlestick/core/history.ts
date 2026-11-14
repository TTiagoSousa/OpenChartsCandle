import type { Chart } from './chart';
import { bucketStart } from './data';
import type { Bar } from './types';

/** One request for bars: the `countBack` newest bars with `time < to`. */
export interface HistoryRequest {
  /** Exclusive upper bound, unix seconds. */
  to: number;
  /** How many bars to return (the newest ones before `to`). Returning fewer is fine. */
  countBack: number;
  /** Aborted when the answer is no longer needed (symbol or timeframe changed, chart destroyed). */
  signal: AbortSignal;
  /** True for the first request of a symbol/timeframe. */
  firstRequest: boolean;
}

/** Answer to a `HistoryRequest`. `noMore: true` = there is nothing older, stop asking. */
export interface HistoryResult {
  bars: Bar[];
  noMore?: boolean;
}

/**
 * Where the chart gets its bars from. Returning a plain `Bar[]` means "this is the whole history"
 * (old style datafeeds): the chart never asks again.
 */
export type HistorySource = (request: HistoryRequest) => Promise<HistoryResult | Bar[]>;

export interface DataSourceOptions {
  /** Open the chart at this instant (unix seconds or ms) instead of the latest bars. */
  time?: number;
  /** Where `time` goes: the center of the chart or its left side. Default 'center'. */
  align?: 'center' | 'start';
  /** Bars asked per request. Default 1000. */
  countBack?: number;
  /**
   * Farther than this many bars from the loaded ones, `goToTime` / `goToTrade` load a window around the
   * date instead of every bar in between (scrolling right then loads the rest). Default 20000.
   */
  maxJump?: number;
}

const toSec = (t: number): number => (t > 1e11 ? Math.floor(t / 1000) : t);

/**
 * History paging of a chart: loads older bars when the view gets near the first one, windows around far
 * dates, newer bars after a jump or a lost connection. One request at a time; answers for an older
 * symbol/timeframe are dropped even if the source ignores the AbortSignal.
 */
export class History {
  source: HistorySource | null = null;
  /** Series id: changes on every new source (symbol/timeframe). */
  gen = 0;
  /** Nothing older to load. */
  noMoreBack = true;
  /** The loaded bars don't reach the realtime edge (after a jump or a resync). */
  liveGap = false;
  /** While filling a gap at the right edge, keep the view on the newest bar. */
  follow = false;
  countBack = 1000;
  maxJump = 20000;
  private liveBar: Bar | null = null;
  private fwdCursor = 0;
  private queue: Promise<unknown> = Promise.resolve();
  private ctrl: AbortController | null = null;
  private pending = 0;
  private backTask: Promise<number> | null = null;
  /** After a failed request, automatic loading waits a little before trying again. */
  private retryAt = 0;
  private fwdTask: Promise<number> | null = null;

  constructor(private chart: Chart) {}

  get loading(): boolean {
    return this.pending > 0;
  }

  /** Forget the source and drop everything in flight. */
  reset(): void {
    this.ctrl?.abort();
    this.ctrl = null;
    this.gen++;
    this.source = null;
    this.queue = Promise.resolve();
    this.backTask = this.fwdTask = null;
    this.noMoreBack = true;
    this.liveGap = false;
    this.follow = false;
    this.liveBar = null;
    if (this.pending) {
      this.pending = 0;
      this.chart.loadingChanged.emit(false);
    }
  }

  /** First request of a source: replaces the chart's bars. Resolves false when it failed or was replaced. */
  async start(source: HistorySource, tf: number, opts: DataSourceOptions): Promise<boolean> {
    this.reset();
    this.source = source;
    this.countBack = Math.max(10, opts.countBack ?? 1000);
    this.maxJump = Math.max(this.countBack, opts.maxJump ?? 20000);
    const gen = this.gen;
    const time = opts.time !== undefined ? toSec(opts.time) : undefined;
    const ok = await this.run(async (signal) => {
      const edge = this.edge(tf);
      const far = time !== undefined && (edge - time) / tf > this.maxJump;
      const to = far ? this.windowEnd(time!, tf) : edge;
      const r = await this.fetch({ to, countBack: this.countBack, firstRequest: true }, signal, gen);
      if (!r) return false;
      this.chart.replaceData(r.bars, tf, time === undefined);
      this.noMoreBack = r.noMore || r.bars.length === 0;
      this.liveGap = to < edge;
      this.fwdCursor = to;
      this.chart.viewChanged.emit(); // liveGap may have changed (realtime button)
      this.chart.historyLoaded.emit({ added: r.bars.length, direction: 'reset' });
      return true;
    });
    return ok === true && gen === this.gen;
  }

  /**
   * Called on every frame: loads more when the view is within one screen of the loaded edge, or when the
   * indicators' warm-up needs more bars before the first visible one.
   */
  check(): void {
    if (!this.source || this.pending || performance.now() < this.retryAt) return;
    const n = this.chart.data.length;
    if (!n) return;
    const ts = this.chart.ts;
    const screen = ts.width / ts.barSpacing;
    const vr = ts.visibleRange();
    if (!this.noMoreBack && vr.from < screen + this.chart.warmupBars()) void this.loadBack();
    else if (this.liveGap && vr.to > n - 1 - screen) void this.loadForward();
  }

  /** Load one block of older bars. Resolves with how many were added, -1 on error or when replaced. */
  loadBack(countBack = this.countBack): Promise<number> {
    if (this.backTask) return this.backTask;
    const gen = this.gen;
    const task = this.run(async (signal) => {
      const d = this.chart.data;
      if (this.noMoreBack || !d.length) return 0;
      const to = d.bars[0].time;
      const r = await this.fetch({ to, countBack, firstRequest: false }, signal, gen);
      if (!r) return -1;
      const added = this.chart.prependBars(r.bars);
      if (r.noMore || added === 0) this.noMoreBack = true;
      this.chart.viewChanged.emit(); // liveGap may have changed (realtime button)
      this.chart.historyLoaded.emit({ added, direction: 'back' });
      return added;
    }).then((v) => v ?? -1);
    this.backTask = task;
    void task.finally(() => {
      if (this.backTask === task) this.backTask = null;
    });
    return task;
  }

  /** Load newer bars after a jump or a lost connection, until the realtime edge is reached. */
  loadForward(): Promise<number> {
    if (this.fwdTask) return this.fwdTask;
    const gen = this.gen;
    const task = this.run(async (signal) => {
      const d = this.chart.data;
      if (!this.liveGap || !d.length) return 0;
      const tf = d.tf;
      const last = d.bars[d.length - 1].time;
      const edge = this.edge(tf);
      let to = Math.max(last, this.fwdCursor) + (this.countBack + 1) * tf;
      const reached = to >= edge;
      if (reached) to = edge;
      const r = await this.fetch({ to, countBack: this.countBack, firstRequest: false }, signal, gen);
      if (!r) return -1;
      const added = this.chart.appendBars(r.bars, this.follow);
      this.fwdCursor = to;
      if (reached) {
        this.liveGap = false;
        this.follow = false;
        const live = this.liveBar;
        this.liveBar = null;
        if (live) this.chart.update(live);
      }
      this.chart.viewChanged.emit(); // liveGap may have changed (realtime button)
      this.chart.historyLoaded.emit({ added, direction: 'forward' });
      if (!reached) this.chart.requestRender(); // keep going if the view is still near the end
      return added;
    }).then((v) => v ?? -1);
    this.fwdTask = task;
    void task.finally(() => {
      if (this.fwdTask === task) this.fwdTask = null;
    });
    return task;
  }

  /**
   * Make the loaded bars contain `time`: older blocks, newer blocks or, when it is far, a window around it.
   * Resolves false when it could not (no source answer, before the start of the history, replaced).
   */
  async cover(time: number, margin = 0): Promise<boolean> {
    const t = toSec(time);
    if (!Number.isFinite(t)) return false;
    const gen = this.gen;
    for (let guard = 0; guard < 1000; guard++) {
      if (gen !== this.gen) return false;
      const d = this.chart.data;
      if (!d.length) return false;
      if (!this.source) return t >= d.bars[0].time;
      const tf = d.tf;
      const first = d.bars[0].time;
      const last = d.bars[d.length - 1].time;
      if (t >= first && (t <= last + tf || !this.liveGap)) {
        // a bit of room on the left so the bar is not glued to the edge
        // (and the indicators' warm-up), in as many blocks as it takes
        while (margin > 0 && !this.noMoreBack && gen === this.gen && this.chart.data.indexAt(t) < margin) {
          if ((await this.loadBack(Math.max(this.countBack, margin - this.chart.data.indexAt(t)))) <= 0) break;
        }
        return true;
      }
      if (t < first) {
        if (this.noMoreBack) return false;
        const gap = Math.ceil((first - t) / tf);
        if (gap > this.maxJump) {
          if (!(await this.jump(t))) return false;
          continue;
        }
        if ((await this.loadBack(Math.min(this.maxJump, Math.max(this.countBack, gap + margin)))) < 0) return false;
        continue;
      }
      // after the last loaded bar, with a gap to the realtime edge
      if ((t - last) / tf > this.maxJump) {
        if (!(await this.jump(t))) return false;
        continue;
      }
      if ((await this.loadForward()) < 0) return false;
    }
    return false;
  }

  /** Replace the bars with a window around `time` (the bars in between are loaded later, on demand). */
  private async jump(time: number): Promise<boolean> {
    const gen = this.gen;
    const ok = await this.run(async (signal) => {
      const tf = this.chart.data.tf;
      const edge = this.edge(tf);
      const to = Math.min(edge, this.windowEnd(time, tf));
      const r = await this.fetch({ to, countBack: this.countBack, firstRequest: false }, signal, gen);
      if (!r || !r.bars.length) return false;
      this.chart.replaceData(r.bars, tf, false);
      this.noMoreBack = !!r.noMore;
      this.liveGap = to < edge;
      this.follow = false;
      this.fwdCursor = to;
      this.chart.viewChanged.emit(); // liveGap may have changed (realtime button)
      this.chart.historyLoaded.emit({ added: r.bars.length, direction: 'reset' });
      return true;
    });
    return ok === true;
  }

  /** Back to the newest bars after a jump. */
  async toLatest(): Promise<boolean> {
    if (!this.liveGap) return true;
    const gen = this.gen;
    const ok = await this.run(async (signal) => {
      const tf = this.chart.data.tf;
      const to = this.edge(tf);
      const r = await this.fetch({ to, countBack: this.countBack, firstRequest: false }, signal, gen);
      if (!r || !r.bars.length) return false;
      this.chart.replaceData(r.bars, tf, true);
      this.noMoreBack = !!r.noMore;
      this.liveGap = false;
      this.follow = false;
      const live = this.liveBar;
      this.liveBar = null;
      if (live) this.chart.update(live);
      this.chart.viewChanged.emit(); // liveGap may have changed (realtime button)
      this.chart.historyLoaded.emit({ added: r.bars.length, direction: 'reset' });
      return true;
    });
    return ok === true;
  }

  /**
   * The datafeed lost its connection and is back: load the bars since the last one we have.
   * If the view was on the newest bar it stays there.
   */
  resync(): void {
    const d = this.chart.data;
    if (!this.source || !d.length || this.liveGap) return;
    this.follow = !this.chart.isScrolledBack();
    this.liveGap = true;
    this.fwdCursor = d.bars[d.length - 1].time;
    void this.loadForward();
  }

  /** Realtime bar while the loaded bars don't reach the edge: keep the newest, apply it once connected. */
  holdLive(bar: Bar): boolean {
    if (!this.liveGap) return false;
    const t = toSec(bar.time);
    if (!this.liveBar || t >= this.liveBar.time) this.liveBar = { ...bar, time: t };
    return true;
  }

  /** Exclusive end of the newest bar: the bar being formed now (or the last realtime bar seen). */
  private edge(tf: number): number {
    const now = bucketStart(Date.now() / 1000, tf) + tf;
    return this.liveBar ? Math.max(now, this.liveBar.time + tf) : now;
  }

  /** `to` of a window that puts `time` in its middle. */
  private windowEnd(time: number, tf: number): number {
    return bucketStart(time, tf) + Math.ceil(this.countBack / 2) * tf;
  }

  private async fetch(req: Omit<HistoryRequest, 'signal'>, signal: AbortSignal, gen: number): Promise<HistoryResult | null> {
    const source = this.source;
    if (!source || gen !== this.gen) return null;
    const r = await source({ ...req, signal });
    if (gen !== this.gen || signal.aborted) return null; // answer for a symbol/timeframe that is gone
    if (Array.isArray(r)) return { bars: r, noMore: true };
    return { bars: r?.bars ?? [], noMore: !!r?.noMore };
  }

  /** Run tasks one at a time; errors go to `chart.historyError`. */
  private run<T>(task: (signal: AbortSignal) => Promise<T>): Promise<T | null> {
    const gen = this.gen;
    if (this.pending++ === 0) this.chart.loadingChanged.emit(true);
    const p = this.queue.then(async () => {
      if (gen !== this.gen) return null;
      const ctrl = new AbortController();
      this.ctrl = ctrl;
      try {
        return await task(ctrl.signal);
      } catch (err) {
        if (gen === this.gen && !ctrl.signal.aborted) {
          this.retryAt = performance.now() + 3000;
          this.chart.historyError.emit(err);
        }
        return null;
      } finally {
        if (this.ctrl === ctrl) this.ctrl = null;
        if (gen === this.gen && --this.pending === 0) {
          this.chart.loadingChanged.emit(false);
          this.chart.requestRender(); // re-check the edges
        }
      }
    });
    this.queue = p.catch(() => undefined);
    return p;
  }
}
