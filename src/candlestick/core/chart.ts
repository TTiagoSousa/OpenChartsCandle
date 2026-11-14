import { DrawingManager, DrawingStorage, localDrawingStorage } from '../drawings/manager';
import type { Drawing } from '../drawings/base';
import type { Indicator } from '../indicators/indicators';
import { computePriceTicks, computeTimeTicks, TimeTick } from './axes';
import { SeriesData } from './data';
import { DataSourceOptions, History, HistorySource } from './history';
import { Kinetic, PriceScale, TimeScale } from './scales';
import { drawSeries, heikinAshi } from './series';
import { Theme, font, resolveTheme, theme } from './theme';
import { Marker, Trade, TradeClickEvent, TradeColors, TradeDisplay, TradeHit, TradePoint, drawMarkers, drawTrades } from './trades';
import { TimeRange, drawTimeRanges } from './time-ranges';
import { TimeframeFeed, TimeframeSeries, mapTimeframe } from './timeframes';
import { TimeZone, TimeZoneId, checkTimeZone } from './timezone';
import { Bar, ChartType, Rect, SymbolInfo, Timeframe } from './types';
import { Emitter, clamp, formatCountdown, formatCrosshairTime, formatPrice, parseColor, uid, withAlpha } from './utils';
import { PaneView } from './view';

export interface Pane {
  id: string;
  ps: PriceScale;
  rect: Rect;
  ratio: number;
  indicators: Indicator[];
  main: boolean;
}

type Interaction =
  | { kind: 'pan'; pane: Pane; startX: number; startY: number; startRO: number; startMin: number; startMax: number; moved: boolean; trade: TradeHit | null }
  | { kind: 'drawing' }
  | { kind: 'price'; pane: Pane; startY: number; startMin: number; startMax: number }
  | { kind: 'time'; startX: number; startSpacing: number }
  | { kind: 'sep'; index: number; startY: number; r1: number; r2: number; h1: number; h2: number };

type Area =
  | { kind: 'pane'; pane: Pane }
  | { kind: 'price'; pane: Pane }
  | { kind: 'time' }
  | { kind: 'sep'; index: number }
  | { kind: 'none' };

export type CursorMode = 'cross' | 'dot' | 'arrow' | 'eraser';

export interface ContextMenuEvent {
  clientX: number;
  clientY: number;
  drawing: Drawing | null;
  pane: Pane | null;
}

interface AxisLabelItem {
  y: number;
  bg: string;
  text: string;
  sub?: string;
  fg?: string;
}

const DEFAULT_RIGHT_OFFSET = 10;

export interface ChartOptions {
  /** Instrument shown (used for price precision and drawings storage key). */
  symbol?: SymbolInfo;
  /** Initial chart type. Default "candles". */
  chartType?: ChartType;
  /**
   * Where drawings are persisted per symbol. Defaults to localStorage (key prefix "openchartscandle").
   * Pass `null` to disable persistence and manage drawings yourself via `chart.drawings`.
   */
  drawingStorage?: DrawingStorage | null;
  /** Colors (background, grid, candles…). Missing keys come from the default theme. */
  theme?: Partial<Theme>;
  /** Show the price scale on the right. Default true. */
  priceAxis?: boolean;
  /** Show the time scale at the bottom. Default true. */
  timeAxis?: boolean;
  /** Show the crosshair. Default true. */
  crosshair?: boolean;
  /** Dotted line + label at the last price. Default true. */
  lastPriceLine?: boolean;
  /** Colors used by `setTrades`. */
  tradeColors?: Partial<TradeColors>;
  /** What is drawn for each trade: entries, exits and the line between them. Default all on. */
  tradeDisplay?: Partial<TradeDisplay>;
  /** Zoom/scroll with the mouse wheel. Set false inside scrollable pages (dashboards). Default true. */
  mouseWheel?: boolean;
  /**
   * Time zone of the time axis and the crosshair: 'local' (the browser's, default), 'UTC', an IANA name
   * ('Europe/Lisbon', 'America/New_York'…) or 'exchange' (`symbol.timezone`). Daily bars always show their date.
   */
  timezone?: TimeZoneId;
}

export class Chart {
  readonly el: HTMLElement;
  readonly canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  width = 0;
  height = 0;
  dpr = 1;
  symbol: SymbolInfo = { symbol: '', precision: 2 };
  data: SeriesData = new SeriesData(60);
  readonly ts = new TimeScale();
  panes: Pane[] = [];
  chartType: ChartType = 'candles';
  private haBars: Bar[] = [];
  readonly drawings: DrawingManager;
  crosshair = { x: 0, y: 0, pane: null as Pane | null, visible: false, index: -1 };
  cursorMode: CursorMode = 'cross';
  priceAxisW = 64;
  timeAxisH = 28;
  /** This chart's colors. Change with `applyTheme`. */
  theme: Theme;
  showPriceAxis = true;
  showTimeAxis = true;
  crosshairEnabled = true;
  mouseWheel = true;
  lastPriceLine = true;
  trades: Trade[] = [];
  markers: Marker[] = [];
  /** Vertical lines and shaded zones in time. Change with `setTimeRanges`. */
  timeRanges: TimeRange[] = [];
  tradeColors: TradeColors = { long: '#2962ff', short: '#ff6d00', profit: '#089981', loss: '#f23645' };
  /** What is drawn for each trade. Change with `setTradeDisplay`. */
  tradeDisplay: TradeDisplay = { entries: true, exits: true, lines: true };
  /** Id of the highlighted trade (ring around its entry and exit), or null. */
  selectedTradeId: string | null = null;
  private tradeHits: TradeHit[] = [];
  percentMode = false;

  readonly crosshairMoved = new Emitter<number | null>();
  readonly dataUpdated = new Emitter<void>();
  readonly layoutChanged = new Emitter<void>();
  readonly indicatorsChanged = new Emitter<void>();
  readonly viewChanged = new Emitter<void>();
  readonly drawingDblClick = new Emitter<Drawing>();
  readonly contextMenu = new Emitter<ContextMenuEvent>();
  /** A trade's entry or exit was clicked on the chart. */
  readonly tradeClick = new Emitter<TradeClickEvent>();
  /** The highlighted trade changed (`selectTrade`, a click or `goToTrade`). */
  readonly tradeSelected = new Emitter<Trade | null>();
  /** Trades were set, added or updated. */
  readonly tradesChanged = new Emitter<void>();
  /** `tradeDisplay` changed. */
  readonly tradeDisplayChanged = new Emitter<TradeDisplay>();
  /** A request of the data source started (true) or all of them finished (false). */
  readonly loadingChanged = new Emitter<boolean>();
  /** A request of the data source failed. Nothing is shown on the chart: show it in your app. */
  readonly historyError = new Emitter<unknown>();
  /** Bars arrived from the data source: older ('back'), newer ('forward') or a new set ('reset'). */
  readonly historyLoaded = new Emitter<{ added: number; direction: 'back' | 'forward' | 'reset' }>();
  /** The time zone of the axis changed (`setTimezone`). */
  readonly timezoneChanged = new Emitter<TimeZoneId>();
  /** History paging (`setDataSource`). */
  readonly history: History = new History(this);
  /** Don't draw the bars while the first request with a `time` is positioning the view. */
  private holding = false;
  private tfFeed: TimeframeFeed | null = null;
  /** Bars of the other timeframes used by indicators, by seconds. */
  private tfSeries = new Map<number, TimeframeSeries>();
  /** Timeframe (seconds) whose bars each indicator's `raw` was computed on; 0 = the chart's. */
  private indMode = new WeakMap<Indicator, number>();

  private tzId: TimeZoneId = 'local';
  private tzCache: TimeZone = new TimeZone();

  private frame = 0;
  private interaction: Interaction | null = null;
  private kinetic = new Kinetic();
  private kineticRaf = 0;
  private animRaf = 0;
  private lastLayoutKey = '';
  private lastCrosshairIndex: number | null = -2;
  private pointerInside = false;
  private resizeObserver: ResizeObserver;

  constructor(el: HTMLElement, options: ChartOptions = {}) {
    this.el = el;
    if (getComputedStyle(el).position === 'static') el.style.position = 'relative';
    this.canvas = document.createElement('canvas');
    this.canvas.className = 'tc-chart-canvas';
    this.canvas.style.position = 'absolute';
    this.canvas.style.left = '0';
    this.canvas.style.top = '0';
    el.appendChild(this.canvas);
    this.ctx = this.canvas.getContext('2d')!;
    const storage = options.drawingStorage === undefined ? localDrawingStorage() : options.drawingStorage;
    this.drawings = new DrawingManager(() => this.requestRender(), storage);
    this.panes.push(this.makePane(true));
    this.ts.barSpacing = 8;
    this.ts.rightOffset = DEFAULT_RIGHT_OFFSET;
    if (options.chartType) this.chartType = options.chartType;
    this.theme = resolveTheme(options.theme);
    this.applyOptions(options);
    if (options.timezone) this.setTimezone(options.timezone);
    if (options.symbol) this.setSymbol(options.symbol);

    this.resizeObserver = new ResizeObserver(() => this.resize());
    this.resizeObserver.observe(el);
    this.resize();
    this.bindEvents();
  }

  /** Change colors (merged with the current theme). */
  applyTheme(patch: Partial<Theme>): void {
    this.theme = resolveTheme(patch, this.theme);
    this.requestRender();
  }

  /** Change display options after creation. */
  applyOptions(o: Pick<ChartOptions, 'priceAxis' | 'timeAxis' | 'crosshair' | 'lastPriceLine' | 'tradeColors' | 'tradeDisplay' | 'mouseWheel'>): void {
    if (o.mouseWheel !== undefined) this.mouseWheel = o.mouseWheel;
    if (o.priceAxis !== undefined) this.showPriceAxis = o.priceAxis;
    if (o.timeAxis !== undefined) this.showTimeAxis = o.timeAxis;
    if (o.crosshair !== undefined) this.crosshairEnabled = o.crosshair;
    if (o.lastPriceLine !== undefined) this.lastPriceLine = o.lastPriceLine;
    if (o.tradeColors) this.tradeColors = { ...this.tradeColors, ...o.tradeColors };
    if (o.tradeDisplay) this.setTradeDisplay(o.tradeDisplay);
    this.timeAxisH = this.showTimeAxis ? 28 : 0;
    if (!this.showPriceAxis) this.priceAxisW = 0;
    this.requestRender();
  }

  // ---------------- trades & markers ----------------

  /**
   * Show entries/exits (strategy tester style). Open trades show live P&L.
   * Trades without `id` get one from their position ("1", "2"…), so every trade can be found.
   */
  setTrades(trades: Trade[]): void {
    this.trades = trades.map((t, i) => ({ ...t, id: t.id ?? String(i + 1) }));
    if (this.selectedTradeId !== null && !this.trade(this.selectedTradeId)) this.selectedTradeId = null;
    this.tradesChanged.emit();
    this.requestRender();
  }

  addTrade(trade: Trade): void {
    this.trades.push({ ...trade, id: trade.id ?? String(this.trades.length + 1) });
    this.tradesChanged.emit();
    this.requestRender();
  }

  /** Update a trade by id (e.g. close it with exitTime/exitPrice). */
  updateTrade(id: string, patch: Partial<Trade>): void {
    const t = this.trade(id);
    if (t) Object.assign(t, patch, { id });
    this.tradesChanged.emit();
    this.requestRender();
  }

  /** The trade with this id, if any. */
  trade(id: string): Trade | undefined {
    return this.trades.find((x) => x.id === id);
  }

  /**
   * Choose what is drawn: only entries, only exits, or both with or without the dashed line.
   * `chart.setTradeDisplay({ exits: false })` → only entries;
   * `chart.setTradeDisplay({ lines: false })` → both, without the line.
   */
  setTradeDisplay(patch: Partial<TradeDisplay>): void {
    this.tradeDisplay = { ...this.tradeDisplay, ...patch };
    this.tradeDisplayChanged.emit({ ...this.tradeDisplay });
    this.requestRender();
  }

  /** Highlight a trade (ring around its entry and exit). `null` clears it. */
  selectTrade(id: string | null): void {
    const next = id !== null && this.trade(id) ? id : null;
    if (next === this.selectedTradeId) return;
    this.selectedTradeId = next;
    this.tradeSelected.emit(next !== null ? this.trade(next)! : null);
    this.requestRender();
  }

  /**
   * Scroll to a trade by id and highlight it.
   * `point`: 'entry' centers the entry, 'exit' the exit (an open trade has none: goes to the last bar),
   * 'both' zooms so the whole trade fits. Bars that are not loaded yet are loaded first (data source).
   * Resolves false when the id is unknown or the trade is before the start of the history.
   */
  async goToTrade(id: string, point: TradePoint | 'both' = 'entry', opts: { animate?: boolean; select?: boolean } = {}): Promise<boolean> {
    const t = this.trade(id);
    if (!t || this.data.length === 0) return false;
    const toSec = (x: number): number => (x > 1e11 ? Math.floor(x / 1000) : x);
    const closed = t.exitPrice !== undefined && t.exitTime !== undefined;
    // load the bars of the trade if they are not loaded yet
    const gen = this.history.gen;
    const margin = Math.ceil(this.ts.width / this.ts.barSpacing / 2) + this.warmupBars();
    if (point === 'exit' && closed) await this.history.cover(toSec(t.exitTime!), margin);
    else {
      await this.history.cover(toSec(t.entryTime), margin);
      if (point === 'both' && closed) await this.history.cover(toSec(t.exitTime!));
    }
    if (gen !== this.history.gen || !this.trade(id)) return false;
    const n = this.data.length;
    if (n === 0) return false;
    const first = this.data.bars[0].time;
    if (toSec(t.entryTime) < first && (t.exitTime === undefined || toSec(t.exitTime) < first)) return false;
    const idxOf = (time: number | undefined): number => (time === undefined ? n - 1 : clamp(this.data.indexAt(toSec(time)), 0, n - 1));
    const ie = idxOf(t.entryTime);
    const ix = t.exitPrice === undefined ? n - 1 : idxOf(t.exitTime);
    let center: number;
    if (point === 'both') {
      const span = Math.abs(ix - ie) + 1;
      // fit the trade in about 60% of the width, never zooming in too far
      const visible = this.ts.width / this.ts.barSpacing;
      if (span > visible * 0.6 || span < visible * 0.15) this.ts.setBarSpacing(clamp((this.ts.width * 0.6) / Math.max(span, 12), 2, 30));
      center = (ie + ix) / 2;
    } else {
      center = point === 'exit' ? ix : ie;
    }
    const half = this.ts.width / this.ts.barSpacing / 2;
    const target = center - (n - 1) + half - 0.5;
    if (opts.select !== false) this.selectTrade(id);
    this.mainPane.ps.auto = true;
    this.animateRightOffset(target, opts.animate !== false);
    return true;
  }

  private animateRightOffset(target: number, animate: boolean): void {
    cancelAnimationFrame(this.animRaf);
    this.stopKinetic();
    const clampRO = (ro: number): number => {
      const keep = this.ts.rightOffset;
      this.ts.rightOffset = ro;
      this.ts.constrain();
      const r = this.ts.rightOffset;
      this.ts.rightOffset = keep;
      return r;
    };
    const end = clampRO(target);
    const start = this.ts.rightOffset;
    if (!animate || Math.abs(end - start) < 0.01) {
      this.ts.rightOffset = end;
      this.viewChanged.emit();
      this.requestRender();
      return;
    }
    const t0 = performance.now();
    const dur = 500;
    const step = (now: number): void => {
      const k = Math.min(1, (now - t0) / dur);
      const e = 1 - Math.pow(1 - k, 3);
      this.ts.rightOffset = start + (end - start) * e;
      this.viewChanged.emit();
      this.requestRender();
      if (k < 1) this.animRaf = requestAnimationFrame(step);
    };
    this.animRaf = requestAnimationFrame(step);
  }

  /** Trade entry/exit under a point of the main pane (pane coordinates). */
  tradeAt(x: number, y: number): TradeClickEvent | null {
    const h = this.tradeHitAt(x, y);
    return h ? { trade: h.trade, point: h.point } : null;
  }

  // ---------------- time zone ----------------

  /** The time zone chosen with the `timezone` option or `setTimezone` ('local' by default). */
  get timezone(): TimeZoneId {
    return this.tzId;
  }

  /** The zone actually used: 'exchange' resolves to `symbol.timezone` (UTC without one). */
  get timeZone(): TimeZone {
    const id = this.tzId === 'exchange' ? this.symbol.timezone || 'UTC' : this.tzId;
    if (this.tzCache.id !== id) {
      try {
        this.tzCache = new TimeZone(id);
      } catch {
        this.tzCache = new TimeZone('UTC'); // a symbol with an unknown zone
      }
    }
    return this.tzCache;
  }

  /**
   * Time zone of the time axis and the crosshair: 'local', 'UTC', an IANA name ('Europe/Lisbon') or 'exchange'.
   * Throws a RangeError for a name the browser doesn't know.
   */
  setTimezone(tz: TimeZoneId): void {
    checkTimeZone(tz);
    if (tz === this.tzId) return;
    this.tzId = tz;
    this.timezoneChanged.emit(tz);
    this.requestRender();
  }

  /** Format an instant like the crosshair label, in the chart's time zone. */
  formatTime(time: number, withTime = this.data.tf < 86400): string {
    return formatCrosshairTime(time > 1e11 ? time / 1000 : time, withTime ? 0 : 86400, this.timeZone);
  }

  // ---------------- time ranges ----------------

  /**
   * Vertical lines (`{ from }`) and shaded zones (`{ from, to }`) in time: start of a simulation, warm-up,
   * excluded periods… Each edge snaps to the bar that contains it, in any timeframe.
   */
  setTimeRanges(ranges: TimeRange[]): void {
    this.timeRanges = ranges.map((r) => ({ ...r, id: r.id ?? uid('range') }));
    this.requestRender();
  }

  /** Add one line or zone. Returns its id. */
  addTimeRange(range: TimeRange): string {
    const r = { ...range, id: range.id ?? uid('range') };
    this.timeRanges = [...this.timeRanges.filter((x) => x.id !== r.id), r];
    this.requestRender();
    return r.id;
  }

  /** Remove the line or zone with this id. */
  removeTimeRange(id: string): void {
    this.timeRanges = this.timeRanges.filter((r) => r.id !== id);
    this.requestRender();
  }

  setMarkers(markers: Marker[]): void {
    this.markers = markers.map((m) => ({ ...m }));
    this.requestRender();
  }

  /** Remove the chart from the DOM and stop all observers/animations. */
  destroy(): void {
    this.history.reset();
    this.tfSeries.forEach((x) => x.destroy());
    this.tfSeries.clear();
    this.resizeObserver.disconnect();
    cancelAnimationFrame(this.frame);
    this.stopKinetic();
    this.canvas.remove();
  }

  get mainPane(): Pane {
    return this.panes[0];
  }

  private makePane(main: boolean): Pane {
    const ps = new PriceScale();
    if (main) {
      ps.marginTop = 0.1;
      ps.marginBottom = 0.08;
    }
    return { id: uid('pane'), ps, rect: { x: 0, y: 0, w: 0, h: 0 }, ratio: main ? 3 : 1, indicators: [], main };
  }

  // ---------------- data ----------------

  /** Set the instrument (precision, name). Loads the drawings stored for it. */
  setSymbol(info: SymbolInfo): void {
    this.symbol = { ...info };
    this.drawings.load(info.symbol);
    this.requestRender();
  }

  /**
   * Replace all bars. `timeframeSeconds` is the bar duration (60 = 1m, 86400 = 1D).
   * `resetView` scrolls back to the latest bar and re-enables auto scale.
   */
  setData(bars: Bar[], timeframeSeconds: number, resetView = true): void {
    this.history.reset();
    this.dropTimeframeSeries();
    this.replaceData(bars, timeframeSeconds, resetView);
  }

  /** Replace the bars without touching the data source (used by the history paging). @internal */
  replaceData(bars: Bar[], timeframeSeconds: number, resetView: boolean): void {
    this.data = new SeriesData(timeframeSeconds, bars);
    this.afterDataReset(resetView);
  }

  /**
   * Load bars from a source that serves them in blocks, like TradingView: the latest `countBack` bars first,
   * older blocks while scrolling to the left, and whatever `goToTime` / `goToTrade` need.
   * Requests for a previous source are aborted and their answers ignored.
   * Resolves false when the first request failed or another source replaced this one.
   *
   * chart.setDataSource(({ to, countBack, signal }) => api.bars('BTCUSDT', '1h', to, countBack, signal), 3600);
   */
  async setDataSource(source: HistorySource | null, timeframeSeconds: number, opts: DataSourceOptions = {}): Promise<boolean> {
    if (!source) {
      this.history.reset();
      return false;
    }
    // never show bars of the previous symbol/timeframe while the new ones load
    this.holding = opts.time !== undefined;
    this.dropTimeframeSeries();
    this.replaceData([], timeframeSeconds, false);
    const gen = this.history.gen + 1;
    try {
      const ok = await this.history.start(source, timeframeSeconds, opts);
      if (!ok) return false;
      if (opts.time !== undefined) await this.goToTime(opts.time, { align: opts.align, animate: false });
      return this.history.gen === gen;
    } finally {
      if (this.history.gen === gen) {
        this.holding = false;
        this.requestRender();
      }
    }
  }

  /** The data source lost its connection and is back: load the bars since the last one. */
  resync(): void {
    this.history.resync();
  }

  /** The first bars of a data source with a `time` are loading (nothing is drawn yet). */
  get isHolding(): boolean {
    return this.holding;
  }

  /** Requests of the data source in progress. */
  get isLoading(): boolean {
    return this.history.loading;
  }

  /** Make sure the loaded bars contain `time` (loading older ones if needed). */
  ensureHistory(time: number): Promise<boolean> {
    return this.history.cover(time);
  }

  /** Add older bars at the left (history paging). The view does not move. Returns how many were added. */
  prependBars(bars: Bar[]): number {
    const k = this.data.prepend(bars);
    if (!k) return 0;
    this.ts.baseIndex = this.data.length - 1;
    if (this.crosshair.visible) this.crosshair.index += k;
    this.haBars = [];
    this.recomputeIndicators(0);
    this.dataUpdated.emit();
    this.requestRender();
    return k;
  }

  /**
   * Add newer bars at the right (forward paging, resync). With `follow` the view stays on the newest bar,
   * otherwise it does not move. Returns how many bars were added.
   */
  appendBars(bars: Bar[], follow = false): number {
    const r = this.data.append(bars);
    if (!r) return 0;
    this.ts.baseIndex = this.data.length - 1;
    if (!follow && r.added) this.ts.rightOffset -= r.added;
    this.recomputeIndicators(r.from);
    if (this.chartType === 'heikin') heikinAshi(this.data.bars, this.haBars, Math.min(r.from, this.haBars.length));
    this.dataUpdated.emit();
    this.viewChanged.emit();
    this.requestRender();
    return r.added;
  }

  private afterDataReset(resetView: boolean): void {
    this.ts.baseIndex = this.data.length - 1;
    this.haBars = [];
    if (resetView) {
      this.ts.rightOffset = DEFAULT_RIGHT_OFFSET;
      for (const p of this.panes) p.ps.auto = true;
    }
    this.ts.constrain();
    this.syncTimeframes();
    this.recomputeIndicators(0);
    this.dataUpdated.emit();
    this.viewChanged.emit();
    this.requestRender();
  }

  /** Realtime update: same time as the last bar replaces it, a newer time appends a new bar. */
  update(bar: Bar): void {
    if (this.history.holdLive(bar)) return; // the loaded bars don't reach now yet
    const prevLen = this.data.length;
    const from = this.data.update(bar);
    if (from < 0) return;
    const added = this.data.length - prevLen;
    this.ts.baseIndex = this.data.length - 1;
    if (added > 0 && this.ts.rightOffset < 0) this.ts.rightOffset -= added;
    this.recomputeIndicators(from);
    if (this.chartType === 'heikin') heikinAshi(this.data.bars, this.haBars, from);
    this.dataUpdated.emit();
    this.requestRender();
  }

  /** Current bars (oldest first). */
  get bars(): Bar[] {
    return this.data.bars;
  }

  private recomputeIndicators(from: number): void {
    for (const ind of this.indicators) {
      if (this.indMode.get(ind)) this.mapIndicator(ind); // its own bars did not change
      else ind.compute(this.data.bars, from);
    }
  }

  // ---------------- indicators on another timeframe ----------------

  /**
   * Where indicators with their own `timeframe` (the 4h MA on a 1h chart) get their bars: the same contract
   * as `setDataSource`, plus the timeframe. Set it again when the symbol changes. The Terminal sets it.
   *
   * chart.setTimeframeFeed({
   *   getBars: (tf, { to, countBack, signal }) => api.bars('BTCUSDT', tf.id, to, countBack, signal),
   *   subscribeBars: (tf, onBar) => api.subscribe('BTCUSDT', tf.id, onBar),
   * });
   */
  setTimeframeFeed(feed: TimeframeFeed | null): void {
    this.tfFeed = feed;
    this.dropTimeframeSeries();
  }

  /** The timeframe an indicator uses when it is not the chart's, or null. */
  private ownTimeframe(ind: Indicator): Timeframe | null {
    const tf = ind.timeframe();
    return tf && tf.seconds !== this.data.tf ? tf : null;
  }

  /** Forget the bars of the other timeframes (new symbol or feed); they load again for the new data. */
  private dropTimeframeSeries(): void {
    this.tfSeries.forEach((x) => x.destroy());
    this.tfSeries.clear();
    this.syncTimeframes();
  }

  /** One series per timeframe in use; indicators that changed between the chart's and another are recomputed. */
  private syncTimeframes(): void {
    const need = new Map<number, Timeframe>();
    for (const ind of this.indicators) {
      ind.chartTimeframe = this.data.tf;
      const tf = this.ownTimeframe(ind);
      if (tf) need.set(tf.seconds, tf);
    }
    for (const [sec, x] of this.tfSeries) {
      if (!need.has(sec)) {
        x.destroy();
        this.tfSeries.delete(sec);
      }
    }
    if (this.tfFeed) {
      for (const [sec, tf] of need) {
        if (this.tfSeries.has(sec)) continue;
        const x: TimeframeSeries = new TimeframeSeries(
          tf,
          this.tfFeed,
          (from) => this.onTimeframeBars(x, from),
          () => this.requestRender(),
          (err) => this.historyError.emit(err),
        );
        this.tfSeries.set(sec, x);
      }
    }
    for (const ind of this.indicators) this.computeIndicator(ind, false);
  }

  /** Compute an indicator on its bars (`full`: from the start even if its mode did not change), then map it. */
  private computeIndicator(ind: Indicator, full: boolean): void {
    const mode = this.ownTimeframe(ind)?.seconds ?? 0;
    const changed = (this.indMode.get(ind) ?? 0) !== mode || !this.indMode.has(ind);
    this.indMode.set(ind, mode);
    if (!mode) {
      if (ind.values !== ind.raw) ind.values = ind.raw;
      if (ind.lines !== ind.rawLines) ind.lines = ind.rawLines;
      ind.points = null;
      if (changed || full) ind.compute(this.data.bars, 0);
      return;
    }
    if (changed || full) ind.compute(this.tfSeries.get(mode)?.data.bars ?? [], 0);
    this.mapIndicator(ind);
  }

  /** Values per chart bar from the values per bar of the indicator's own timeframe (no look-ahead). */
  private mapIndicator(ind: Indicator): void {
    const sec = this.indMode.get(ind) ?? 0;
    const x = this.tfSeries.get(sec);
    const n = this.data.length;
    const values = new Array<number>(n).fill(NaN);
    const lines = ind.rawLines.map(() => new Array<number>(n).fill(NaN));
    // larger timeframe: the line joins the first bar of each value (TradingView), not one step per bar
    const points = sec > this.data.tf ? new Uint8Array(n) : null;
    if (x) {
      const map = mapTimeframe(this.data.bars, this.data.tf, x.data.bars, sec, x.live);
      for (let i = 0; i < n; i++) {
        if (map[i] < 0) continue;
        values[i] = ind.raw[map[i]];
        for (let k = 0; k < lines.length; k++) lines[k][i] = ind.rawLines[k][map[i]];
        if (points && map[i] !== map[i - 1]) points[i] = 1;
      }
    }
    ind.values = values;
    ind.lines = lines;
    ind.points = points;
  }

  private onTimeframeBars(x: TimeframeSeries, from: number): void {
    const sec = x.tf.seconds;
    if (this.tfSeries.get(sec) !== x) return;
    for (const ind of this.indicators) {
      if (this.indMode.get(ind) !== sec) continue;
      ind.compute(x.data.bars, from);
      this.mapIndicator(ind);
    }
    this.requestRender();
  }

  /**
   * Bars an indicator on the chart's timeframe needs before the first one shown (warm-up): older blocks are
   * loaded until they are there, also after a jump (`goToTime`, `goToTrade`).
   */
  warmupBars(): number {
    let w = 0;
    for (const ind of this.indicators) if (!this.ownTimeframe(ind)) w = Math.max(w, ind.warmup());
    return w;
  }

  /** Called on every frame: load the bars of the other timeframes that the visible bars (and their warm-up) need. */
  private checkTimeframes(): void {
    const n = this.data.length;
    if (!this.tfSeries.size || !n || this.holding) return;
    const vr = this.ts.visibleRange();
    const a = clamp(Math.floor(vr.from), 0, n - 1);
    const b = clamp(Math.ceil(vr.to), 0, n - 1);
    const from = this.data.bars[a].time;
    const to = this.data.bars[b].time + this.data.tf;
    for (const [sec, x] of this.tfSeries) {
      let warm = 0;
      for (const ind of this.indicators) if (this.indMode.get(ind) === sec) warm = Math.max(warm, ind.warmup());
      // +1: on a larger timeframe the first visible bar shows the bar that closed before it
      x.ensure(from - (warm + 1) * sec, to, this.history.countBack, 20000 + warm);
    }
  }

  displayBars(): Bar[] {
    if (this.chartType === 'heikin') {
      if (this.haBars.length !== this.data.length) heikinAshi(this.data.bars, this.haBars, Math.max(0, this.haBars.length - 1));
      return this.haBars;
    }
    return this.data.bars;
  }

  setChartType(t: ChartType): void {
    this.chartType = t;
    this.haBars = [];
    this.requestRender();
  }

  // ---------------- indicators ----------------

  get indicators(): Indicator[] {
    return this.panes.flatMap((p) => p.indicators);
  }

  addIndicator(ind: Indicator): void {
    ind.onDataChanged = () => {
      this.dataUpdated.emit();
      this.requestRender();
    };
    if (ind.overlay) this.mainPane.indicators.push(ind);
    else {
      const p = this.makePane(false);
      p.indicators.push(ind);
      this.panes.push(p);
    }
    this.indMode.delete(ind);
    this.syncTimeframes();
    this.indicatorsChanged.emit();
    this.requestRender();
  }

  removeIndicator(ind: Indicator): void {
    ind.onDataChanged = null;
    for (const p of this.panes) {
      const i = p.indicators.indexOf(ind);
      if (i >= 0) p.indicators.splice(i, 1);
    }
    this.panes = this.panes.filter((p) => p.main || p.indicators.length > 0);
    this.indMode.delete(ind);
    this.syncTimeframes();
    this.indicatorsChanged.emit();
    this.requestRender();
  }

  updateIndicator(ind: Indicator): void {
    this.syncTimeframes();
    this.computeIndicator(ind, true);
    this.indicatorsChanged.emit();
    this.requestRender();
  }

  paneOf(ind: Indicator): Pane | undefined {
    return this.panes.find((p) => p.indicators.includes(ind));
  }

  // ---------------- view control ----------------

  resetView(): void {
    this.ts.barSpacing = 8;
    this.ts.rightOffset = DEFAULT_RIGHT_OFFSET;
    for (const p of this.panes) p.ps.auto = true;
    this.ts.constrain();
    this.viewChanged.emit();
    this.requestRender();
  }

  /** Show the last `count` bars. */
  showLastBars(count: number): void {
    const n = Math.max(5, count);
    this.ts.setBarSpacing(this.ts.width / (n + DEFAULT_RIGHT_OFFSET * 0.5));
    this.ts.rightOffset = DEFAULT_RIGHT_OFFSET * 0.5;
    this.ts.constrain();
    this.mainPane.ps.auto = true;
    this.viewChanged.emit();
    this.requestRender();
  }

  scrollBars(delta: number): void {
    this.ts.rightOffset -= delta;
    this.ts.constrain();
    this.viewChanged.emit();
    this.requestRender();
  }

  zoomStep(dir: 1 | -1): void {
    this.ts.zoom(this.ts.width - this.ts.barSpacing * Math.max(this.ts.rightOffset, 0), dir);
    this.viewChanged.emit();
    this.requestRender();
  }

  scrollToRealtime(): void {
    if (this.history.liveGap && !this.history.follow) {
      void this.history.toLatest();
      return;
    }
    cancelAnimationFrame(this.animRaf);
    const start = this.ts.rightOffset;
    const target = DEFAULT_RIGHT_OFFSET;
    const t0 = performance.now();
    const dur = 450;
    const step = (now: number): void => {
      const k = Math.min(1, (now - t0) / dur);
      const e = 1 - Math.pow(1 - k, 3);
      this.ts.rightOffset = start + (target - start) * e;
      this.viewChanged.emit();
      this.requestRender();
      if (k < 1) this.animRaf = requestAnimationFrame(step);
    };
    this.animRaf = requestAnimationFrame(step);
  }

  isScrolledBack(): boolean {
    return this.ts.rightOffset < -1 || (this.history.liveGap && !this.history.follow);
  }

  /** Time at the center of the chart (unix seconds). */
  centerTime(): number {
    return this.data.indexToTime(this.ts.xToIndex(this.ts.width / 2));
  }

  /**
   * Scroll to an instant (unix seconds or ms). With a data source, bars that are not loaded yet are
   * loaded first. `align`: 'center' (default) or 'start' (left side). Resolves false when the instant
   * could not be reached (before the start of the history, failed request, replaced data).
   */
  async goToTime(time: number, opts: { align?: 'center' | 'start'; animate?: boolean } = {}): Promise<boolean> {
    const t = time > 1e11 ? Math.floor(time / 1000) : time;
    const gen = this.history.gen;
    const margin = Math.ceil(this.ts.width / this.ts.barSpacing / 2) + this.warmupBars();
    const covered = await this.history.cover(t, margin);
    if (gen !== this.history.gen || !this.data.length) return false;
    const n = this.data.length;
    const i = clamp(this.data.indexAt(t), 0, n - 1);
    const visible = this.ts.width / this.ts.barSpacing;
    const target = opts.align === 'start' ? i - (n - 1) + visible - 3 : i - (n - 1) + visible / 2 - 0.5;
    this.mainPane.ps.auto = true;
    this.animateRightOffset(target, opts.animate !== false);
    return covered;
  }

  setAutoScale(on: boolean): void {
    this.mainPane.ps.auto = on;
    this.viewChanged.emit();
    this.requestRender();
  }

  setLog(on: boolean): void {
    this.mainPane.ps.log = on;
    this.mainPane.ps.auto = true;
    this.viewChanged.emit();
    this.requestRender();
  }

  setPercent(on: boolean): void {
    this.percentMode = on;
    this.viewChanged.emit();
    this.requestRender();
  }

  setInvert(on: boolean): void {
    this.mainPane.ps.invert = on;
    this.viewChanged.emit();
    this.requestRender();
  }

  // ---------------- views ----------------

  view(p: Pane): PaneView {
    const n = this.data.length;
    const vr = this.ts.visibleRange();
    const from = clamp(vr.from, 0, Math.max(0, n - 1));
    const to = clamp(vr.to, 0, Math.max(0, n - 1));
    return new PaneView(this.ctx, p.rect, this.dpr, this.ts, p.ps, this.data, this.symbol.precision, from, to, this.symbol);
  }

  mainView(): PaneView {
    return this.view(this.mainPane);
  }

  fmt(p: number): string {
    return formatPrice(p, this.symbol.precision);
  }

  // ---------------- layout ----------------

  private resize(): void {
    const r = this.el.getBoundingClientRect();
    this.dpr = window.devicePixelRatio || 1;
    this.width = Math.max(1, Math.floor(r.width));
    this.height = Math.max(1, Math.floor(r.height));
    this.canvas.width = Math.round(this.width * this.dpr);
    this.canvas.height = Math.round(this.height * this.dpr);
    this.canvas.style.width = this.width + 'px';
    this.canvas.style.height = this.height + 'px';
    this.layout();
    this.ts.constrain();
    this.draw();
  }

  private layout(): void {
    const paneW = this.width - this.priceAxisW;
    const totalH = this.height - this.timeAxisH;
    const sum = this.panes.reduce((a, p) => a + p.ratio, 0);
    let y = 0;
    this.panes.forEach((p, i) => {
      const h = i === this.panes.length - 1 ? totalH - y : Math.round((totalH * p.ratio) / sum);
      p.rect = { x: 0, y, w: paneW, h };
      p.ps.height = h;
      y += h;
    });
    this.ts.width = paneW;
    const key = this.panes.map((p) => `${p.id}:${p.rect.y}:${p.rect.h}`).join('|') + `|${paneW}`;
    if (key !== this.lastLayoutKey) {
      this.lastLayoutKey = key;
      queueMicrotask(() => this.layoutChanged.emit());
    }
  }

  private updatePriceAxisWidth(): void {
    if (!this.showPriceAxis) {
      this.priceAxisW = 0;
      return;
    }
    const ctx = this.ctx;
    ctx.font = font(12);
    const p = this.mainPane.ps;
    const sample = Math.max(Math.abs(p.max), Math.abs(p.min), Math.abs(this.data.bars[this.data.length - 1]?.close ?? 0));
    let w = ctx.measureText(this.fmt(sample)).width;
    if (this.percentMode) w = Math.max(w, ctx.measureText('-100.00%').width);
    for (const pane of this.panes) {
      if (pane.main) continue;
      w = Math.max(w, ctx.measureText(pane.ps.max.toFixed(2)).width, ctx.measureText(pane.ps.min.toFixed(2)).width);
    }
    const target = Math.max(56, Math.ceil(w + 26));
    if (Math.abs(target - this.priceAxisW) > 2) {
      this.priceAxisW = target;
      this.ts.width = this.width - target;
    }
  }

  private autoscale(from: number, to: number): void {
    const bars = this.displayBars();
    for (const p of this.panes) {
      if (!p.ps.auto) continue;
      let lo = Infinity;
      let hi = -Infinity;
      if (p.main) {
        const lineLike = this.chartType === 'line' || this.chartType === 'area' || this.chartType === 'baseline' || this.chartType === 'step';
        for (let i = from; i <= to; i++) {
          const b = bars[i];
          if (!b) continue;
          const l = lineLike ? b.close : b.low;
          const h = lineLike ? b.close : b.high;
          if (l < lo) lo = l;
          if (h > hi) hi = h;
        }
      }
      for (const ind of p.indicators) {
        if (!ind.shown || (p.main && !ind.affectsScale)) continue;
        const r = ind.range(from, to);
        if (r) {
          lo = Math.min(lo, r[0]);
          hi = Math.max(hi, r[1]);
        }
      }
      if (lo <= hi) p.ps.setRange(lo, hi);
    }
  }

  // ---------------- rendering ----------------

  requestRender(): void {
    if (this.frame) return;
    this.frame = requestAnimationFrame(() => this.draw());
  }

  draw(): void {
    this.frame = 0;
    const ctx = this.ctx;
    const dpr = this.dpr;
    Object.assign(theme, this.theme); // renderers read the shared `theme`
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.fillStyle = theme.bg;
    ctx.fillRect(0, 0, this.width, this.height);
    if (!this.data || this.data.length === 0 || this.holding) return;

    this.updatePriceAxisWidth();
    this.layout();
    const n = this.data.length;
    this.ts.baseIndex = n - 1;
    const vr = this.ts.visibleRange();
    const from = clamp(vr.from, 0, n - 1);
    const to = clamp(vr.to, 0, n - 1);
    this.autoscale(from, to);
    const bars = this.displayBars();
    const timeTicks = computeTimeTicks(this.ts, this.data, this.timeZone);
    const marks = this.drawings.axisMarks(this.mainView());

    for (const pane of this.panes) {
      const r = pane.rect;
      const v = this.view(pane);
      const priceTicks = computePriceTicks(pane.ps, r.h, pane.main ? this.symbol.precision : 2);
      ctx.save();
      ctx.beginPath();
      ctx.rect(r.x, r.y, r.w, r.h);
      ctx.clip();
      ctx.translate(r.x, r.y);
      this.drawGrid(v, timeTicks, priceTicks);
      if (this.timeRanges.length) drawTimeRanges(v, this.timeRanges, pane.main);
      if (pane.main) {
        for (const ind of pane.indicators) if (ind.shown && !ind.affectsScale) ind.draw(v);
        drawSeries(v, this.chartType, bars);
        for (const ind of pane.indicators) if (ind.shown && ind.affectsScale) ind.draw(v);
        if (this.markers.length) drawMarkers(v, this.markers);
        this.tradeHits = this.trades.length ? drawTrades(v, this.trades, this.tradeColors, this.tradeDisplay, this.selectedTradeId) : [];
        if (this.lastPriceLine) this.drawLastPriceLine(v);
        this.drawings.draw(v);
      } else {
        for (const ind of pane.indicators) if (ind.shown) ind.draw(v);
      }
      this.drawCrosshair(v, pane);
      ctx.restore();
      if (this.showPriceAxis) this.drawPriceAxis(pane, v, priceTicks, pane.main ? marks : null);
    }
    // separators
    ctx.fillStyle = theme.border;
    for (let i = 1; i < this.panes.length; i++) {
      const y = this.panes[i].rect.y;
      ctx.fillRect(0, y, this.width, 1);
    }
    if (this.showTimeAxis) this.drawTimeAxis(timeTicks, marks);
    this.history.check();
    this.checkTimeframes();
  }

  private drawGrid(v: PaneView, ticks: TimeTick[], prices: number[]): void {
    const ctx = v.ctx;
    ctx.strokeStyle = theme.grid;
    ctx.lineWidth = 1 / this.dpr;
    ctx.beginPath();
    const px = (val: number): number => (Math.round(val * this.dpr) + 0.5) / this.dpr;
    for (const t of ticks) {
      const x = px(t.x);
      ctx.moveTo(x, 0);
      ctx.lineTo(x, v.height);
    }
    for (const p of prices) {
      const y = px(v.priceToY(p));
      ctx.moveTo(0, y);
      ctx.lineTo(v.width, y);
    }
    ctx.stroke();
  }

  private lastBarColor(): string {
    const b = this.data.bars[this.data.length - 1];
    return b.close >= b.open ? theme.up : theme.down;
  }

  private drawLastPriceLine(v: PaneView): void {
    const last = this.data.bars[this.data.length - 1];
    const y = (Math.round(v.priceToY(last.close) * this.dpr) + 0.5) / this.dpr;
    const ctx = v.ctx;
    ctx.save();
    ctx.strokeStyle = this.lastBarColor();
    ctx.lineWidth = 1 / this.dpr;
    ctx.setLineDash([1, 2]);
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(v.width, y);
    ctx.stroke();
    ctx.restore();
  }

  private crosshairActive(): boolean {
    return this.crosshairEnabled && this.crosshair.visible && this.crosshair.pane !== null && this.cursorMode !== 'eraser';
  }

  private drawCrosshair(v: PaneView, pane: Pane): void {
    if (!this.crosshairActive()) return;
    const ctx = v.ctx;
    const x = (Math.round(this.ts.indexToX(this.crosshair.index) * this.dpr) + 0.5) / this.dpr;
    if (this.cursorMode === 'dot') {
      if (pane === this.crosshair.pane) {
        ctx.fillStyle = theme.textStrong;
        ctx.beginPath();
        ctx.arc(this.ts.indexToX(this.crosshair.index), this.crosshair.y - pane.rect.y, 2.5, 0, Math.PI * 2);
        ctx.fill();
      }
      return;
    }
    if (this.cursorMode === 'arrow') return;
    ctx.save();
    ctx.strokeStyle = withAlpha(theme.crosshair, 0.9);
    ctx.lineWidth = 1 / this.dpr;
    ctx.setLineDash([5, 4]);
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, v.height);
    if (pane === this.crosshair.pane) {
      const y = (Math.round((this.crosshair.y - pane.rect.y) * this.dpr) + 0.5) / this.dpr;
      ctx.moveTo(0, y);
      ctx.lineTo(v.width, y);
    }
    ctx.stroke();
    ctx.restore();
  }

  private fmtAxis(pane: Pane, price: number): string {
    if (!pane.main) {
      const a = Math.abs(price);
      return price.toFixed(a >= 1000 ? 0 : a >= 1 || a < 1e-9 ? 2 : 4);
    }
    if (this.percentMode) {
      const base = this.percentBase();
      const pct = ((price - base) / base) * 100;
      return `${pct >= 0 ? '' : '−'}${Math.abs(pct).toFixed(2)}%`;
    }
    return this.fmt(price);
  }

  private percentBase(): number {
    const vr = this.ts.visibleRange();
    const i = clamp(vr.from, 0, this.data.length - 1);
    return this.data.bars[i].close;
  }

  private drawPriceAxis(pane: Pane, v: PaneView, ticks: number[], marks: ReturnType<DrawingManager['axisMarks']> | null): void {
    const ctx = this.ctx;
    const x0 = this.width - this.priceAxisW;
    const r = pane.rect;
    const W = this.priceAxisW;
    ctx.save();
    ctx.beginPath();
    ctx.rect(x0, r.y, W, r.h);
    ctx.clip();
    ctx.fillStyle = theme.bg;
    ctx.fillRect(x0, r.y, W, r.h);
    ctx.fillStyle = theme.border;
    ctx.fillRect(x0, r.y, 1, r.h);

    ctx.font = font(12);
    ctx.textBaseline = 'middle';
    ctx.textAlign = 'left';
    ctx.fillStyle = theme.text;
    for (const p of ticks) {
      const y = r.y + pane.ps.priceToY(p);
      if (y < r.y + 8 || y > r.y + r.h - 8) continue;
      ctx.fillText(this.fmtAxis(pane, p), x0 + 10, y);
    }

    // active drawing band
    if (marks?.active?.priceBand) {
      const [a, b] = marks.active.priceBand;
      const y1 = r.y + pane.ps.priceToY(a);
      const y2 = r.y + pane.ps.priceToY(b);
      ctx.fillStyle = withAlpha(theme.accent, 0.2);
      ctx.fillRect(x0 + 1, Math.min(y1, y2), W, Math.abs(y2 - y1));
    }

    const labels: AxisLabelItem[] = [];
    for (const ind of pane.indicators) {
      if (!ind.shown) continue;
      for (const l of ind.axisLabels()) {
        if (!isFinite(l.price)) continue;
        labels.push({ y: r.y + pane.ps.priceToY(l.price), bg: l.color, text: l.text ?? this.fmtAxis(pane, l.price) });
      }
    }
    if (marks) {
      for (const m of marks.persistent) labels.push({ y: r.y + pane.ps.priceToY(m.price), bg: m.color, text: this.fmtAxis(pane, m.price) });
      if (marks.active) {
        for (const m of marks.active.prices) labels.push({ y: r.y + pane.ps.priceToY(m.price), bg: m.color ?? theme.accent, text: this.fmtAxis(pane, m.price) });
      }
    }
    if (pane.main) {
      for (const t of this.trades) {
        if (t.exitPrice !== undefined || !this.tradeDisplay.entries) continue;
        labels.push({ y: r.y + pane.ps.priceToY(t.entryPrice), bg: t.side === 'long' ? this.tradeColors.long : this.tradeColors.short, text: this.fmtAxis(pane, t.entryPrice) });
      }
    }
    if (pane.main && this.lastPriceLine) {
      const last = this.data.bars[this.data.length - 1];
      const remain = last.time + this.data.tf - Date.now() / 1000;
      labels.push({
        y: r.y + pane.ps.priceToY(last.close),
        bg: this.lastBarColor(),
        text: this.fmtAxis(pane, last.close),
        sub: this.data.tf <= 86400 * 7 ? formatCountdown(remain) : undefined,
      });
    }
    this.layoutLabels(labels, r.y, r.y + r.h);
    for (const l of labels) this.drawAxisLabel(x0, l.y, W, l);

    if (this.crosshairActive() && this.crosshair.pane === pane) {
      const price = pane.ps.yToPrice(this.crosshair.y - r.y);
      this.drawAxisLabel(x0, this.crosshair.y, W, { y: this.crosshair.y, bg: theme.crosshairLabel, text: this.fmtAxis(pane, price) });
    }
    ctx.restore();
  }

  private layoutLabels(labels: AxisLabelItem[], top: number, bottom: number): void {
    // each label spans [y - 10, y - 10 + h]; the price text is centered on y
    labels.sort((a, b) => a.y - b.y);
    const hOf = (l: AxisLabelItem): number => (l.sub ? 34 : 20);
    for (let i = 1; i < labels.length; i++) {
      const prev = labels[i - 1];
      const minY = prev.y + hOf(prev);
      if (labels[i].y < minY && labels[i].y - prev.y < 40) labels[i].y = minY;
    }
    for (const l of labels) l.y = clamp(l.y, top + 10, bottom - hOf(l) + 10);
  }

  private drawAxisLabel(x0: number, y: number, W: number, l: AxisLabelItem): void {
    const ctx = this.ctx;
    const h = l.sub ? 34 : 20;
    const top = Math.round(y - 10);
    ctx.fillStyle = l.bg;
    ctx.beginPath();
    const x = x0 + 1;
    const w = W - 1;
    const rr = 3;
    ctx.moveTo(x, top);
    ctx.lineTo(x + w - rr, top);
    ctx.arcTo(x + w, top, x + w, top + rr, rr);
    ctx.lineTo(x + w, top + h - rr);
    ctx.arcTo(x + w, top + h, x + w - rr, top + h, rr);
    ctx.lineTo(x, top + h);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = l.fg ?? contrastText(l.bg);
    ctx.font = font(12);
    ctx.textBaseline = 'middle';
    ctx.textAlign = 'left';
    ctx.fillText(l.text, x0 + 10, top + 10.5);
    if (l.sub) {
      ctx.globalAlpha = 0.85;
      ctx.fillText(l.sub, x0 + 10, top + 25);
      ctx.globalAlpha = 1;
    }
  }

  private drawTimeAxis(ticks: TimeTick[], marks: ReturnType<DrawingManager['axisMarks']>): void {
    const ctx = this.ctx;
    const y0 = this.height - this.timeAxisH;
    const W = this.ts.width;
    ctx.save();
    ctx.fillStyle = theme.bg;
    ctx.fillRect(0, y0, this.width, this.timeAxisH);
    ctx.fillStyle = theme.border;
    ctx.fillRect(0, y0, this.width, 1);
    ctx.beginPath();
    ctx.rect(0, y0, W, this.timeAxisH);
    ctx.clip();
    ctx.textBaseline = 'middle';
    ctx.textAlign = 'center';
    for (const t of ticks) {
      ctx.font = font(12, t.weight >= 8 ? '600' : '');
      ctx.fillStyle = t.weight >= 7 ? theme.textStrong : theme.text;
      ctx.fillText(t.label, t.x, y0 + this.timeAxisH / 2 + 1);
    }
    const placed: [number, number][] = [];
    const tLabel = (time: number, bg: string): void => {
      const x = this.ts.indexToX(this.data.timeToIndex(time));
      const r = this.drawTimeLabel(x, y0, formatCrosshairTime(time, this.data.tf, this.timeZone), bg, placed);
      if (r) placed.push(r);
    };
    if (marks.active?.timeBand) {
      const [a, b] = marks.active.timeBand;
      const x1 = this.ts.indexToX(this.data.timeToIndex(a));
      const x2 = this.ts.indexToX(this.data.timeToIndex(b));
      ctx.fillStyle = withAlpha(theme.accent, 0.2);
      ctx.fillRect(Math.min(x1, x2), y0 + 1, Math.abs(x2 - x1), this.timeAxisH);
    }
    for (const m of marks.persistentTimes) tLabel(m.time, m.color);
    if (marks.active) for (const t of marks.active.times) tLabel(t, theme.accent);
    if (this.crosshairActive()) {
      const t = this.data.indexToTime(this.crosshair.index);
      this.drawTimeLabel(this.ts.indexToX(this.crosshair.index), y0, formatCrosshairTime(t, this.data.tf, this.timeZone), theme.crosshairLabel);
    }
    ctx.restore();
  }

  private drawTimeLabel(x: number, y0: number, text: string, bg: string, avoid: [number, number][] = []): [number, number] | null {
    const ctx = this.ctx;
    ctx.font = font(12);
    const w = ctx.measureText(text).width + 16;
    const left = clamp(Math.round(x - w / 2), 0, this.ts.width - w);
    if (avoid.some(([a, b]) => left < b && left + w > a)) return null;
    ctx.fillStyle = bg;
    ctx.beginPath();
    ctx.roundRect(left, y0 + 1, w, this.timeAxisH - 4, [0, 0, 3, 3]);
    ctx.fill();
    ctx.fillStyle = contrastText(bg);
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(text, left + w / 2, y0 + this.timeAxisH / 2 - 0.5);
    return [left, left + w];
  }

  // ---------------- interaction ----------------

  private area(x: number, y: number): Area {
    const paneW = this.width - this.priceAxisW;
    if (this.timeAxisH > 0 && y >= this.height - this.timeAxisH) return x < paneW ? { kind: 'time' } : { kind: 'none' };
    for (let i = 0; i < this.panes.length; i++) {
      const p = this.panes[i];
      if (i > 0 && Math.abs(y - p.rect.y) <= 3) return { kind: 'sep', index: i };
      if (y >= p.rect.y && y < p.rect.y + p.rect.h) return x >= paneW ? { kind: 'price', pane: p } : { kind: 'pane', pane: p };
    }
    return { kind: 'none' };
  }

  private local(e: MouseEvent): { x: number; y: number } {
    const r = this.canvas.getBoundingClientRect();
    return { x: e.clientX - r.left, y: e.clientY - r.top };
  }

  private mods(e: MouseEvent | KeyboardEvent): { shift: boolean; ctrl: boolean; alt: boolean } {
    return { shift: e.shiftKey, ctrl: e.ctrlKey || e.metaKey, alt: e.altKey };
  }

  private setCrosshair(x: number, y: number, pane: Pane | null): void {
    const idx = Math.round(this.ts.xToIndex(x));
    this.crosshair.x = x;
    this.crosshair.index = idx;
    this.crosshair.pane = pane;
    this.crosshair.visible = pane !== null;
    let cy = y;
    const dm = this.drawings;
    if (pane?.main && dm.magnet !== 'off' && (dm.tool || dm.isBusy())) {
      const v = this.mainView();
      const p = dm.snap(v, x, y - pane.rect.y);
      cy = pane.rect.y + v.priceToY(p.price);
    }
    this.crosshair.y = cy;
    const barIdx = pane && idx >= 0 && idx < this.data.length ? idx : null;
    if (barIdx !== this.lastCrosshairIndex) {
      this.lastCrosshairIndex = barIdx;
      this.crosshairMoved.emit(barIdx);
    }
    this.requestRender();
  }

  private hideCrosshair(): void {
    this.crosshair.visible = false;
    this.crosshair.pane = null;
    if (this.lastCrosshairIndex !== null) {
      this.lastCrosshairIndex = null;
      this.crosshairMoved.emit(null);
    }
    this.requestRender();
  }

  private baseCursor(): string {
    if (this.drawings.tool) return 'crosshair';
    switch (this.cursorMode) {
      case 'arrow': return 'default';
      case 'dot': return 'none';
      case 'eraser': return 'cell';
      default: return 'crosshair';
    }
  }

  private setCursor(c: string): void {
    if (this.canvas.style.cursor !== c) this.canvas.style.cursor = c;
  }

  private bindEvents(): void {
    const c = this.canvas;
    c.addEventListener('pointerdown', (e) => this.onDown(e));
    c.addEventListener('pointermove', (e) => this.onMove(e));
    c.addEventListener('pointerup', (e) => this.onUp(e));
    c.addEventListener('pointercancel', (e) => this.onUp(e));
    c.addEventListener('pointerleave', () => {
      this.pointerInside = false;
      if (!this.interaction && !this.drawings.creating) this.hideCrosshair();
    });
    c.addEventListener('pointerenter', () => (this.pointerInside = true));
    c.addEventListener('dblclick', (e) => this.onDblClick(e));
    c.addEventListener('wheel', (e) => this.onWheel(e), { passive: false });
    c.addEventListener('contextmenu', (e) => {
      e.preventDefault();
      const { x, y } = this.local(e);
      const a = this.area(x, y);
      let d: Drawing | null = null;
      if (a.kind === 'pane' && a.pane.main) {
        const hit = this.drawings.hitTest(this.mainView(), x, y - a.pane.rect.y);
        d = hit?.d ?? null;
        if (d) this.drawings.select(d);
      }
      this.contextMenu.emit({ clientX: e.clientX, clientY: e.clientY, drawing: d, pane: a.kind === 'pane' ? a.pane : null });
    });
  }

  private stopKinetic(): void {
    if (this.kineticRaf) cancelAnimationFrame(this.kineticRaf);
    this.kineticRaf = 0;
    cancelAnimationFrame(this.animRaf);
  }

  private onDown(e: PointerEvent): void {
    if (e.button !== 0) return;
    const { x, y } = this.local(e);
    this.stopKinetic();
    const a = this.area(x, y);
    this.canvas.setPointerCapture(e.pointerId);
    const dm = this.drawings;

    // creation in progress always continues on main pane coordinates
    if (dm.creating || (dm.tool && a.kind === 'pane' && a.pane.main)) {
      const main = this.mainPane;
      dm.pointerDown(this.mainView(), x, y - main.rect.y, this.mods(e));
      this.interaction = { kind: 'drawing' };
      return;
    }
    switch (a.kind) {
      case 'pane': {
        if (a.pane.main) {
          const v = this.mainView();
          if (this.cursorMode === 'eraser') {
            const hit = dm.hitTest(v, x, y - a.pane.rect.y);
            if (hit) dm.remove(hit.d);
            return;
          }
          if (dm.pointerDown(v, x, y - a.pane.rect.y, this.mods(e))) {
            this.interaction = { kind: 'drawing' };
            return;
          }
        }
        const ps = a.pane.ps;
        const hit = a.pane.main ? this.tradeHitAt(x, y - a.pane.rect.y) : null;
        this.interaction = { kind: 'pan', pane: a.pane, startX: x, startY: y, startRO: this.ts.rightOffset, startMin: ps.min, startMax: ps.max, moved: false, trade: hit };
        this.kinetic.reset();
        this.kinetic.addPosition(x, performance.now());
        this.setCursor('grabbing');
        break;
      }
      case 'price':
        this.interaction = { kind: 'price', pane: a.pane, startY: y, startMin: a.pane.ps.min, startMax: a.pane.ps.max };
        break;
      case 'time':
        this.interaction = { kind: 'time', startX: x, startSpacing: this.ts.barSpacing };
        break;
      case 'sep': {
        const p1 = this.panes[a.index - 1];
        const p2 = this.panes[a.index];
        this.interaction = { kind: 'sep', index: a.index, startY: y, r1: p1.ratio, r2: p2.ratio, h1: p1.rect.h, h2: p2.rect.h };
        break;
      }
    }
  }

  private onMove(e: PointerEvent): void {
    const { x, y } = this.local(e);
    const it = this.interaction;
    const dm = this.drawings;
    const a = this.area(x, y);

    if (it?.kind === 'drawing' || (dm.creating && !it)) {
      const main = this.mainPane;
      dm.pointerMove(this.mainView(), x, y - main.rect.y, this.mods(e));
      this.setCrosshair(x, clamp(y, main.rect.y, main.rect.y + main.rect.h - 1), main);
      if (dm.drag) this.setCursor(dm.drag.kind === 'move' ? 'grabbing' : (dm.hoverHit?.cursor ?? 'pointer'));
      return;
    }
    if (it) {
      switch (it.kind) {
        case 'pan': {
          const dx = x - it.startX;
          const dy = y - it.startY;
          if (!it.moved && Math.hypot(dx, dy) < 2) break;
          it.moved = true;
          this.ts.rightOffset = it.startRO - dx / this.ts.barSpacing;
          this.ts.constrain();
          if (Math.abs(dy) > 0 && (!it.pane.ps.auto || Math.abs(dy) > 25)) {
            if (it.pane.ps.auto) {
              it.pane.ps.auto = false;
              it.startMin = it.pane.ps.min;
              it.startMax = it.pane.ps.max;
              it.startY = y;
            }
            it.pane.ps.panFrom(it.startMin, it.startMax, y - it.startY);
          }
          this.kinetic.addPosition(x, performance.now());
          this.viewChanged.emit();
          this.setCrosshair(x, y, it.pane);
          break;
        }
        case 'price': {
          const factor = Math.exp((y - it.startY) * 0.006);
          it.pane.ps.auto = false;
          it.pane.ps.scaleFrom(it.startMin, it.startMax, factor);
          this.viewChanged.emit();
          this.requestRender();
          break;
        }
        case 'time': {
          const W = this.ts.width;
          const coeff = (W - it.startX + 1) / Math.max(1, W - x + 1);
          const k = clamp(coeff, 0.05, 20);
          this.ts.setBarSpacing(it.startSpacing * Math.pow(k, 0.9));
          this.ts.constrain();
          this.viewChanged.emit();
          this.requestRender();
          break;
        }
        case 'sep': {
          const dy = y - it.startY;
          const minH = 40;
          const h1 = clamp(it.h1 + dy, minH, it.h1 + it.h2 - minH);
          const h2 = it.h1 + it.h2 - h1;
          const total = it.r1 + it.r2;
          this.panes[it.index - 1].ratio = (total * h1) / (h1 + h2);
          this.panes[it.index].ratio = (total * h2) / (h1 + h2);
          this.requestRender();
          break;
        }
      }
      return;
    }

    // hover
    if (a.kind === 'pane') {
      this.setCrosshair(x, y, a.pane);
      if (a.pane.main && !dm.tool) {
        const cur = dm.hover(this.mainView(), x, y - a.pane.rect.y);
        this.setCursor(cur ?? (this.tradeHitAt(x, y - a.pane.rect.y) ? 'pointer' : this.baseCursor()));
      } else {
        if (dm.hovered) {
          dm.hovered = null;
          this.requestRender();
        }
        this.setCursor(this.baseCursor());
      }
    } else {
      this.hideCrosshair();
      if (dm.hovered) {
        dm.hovered = null;
        this.requestRender();
      }
      this.setCursor(a.kind === 'price' ? 'ns-resize' : a.kind === 'time' ? 'ew-resize' : a.kind === 'sep' ? 'row-resize' : 'default');
    }
  }

  private tradeHitAt(x: number, y: number): TradeHit | null {
    for (let i = this.tradeHits.length - 1; i >= 0; i--) {
      const h = this.tradeHits[i];
      if (x >= h.x && x <= h.x + h.w && y >= h.y && y <= h.y + h.h) return h;
    }
    return null;
  }

  private onUp(e: PointerEvent): void {
    const { x, y } = this.local(e);
    const it = this.interaction;
    this.interaction = null;
    if (this.canvas.hasPointerCapture(e.pointerId)) this.canvas.releasePointerCapture(e.pointerId);
    if (it?.kind === 'drawing') {
      this.drawings.pointerUp(this.mainView(), x, y - this.mainPane.rect.y, this.mods(e));
      this.setCursor(this.baseCursor());
      return;
    }
    if (it?.kind === 'pan' && !it.moved && it.trade) {
      // a click (no drag) on an entry/exit: highlight the trade and tell the app
      const { trade, point } = it.trade;
      this.selectTrade(trade.id ?? null);
      this.tradeClick.emit({ trade, point });
    } else if (it?.kind === 'pan' && !it.moved && it.pane.main && this.selectedTradeId !== null) {
      this.selectTrade(null);
    }
    if (it?.kind === 'pan') {
      this.setCursor(this.baseCursor());
      if (it.moved && this.kinetic.start(x, performance.now())) {
        const startRO = this.ts.rightOffset;
        const startX = x;
        const step = (): void => {
          const now = performance.now();
          const pos = this.kinetic.position(now);
          this.ts.rightOffset = startRO - (pos - startX) / this.ts.barSpacing;
          this.ts.constrain();
          this.viewChanged.emit();
          this.requestRender();
          if (!this.kinetic.finished(now)) this.kineticRaf = requestAnimationFrame(step);
          else this.kineticRaf = 0;
        };
        this.kineticRaf = requestAnimationFrame(step);
      }
    }
    if (!this.pointerInside) this.hideCrosshair();
  }

  private onDblClick(e: MouseEvent): void {
    const { x, y } = this.local(e);
    const a = this.area(x, y);
    if (this.drawings.creating) {
      this.drawings.doubleClick(this.mainView(), x, y - this.mainPane.rect.y);
      return;
    }
    if (a.kind === 'price') {
      a.pane.ps.auto = true;
      this.viewChanged.emit();
      this.requestRender();
    } else if (a.kind === 'time') {
      this.resetView();
    } else if (a.kind === 'pane' && a.pane.main) {
      const d = this.drawings.doubleClick(this.mainView(), x, y - a.pane.rect.y);
      if (d) this.drawingDblClick.emit(d);
    }
  }

  private onWheel(e: WheelEvent): void {
    if (!this.mouseWheel) return; // let the page scroll
    e.preventDefault();
    this.stopKinetic();
    const { x, y } = this.local(e);
    const a = this.area(x, y);
    let adj = 1;
    if (e.deltaMode === 1) adj = 32;
    else if (e.deltaMode === 2) adj = 120;
    const dx = (adj * e.deltaX) / 100;
    const dy = -(adj * e.deltaY) / 100;
    if (a.kind === 'price') {
      const ps = a.pane.ps;
      ps.auto = false;
      ps.scaleFrom(ps.min, ps.max, Math.exp(-dy * 0.08));
      this.viewChanged.emit();
      this.requestRender();
      return;
    }
    if (dy !== 0 && !e.shiftKey) {
      const scale = Math.sign(dy) * Math.min(1, Math.abs(dy));
      this.ts.zoom(x, scale);
    }
    if (dx !== 0 || (e.shiftKey && dy !== 0)) {
      const d = dx !== 0 ? dx : -dy;
      this.ts.rightOffset += (d * 80) / this.ts.barSpacing;
      this.ts.constrain();
    }
    this.viewChanged.emit();
    if (a.kind === 'pane') this.setCrosshair(x, y, a.pane);
    this.requestRender();
  }

  /** Keyboard helpers used by the app */
  finishPath(): void {
    this.drawings.finishCreation();
  }

  screenshot(): string {
    this.draw();
    return this.canvas.toDataURL('image/png');
  }
}

function contrastText(bg: string): string {
  const { r, g, b } = parseColor(bg);
  const l = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return l > 0.62 ? '#131722' : '#ffffff';
}
