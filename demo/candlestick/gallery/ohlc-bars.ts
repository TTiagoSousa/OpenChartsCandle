import { createChart } from 'openchartscandle/candlestick';
import { chartOptions, makeBars } from '../data';

// Barras OHLC: um traço vertical do mínimo ao máximo, a abertura à esquerda e o fecho à direita.
export function mount(el: HTMLElement): () => void {
  const chart = createChart(el, chartOptions(el, { chartType: 'bars' }));
  chart.setData(makeBars(300, { seed: 11 }), 3600);
  chart.showLastBars(90);
  return () => chart.destroy();
}
