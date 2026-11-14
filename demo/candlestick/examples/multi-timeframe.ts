import { createTerminal, type Terminal } from 'openchartscandle/candlestick';
import { SIM_SYMBOLS, datafeed, h } from '../data';

// Vários gráficos na mesma página: o mesmo símbolo em 4 timeframes.
// Os botões mudam o símbolo em todos ao mesmo tempo com terminal.setSymbol().
export function mount(el: HTMLElement): () => void {
  const bar = h('div', { class: 'ex-toolbar' }, h('span', { class: 'ex-label', text: 'Símbolo:' }));
  const grid = h('div', { class: 'ex-grid-2x2' });
  el.append(bar, grid);

  const terminals: Terminal[] = ['1', '15', '60', '1D'].map((timeframe) => {
    const cell = h('div', { class: 'ex-cell' });
    grid.append(cell);
    return createTerminal(cell, {
      datafeed,
      symbol: 'SIMBTC',
      timeframe,
      minimal: true,
      timeframeSelector: false, // intervalo fixo neste exemplo
      legend: true,
      compact: true,
      indicators: [],
      storageKey: null,
    });
  });

  for (const s of SIM_SYMBOLS.slice(0, 6)) {
    bar.append(h('button', { class: 'ex-btn', text: s.symbol, onclick: () => terminals.forEach((t) => void t.setSymbol(s.symbol)) }));
  }

  return () => terminals.forEach((t) => t.destroy());
}
