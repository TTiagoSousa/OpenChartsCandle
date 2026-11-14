import { Chart, CursorMode } from '../core/chart';
import { Theme, resolveTheme } from '../core/theme';
import type { HistorySource } from '../core/history';
import type { TradeColors, TradeDisplay } from '../core/trades';
import { TIMEZONES, TimeZone, TimeZoneId, checkTimeZone, zonedTime } from '../core/timezone';
import { ChartType, Quote, SymbolInfo, TIMEFRAMES, Timeframe, parseTimeframe } from '../core/types';
import { Emitter, formatNumber, formatPrice, formatVolume, pad2, storageGet, storageSet } from '../core/utils';
import type { Datafeed } from '../datafeed';
import type { Drawing, LineDash } from '../drawings/base';
import { MagnetMode, localDrawingStorage } from '../drawings/manager';
import { TOOL_GROUPS, ToolGroup, toolById } from '../drawings/registry';
import { INDICATORS, Indicator, Params, Visibility, checkIndicatorParams, createIndicator } from '../indicators/indicators';
import { colorPicker } from './color-picker';
import { drawingSettings, editText, indicatorSettings, indicatorsDialog, symbolSearch } from './dialogs';
import { MenuItem, closePopover, h, menu, setPortalTheme, showPopover, tooltip } from './dom';
import { icon } from './icons';
import { Legend } from './legend';
import { TradeList, TradeListOptions } from './trade-list';

interface SavedState {
  symbol: string;
  tf: string;
  chartType: ChartType;
  indicators: { type: string; params: Params; visible: boolean; visibility?: Visibility }[];
  magnet: MagnetMode;
  stay: boolean;
  favorites: string[];
  groupTools: Record<string, string>;
  toolbarPos: { x: number; y: number } | null;
  showWatchlist: boolean;
  timezone?: TimeZoneId;
}

const DEFAULT_STATE: SavedState = {
  symbol: '',
  tf: '5',
  chartType: 'candles',
  indicators: [{ type: 'sma', params: { length: 50, color: '#2962ff' }, visible: true }],
  magnet: 'off',
  stay: false,
  favorites: ['1', '5', '15', '60', '240', '1D', '1W'],
  groupTools: {},
  toolbarPos: null,
  showWatchlist: true,
};

const CHART_TYPES: { id: ChartType; label: string }[] = [
  { id: 'bars', label: 'Barras' },
  { id: 'candles', label: 'Velas' },
  { id: 'hollow', label: 'Velas ocas' },
  { id: 'heikin', label: 'Heikin Ashi' },
  { id: 'line', label: 'Linha' },
  { id: 'step', label: 'Linha em degraus' },
  { id: 'area', label: 'Área' },
  { id: 'baseline', label: 'Linha de base' },
];

const CURSORS: { id: CursorMode; label: string; icon: string }[] = [
  { id: 'cross', label: 'Cruz', icon: 'cross' },
  { id: 'dot', label: 'Ponto', icon: 'dot' },
  { id: 'arrow', label: 'Seta', icon: 'arrowCursor' },
  { id: 'eraser', label: 'Borracha', icon: 'eraser' },
];

/**
 * An indicator used by a simulation, with its settings (`terminal.setSimulationIndicators`).
 *
 * ```ts
 * { id: 'rsi-entrada', type: 'rsi', label: 'RSI de entrada', params: { length: 14, upper: 70, lower: 30 } }
 * ```
 */
export interface SimulationIndicator {
  /** Stable key, unique in the list (e.g. 'rsi-entrada'): calling again with the same ids keeps what is on the chart. */
  id: string;
  /** 'sma', 'ema' or 'rsi' (see `INDICATORS`). */
  type: string;
  /** The settings, with the same keys as `createIndicator` (what is missing takes the default). */
  params?: Params;
  /** Name in the dialog. Default: the indicator's name. */
  label?: string;
  /** On the chart from the start. Default true. */
  visible?: boolean;
}

export interface TerminalOptions {
  /** Data source (history + realtime). Required. */
  datafeed: Datafeed;
  /** Initial symbol. Defaults to the last used one, or the first symbol of the datafeed. */
  symbol?: string;
  /** Initial timeframe id ("1", "5", "60", "1D"…). Default "5". */
  timeframe?: string;
  /**
   * Timeframes offered in the UI: `Timeframe` objects or strings ("1", "5", "15m", "1h", "4h", "1D", "1W").
   * A symbol's own `timeframes` (from `getSymbols`) take precedence. Default: TIMEFRAMES.
   */
  timeframes?: (Timeframe | string)[];
  /** Open the first symbol at this instant (unix seconds or ms) instead of the latest bars. */
  initialTime?: number;
  /** Bars asked per `getBars` request (datafeeds that serve blocks). Default 1000. */
  countBack?: number;
  /**
   * Time zone of the time axis, the crosshair and the clock: 'local' (the browser's, default), 'UTC', an IANA
   * name ('Europe/Lisbon', 'America/New_York'…) or 'exchange' (`SymbolInfo.timezone`). The clock in the bottom
   * bar opens a menu to change it (remembered with `storageKey`).
   */
  timezone?: TimeZoneId;
  /** Time zones in the clock menu. Default: TIMEZONES. */
  timezones?: { id: TimeZoneId; label: string }[];
  /** Spinner over the chart while the first bars of a symbol/timeframe load. Default true. */
  loadingIndicator?: boolean;
  /** Show the right panel (watchlist + symbol details). `string[]` limits the watchlist symbols. Default true. */
  watchlist?: boolean | string[];
  /** Show the top bar (symbol search, timeframes, chart type, indicators). Default true. */
  topbar?: boolean;
  /** Show the left drawing toolbar. Default true. */
  leftToolbar?: boolean;
  /** Show the bottom bar (ranges, clock, %/log/auto). Default true. */
  bottomBar?: boolean;
  /** Text shown at the right of the top bar. Default none. */
  brand?: string | null;
  /** Prefix for localStorage (UI state + drawings). `null` disables persistence. Default "openchartscandle". */
  storageKey?: string | null;
  /** Indicators added when there is no saved state. Default: SMA 50. */
  indicators?: { type: string; params?: Params }[];
  /**
   * Indicators of a simulation / strategy, with the settings it used. They show in the "Indicadores" dialog
   * under "Da simulação", each with a checkbox to show or hide it, and are not saved with the user's own.
   * Same as calling `setSimulationIndicators` after creating the terminal.
   */
  simulationIndicators?: SimulationIndicator[];
  /** Heading of that section of the dialog. Default "Da simulação". */
  simulationTitle?: string;
  /** Initial chart type when there is no saved state. */
  chartType?: ChartType;

  // ----- top bar items -----
  /** Symbol search button. Default true. */
  symbolSearch?: boolean;
  /**
   * Timeframe buttons + menu. `true` = all `timeframes`; `string[]` = only these ids (e.g. ['1','5','60','1D']); `false` hides.
   * Without the top bar (`minimal`) it is a small selector at the top right of the chart. Default true.
   */
  timeframeSelector?: boolean | string[];
  /** Chart type menu. `true` = all; `ChartType[]` = only these; `false` hides. Default true. */
  chartTypes?: boolean | ChartType[];
  /** "Indicadores" button. `true` = all built-in; `string[]` = only these types; `false` hides. Default true. */
  indicatorPicker?: boolean | string[];
  /** Undo / redo buttons. Default true. */
  undoRedo?: boolean;
  /** Screenshot button. Default true. */
  screenshot?: boolean;
  /** Fullscreen button. Default true. */
  fullscreen?: boolean;

  // ----- chart area -----
  /** Drawing tools in the left toolbar. `true` = all; `string[]` = only these tool ids. Default true. */
  drawingTools?: boolean | string[];
  /** Legend with OHLC and indicator values. Default true. */
  legend?: boolean;
  /** Range buttons (1D, 5D, 1M…) in the bottom bar. Default true. */
  rangeButtons?: boolean;

  // ----- look -----
  /** Colors of the chart AND the interface (background, grid, candles, borders, text…). */
  theme?: Partial<Theme>;
  /** Only the chart: turns off top bar, toolbars, bottom bar, watchlist and legend (each can be re-enabled). */
  minimal?: boolean;
  /** Smaller bars and buttons, for cards and small containers. */
  compact?: boolean;
  /** CSS border around the whole terminal, e.g. '1px solid #2a2e39'. */
  border?: string;
  /** Corner radius in px. */
  radius?: number;
  /** Price scale on the right. Default true. */
  priceAxis?: boolean;
  /** Time scale at the bottom. Default true. */
  timeAxis?: boolean;
  /** Crosshair. Default true. */
  crosshair?: boolean;
  /** Dotted line + label at the last price. Default true. */
  lastPriceLine?: boolean;
  /** Colors of trade entries/exits (`chart.setTrades`). */
  tradeColors?: Partial<TradeColors>;
  /** What is drawn for each trade: entries, exits and the line between them. Default all on. */
  tradeDisplay?: Partial<TradeDisplay>;
  /**
   * Panel under the chart with the list of trades, the Ambas / Entradas / Saídas buttons, the "Linha"
   * switch and a field to jump to a trade by id. `true` or options. Default false.
   */
  tradeList?: boolean | TradeListOptions;
  /** Height of the trade list panel in px. Default 200. */
  tradeListHeight?: number;
  /** Zoom/scroll with the mouse wheel. Set false inside scrollable pages. Default true. */
  mouseWheel?: boolean;
  /** Enable global keyboard shortcuts (Alt+T, Del, Ctrl+Z…). Default true. */
  keyboard?: boolean;
}

type Optional = 'timezone' | 'symbol' | 'chartType' | 'theme' | 'border' | 'radius' | 'tradeColors' | 'tradeDisplay' | 'tradeList' | 'tradeListHeight' | 'initialTime' | 'simulationIndicators' | 'simulationTitle';
type ResolvedOptions = Required<Omit<TerminalOptions, Optional>> & Pick<TerminalOptions, Optional>;

export class Terminal {
  readonly chart: Chart;
  readonly root: HTMLElement;
  /** The trade list panel (option `tradeList`), or null. */
  tradeList: TradeList | null = null;
  /** Resolves when the first symbol finished loading. */
  readonly ready: Promise<void>;
  /** The timeframe changed (selector, `setTimeframe`, or a symbol without the previous one). */
  readonly timeframeChanged = new Emitter<Timeframe>();
  /** Another symbol is shown. */
  readonly symbolChanged = new Emitter<SymbolInfo>();
  /** `getBars` requests in progress (true) or all finished (false). */
  readonly loadingChanged = new Emitter<boolean>();
  /** A `getBars` request failed. The library shows no message: show it in your app (and maybe `reload()`). */
  readonly error = new Emitter<unknown>();
  /** The time zone of the axis changed (clock menu or `setTimezone`). */
  readonly timezoneChanged = new Emitter<TimeZoneId>();
  private state: SavedState;
  private opts: ResolvedOptions;
  private datafeed: Datafeed;
  private symbols: SymbolInfo[] = [];
  private quotes = new Map<string, Quote>();
  private timeframes: Timeframe[];
  private tf: Timeframe;
  private els: Record<string, HTMLElement> = {};
  private watchRows = new Map<string, { row: HTMLElement; last: HTMLElement; chg: HTMLElement; pct: HTMLElement; prev: number }>();
  private floating!: HTMLElement;
  private legend: Legend | null = null;
  private loading!: HTMLElement;
  private tfTyping = '';
  private tfTypingEl: HTMLElement | null = null;
  private tfTypingTimer = 0;
  private loadToken = 0;
  private firstLoad = true;
  private unsubBars: (() => void) | null = null;
  private unsubQuotes: (() => void) | null = null;
  private timers: number[] = [];
  private keyHandler = (e: KeyboardEvent): void => this.onKey(e);
  private toolGroups: ToolGroup[] = [];

  constructor(container: HTMLElement, options: TerminalOptions) {
    this.opts = {
      timeframe: '5',
      timeframes: TIMEFRAMES,
      watchlist: true,
      topbar: true,
      leftToolbar: true,
      bottomBar: true,
      brand: null,
      storageKey: 'openchartscandle',
      indicators: [{ type: 'sma', params: { length: 50, color: '#2962ff' } }],
      keyboard: true,
      symbolSearch: true,
      timeframeSelector: true,
      chartTypes: true,
      indicatorPicker: true,
      undoRedo: true,
      screenshot: true,
      fullscreen: true,
      drawingTools: true,
      legend: true,
      rangeButtons: true,
      minimal: false,
      compact: false,
      priceAxis: true,
      timeAxis: true,
      crosshair: true,
      lastPriceLine: true,
      mouseWheel: true,
      countBack: 1000,
      loadingIndicator: true,
      timezones: TIMEZONES,
      // "minimal" switches the surrounding UI off; explicit options still win
      ...(options.minimal ? { topbar: false, leftToolbar: false, bottomBar: false, watchlist: false, legend: false } : {}),
      ...options,
    };
    this.datafeed = options.datafeed;
    this.timeframes = this.opts.timeframes.map((t) => (typeof t === 'string' ? parseTimeframe(t) : t)).filter((t): t is Timeframe => !!t);
    if (!this.timeframes.length) this.timeframes = TIMEFRAMES;
    const saved = this.opts.storageKey ? storageGet<Partial<SavedState> | null>(`${this.opts.storageKey}.state`, null) : null;
    this.state = {
      ...DEFAULT_STATE,
      tf: this.opts.timeframe,
      chartType: this.opts.chartType ?? DEFAULT_STATE.chartType,
      indicators: this.opts.indicators.map((i) => ({ type: i.type, params: i.params ?? {}, visible: true })),
      ...(saved ?? {}),
    };
    if (options.symbol) this.state.symbol = options.symbol;
    if (!this.state.timezone || !this.validZone(this.state.timezone)) this.state.timezone = this.opts.timezone ?? 'local';
    const selectable = this.selectableTimeframes();
    this.tf = selectable.find((t) => t.id === this.state.tf) ?? selectable.find((t) => t.id === this.opts.timeframe) ?? selectable[0] ?? this.timeframes[0];
    this.root = container;
    this.chart = this.build();
    this.ready = this.start();
  }

  private save(): void {
    // the simulation's indicators come from code, not from the saved state
    this.state.indicators = this.chart.indicators.filter((i) => !i.origin).map((i) => i.toJSON());
    if (this.opts.storageKey) storageSet(`${this.opts.storageKey}.state`, this.state);
  }

  /** Remove the terminal, its listeners and subscriptions. */
  destroy(): void {
    this.unsubBars?.();
    this.unsubQuotes?.();
    this.timers.forEach((t) => clearInterval(t));
    document.removeEventListener('keydown', this.keyHandler);
    closePopover();
    this.tradeList?.destroy();
    this.chart.destroy();
    this.root.innerHTML = '';
    this.root.classList.remove('tc-terminal');
  }

  // ======================= layout =======================

  private build(): Chart {
    const o = this.opts;
    this.root.classList.add('tc-terminal');
    this.root.classList.toggle('tc-compact', o.compact);
    this.root.classList.toggle('tc-minimal', o.minimal);
    if (o.border) this.root.style.border = o.border;
    if (o.radius !== undefined) this.root.style.borderRadius = `${o.radius}px`;
    this.applyCssTheme(resolveTheme(o.theme));
    this.root.addEventListener('pointerdown', () => setPortalTheme(this.cssVars), true);
    this.root.addEventListener('focusin', () => setPortalTheme(this.cssVars));
    const chartHost = h('div', { class: 'tc-chart-host' });
    const chartWrap = h('div', { class: 'tc-chart-wrap' }, chartHost);
    const center = h('div', { class: 'tc-center-col' }, chartWrap, o.bottomBar ? this.buildBottomBar() : null);
    const workspace = h(
      'div',
      { class: 'tc-workspace' },
      o.leftToolbar ? this.buildLeftToolbar() : null,
      center,
      o.watchlist !== false ? this.buildRightPanel() : null,
    );
    if (o.topbar) this.root.append(this.buildTopbar());
    this.root.append(workspace);

    const chart = new Chart(chartHost, {
      drawingStorage: o.storageKey ? localDrawingStorage(o.storageKey) : null,
      chartType: this.state.chartType,
      theme: o.theme,
      priceAxis: o.priceAxis,
      timeAxis: o.timeAxis,
      crosshair: o.crosshair,
      lastPriceLine: o.lastPriceLine,
      tradeColors: o.tradeColors,
      tradeDisplay: o.tradeDisplay,
      mouseWheel: o.mouseWheel,
      timezone: this.validZone(this.state.timezone!) ? this.state.timezone : 'local',
    });
    (this as { chart: Chart }).chart = chart;
    chart.timezoneChanged.on((tz) => {
      this.state.timezone = tz;
      this.save();
      if (this.els.clock) this.updateClock();
      this.timezoneChanged.emit(tz);
    });
    if (o.tradeList) {
      const panel = h('div', { class: 'tc-trades-panel' });
      if (o.tradeListHeight) panel.style.setProperty('--tc-trades-h', `${o.tradeListHeight}px`);
      center.insertBefore(panel, chartWrap.nextSibling);
      this.tradeList = new TradeList(panel, chart, o.tradeList === true ? {} : o.tradeList);
    }
    chart.drawings.magnet = this.state.magnet;
    chart.drawings.stayInDrawMode = this.state.stay;

    if (o.legend) {
      this.legend = new Legend(chartWrap, chart, {
        onSettings: (ind) => indicatorSettings(this.chart, ind, () => { this.legend?.rebuild(); this.save(); }),
        onRemove: (ind) => this.removeIndicator(ind),
        onToggle: (ind) => { ind.visible = !ind.visible; this.chart.updateIndicator(ind); this.save(); },
        onSymbolClick: () => (o.symbolSearch ? this.openSymbolSearch() : undefined),
      });
    }
    this.loading = h('div', { class: 'tc-loading' }, h('div', { class: 'tc-loading__spinner' }));
    chartWrap.append(this.loading);
    if (!o.topbar && o.timeframeSelector !== false) {
      this.els.tfFloat = h('div', { class: 'tc-tf-float' });
      chartWrap.append(this.els.tfFloat);
    }

    this.floating = h('div', { class: 'tc-floating-toolbar' });
    chartWrap.append(this.floating);
    const rtBtn = h('button', { class: 'tc-realtime-btn', html: icon('doubleRight'), onclick: () => this.chart.scrollToRealtime() });
    tooltip(rtBtn, 'Rolar para a barra mais recente');
    chartWrap.append(rtBtn);
    this.els.realtime = rtBtn;

    this.chart.viewChanged.on(() => {
      rtBtn.classList.toggle('is-visible', this.chart.isScrolledBack());
      this.syncBottomToggles();
      this.els.tfFloat?.style.setProperty('right', `${this.chart.priceAxisW + 8}px`);
    });
    this.chart.loadingChanged.on((loading) => {
      this.loading.classList.toggle('is-visible', loading && this.opts.loadingIndicator && (this.chart.bars.length === 0 || this.chart.isHolding));
      this.loadingChanged.emit(loading);
    });
    this.chart.historyError.on((err) => this.emitError(err));
    this.chart.drawings.selection.on((d) => this.renderFloating(d));
    this.chart.drawings.changed.on(() => this.renderFloating(this.chart.drawings.selected));
    this.chart.drawings.toolChanged.on(() => this.syncLeftToolbar());
    this.chart.drawings.historyChanged.on(() => this.syncUndo());
    this.chart.drawings.textEdit.on((d) => editText(this.chart, d));
    this.chart.drawingDblClick.on((d) => (d.type === 'text' ? editText(this.chart, d) : drawingSettings(this.chart, d)));
    this.chart.contextMenu.on((e) => this.showContextMenu(e.clientX, e.clientY, e.drawing));
    this.chart.dataUpdated.on(() => this.renderDetails());
    if (o.keyboard) document.addEventListener('keydown', this.keyHandler);
    return chart;
  }

  private async start(): Promise<void> {
    this.symbols = await this.datafeed.getSymbols();
    if (!this.symbols.length) throw new Error('openchartscandle: datafeed.getSymbols() returned no symbols');
    const initial = this.symbols.find((x) => x.symbol === this.state.symbol) ?? this.symbols[0];
    for (const ind of this.state.indicators) {
      const i = this.builtinAllowed(ind.type) ? createIndicator(ind.type, ind.params) : null;
      if (!i) continue; // e.g. a type that no longer exists in a saved state
      i.visible = ind.visible;
      i.visibility = ind.visibility ?? null;
      this.chart.addIndicator(i);
    }
    if (this.opts.simulationIndicators && !this.sim.length) this.setSimulationIndicators(this.opts.simulationIndicators);
    this.buildWatchlistRows();
    this.syncLeftToolbar();
    this.syncUndo();
    await this.load(initial);

    if (this.opts.watchlist !== false && this.datafeed.subscribeQuotes) {
      this.unsubQuotes = this.datafeed.subscribeQuotes(this.watchlistSymbols().map((x) => x.symbol), (q) => {
        this.quotes.set(q.symbol, q);
        this.updateWatchRow(q);
        if (q.symbol === this.chart.symbol.symbol) this.renderDetails();
      });
    }
    if (this.opts.bottomBar) {
      this.updateClock();
      this.timers.push(window.setInterval(() => this.updateClock(), 1000));
    }
  }

  private emitError(err: unknown): void {
    if (this.error.size) this.error.emit(err);
    else console.error('openchartscandle: failed to load bars', err);
  }

  /**
   * Load (or reload) a symbol with the current timeframe. `time` keeps that instant in the view
   * (timeframe change); otherwise the chart opens on the latest bars.
   */
  private async load(info: SymbolInfo, time?: number): Promise<void> {
    const token = ++this.loadToken;
    this.unsubBars?.();
    this.unsubBars = null;
    if (this.chart.symbol.symbol !== info.symbol) {
      this.chart.setSymbol(info);
      this.symbolChanged.emit(info);
    }
    this.fitTimeframe(info);
    this.syncTopbar();
    this.updateWatchActive();
    const sym = info.symbol;
    const tf = this.tf;
    if (this.firstLoad) {
      this.firstLoad = false;
      time ??= this.opts.initialTime;
    }
    // indicators with their own timeframe get their bars from the same datafeed
    this.chart.setTimeframeFeed({
      getBars: (t, req) => this.datafeed.getBars(sym, t, req),
      subscribeBars: (t, onBar) => this.datafeed.subscribeBars(sym, t, onBar),
    });
    // the request carries `to` / `countBack` / `signal`; an old-style datafeed ignores it and returns everything
    const source: HistorySource = (req) => this.datafeed.getBars(sym, tf, req);
    const ok = await this.chart.setDataSource(source, tf.seconds, { time, countBack: this.opts.countBack });
    if (token !== this.loadToken) return;
    if (ok) {
      this.unsubBars = this.datafeed.subscribeBars(
        sym,
        tf,
        (bar) => {
          if (token === this.loadToken) this.chart.update(bar);
        },
        () => {
          if (token === this.loadToken) this.chart.resync();
        },
      );
    }
    this.legend?.rebuild();
    this.renderDetails();
  }

  /** Load the current symbol and timeframe again (e.g. after an `error`), keeping the instant in view. */
  reload(): Promise<void> {
    return this.load(this.chart.symbol, this.keepTime());
  }

  /** Instant to keep when the bars are replaced: the center of the view, unless it is on the latest bars. */
  private keepTime(): number | undefined {
    return this.chart.bars.length && this.chart.isScrolledBack() ? this.chart.centerTime() : undefined;
  }

  /** The symbol's own timeframes may not include the current one: take the closest. */
  private fitTimeframe(info: SymbolInfo): void {
    const list = this.selectableTimeframes(info);
    if (!list.length || list.some((t) => t.id === this.tf.id)) return;
    const s = this.tf.seconds;
    const best = list.reduce((a, b) => (Math.abs(b.seconds - s) < Math.abs(a.seconds - s) ? b : a));
    this.tf = best;
    this.state.tf = best.id;
    this.save();
    this.timeframeChanged.emit(best);
  }

  // ---------- indicators ----------

  private builtinAllowed(type: string): boolean {
    const p = this.opts.indicatorPicker;
    return !Array.isArray(p) || p.includes(type);
  }

  private openIndicators(): void {
    const choices = INDICATORS.filter((e) => this.builtinAllowed(e.type)).map((e) => ({ id: e.type, name: e.name, description: e.description }));
    const sim = this.sim.length
      ? {
          title: this.opts.simulationTitle ?? 'Da simulação',
          items: () => this.sim.map((x) => ({ id: x.def.id, name: x.def.label ?? x.ind.name, description: x.ind.title(), on: this.chart.indicators.includes(x.ind) })),
          onToggle: (id: string, on: boolean) => this.showSimulationIndicator(id, on),
        }
      : undefined;
    indicatorsDialog(
      choices,
      (c) => {
        const ind = createIndicator(c.id);
        if (ind) this.chart.addIndicator(ind);
        this.save();
      },
      sim,
    );
  }

  // ---------- simulation indicators ----------

  private sim: { def: SimulationIndicator; ind: Indicator }[] = [];

  /**
   * The indicators of a simulation, with its settings. They replace the previous simulation's; an indicator
   * with the same `id`, type and params keeps its place, visibility and any change made in its settings.
   * Returns the problems found (unknown type or keys, wrong values), also written to the console: an
   * indicator with an unknown type is left out, wrong keys are ignored and the rest is used.
   */
  setSimulationIndicators(list: SimulationIndicator[]): string[] {
    const problems: string[] = [];
    const old = new Map(this.sim.map((x) => [x.def.id, x]));
    const next: { def: SimulationIndicator; ind: Indicator }[] = [];
    const seen = new Set<string>();
    list.forEach((def, n) => {
      const where = `simulationIndicators[${n}]${def?.id ? ` (${def.id})` : ''}`;
      if (!def || typeof def.id !== 'string' || !def.id) {
        problems.push(`${where}: falta o 'id' (um texto único)`);
        return;
      }
      if (seen.has(def.id)) {
        problems.push(`${where}: o id '${def.id}' está repetido`);
        return;
      }
      seen.add(def.id);
      const issues = checkIndicatorParams(def.type, def.params ?? {});
      problems.push(...issues.map((m) => `${where}: ${m}`));
      const prev = old.get(def.id);
      if (prev && prev.def.type === def.type && JSON.stringify(prev.def.params ?? {}) === JSON.stringify(def.params ?? {})) {
        old.delete(def.id);
        next.push({ def, ind: prev.ind });
        return;
      }
      // keys that are not right are left out, so they don't end up in the settings
      const params = Object.fromEntries(Object.entries(def.params ?? {}).filter(([k]) => !issues.some((m) => m.startsWith(`'${k}'`))));
      const ind = createIndicator(def.type, params);
      if (!ind) return;
      ind.origin = def.id;
      if (def.visible !== false) this.chart.addIndicator(ind);
      next.push({ def, ind });
    });
    for (const x of old.values()) if (this.chart.indicators.includes(x.ind)) this.chart.removeIndicator(x.ind);
    this.sim = next;
    this.legend?.rebuild();
    if (problems.length) console.warn('openchartscandle: simulationIndicators\n- ' + problems.join('\n- '));
    return problems;
  }

  /** The simulation's indicators, with their current settings and whether each is on the chart. */
  getSimulationIndicators(): { id: string; type: string; label: string; params: Params; shown: boolean }[] {
    return this.sim.map((x) => ({ id: x.def.id, type: x.def.type, label: x.def.label ?? x.ind.name, params: { ...x.ind.params }, shown: this.chart.indicators.includes(x.ind) }));
  }

  /** Put a simulation indicator on the chart or take it off (its settings are kept for when it comes back). */
  showSimulationIndicator(id: string, on: boolean): void {
    const x = this.sim.find((s) => s.def.id === id);
    if (!x) return;
    const shown = this.chart.indicators.includes(x.ind);
    if (on && !shown) this.chart.addIndicator(x.ind);
    else if (!on && shown) this.chart.removeIndicator(x.ind);
    this.legend?.rebuild();
  }

  private removeIndicator(ind: Indicator): void {
    this.chart.removeIndicator(ind);
    this.save();
  }

  /** Change colors of the chart and the interface at runtime. */
  applyTheme(patch: Partial<Theme>): void {
    this.chart.applyTheme(patch);
    this.applyCssTheme(this.chart.theme);
    this.tradeList?.applyTheme();
  }

  private cssVars = '';

  private applyCssTheme(t: Theme): void {
    const vars: Record<string, string> = {
      '--tc-bg': t.bg,
      '--tc-app-bg': t.appBg,
      '--tc-border': t.border,
      '--tc-text': t.text,
      '--tc-text-strong': t.textStrong,
      '--tc-muted': t.muted,
      '--tc-accent': t.accent,
      '--tc-up': t.up,
      '--tc-down': t.down,
    };
    this.cssVars = Object.entries(vars).map(([k, v]) => `${k}:${v};`).join('');
    for (const [k, v] of Object.entries(vars)) this.root.style.setProperty(k, v);
  }

  private openSymbolSearch(): void {
    symbolSearch(this.symbols, (x) => this.setSymbol(x.symbol));
  }

  // ======================= topbar =======================

  private chartTypeList(): { id: ChartType; label: string }[] {
    const c = this.opts.chartTypes;
    return Array.isArray(c) ? CHART_TYPES.filter((t) => c.includes(t.id)) : CHART_TYPES;
  }

  private buildTopbar(): HTMLElement {
    const o = this.opts;
    const groups: (HTMLElement | null)[][] = [];
    const btn = (iconName: string, tip: string, onclick: () => void, hotkey?: string): HTMLElement => {
      const b = h('button', { class: 'tc-tb-btn tc-tb-btn--icon', html: icon(iconName), onclick });
      tooltip(b, tip, hotkey);
      return b;
    };

    if (o.symbolSearch) {
      const sym = h('button', { class: 'tc-tb-btn tc-tb-symbol', onclick: () => this.openSymbolSearch() }, h('span', { class: 'tc-tb-symbol__icon', html: icon('search') }), h('span', { class: 'tc-tb-symbol__name' }));
      this.els.symbol = sym;
      tooltip(sym, 'Pesquisa de símbolo');
      groups.push([sym]);
    }
    if (o.timeframeSelector !== false) {
      const tfs = h('div', { class: 'tc-tb-group tc-tb-tfs' });
      this.els.tfs = tfs;
      const tfMore = h('button', { class: 'tc-tb-btn tc-tb-btn--icon tc-tb-caret', html: icon('chevronDown') });
      tfMore.addEventListener('click', () => this.showTimeframeMenu(tfMore));
      tooltip(tfMore, 'Intervalo de tempo');
      groups.push([tfs, this.selectableTimeframes().length > 1 ? tfMore : null]);
    }
    if (o.chartTypes !== false && this.chartTypeList().length > 1) {
      const ctype = h('button', { class: 'tc-tb-btn tc-tb-btn--icon' });
      ctype.addEventListener('click', () =>
        showPopover(
          menu(this.chartTypeList().map((t) => ({ label: t.label, icon: icon(t.id), active: this.chart.chartType === t.id, action: () => this.setChartType(t.id) }))),
          ctype,
        ),
      );
      tooltip(ctype, 'Tipo de gráfico');
      this.els.ctype = ctype;
      groups.push([ctype]);
    }
    if (o.indicatorPicker !== false) {
      groups.push([h('button', { class: 'tc-tb-btn tc-tb-btn--text', onclick: () => this.openIndicators() }, h('span', { html: icon('indicators') }), h('span', {}, 'Indicadores'))]);
    }
    if (o.undoRedo) {
      this.els.undo = btn('undo', 'Desfazer', () => this.chart.drawings.undo(), 'Ctrl + Z');
      this.els.redo = btn('redo', 'Refazer', () => this.chart.drawings.redo(), 'Ctrl + Y');
      groups.push([this.els.undo, this.els.redo]);
    }
    const left: HTMLElement[] = [];
    groups.forEach((g, i) => {
      if (i > 0) left.push(h('div', { class: 'tc-tb-sep' }));
      for (const el of g) if (el) left.push(el);
    });
    return h(
      'header',
      { class: 'tc-topbar' },
      h('div', { class: 'tc-topbar__logo', html: icon('logo') }),
      ...left,
      h('div', { class: 'tc-tb-spacer' }),
      o.brand ? h('div', { class: 'tc-tb-brand' }, o.brand) : null,
      o.screenshot ? btn('camera', 'Captura de ecrã', () => this.screenshot()) : null,
      o.fullscreen
        ? btn('fullscreen', 'Ecrã inteiro', () => (document.fullscreenElement ? document.exitFullscreen() : this.root.requestFullscreen()))
        : null,
      o.watchlist !== false ? btn('watchlist', 'Lista de observação', () => this.toggleWatchlist()) : null,
    );
  }

  /** Timeframes offered by the selector: the symbol's own list, or `timeframes` (respects `timeframeSelector: string[]`). */
  private selectableTimeframes(info: SymbolInfo | undefined = this.currentSymbolInfo()): Timeframe[] {
    const own = info?.timeframes?.map(parseTimeframe).filter((t): t is Timeframe => !!t);
    const base = own?.length ? own : this.timeframes;
    const sel = this.opts.timeframeSelector;
    if (!Array.isArray(sel)) return base;
    const ids = sel.map((x) => parseTimeframe(x)?.id ?? x);
    const picked = base.filter((t) => ids.includes(t.id));
    return picked.length ? picked : base;
  }

  private currentSymbolInfo(): SymbolInfo | undefined {
    const sym = this.chart?.symbol.symbol;
    return sym ? this.symbols.find((x) => x.symbol === sym) : undefined;
  }

  /** Small timeframe selector over the chart when there is no top bar. */
  private syncTfFloat(): void {
    const box = this.els.tfFloat;
    if (!box) return;
    box.innerHTML = '';
    const list = this.selectableTimeframes();
    if (list.length < 2) {
      box.style.display = 'none';
      return;
    }
    box.style.display = '';
    if (list.length <= 6) {
      for (const t of list) {
        const b = h('button', { class: `tc-tf-float__btn${t.id === this.tf.id ? ' is-active' : ''}`, onclick: () => void this.setTimeframe(t) }, t.short);
        tooltip(b, t.label);
        box.append(b);
      }
      return;
    }
    const b = h('button', { class: 'tc-tf-float__btn is-active' }, h('span', {}, this.tf.short), h('span', { class: 'tc-tf-float__caret', html: icon('chevronDown') }));
    b.addEventListener('click', () =>
      showPopover(menu(list.map((t) => ({ label: t.label, active: t.id === this.tf.id, action: () => void this.setTimeframe(t) }))), b),
    );
    tooltip(b, 'Intervalo de tempo');
    box.append(b);
  }

  private syncTopbar(): void {
    this.syncTfFloat();
    const info = this.chart.symbol;
    const name = this.els.symbol?.querySelector('.tc-tb-symbol__name');
    if (name) name.textContent = info.symbol;
    if (this.els.ctype) this.els.ctype.innerHTML = icon(this.chart.chartType);
    const tfs = this.els.tfs;
    if (!tfs) return;
    tfs.innerHTML = '';
    const restricted = Array.isArray(this.opts.timeframeSelector);
    const favs = this.selectableTimeframes().filter((t) => restricted || this.state.favorites.includes(t.id) || t.id === this.tf.id);
    for (const t of favs) {
      const b = h('button', { class: `tc-tb-btn tc-tb-tf${t.id === this.tf.id ? ' is-active' : ''}`, onclick: () => this.setTimeframe(t) }, t.short);
      tooltip(b, t.label);
      tfs.append(b);
    }
    this.els.ctype.innerHTML = icon(this.chart.chartType);
  }

  private showTimeframeMenu(anchor: HTMLElement): void {
    const box = h('div', { class: 'tc-menu tc-tf-menu' });
    box.append(h('div', { class: 'tc-menu__title' }, 'Intervalos'));
    for (const t of this.selectableTimeframes()) {
      const fav = this.state.favorites.includes(t.id);
      const star = h('span', { class: `tc-tf-star${fav ? ' is-fav' : ''}`, text: '★' });
      star.addEventListener('click', (e) => {
        e.stopPropagation();
        this.state.favorites = fav ? this.state.favorites.filter((x) => x !== t.id) : [...this.state.favorites, t.id];
        this.save();
        this.syncTopbar();
        closePopover();
        this.showTimeframeMenu(anchor);
      });
      box.append(
        h(
          'button',
          { class: `tc-menu__item${t.id === this.tf.id ? ' is-active' : ''}`, onclick: () => { closePopover(); this.setTimeframe(t); } },
          h('span', { class: 'tc-menu__label' }, t.label),
          star,
        ),
      );
    }
    showPopover(box, anchor);
  }

  // ======================= left toolbar =======================

  private buildLeftToolbar(): HTMLElement {
    const bar = h('aside', { class: 'tc-left-toolbar' });
    this.els.left = bar;
    // cursor group
    bar.append(this.groupButton('cursor'));
    const allowed = this.opts.drawingTools;
    this.toolGroups = TOOL_GROUPS.map((g) => ({ ...g, tools: Array.isArray(allowed) ? g.tools.filter((t) => allowed.includes(t.id)) : g.tools })).filter(
      (g) => g.tools.length > 0 && allowed !== false,
    );
    for (const g of this.toolGroups) bar.append(this.groupButton(g.id));
    bar.append(h('div', { class: 'tc-lt-sep' }));

    const zoomIn = h('button', { class: 'tc-lt-btn', html: icon('zoomIn'), onclick: () => this.chart.zoomStep(1) });
    tooltip(zoomIn, 'Ampliar');
    bar.append(zoomIn);

    const magnet = h('div', { class: 'tc-lt-item' });
    const magnetBtn = h('button', { class: 'tc-lt-btn', onclick: () => this.setMagnet(this.chart.drawings.magnet === 'off' ? 'weak' : 'off') });
    const magnetArrow = h('button', { class: 'tc-lt-arrow', html: icon('chevronRight') });
    magnetArrow.addEventListener('click', () =>
      showPopover(
        menu([
          { label: 'Íman fraco', icon: icon('magnet'), active: this.chart.drawings.magnet === 'weak', action: () => this.setMagnet('weak') },
          { label: 'Íman forte', icon: icon('magnetStrong'), active: this.chart.drawings.magnet === 'strong', action: () => this.setMagnet('strong') },
        ]),
        magnetArrow,
        { side: 'right' },
      ),
    );
    tooltip(magnetBtn, 'Modo íman: ajusta os pontos ao OHLC');
    magnet.append(magnetBtn, magnetArrow);
    this.els.magnet = magnetBtn;
    bar.append(magnet);

    const stay = h('button', {
      class: 'tc-lt-btn',
      html: icon('stayDrawing'),
      onclick: () => {
        this.state.stay = !this.state.stay;
        this.chart.drawings.stayInDrawMode = this.state.stay;
        this.save();
        this.syncLeftToolbar();
      },
    });
    tooltip(stay, 'Manter o modo de desenho');
    this.els.stay = stay;
    const lock = h('button', {
      class: 'tc-lt-btn',
      onclick: () => {
        const dm = this.chart.drawings;
        dm.lockAll = !dm.lockAll;
        this.syncLeftToolbar();
        this.chart.requestRender();
      },
    });
    tooltip(lock, 'Bloquear todos os desenhos');
    this.els.lock = lock;
    const hide = h('button', {
      class: 'tc-lt-btn',
      onclick: () => {
        const dm = this.chart.drawings;
        dm.hideAll = !dm.hideAll;
        dm.select(null);
        this.syncLeftToolbar();
        this.chart.requestRender();
      },
    });
    tooltip(hide, 'Ocultar todos os desenhos');
    this.els.hide = hide;
    const del = h('button', { class: 'tc-lt-btn', html: icon('trash') });
    del.addEventListener('click', () =>
      showPopover(
        menu([
          { label: `Remover ${this.chart.drawings.drawings.length} desenho(s)`, icon: icon('trash'), action: () => this.chart.drawings.clearAll() },
          { label: `Remover ${this.chart.indicators.length} indicador(es)`, icon: icon('indicators'), action: () => this.removeAllIndicators() },
          { separator: true, label: '' },
          { label: 'Remover desenhos e indicadores', danger: true, action: () => { this.chart.drawings.clearAll(); this.removeAllIndicators(); } },
        ]),
        del,
        { side: 'right' },
      ),
    );
    tooltip(del, 'Remover objetos');
    bar.append(stay, lock, hide, h('div', { class: 'tc-lt-sep' }), del);
    return bar;
  }

  private groupButton(groupId: string): HTMLElement {
    const item = h('div', { class: 'tc-lt-item', 'data-group': groupId });
    const btn = h('button', { class: 'tc-lt-btn' });
    const arrow = h('button', { class: 'tc-lt-arrow', html: icon('chevronRight') });
    btn.addEventListener('click', () => {
      if (groupId === 'cursor') {
        this.chart.drawings.setTool(null);
        this.syncLeftToolbar();
        return;
      }
      const toolId = this.currentGroupTool(groupId);
      const dm = this.chart.drawings;
      dm.setTool(dm.tool === toolId ? null : toolId);
    });
    arrow.addEventListener('click', () => {
      let items: MenuItem[];
      if (groupId === 'cursor') {
        items = CURSORS.map((c) => ({
          label: c.label,
          icon: icon(c.icon),
          active: this.chart.cursorMode === c.id,
          action: () => {
            this.chart.cursorMode = c.id;
            this.chart.drawings.setTool(null);
            this.syncLeftToolbar();
          },
        }));
      } else {
        const g = this.toolGroups.find((x) => x.id === groupId)!;
        items = g.tools.map((t) => ({
          label: t.title,
          icon: icon(t.icon),
          hotkey: t.hotkey,
          active: this.chart.drawings.tool === t.id,
          action: () => {
            this.state.groupTools[groupId] = t.id;
            this.save();
            this.chart.drawings.setTool(t.id);
          },
        }));
      }
      showPopover(menu(items), arrow, { side: 'right', className: 'tc-popover--tools' });
    });
    item.append(btn, arrow);
    const g = this.toolGroups.find((x) => x.id === groupId);
    tooltip(btn, groupId === 'cursor' ? 'Cursor' : g?.title ?? '');
    return item;
  }

  private toolAllowed(id: string): boolean {
    return this.toolGroups.some((g) => g.tools.some((t) => t.id === id));
  }

  private currentGroupTool(groupId: string): string {
    const g = this.toolGroups.find((x) => x.id === groupId)!;
    const saved = this.state.groupTools[groupId];
    return g.tools.some((t) => t.id === saved) ? saved : g.tools[0].id;
  }

  private syncLeftToolbar(): void {
    if (!this.els.left) return;
    const dm = this.chart.drawings;
    this.els.left.querySelectorAll<HTMLElement>('.tc-lt-item[data-group]').forEach((item) => {
      const gid = item.dataset.group!;
      const btn = item.querySelector('.tc-lt-btn') as HTMLElement;
      if (gid === 'cursor') {
        const c = CURSORS.find((x) => x.id === this.chart.cursorMode)!;
        btn.innerHTML = icon(c.icon);
        btn.classList.toggle('is-active', !dm.tool);
        return;
      }
      const g = this.toolGroups.find((x) => x.id === gid)!;
      const activeInGroup = g.tools.find((t) => t.id === dm.tool);
      if (activeInGroup) this.state.groupTools[gid] = activeInGroup.id;
      const t = toolById(this.currentGroupTool(gid))!;
      btn.innerHTML = icon(t.icon);
      btn.classList.toggle('is-active', !!activeInGroup);
    });
    const m = dm.magnet;
    this.els.magnet.innerHTML = icon(m === 'strong' ? 'magnetStrong' : 'magnet');
    this.els.magnet.classList.toggle('is-active', m !== 'off');
    this.els.stay.classList.toggle('is-active', dm.stayInDrawMode);
    this.els.lock.innerHTML = icon(dm.lockAll ? 'lock' : 'unlock');
    this.els.lock.classList.toggle('is-active', dm.lockAll);
    this.els.hide.innerHTML = icon(dm.hideAll ? 'eyeOff' : 'eye');
    this.els.hide.classList.toggle('is-active', dm.hideAll);
  }

  private setMagnet(m: MagnetMode): void {
    this.chart.drawings.magnet = m;
    this.state.magnet = m;
    this.save();
    this.syncLeftToolbar();
  }

  // ======================= bottom bar =======================

  private buildBottomBar(): HTMLElement {
    const ranges: { label: string; tf: string; bars: number | 'ytd' | 'all'; tip: string }[] = [
      { label: '1D', tf: '1', bars: 1440, tip: '1 dia em intervalos de 1 minuto' },
      { label: '5D', tf: '5', bars: 1440, tip: '5 dias em intervalos de 5 minutos' },
      { label: '1M', tf: '30', bars: 1440, tip: '1 mês em intervalos de 30 minutos' },
      { label: '3M', tf: '60', bars: 2160, tip: '3 meses em intervalos de 1 hora' },
      { label: 'YTD', tf: '1D', bars: 'ytd', tip: 'Desde o início do ano' },
      { label: 'Tudo', tf: '1D', bars: 'all', tip: 'Todo o histórico' },
    ];
    const left = h('div', { class: 'tc-bb-group' });
    const selectable = this.selectableTimeframes();
    for (const r of this.opts.rangeButtons ? ranges.filter((x) => selectable.some((t) => t.id === x.tf)) : []) {
      const b = h('button', {
        class: 'tc-bb-btn',
        onclick: async () => {
          await this.setTimeframe(r.tf);
          const tz = this.chart.timeZone;
          const jan1 = zonedTime(tz, tz.wall(Date.now() / 1000).getUTCFullYear(), 0, 1);
          if (r.bars === 'ytd') await this.chart.ensureHistory(jan1);
          else if (r.bars === 'all') {
            // load every block (daily bars: a few requests)
            for (let i = 0; i < 50 && !this.chart.history.noMoreBack; i++) if ((await this.chart.history.loadBack()) < 0) break;
          } else await this.chart.ensureHistory(this.chart.bars[this.chart.bars.length - 1]?.time - r.bars * this.tf.seconds);
          const n = this.chart.data.length;
          let count: number;
          if (r.bars === 'all') count = n;
          else if (r.bars === 'ytd') count = n - Math.max(0, this.chart.data.indexAt(jan1));
          else count = r.bars;
          this.chart.showLastBars(Math.min(n, count));
        },
      }, r.label);
      tooltip(b, r.tip);
      left.append(b);
    }
    const clock = h('button', { class: 'tc-bb-btn tc-bb-clock', onclick: () => this.openTimezoneMenu() });
    tooltip(clock, 'Fuso horário');
    this.els.clock = clock;
    const mk = (label: string, tip: string, fn: () => void): HTMLElement => {
      const b = h('button', { class: 'tc-bb-btn tc-bb-toggle', onclick: fn }, label);
      tooltip(b, tip);
      return b;
    };
    this.els.pct = mk('%', 'Escala de percentagem', () => this.chart.setPercent(!this.chart.percentMode));
    this.els.log = mk('log', 'Escala logarítmica', () => this.chart.setLog(!this.chart.mainPane.ps.log));
    this.els.auto = mk('auto', 'Escala automática', () => this.chart.setAutoScale(!this.chart.mainPane.ps.auto));
    return h('footer', { class: 'tc-bottombar' }, left, h('div', { class: 'tc-tb-spacer' }), clock, h('div', { class: 'tc-bb-sep' }), this.els.pct, this.els.log, this.els.auto);
  }

  private syncBottomToggles(): void {
    if (!this.chart || !this.els.pct) return;
    const ps = this.chart.mainPane.ps;
    this.els.pct.classList.toggle('is-active', this.chart.percentMode);
    this.els.log.classList.toggle('is-active', ps.log);
    this.els.auto.classList.toggle('is-active', ps.auto);
  }

  private updateClock(): void {
    const tz = this.chart.timeZone;
    const now = Date.now() / 1000;
    const d = tz.wall(now);
    const name = this.chart.timezone === 'local' ? '' : `${this.chart.timezone === 'exchange' ? tz.id : this.chart.timezone} `;
    this.els.clock.textContent = `${pad2(d.getUTCHours())}:${pad2(d.getUTCMinutes())}:${pad2(d.getUTCSeconds())} (${name}${tz.label(now)})`;
  }

  private openTimezoneMenu(): void {
    const list = [...this.opts.timezones];
    const cur = this.chart.timezone;
    if (!list.some((z) => z.id === cur)) list.push({ id: cur, label: cur });
    const now = Date.now() / 1000;
    const items: MenuItem[] = list
      .filter((z) => this.validZone(z.id))
      .map((z) => {
        const off = z.id === 'exchange' ? this.chart.symbol.timezone || 'UTC' : z.id;
        let label = z.label;
        try {
          const zone = new TimeZone(off);
          label = `${z.label}  (${z.id === 'exchange' && off !== 'UTC' ? `${off} ` : ''}${zone.label(now)})`;
        } catch {
          /* listed but unknown: keep the plain label */
        }
        return { label, active: z.id === cur, action: () => this.setTimezone(z.id) };
      });
    showPopover(menu(items), this.els.clock, { side: 'top' });
  }

  private validZone(id: string): boolean {
    try {
      checkTimeZone(id);
      return true;
    } catch {
      return false;
    }
  }

  /** Time zone of the axis, the crosshair and the clock ('local', 'UTC', 'Europe/Lisbon', 'exchange'…). Throws a RangeError for an unknown name. */
  setTimezone(tz: TimeZoneId): void {
    this.chart.setTimezone(tz);
  }

  /** The chosen time zone. */
  get timezone(): TimeZoneId {
    return this.chart.timezone;
  }

  // ======================= right panel =======================

  private buildRightPanel(): HTMLElement {
    const list = h('div', { class: 'tc-wl-list' });
    this.els.wlList = list;
    const details = h('div', { class: 'tc-details' });
    this.els.details = details;
    const panel = h(
      'aside',
      { class: `tc-right-panel${this.state.showWatchlist ? '' : ' is-hidden'}` },
      h('div', { class: 'tc-rp-header' }, h('span', { class: 'tc-rp-title' }, 'Lista de observação')),
      h('div', { class: 'tc-wl-head' }, h('span', {}, 'Símbolo'), h('span', {}, 'Último'), h('span', {}, 'Var'), h('span', {}, 'Var%')),
      list,
      details,
    );
    this.els.right = panel;
    return panel;
  }

  private watchlistSymbols(): SymbolInfo[] {
    const w = this.opts.watchlist;
    if (Array.isArray(w)) return w.map((sym) => this.symbols.find((x) => x.symbol === sym)).filter((x): x is SymbolInfo => !!x);
    return this.symbols;
  }

  private buildWatchlistRows(): void {
    const list = this.els.wlList;
    if (!list) return;
    list.innerHTML = '';
    this.watchRows.clear();
    for (const sym of this.watchlistSymbols()) {
      const last = h('span', { class: 'tc-wl-num' }, '—');
      const chg = h('span', { class: 'tc-wl-num' }, '');
      const pct = h('span', { class: 'tc-wl-num' }, '');
      const row = h(
        'button',
        { class: 'tc-wl-row', onclick: () => this.setSymbol(sym.symbol) },
        h('span', { class: 'tc-wl-sym' }, h('span', { class: 'tc-sym-badge', 'data-type': sym.type ?? '' }, sym.symbol.slice(0, 1)), sym.symbol),
        last,
        chg,
        pct,
      );
      this.watchRows.set(sym.symbol, { row, last, chg, pct, prev: NaN });
      list.append(row);
    }
  }

  private toggleWatchlist(): void {
    if (!this.els.right) return;
    this.state.showWatchlist = !this.state.showWatchlist;
    this.els.right.classList.toggle('is-hidden', !this.state.showWatchlist);
    this.save();
  }

  private updateWatchActive(): void {
    for (const [sym, r] of this.watchRows) r.row.classList.toggle('is-active', this.chart.symbol.symbol === sym);
  }

  private precisionOf(symbol: string): number {
    return this.symbols.find((x) => x.symbol === symbol)?.precision ?? 2;
  }

  private updateWatchRow(q: Quote): void {
    const r = this.watchRows.get(q.symbol);
    if (!r) return;
    const p = this.precisionOf(q.symbol);
    r.last.textContent = formatPrice(q.last, p);
    r.chg.textContent = (q.change >= 0 ? '' : '−') + formatPrice(Math.abs(q.change), p);
    r.pct.textContent = (q.changePct >= 0 ? '+' : '−') + Math.abs(q.changePct).toFixed(2) + '%';
    const col = q.change >= 0 ? 'is-up' : 'is-down';
    r.chg.className = `tc-wl-num ${col}`;
    r.pct.className = `tc-wl-num ${col}`;
    if (isFinite(r.prev) && r.prev !== q.last) {
      r.last.classList.remove('flash-up', 'flash-down');
      void r.last.offsetWidth;
      r.last.classList.add(q.last > r.prev ? 'flash-up' : 'flash-down');
    }
    r.prev = q.last;
  }

  /** Quote of the active symbol: from the datafeed, or derived from the last 24h of loaded bars. */
  private activeQuote(): Quote | null {
    const sym = this.chart.symbol.symbol;
    const bars = this.chart.bars;
    const last = bars[bars.length - 1];
    if (!last) return this.quotes.get(sym) ?? null;
    const q = this.quotes.get(sym);
    if (q) return { ...q, last: last.close };
    const from = last.time - 86400;
    let i = bars.length - 1;
    let high = -Infinity;
    let low = Infinity;
    let volume = 0;
    while (i >= 0 && bars[i].time > from) {
      high = Math.max(high, bars[i].high);
      low = Math.min(low, bars[i].low);
      volume += bars[i].volume;
      i--;
    }
    const open = bars[Math.max(0, i + 1)].open;
    const change = last.close - open;
    return { symbol: sym, last: last.close, change, changePct: (change / open) * 100, open, high, low, volume };
  }

  private renderDetails(): void {
    const el = this.els.details;
    if (!el) return;
    const info = this.chart.symbol;
    const q = this.activeQuote();
    el.innerHTML = '';
    if (!q) return;
    const p = info.precision;
    const up = q.change >= 0;
    const f = (x: number | undefined): string => (x === undefined || !isFinite(x) ? '—' : formatNumber(x, p));
    el.append(
      h(
        'div',
        { class: 'tc-details__head' },
        h('span', { class: 'tc-sym-badge tc-sym-badge--lg', 'data-type': info.type ?? '' }, info.symbol.slice(0, 1)),
        h('div', {}, h('div', { class: 'tc-details__sym' }, info.symbol), h('div', { class: 'tc-details__name' }, [info.name, info.exchange].filter(Boolean).join(' · '))),
      ),
      h(
        'div',
        { class: 'tc-details__price' },
        h('span', { class: 'tc-details__last' }, f(q.last)),
        info.currency ? h('span', { class: 'tc-details__ccy' }, info.currency) : null,
        h('span', { class: `tc-details__chg ${up ? 'is-up' : 'is-down'}` }, `${up ? '+' : '−'}${formatNumber(Math.abs(q.change), p)}  ${up ? '+' : '−'}${Math.abs(q.changePct).toFixed(2)}%`),
      ),
      h('div', { class: 'tc-details__status' }, h('span', { class: 'tc-dot-live' }), 'Em tempo real'),
      h(
        'div',
        { class: 'tc-details__stats' },
        stat('Máx. 24h', f(q.high)),
        stat('Mín. 24h', f(q.low)),
        stat('Abertura 24h', f(q.open)),
        stat('Volume 24h', q.volume === undefined ? '—' : formatVolume(q.volume)),
      ),
    );
    if (q.high !== undefined && q.low !== undefined) el.append(rangeBar(q.low, q.high, q.last));
  }

  // ======================= floating drawing toolbar =======================

  private renderFloating(d: Drawing | null): void {
    const el = this.floating;
    el.innerHTML = '';
    if (!d) {
      el.classList.remove('is-visible');
      return;
    }
    const dm = this.chart.drawings;
    el.classList.add('is-visible');
    const grip = h('div', { class: 'tc-ft-grip' });
    this.makeDraggable(grip);
    el.append(grip);
    const fields = d.settings().map((f) => f.key);
    const hasLine = fields.includes('color');
    const hasFill = fields.includes('fill') || fields.includes('fillEnabled');
    if (hasLine) {
      const b = h('button', { class: 'tc-ft-btn tc-ft-color' }, h('span', { html: icon('trendline') }), h('span', { class: 'tc-ft-color__bar', style: `background:${d.opts.color}` }));
      b.addEventListener('click', () => showPopover(colorPicker(d.opts.color, (c) => dm.updateOptions(d, { color: c })), b));
      tooltip(b, 'Cor da linha');
      el.append(b);
    }
    if (hasFill) {
      const b = h('button', { class: 'tc-ft-btn tc-ft-color' }, h('span', { html: icon('rect') }), h('span', { class: 'tc-ft-color__bar', style: `background:${d.opts.fill}` }));
      b.addEventListener('click', () => showPopover(colorPicker(d.opts.fill, (c) => dm.updateOptions(d, { fill: c, fillEnabled: true })), b));
      tooltip(b, 'Cor de fundo');
      el.append(b);
    }
    if (d.type === 'text') {
      const b = h('button', { class: 'tc-ft-btn tc-ft-color' }, h('span', { html: icon('text') }), h('span', { class: 'tc-ft-color__bar', style: `background:${d.opts.textColor}` }));
      b.addEventListener('click', () => showPopover(colorPicker(d.opts.textColor, (c) => dm.updateOptions(d, { textColor: c })), b));
      el.append(b);
    }
    if (fields.includes('width')) {
      const b = h('button', { class: 'tc-ft-btn tc-ft-width' }, h('span', { class: 'tc-ft-width__line', style: `height:${d.opts.width}px` }), h('span', {}, `${d.opts.width}px`));
      b.addEventListener('click', () =>
        showPopover(
          menu([1, 2, 3, 4].map((w) => ({ label: `${w}px`, active: d.opts.width === w, icon: `<span class="w-sample" style="height:${w}px"></span>`, action: () => dm.updateOptions(d, { width: w }) }))),
          b,
        ),
      );
      tooltip(b, 'Espessura');
      el.append(b);
    }
    if (fields.includes('dash')) {
      const labels: Record<LineDash, string> = { solid: '———', dashed: '- - -', dotted: '·····' };
      const b = h('button', { class: 'tc-ft-btn tc-ft-dash' }, labels[d.opts.dash]);
      b.addEventListener('click', () =>
        showPopover(
          menu((['solid', 'dashed', 'dotted'] as LineDash[]).map((s) => ({ label: labels[s], active: d.opts.dash === s, action: () => dm.updateOptions(d, { dash: s }) }))),
          b,
        ),
      );
      tooltip(b, 'Estilo');
      el.append(b);
    }
    const settings = h('button', { class: 'tc-ft-btn', html: icon('settings'), onclick: () => (d.type === 'text' ? editText(this.chart, d) : drawingSettings(this.chart, d)) });
    tooltip(settings, 'Definições');
    const lock = h('button', {
      class: `tc-ft-btn${d.locked ? ' is-active' : ''}`,
      html: icon(d.locked ? 'lock' : 'unlock'),
      onclick: () => {
        dm.checkpoint();
        d.locked = !d.locked;
        dm.commit();
      },
    });
    tooltip(lock, d.locked ? 'Desbloquear' : 'Bloquear');
    const del = h('button', { class: 'tc-ft-btn', html: icon('trash'), onclick: () => dm.remove(d) });
    tooltip(del, 'Remover', 'Del');
    const more = h('button', { class: 'tc-ft-btn', html: icon('more') });
    more.addEventListener('click', () => showPopover(menu(this.drawingMenuItems(d)), more));
    el.append(settings, lock, del, more);
    this.positionFloating();
  }

  private makeDraggable(grip: HTMLElement): void {
    grip.addEventListener('pointerdown', (e) => {
      e.preventDefault();
      const el = this.floating;
      const parent = el.parentElement!.getBoundingClientRect();
      const r = el.getBoundingClientRect();
      const ox = e.clientX - r.left;
      const oy = e.clientY - r.top;
      const move = (ev: PointerEvent): void => {
        const x = Math.max(0, Math.min(ev.clientX - parent.left - ox, parent.width - r.width));
        const y = Math.max(0, Math.min(ev.clientY - parent.top - oy, parent.height - r.height));
        this.state.toolbarPos = { x, y };
        el.style.left = `${x}px`;
        el.style.top = `${y}px`;
        el.style.transform = 'none';
      };
      const up = (): void => {
        window.removeEventListener('pointermove', move);
        window.removeEventListener('pointerup', up);
        this.save();
      };
      window.addEventListener('pointermove', move);
      window.addEventListener('pointerup', up);
    });
  }

  private positionFloating(): void {
    const el = this.floating;
    const pos = this.state.toolbarPos;
    if (pos) {
      el.style.left = `${pos.x}px`;
      el.style.top = `${pos.y}px`;
      el.style.transform = 'none';
    } else {
      el.style.left = '50%';
      el.style.top = '40px';
      el.style.transform = 'translateX(-50%)';
    }
  }

  private drawingMenuItems(d: Drawing): MenuItem[] {
    const dm = this.chart.drawings;
    return [
      { label: 'Definições…', icon: icon('settings'), action: () => (d.type === 'text' ? editText(this.chart, d) : drawingSettings(this.chart, d)) },
      { label: 'Clonar', icon: icon('copy'), hotkey: 'Ctrl + C/V', action: () => dm.clone(d) },
      { separator: true, label: '' },
      { label: 'Trazer para a frente', icon: icon('front'), action: () => dm.bringToFront(d) },
      { label: 'Enviar para trás', icon: icon('back'), action: () => dm.sendToBack(d) },
      { label: d.locked ? 'Desbloquear' : 'Bloquear', icon: icon(d.locked ? 'unlock' : 'lock'), action: () => { dm.checkpoint(); d.locked = !d.locked; dm.commit(); } },
      { label: 'Ocultar', icon: icon('eyeOff'), action: () => { dm.checkpoint(); d.hidden = true; dm.select(null); dm.commit(); } },
      { separator: true, label: '' },
      { label: 'Remover', icon: icon('trash'), hotkey: 'Del', danger: true, action: () => dm.remove(d) },
    ];
  }

  private showContextMenu(x: number, y: number, d: Drawing | null): void {
    let items: MenuItem[];
    if (d) items = this.drawingMenuItems(d);
    else {
      const dm = this.chart.drawings;
      items = [
        { label: 'Repor vista do gráfico', icon: icon('fullscreen'), hotkey: 'Alt + R', action: () => this.chart.resetView() },
        { separator: true, label: '' },
        { label: 'Adicionar indicador…', icon: icon('indicators'), action: () => this.openIndicators() },
        { label: 'Mostrar desenhos ocultos', icon: icon('eye'), action: () => { dm.checkpoint(); dm.drawings.forEach((x) => (x.hidden = false)); dm.hideAll = false; dm.commit(); this.syncLeftToolbar(); } },
        { separator: true, label: '' },
        { label: 'Remover todos os desenhos', icon: icon('trash'), danger: true, action: () => dm.clearAll() },
        { label: 'Remover todos os indicadores', icon: icon('trash'), danger: true, action: () => this.removeAllIndicators() },
      ];
    }
    showPopover(menu(items), { x, y });
  }

  // ======================= actions =======================

  /** Switch to another symbol of the datafeed. */
  async setSymbol(symbol: string): Promise<void> {
    if (this.chart.symbol.symbol === symbol) return;
    const info = this.symbols.find((x) => x.symbol === symbol);
    if (!info) throw new Error(`openchartscandle: unknown symbol "${symbol}"`);
    this.state.symbol = symbol;
    this.save();
    await this.load(info);
  }

  /**
   * Switch timeframe by id or name ("1", "5", "60", "1h", "4h", "1D"…). The instant in the center of the
   * chart stays in the center (March 2022 on 1h → March 2022 on 4h), loading the bars needed to get there.
   */
  async setTimeframe(t: Timeframe | string): Promise<void> {
    const tf = typeof t === 'string' ? (this.selectableTimeframes().find((x) => x.id === t) ?? parseTimeframe(t)) : t;
    if (!tf || tf.id === this.tf.id) return;
    const keep = this.keepTime();
    this.tf = tf;
    this.state.tf = tf.id;
    this.save();
    this.timeframeChanged.emit(tf);
    await this.load(this.chart.symbol, keep);
  }

  /** Currently selected timeframe. */
  get timeframe(): Timeframe {
    return this.tf;
  }

  private setChartType(t: ChartType): void {
    this.state.chartType = t;
    this.chart.setChartType(t);
    this.save();
    this.syncTopbar();
    this.legend?.update();
  }

  private removeAllIndicators(): void {
    for (const ind of [...this.chart.indicators]) this.removeIndicator(ind);
    this.save();
  }

  private syncUndo(): void {
    if (!this.els.undo) return;
    const dm = this.chart.drawings;
    this.els.undo.classList.toggle('is-disabled', !dm.canUndo());
    this.els.redo.classList.toggle('is-disabled', !dm.canRedo());
  }

  private screenshot(): void {
    const url = this.chart.screenshot();
    const a = document.createElement('a');
    const d = new Date();
    a.href = url;
    a.download = `${this.chart.symbol.symbol}_${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}_${pad2(d.getHours())}-${pad2(d.getMinutes())}.png`;
    a.click();
  }

  private onKey(e: KeyboardEvent): void {
    const t = e.target as HTMLElement;
    if (t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.tagName === 'SELECT' || t.isContentEditable)) return;
    if (document.querySelector('.tc-modal-backdrop')) return;
    const dm = this.chart.drawings;
    const ctrl = e.ctrlKey || e.metaKey;
    const key = e.key.toLowerCase();

    if (ctrl && key === 'z' && !e.shiftKey) {
      e.preventDefault();
      dm.undo();
      return;
    }
    if (ctrl && (key === 'y' || (key === 'z' && e.shiftKey))) {
      e.preventDefault();
      dm.redo();
      return;
    }
    if (ctrl && key === 'c') {
      dm.copySelected();
      return;
    }
    if (ctrl && key === 'v') {
      dm.paste(this.chart.mainView());
      return;
    }
    if (e.altKey && !ctrl) {
      const map: Record<string, string> = { t: 'trendline', h: 'hline', j: 'hray', v: 'vline', c: 'crossline', f: 'fib' };
      if (map[key] && this.toolAllowed(map[key])) {
        e.preventDefault();
        dm.setTool(map[key]);
        return;
      }
      if (key === 'r') {
        e.preventDefault();
        this.chart.resetView();
        return;
      }
    }
    switch (e.key) {
      case 'Delete':
      case 'Backspace':
        if (dm.selected) {
          e.preventDefault();
          dm.deleteSelected();
        }
        return;
      case 'Escape':
        closePopover();
        if (this.tfTypingEl) {
          this.cancelTfTyping();
          return;
        }
        if (dm.creating) dm.cancelCreation();
        else if (dm.tool) dm.setTool(null);
        else dm.select(null);
        return;
      case 'Enter':
        if (this.tfTypingEl) {
          this.applyTfTyping();
          return;
        }
        if (dm.creating) dm.finishCreation();
        return;
      case 'ArrowLeft':
        this.chart.scrollBars(e.shiftKey ? 10 : 1);
        return;
      case 'ArrowRight':
        this.chart.scrollBars(e.shiftKey ? -10 : -1);
        return;
      case 'ArrowUp':
        e.preventDefault();
        this.chart.zoomStep(1);
        return;
      case 'ArrowDown':
        e.preventDefault();
        this.chart.zoomStep(-1);
        return;
    }
    if (!ctrl && !e.altKey && /^[0-9dwhDWH]$/.test(e.key)) this.tfTypingKey(e.key);
  }

  /** TradingView-style: type "15" + Enter to switch interval, "4h", "D", "W". */
  private tfTypingKey(k: string): void {
    this.tfTyping += k.toUpperCase();
    if (!this.tfTypingEl) {
      this.tfTypingEl = h('div', { class: 'tc-tf-typing' });
      document.querySelector('.tc-chart-wrap')?.append(this.tfTypingEl);
    }
    this.tfTypingEl.innerHTML = '';
    this.tfTypingEl.append(h('div', { class: 'tc-tf-typing__label' }, 'Alterar intervalo'), h('div', { class: 'tc-tf-typing__value' }, this.tfTyping));
    clearTimeout(this.tfTypingTimer);
    this.tfTypingTimer = window.setTimeout(() => this.applyTfTyping(), 2200);
  }

  private applyTfTyping(): void {
    const s = this.tfTyping;
    this.cancelTfTyping();
    let id = s;
    const m = s.match(/^(\d+)H$/);
    if (m) id = String(Number(m[1]) * 60);
    if (s === 'D' || s === '1D') id = '1D';
    if (s === 'W' || s === '1W') id = '1W';
    const tf = this.selectableTimeframes().find((t) => t.id === id);
    if (tf) this.setTimeframe(tf);
  }

  private cancelTfTyping(): void {
    clearTimeout(this.tfTypingTimer);
    this.tfTyping = '';
    this.tfTypingEl?.remove();
    this.tfTypingEl = null;
  }
}

function stat(label: string, value: string): HTMLElement {
  return h('div', { class: 'tc-stat' }, h('span', { class: 'tc-stat__label' }, label), h('span', { class: 'tc-stat__value' }, value));
}

function rangeBar(lo: number, hi: number, last: number): HTMLElement {
  const pct = hi > lo ? ((last - lo) / (hi - lo)) * 100 : 50;
  return h(
    'div',
    { class: 'tc-range-bar' },
    h('div', { class: 'tc-range-bar__label' }, 'Intervalo 24h'),
    h('div', { class: 'tc-range-bar__track' }, h('div', { class: 'tc-range-bar__marker', style: `left:${pct}%` })),
  );
}
