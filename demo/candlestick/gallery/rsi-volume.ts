import { createChart, createIndicator } from 'openchartscandle/candlestick';
import { chartOptions, makeBars } from '../data';

// RSI 14 (Wilder) num painel por baixo das velas, com 70/30.
export function mount(el: HTMLElement): () => void {
  const chart = createChart(el, chartOptions(el));
  const bars = makeBars(300, { seed: 14 });
  chart.setData(bars, 3600);
  chart.addIndicator(createIndicator('rsi', { length: 14, width: 2 })!);
  chart.showLastBars(120);
  return () => chart.destroy();
}
