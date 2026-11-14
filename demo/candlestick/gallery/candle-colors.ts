import { createChart } from 'openchartscandle/candlestick';
import { chartOptions, makeBars } from '../data';

// Cores das velas: corpo, pavio e contorno separados para as que sobem e as que descem.
export function mount(el: HTMLElement): () => void {
  const chart = createChart(
    el,
    chartOptions(el, {
      theme: {
        bg: '#0b1020',
        grid: 'rgba(80, 100, 160, 0.18)',
        up: '#2962ff',
        down: '#0b1020', // corpo das que descem igual ao fundo: parecem ocas
        wickUp: '#2962ff',
        wickDown: '#ff9800',
        borderUp: '#2962ff',
        borderDown: '#ff9800',
        candleBorder: true,
      },
    }),
  );
  chart.setData(makeBars(300, { seed: 31 }), 3600);
  chart.showLastBars(80);
  return () => chart.destroy();
}
