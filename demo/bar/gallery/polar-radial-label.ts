import { createBarChart } from 'openchartscandle/bar';

// Barras polares radiais: cada categoria é uma fatia do círculo e o valor fica escrito por fora.
export function mount(el: HTMLElement): () => void {
  const chart = createBarChart(el, {
    categories: ['A', 'B', 'C', 'D', 'E', 'F'],
    series: [{ name: 'Valor', data: [2, 1.2, 2.4, 3.6, 3.2, 2.8] }],
    polar: { categories: 'angle' },
    labels: { show: true, position: 'outside' },
    legend: { show: false },
  });
  return () => chart.destroy();
}
