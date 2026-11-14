import { createChart } from 'openchartscandle/candlestick';
import { chartOptions, makeBars } from '../data';

// Velas ocas: as que fecham acima da abertura ficam só com o contorno.
export function mount(el: HTMLElement): () => void {
  const chart = createChart(el, chartOptions(el, { chartType: 'hollow' }));
  chart.setData(makeBars(300, { seed: 21 }), 3600);
  chart.showLastBars(90);
  return () => chart.destroy();
}
