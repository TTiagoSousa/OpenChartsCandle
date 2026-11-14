import { createBarChart } from 'openchartscandle/bar';

// Colunas simples: uma série, um valor por dia.
export function mount(el: HTMLElement): () => void {
  const chart = createBarChart(el, {
    categories: ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom'],
    series: [{ name: 'Visitas', data: [120, 200, 150, 80, 70, 110, 130] }],
    legend: { show: false },
  });
  return () => chart.destroy();
}
