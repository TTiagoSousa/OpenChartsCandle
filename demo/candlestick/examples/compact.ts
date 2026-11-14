import { createTerminal } from 'openchartscandle/candlestick';
import { datafeed, h } from '../data';

// Terminal compacto dentro de um card pequeno: barras e botões mais pequenos, borda e cantos arredondados.
export function mount(el: HTMLElement): () => void {
  const card = h('div', { class: 'ex-card', style: 'width: 620px; max-width: 100%' },
    h('div', { class: 'ex-card__title', text: 'Ouro · 1h' }),
  );
  const host = h('div', { style: 'height: 380px' });
  card.append(host);
  el.append(h('div', { class: 'ex-center' }, card));

  const terminal = createTerminal(host, {
    datafeed,
    symbol: 'XAUSIM',
    timeframe: '60',
    compact: true,
    watchlist: false,
    bottomBar: false,
    screenshot: false,
    fullscreen: false,
    timeframeSelector: ['15', '60', '240', '1D'],
    chartTypes: ['candles', 'line', 'area'],
    drawingTools: ['trendline', 'hline', 'fib', 'rect', 'long', 'short'],
    border: '1px solid #2a2e39',
    radius: 8,
    mouseWheel: false, // a página faz scroll normalmente por cima do card
    storageKey: null,
  });

  return () => terminal.destroy();
}
