import { createScatterChart } from 'openchartscandle/scatter';
import { noisy } from '../data';

// Regressão exponencial: y = a·e^(bx). Crescimento que acelera, como juros compostos ou uma epidemia no início.
export function mount(el: HTMLElement): () => void {
  const data = noisy(50, 0, 10, (x) => 2 * Math.exp(0.35 * x), 0, 42).map(([x, y], i) => [x, +(y * (1 + Math.sin(i * 7.3) * 0.18)).toFixed(2)] as [number, number]);
  const chart = createScatterChart(el, {
    series: [{ name: 'Dados', data, symbolSize: 8, color: '#ff9800', regression: { type: 'exponential', color: '#f23645' } }],
  });
  return () => chart.destroy();
}
