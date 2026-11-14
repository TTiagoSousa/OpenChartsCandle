import { createScatterChart } from 'openchartscandle/scatter';
import { noisy } from '../data';

// Regressão logarítmica: y = a + b·ln(x). Cresce depressa no início e depois abranda,
// como a aprendizagem ou a utilidade do dinheiro.
export function mount(el: HTMLElement): () => void {
  const chart = createScatterChart(el, {
    series: [{ name: 'Dados', data: noisy(60, 1, 100, (x) => 12 * Math.log(x) + 5, 3.5, 44), symbolSize: 8, color: '#089981', regression: 'logarithmic' }],
  });
  return () => chart.destroy();
}
