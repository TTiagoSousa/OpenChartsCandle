import { createChart } from 'openchartscandle/candlestick';
import { chartOptions, externalTrades, makeBars } from '../data';

// Só as entradas: setTradeDisplay({ exits: false }). Sem saídas, a linha também desaparece.
export function mount(el: HTMLElement): () => void {
  const chart = createChart(el, chartOptions(el, { tradeDisplay: { exits: false } }));
  const bars = makeBars(300, { seed: 7 });
  chart.setData(bars, 3600);
  chart.setTrades(externalTrades(bars));
  chart.showLastBars(110);
  return () => chart.destroy();
}
