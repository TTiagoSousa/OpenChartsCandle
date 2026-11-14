import { createTerminal } from 'openchartscandle/candlestick';
import { datafeed } from '../data';

// O terminal ao estilo TradingView em tamanho compacto: barras, ferramentas, legenda e dados ao vivo.
export function mount(el: HTMLElement): () => void {
  const terminal = createTerminal(el, {
    datafeed,
    symbol: 'SIMETH',
    timeframe: '15',
    compact: true,
    watchlist: false,
    storageKey: null,
    mouseWheel: !el.closest('.gal-card'),
  });
  return () => terminal.destroy();
}
