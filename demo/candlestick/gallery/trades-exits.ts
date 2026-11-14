import { createChart } from 'openchartscandle/candlestick';
import { chartOptions, externalTrades, makeBars } from '../data';

// Só as saídas, com o P&L de cada uma ao lado da seta: setTradeDisplay({ entries: false }).
export function mount(el: HTMLElement): () => void {
  const chart = createChart(el, chartOptions(el));
  const bars = makeBars(300, { seed: 7 });
  chart.setData(bars, 3600);
  chart.setTrades(externalTrades(bars));
  chart.setTradeDisplay({ entries: false }); // também pode ir na opção tradeDisplay
  chart.showLastBars(110);
  return () => chart.destroy();
}
