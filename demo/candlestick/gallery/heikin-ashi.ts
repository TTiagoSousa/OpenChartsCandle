import { createChart } from 'openchartscandle/candlestick';
import { chartOptions, makeBars } from '../data';

// Heikin Ashi: velas suavizadas (médias da vela anterior e da atual), boas para ver a tendência.
export function mount(el: HTMLElement): () => void {
  const chart = createChart(el, chartOptions(el, { chartType: 'heikin' }));
  chart.setData(makeBars(300, { seed: 5 }), 3600);
  chart.showLastBars(120);
  return () => chart.destroy();
}
