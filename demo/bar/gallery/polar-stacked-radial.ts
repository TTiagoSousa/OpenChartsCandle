import { createBarChart } from 'openchartscandle/bar';

// Barras empilhadas em polar (radial): cada dia é uma fatia e as séries crescem para fora.
export function mount(el: HTMLElement): () => void {
  const chart = createBarChart(el, {
    categories: ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom'],
    series: [
      { name: 'A', data: [1, 2, 3, 4, 3, 5, 1] },
      { name: 'B', data: [2, 4, 6, 1, 3, 2, 1] },
      { name: 'C', data: [1, 2, 3, 4, 1, 2, 5] },
    ],
    stacked: true,
    polar: { categories: 'angle', innerRadius: 0.1 },
    legend: { position: 'top', align: 'center' },
  });
  return () => chart.destroy();
}
