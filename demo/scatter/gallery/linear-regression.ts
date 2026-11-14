import { createScatterChart } from 'openchartscandle/scatter';
import { noisy } from '../data';

// Regressão linear: a reta que melhor passa pelos pontos (mínimos quadrados), com a fórmula e o R².
export function mount(el: HTMLElement): () => void {
  const chart = createScatterChart(el, {
    series: [{ name: 'Dados', data: noisy(60, 0, 20, (x) => 1.8 * x + 3, 4, 41), symbolSize: 8, regression: 'linear' }],
  });
  return () => chart.destroy();
}
