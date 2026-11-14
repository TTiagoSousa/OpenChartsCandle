import { createChart } from 'openchartscandle/candlestick';
import { chartOptions, makeBars } from '../data';

// O gráfico de velas mais simples: createChart + setData(velas, duração de cada vela em segundos).
export function mount(el: HTMLElement): () => void {
  const chart = createChart(el, chartOptions(el));
  chart.setData(makeBars(300), 3600); // velas de 1 hora
  chart.showLastBars(120);
  return () => chart.destroy();
}
