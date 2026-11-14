import { createBarChart } from 'openchartscandle/bar';

// Barras num sistema polar: uma série, uma categoria por anel.
export function mount(el: HTMLElement): () => void {
  const chart = createBarChart(el, {
    categories: ['Seg', 'Ter', 'Qua', 'Qui', 'Sex'],
    series: [{ name: 'Vendas', data: [2.5, 3.1, 1.8, 4.2, 3.6] }],
    polar: { categories: 'radius', innerRadius: 0.1 },
    legend: { show: false },
  });
  return () => chart.destroy();
}
