import type { Chart } from '../core/chart';
import { TIMEFRAMES } from '../core/types';
import { formatVolume } from '../core/utils';
import type { Indicator } from '../indicators/indicators';
import { h } from './dom';
import { icon } from './icons';

export interface LegendCallbacks {
  onSettings: (ind: Indicator) => void;
  onRemove: (ind: Indicator) => void;
  onToggle: (ind: Indicator) => void;
  onSymbolClick: () => void;
}

/** DOM legends (OHLC + indicator values) positioned over each pane. */
export class Legend {
  private root: HTMLElement;
  private index: number | null = null;
  private collapsed = false;

  constructor(host: HTMLElement, private chart: Chart, private cb: LegendCallbacks) {
    this.root = h('div', { class: 'tc-legend-layer' });
    host.appendChild(this.root);
    chart.crosshairMoved.on((i) => {
      this.index = i;
      this.update();
    });
    chart.dataUpdated.on(() => this.update());
    chart.indicatorsChanged.on(() => this.rebuild());
    chart.layoutChanged.on(() => this.rebuild());
    this.rebuild();
  }

  private paneEls: { pane: string; el: HTMLElement; rows: { ind: Indicator; values: HTMLElement; row: HTMLElement }[] }[] = [];
  private ohlcEl: HTMLElement | null = null;
  private titleEl: HTMLElement | null = null;

  rebuild(): void {
    this.root.innerHTML = '';
    this.paneEls = [];
    const chart = this.chart;
    if (!chart.data) return;
    chart.panes.forEach((pane) => {
      const box = h('div', { class: 'tc-legend', style: `top:${pane.rect.y + 6}px` });
      const entry = { pane: pane.id, el: box, rows: [] as { ind: Indicator; values: HTMLElement; row: HTMLElement }[] };
      if (pane.main) {
        const tf = TIMEFRAMES.find((t) => t.seconds === chart.data.tf);
        this.titleEl = h(
          'div',
          { class: 'tc-legend__title', onclick: () => this.cb.onSymbolClick() },
          h('span', { class: 'tc-legend__live' }),
          h('span', { class: 'tc-legend__sym' }, [chart.symbol.name ?? chart.symbol.symbol, tf?.short ?? '', chart.symbol.exchange].filter(Boolean).join(' · ')),
        );
        this.ohlcEl = h('div', { class: 'tc-legend__ohlc' });
        box.append(h('div', { class: 'tc-legend__head' }, this.titleEl, this.ohlcEl));
      }
      const indRows = h('div', { class: `tc-legend__rows${this.collapsed && pane.main ? ' is-collapsed' : ''}` });
      for (const ind of pane.indicators) {
        const values = h('span', { class: 'tc-legend__values' });
        const row = h(
          'div',
          { class: `tc-legend__row${ind.shown ? '' : ' is-hidden'}` },
          h('span', { class: 'tc-legend__name' }, ind.title()),
          values,
          h(
            'span',
            { class: 'tc-legend__actions' },
            h('button', { class: 'tc-legend__btn', title: ind.visible ? 'Ocultar' : 'Mostrar', html: icon(ind.visible ? 'eye' : 'eyeOff'), onclick: () => this.cb.onToggle(ind) }),
            h('button', { class: 'tc-legend__btn', title: 'Definições', html: icon('settings'), onclick: () => this.cb.onSettings(ind) }),
            h('button', { class: 'tc-legend__btn', title: 'Remover', html: icon('close'), onclick: () => this.cb.onRemove(ind) }),
          ),
        );
        row.addEventListener('dblclick', () => this.cb.onSettings(ind));
        entry.rows.push({ ind, values, row });
        indRows.append(row);
      }
      if (pane.main && pane.indicators.length > 0) {
        const toggle = h('button', { class: `tc-legend__collapse${this.collapsed ? ' is-collapsed' : ''}`, html: icon('chevronDown') });
        toggle.addEventListener('click', () => {
          this.collapsed = !this.collapsed;
          this.rebuild();
        });
        box.append(indRows, toggle);
      } else box.append(indRows);
      this.root.append(box);
      this.paneEls.push(entry);
    });
    this.update();
  }

  update(): void {
    const chart = this.chart;
    if (!chart.data || chart.data.length === 0) return;
    const bars = chart.displayBars();
    const i = this.index ?? bars.length - 1;
    const b = bars[Math.min(i, bars.length - 1)];
    if (!b) return;
    if (this.ohlcEl) {
      const prev = bars[i - 1];
      const ch = prev ? b.close - prev.close : b.close - b.open;
      const pct = prev ? (ch / prev.close) * 100 : (ch / b.open) * 100;
      const col = b.close >= b.open ? chart.theme.up : chart.theme.down;
      const f = (x: number): string => chart.fmt(x);
      const sign = ch >= 0 ? '+' : '−';
      this.ohlcEl.innerHTML = '';
      const item = (k: string, val: string): HTMLElement => h('span', { class: 'tc-legend__kv' }, h('span', { class: 'tc-legend__k' }, k), h('span', { class: 'tc-legend__v', style: `color:${col}` }, val));
      this.ohlcEl.append(
        item('O', f(b.open)),
        item('H', f(b.high)),
        item('L', f(b.low)),
        item('C', f(b.close)),
        h('span', { class: 'tc-legend__v', style: `color:${col}` }, `${sign}${f(Math.abs(ch))} (${sign}${Math.abs(pct).toFixed(2)}%)`),
        h('span', { class: 'tc-legend__kv tc-legend__vol' }, h('span', { class: 'tc-legend__k' }, 'Vol'), h('span', { class: 'tc-legend__v', style: `color:${col}` }, formatVolume(b.volume))),
      );
    }
    const mainView = chart.mainView();
    for (const p of this.paneEls) {
      const pane = chart.panes.find((x) => x.id === p.pane);
      const v = pane ? chart.view(pane) : mainView;
      for (const r of p.rows) {
        const vals = r.ind.shown ? r.ind.legend(Math.min(i, chart.data.length - 1), v) : [];
        r.values.innerHTML = '';
        for (const val of vals) r.values.append(h('span', { style: `color:${val.color}` }, val.text));
      }
    }
  }
}
