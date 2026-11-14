import { createTerminal, lightTheme } from 'openchartscandle/candlestick';
import { datafeed } from '../data';

// Tema claro pronto a usar, com as cores das velas alteradas por cima.
export function mount(el: HTMLElement): () => void {
  const terminal = createTerminal(el, {
    datafeed,
    symbol: 'ACME',
    timeframe: '15',
    watchlist: false,
    storageKey: null,
    theme: { ...lightTheme, up: '#26a69a', down: '#ef5350' },
  });

  return () => terminal.destroy();
}
