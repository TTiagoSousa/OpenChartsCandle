import { createChart, lightTheme } from 'openchartscandle/candlestick';
import { chartOptions, makeBars } from '../data';

// Tema claro: passa lightTheme (ou só as cores que queres mudar) na opção theme.
export function mount(el: HTMLElement): () => void {
  const chart = createChart(el, chartOptions(el, { theme: lightTheme }));
  chart.setData(makeBars(300, { seed: 9 }), 3600);
  chart.showLastBars(100);
  return () => chart.destroy();
}
