import { createTerminal } from 'openchartscandle/candlestick';
import { datafeed } from '../data';

// Só o gráfico: sem barras, sem watchlist. A legenda OHLC volta a ser ligada.
export function mount(el: HTMLElement): () => void {
  const terminal = createTerminal(el, {
    datafeed,
    symbol: 'SIMETH',
    timeframe: '15',
    minimal: true, // desliga barra de topo, ferramentas, barra de baixo, watchlist e legenda
    legend: true, // ...mas mantém a legenda
    storageKey: null, // não guardar nada
  });

  return () => terminal.destroy();
}
