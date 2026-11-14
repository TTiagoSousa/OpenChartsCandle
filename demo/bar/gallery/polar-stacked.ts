import { createBarChart } from 'openchartscandle/bar';

// Barras empilhadas em polar: três séries somadas em cada anel.
export function mount(el: HTMLElement): () => void {
  const chart = createBarChart(el, {
    categories: ['Seg', 'Ter', 'Qua', 'Qui'],
    series: [
      { name: 'A', data: [1, 2, 3, 4] },
      { name: 'B', data: [2, 4, 6, 8] },
      { name: 'C', data: [1, 2, 3, 4] },
    ],
    stacked: true,
    polar: { categories: 'radius', innerRadius: 0.1 },
    legend: { position: 'top', align: 'center' },
  });
  return () => chart.destroy();
}
