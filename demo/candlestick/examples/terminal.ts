import { createTerminal } from 'openchartscandle/candlestick';
import { datafeed } from '../data';

// O gráfico completo, ao estilo TradingView: pesquisa de símbolos, timeframes,
// tipos de gráfico, indicadores, 25 ferramentas de desenho, watchlist e atalhos.
export function mount(el: HTMLElement): () => void {
  const terminal = createTerminal(el, {
    datafeed, // de onde vêm as velas (aqui: um simulador de mercado)
    symbol: 'SIMBTC',
    timeframe: '5',
    brand: 'ChartView',
    storageKey: 'tc-site-terminal', // guarda desenhos e preferências no browser
  });

  return () => terminal.destroy();
}
