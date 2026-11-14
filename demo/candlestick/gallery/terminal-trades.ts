import { createTerminal } from 'openchartscandle/candlestick';
import { datafeed, smaCrossTrades } from '../data';

// O terminal completo com a lista de trades por baixo (opção tradeList).
// Os trades chegam de fora (aqui uma estratégia simulada) com chart.setTrades a cada vela fechada.
export function mount(el: HTMLElement): () => void {
  const terminal = createTerminal(el, {
    datafeed,
    symbol: 'SIMBTC',
    timeframe: '5',
    compact: true,
    watchlist: false,
    storageKey: null,
    tradeList: { collapsible: true },
    tradeListHeight: 180,
    mouseWheel: !el.closest('.gal-card'),
  });
  let count = 0;
  const off = terminal.chart.dataUpdated.on(() => {
    const bars = terminal.chart.bars;
    if (bars.length === count) return;
    count = bars.length;
    terminal.chart.setTrades(smaCrossTrades(bars, 9, 21, 300));
  });
  return () => {
    off();
    terminal.destroy();
  };
}
