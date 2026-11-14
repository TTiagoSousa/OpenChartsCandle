import { createBarChart } from 'openchartscandle/bar';

// Barras polares com pontas redondas (roundCap) e um buraco ao centro (innerRadius).
export function mount(el: HTMLElement): () => void {
  const chart = createBarChart(el, {
    categories: ['Seg', 'Ter', 'Qua', 'Qui'],
    series: [
      { name: 'A', data: [1, 2, 3, 4] },
      { name: 'B', data: [2, 4, 6, 8] },
      { name: 'C', data: [1, 2, 3, 4] },
    ],
    stacked: true,
    polar: { categories: 'radius', roundCap: true, innerRadius: 0.25 },
    legend: { position: 'top', align: 'center' },
  });
  return () => chart.destroy();
}
