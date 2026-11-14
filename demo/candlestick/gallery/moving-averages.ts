import { createChart, createIndicator } from 'openchartscandle/candlestick';
import { chartOptions, makeBars } from '../data';

// Médias móveis internas: simples (SMA), exponencial (EMA) e ponderada (WMA) com createIndicator.
export function mount(el: HTMLElement): () => void {
  const chart = createChart(el, chartOptions(el));
  chart.setData(makeBars(400, { seed: 12 }), 3600);
  chart.addIndicator(createIndicator('sma', { length: 50, color: '#2962ff', width: 2 })!);
  chart.addIndicator(createIndicator('sma', { length: 20, color: '#ff9800', width: 2 })!);
  chart.addIndicator(createIndicator('sma', { length: 100, color: '#e040fb', width: 2 })!);
  chart.showLastBars(160);
  return () => chart.destroy();
}
