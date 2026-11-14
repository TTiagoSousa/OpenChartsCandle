import type { Chart } from '../core/chart';
import type { Theme } from '../core/theme';
import { Trade, TradeDisplay, TradePoint, tradePnl, tradeStats } from '../core/trades';
import { formatPrice } from '../core/utils';
import { h } from './dom';

export interface TradeListOptions {
  /** Title of the panel. Default "Lista de trades". `null` hides the header title. */
  title?: string | null;
  /** Buttons Ambas / Entradas / Saídas and the "Linha" switch. Default true. */
  toggles?: boolean;
  /** Field to jump to a trade by id. Default true. */
  search?: boolean;
  /** Summary: trades, win rate, P&L. Default true. */
  stats?: boolean;
  /** The table of trades. `false` leaves only the header (a toolbar for the chart). Default true. */
  table?: boolean;
  /** What a click on a row does. Default 'entry'. The entry and exit cells always go to their point. */
  rowClick?: TradePoint | 'both';
  /** Newest trade at the top. Default true. */
  newestFirst?: boolean;
  /** The title collapses / expands the table. Default false. */
  collapsible?: boolean;
  /** Start collapsed (with `collapsible`). Default false. */
  collapsed?: boolean;
  /** Format of times. Default: like the crosshair label of the chart's timeframe. */
  formatTime?: (timeSeconds: number) => string;
  /** Format of prices. Default: the symbol's precision. */
  formatPrice?: (price: number) => string;
}

type Mode = 'both' | 'entries' | 'exits';

const toSec = (t: number): number => (t > 1e11 ? Math.floor(t / 1000) : t);
const pctText = (p: number): string => `${p >= 0 ? '+' : '−'}${Math.abs(p).toFixed(2)}%`;

/** CSS variables of a chart theme, so the list matches the chart it belongs to. */
function themeVars(t: Theme): Record<string, string> {
  return {
    '--tc-bg': t.bg,
    '--tc-border': t.border,
    '--tc-text': t.text,
    '--tc-text-strong': t.textStrong,
    '--tc-muted': t.muted,
    '--tc-accent': t.accent,
    '--tc-up': t.up,
    '--tc-down': t.down,
  };
}

/**
 * List of trades linked to a chart: show only entries, only exits or both (with or without the
 * line between them), jump to a trade by id, and click a row / entry / exit to scroll the chart to it.
 * Clicking a trade on the chart selects its row.
 */
export class TradeList {
  readonly el: HTMLElement;
  private opts: Required<Omit<TradeListOptions, 'formatTime' | 'formatPrice' | 'title'>> & Pick<TradeListOptions, 'formatTime' | 'formatPrice' | 'title'>;
  private body: HTMLElement | null = null;
  private statsEl: HTMLElement | null = null;
  private modeBtns = new Map<Mode, HTMLButtonElement>();
  private lineBtn: HTMLButtonElement | null = null;
  private rows = new Map<string, { row: HTMLElement; pnl: HTMLElement; trade: Trade }>();
  private offs: (() => void)[] = [];
  private lastBars = -1;

  constructor(
    container: HTMLElement,
    readonly chart: Chart,
    options: TradeListOptions = {},
  ) {
    this.opts = {
      toggles: true,
      search: true,
      stats: true,
      table: true,
      rowClick: 'entry',
      newestFirst: true,
      collapsible: false,
      collapsed: false,
      ...options,
      title: options.title === undefined ? 'Lista de trades' : options.title,
    };
    this.el = h('div', { class: 'tc-trades' });
    this.el.classList.toggle('tc-trades--bar', !this.opts.table);
    this.el.classList.toggle('is-collapsed', this.opts.collapsible && this.opts.collapsed);
    this.applyTheme();
    this.el.append(this.buildHeader());
    if (this.opts.table) {
      this.body = h('div', { class: 'tc-trades__body' });
      this.el.append(this.body);
    }
    container.append(this.el);
    this.syncToggles();
    this.render();

    this.offs.push(
      chart.tradesChanged.on(() => this.render()),
      chart.timezoneChanged.on(() => this.render()),
      chart.tradeDisplayChanged.on(() => this.syncToggles()),
      chart.tradeSelected.on((t) => this.markSelected(t?.id ?? null, true)),
      chart.dataUpdated.on(() => this.onData()),
    );
  }

  /** Re-read the chart theme (call after `chart.applyTheme`). */
  applyTheme(): void {
    for (const [k, v] of Object.entries(themeVars(this.chart.theme))) this.el.style.setProperty(k, v);
  }

  /** Remove the list and its listeners. */
  destroy(): void {
    this.offs.forEach((off) => off());
    this.el.remove();
  }

  // ---------------- header ----------------

  private buildHeader(): HTMLElement {
    const o = this.opts;
    const head = h('div', { class: 'tc-trades__head' });
    if (o.title !== null) {
      const title = h('div', { class: 'tc-trades__title' }, o.title ?? '');
      if (o.collapsible) {
        title.classList.add('is-toggle');
        title.prepend(h('span', { class: 'tc-trades__chevron' }, '▾'));
        title.addEventListener('click', () => this.el.classList.toggle('is-collapsed'));
      }
      head.append(title);
    }
    if (o.toggles) {
      const seg = h('div', { class: 'tc-trades__seg', role: 'group', 'aria-label': 'Mostrar trades' });
      const modes: [Mode, string][] = [
        ['both', 'Ambas'],
        ['entries', 'Entradas'],
        ['exits', 'Saídas'],
      ];
      for (const [mode, label] of modes) {
        const b = h('button', { class: 'tc-trades__seg-btn', type: 'button', onclick: () => this.setMode(mode) }, label);
        this.modeBtns.set(mode, b);
        seg.append(b);
      }
      this.lineBtn = h(
        'button',
        {
          class: 'tc-trades__switch',
          type: 'button',
          role: 'switch',
          title: 'Linha tracejada da entrada à saída',
          onclick: () => this.chart.setTradeDisplay({ lines: !this.chart.tradeDisplay.lines }),
        },
        h('span', { class: 'tc-trades__knob' }),
        'Linha',
      );
      head.append(seg, this.lineBtn);
    }
    if (o.search) {
      const input = h('input', { class: 'tc-trades__search', type: 'search', placeholder: 'Ir para id…', 'aria-label': 'Ir para o trade com este id' });
      const go = (point: TradePoint): void => {
        const id = input.value.trim().replace(/^#/, '');
        if (!id) return;
        const fail = (msg: string): void => {
          input.classList.add('is-error');
          input.title = msg;
        };
        if (!this.chart.trade(id)) return fail(`Não há trade com id "${id}"`);
        input.classList.remove('is-error');
        input.title = '';
        void this.chart.goToTrade(id, point).then((ok) => {
          if (!ok && this.chart.trade(id)) fail(`O trade "${id}" é anterior ao histórico disponível`);
        });
      };
      input.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') go(e.shiftKey ? 'exit' : 'entry');
        e.stopPropagation(); // don't trigger the terminal's shortcuts
      });
      input.addEventListener('input', () => input.classList.remove('is-error'));
      const wrap = h(
        'div',
        { class: 'tc-trades__find' },
        input,
        h('button', { class: 'tc-trades__go', type: 'button', title: 'Ir para a entrada (Enter)', onclick: () => go('entry') }, 'Entrada'),
        h('button', { class: 'tc-trades__go', type: 'button', title: 'Ir para a saída (Shift+Enter)', onclick: () => go('exit') }, 'Saída'),
      );
      head.append(wrap);
    }
    if (o.stats) {
      this.statsEl = h('div', { class: 'tc-trades__stats' });
      head.append(this.statsEl);
    }
    return head;
  }

  private setMode(mode: Mode): void {
    this.chart.setTradeDisplay({ entries: mode !== 'exits', exits: mode !== 'entries' });
  }

  private syncToggles(): void {
    const d: TradeDisplay = this.chart.tradeDisplay;
    const mode: Mode = d.entries && d.exits ? 'both' : d.entries ? 'entries' : d.exits ? 'exits' : 'both';
    for (const [m, b] of this.modeBtns) {
      const on = m === mode && (d.entries || d.exits);
      b.classList.toggle('is-on', on);
      b.setAttribute('aria-pressed', String(on));
    }
    if (this.lineBtn) {
      const usable = d.entries && d.exits;
      this.lineBtn.classList.toggle('is-on', d.lines && usable);
      this.lineBtn.setAttribute('aria-checked', String(d.lines && usable));
      this.lineBtn.disabled = !usable;
    }
  }

  // ---------------- table ----------------

  private fmtTime(t: number): string {
    return this.opts.formatTime ? this.opts.formatTime(toSec(t)) : this.chart.formatTime(toSec(t), true).replace('  ', ' ');
  }

  private fmtPrice(p: number): string {
    return this.opts.formatPrice ? this.opts.formatPrice(p) : formatPrice(p, this.chart.symbol.precision);
  }

  private lastPrice(): number {
    const bars = this.chart.bars;
    return bars.length ? bars[bars.length - 1].close : NaN;
  }

  private onData(): void {
    // a new bar can bring older trades into range; otherwise only open P&L changes
    const n = this.chart.bars.length;
    if (n !== this.lastBars) return this.render();
    const last = this.lastPrice();
    for (const { pnl, trade } of this.rows.values()) if (trade.exitPrice === undefined) this.fillPnl(pnl, trade, last);
    this.renderStats();
  }

  private fillPnl(el: HTMLElement, t: Trade, last: number): void {
    if (!isFinite(last)) {
      el.textContent = '—';
      return;
    }
    const r = tradePnl(t, last);
    el.textContent = '';
    el.append(h('b', {}, pctText(r.pct)), h('small', {}, `${r.abs >= 0 ? '+' : '−'}${this.fmtPrice(Math.abs(r.abs))}`));
    el.classList.toggle('is-up', r.abs >= 0);
    el.classList.toggle('is-down', r.abs < 0);
  }

  private renderStats(): void {
    if (!this.statsEl) return;
    const last = this.lastPrice();
    const s = tradeStats(this.chart.trades, isFinite(last) ? last : 0);
    this.statsEl.innerHTML = '';
    this.statsEl.append(
      h('span', {}, h('small', {}, 'Trades '), String(s.total)),
      h('span', {}, h('small', {}, 'Acerto '), `${s.winRate.toFixed(0)}%`),
      h('span', { class: s.pnlPct >= 0 ? 'is-up' : 'is-down' }, h('small', {}, 'P&L '), pctText(s.pnlPct)),
    );
  }

  /** Rebuild the table from `chart.trades`. Called automatically when trades or data change. */
  render(): void {
    this.lastBars = this.chart.bars.length;
    this.renderStats();
    const body = this.body;
    if (!body) return;
    const scroll = body.scrollTop;
    body.innerHTML = '';
    this.rows.clear();
    const trades = [...this.chart.trades];
    if (this.opts.newestFirst) trades.reverse();
    if (!trades.length) {
      body.append(h('div', { class: 'tc-trades__empty' }, 'Sem trades. Usa chart.setTrades([...]).'));
      return;
    }
    const last = this.lastPrice();
    const first = this.chart.bars[0]?.time ?? 0;
    const table = h('table', { class: 'tc-trades__table' });
    table.append(
      h('thead', {}, h('tr', {}, h('th', {}, 'Id'), h('th', {}, 'Tipo'), h('th', {}, 'Entrada'), h('th', {}, 'Saída'), h('th', { class: 'is-num' }, 'Qtd'), h('th', { class: 'is-num' }, 'P&L'))),
    );
    const tbody = h('tbody');
    for (const t of trades) {
      const id = t.id!;
      const open = t.exitPrice === undefined;
      // trades older than the loaded bars can't be scrolled to
      const away = toSec(t.entryTime) < first && (open || toSec(t.exitTime ?? 0) < first);
      const cell = (point: TradePoint, time: number, price: number): HTMLElement =>
        h(
          'button',
          {
            class: 'tc-trades__point',
            type: 'button',
            title: point === 'entry' ? 'Ir para a entrada' : 'Ir para a saída',
            onclick: (e: Event) => {
              e.stopPropagation();
              void this.chart.goToTrade(id, point);
            },
          },
          h('b', {}, this.fmtPrice(price)),
          h('small', {}, this.fmtTime(time)),
        );
      const pnl = h('td', { class: 'tc-trades__pnl is-num' });
      this.fillPnl(pnl, t, last);
      const row = h(
        'tr',
        {
          class: `tc-trades__row${away ? ' is-away' : ''}`,
          'data-id': id,
          title: away ? 'Fora das velas carregadas: carrega ao clicar' : '',
          onclick: () => void this.chart.goToTrade(id, this.opts.rowClick),
        },
        h('td', { class: 'tc-trades__id' }, `#${id}`),
        h('td', {}, h('span', { class: `tc-trades__side is-${t.side}` }, t.side === 'long' ? 'Long' : 'Short')),
        h('td', {}, cell('entry', t.entryTime, t.entryPrice)),
        h('td', {}, open ? h('span', { class: 'tc-trades__open' }, 'aberto') : cell('exit', t.exitTime!, t.exitPrice!)),
        h('td', { class: 'is-num' }, t.qty !== undefined ? String(t.qty) : '—'),
        pnl,
      );
      tbody.append(row);
      this.rows.set(id, { row, pnl, trade: t });
    }
    table.append(tbody);
    body.append(table);
    body.scrollTop = scroll;
    this.markSelected(this.chart.selectedTradeId, false);
  }

  private markSelected(id: string | null, reveal: boolean): void {
    for (const [rid, { row }] of this.rows) row.classList.toggle('is-selected', rid === id);
    if (!reveal || id === null || !this.body) return;
    const r = this.rows.get(id)?.row;
    if (!r) return;
    // scroll only inside the list, never the page
    const top = r.offsetTop - this.body.clientHeight / 2 + r.offsetHeight / 2;
    this.body.scrollTo({ top, behavior: 'smooth' });
  }
}

/** Create a trade list linked to a chart (or `terminal.chart`). */
export function createTradeList(container: HTMLElement, chart: Chart, options: TradeListOptions = {}): TradeList {
  return new TradeList(container, chart, options);
}
