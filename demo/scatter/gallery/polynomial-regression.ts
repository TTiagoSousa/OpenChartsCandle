import { createScatterChart } from 'openchartscandle/scatter';
import { noisy } from '../data';

// Regressão polinomial de grau 3: uma curva com subidas e descidas. `order` escolhe o grau.
export function mount(el: HTMLElement): () => void {
  const chart = createScatterChart(el, {
    series: [
      {
        name: 'Dados',
        data: noisy(70, -6, 6, (x) => 0.12 * x ** 3 - 0.5 * x ** 2 - 2 * x + 6, 2.2, 43),
        symbolSize: 8,
        color: '#9c27b0',
        regression: { type: 'polynomial', order: 3 },
      },
    ],
  });
  return () => chart.destroy();
}
