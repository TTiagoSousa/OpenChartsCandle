import { createChart } from 'openchartscandle/candlestick';
import { chartOptions, externalTrades, makeBars } from '../data';

// Entradas e saídas sem a linha tracejada entre elas: setTradeDisplay({ lines: false }).
// O P&L passa para junto da seta de saída.
export function mount(el: HTMLElement): () => void {
  const chart = createChart(el, chartOptions(el, { tradeDisplay: { lines: false } }));
  const bars = makeBars(300, { seed: 7 });
  chart.setData(bars, 3600);
  chart.setTrades(externalTrades(bars));
  chart.showLastBars(110);
  return () => chart.destroy();
}
