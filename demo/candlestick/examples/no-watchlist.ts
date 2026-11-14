import { createTerminal } from 'openchartscandle/candlestick';
import { datafeed } from '../data';

// O terminal completo sem a lista de símbolos e o painel de informação à direita.
export function mount(el: HTMLElement): () => void {
  const terminal = createTerminal(el, {
    datafeed,
    symbol: 'XAUSIM',
    timeframe: '60',
    watchlist: false,
    storageKey: 'tc-site-no-watchlist',
  });

  return () => terminal.destroy();
}
