import { createChart } from 'openchartscandle/candlestick';
import { chartOptions, makeBars } from '../data';

// Área: só os fechos, com preenchimento em gradiente por baixo da linha.
export function mount(el: HTMLElement): () => void {
  const chart = createChart(el, chartOptions(el, { chartType: 'area' }));
  chart.setData(makeBars(400, { seed: 3, tf: 86400 }), 86400); // velas diárias
  chart.showLastBars(250);
  return () => chart.destroy();
}
