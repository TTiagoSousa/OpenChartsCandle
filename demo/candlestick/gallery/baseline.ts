import { createChart } from 'openchartscandle/candlestick';
import { chartOptions, makeBars } from '../data';

// Linha de base: verde acima do preço de referência e vermelho abaixo.
export function mount(el: HTMLElement): () => void {
  const chart = createChart(el, chartOptions(el, { chartType: 'baseline' }));
  chart.setData(makeBars(300, { seed: 17 }), 3600);
  chart.showLastBars(160);
  return () => chart.destroy();
}
