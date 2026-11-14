import { createBarChart } from 'openchartscandle/bar';

// Barras polares tangenciais: cada categoria é um anel e a barra dá a volta; valor por dentro.
export function mount(el: HTMLElement): () => void {
  const chart = createBarChart(el, {
    categories: ['A', 'B', 'C', 'D'],
    series: [{ name: 'Valor', data: [2, 1.2, 2.4, 3.6] }],
    polar: { categories: 'radius', innerRadius: 0.2 },
    valueAxis: { max: 4 },
    labels: { show: true, position: 'inside' },
    legend: { show: false },
  });
  return () => chart.destroy();
}
