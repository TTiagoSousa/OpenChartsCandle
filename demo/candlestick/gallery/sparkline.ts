import { createChart } from 'openchartscandle/candlestick';
import { chartOptions, makeBars } from '../data';

// Sem eixos nem cruz: um gráfico pequeno para cards e listas.
export function mount(el: HTMLElement): () => void {
  const chart = createChart(
    el,
    chartOptions(el, {
      chartType: 'area',
      priceAxis: false,
      timeAxis: false,
      crosshair: false,
      lastPriceLine: false,
      theme: { grid: 'transparent', line: '#089981' },
    }),
  );
  chart.setData(makeBars(160, { seed: 44 }), 3600);
  chart.showLastBars(160);
  return () => chart.destroy();
}
