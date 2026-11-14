import { createBarChart } from 'openchartscandle/bar';

// Cada coluna tem um trilho de fundo com a altura total do eixo (background: true).
export function mount(el: HTMLElement): () => void {
  const chart = createBarChart(el, {
    categories: ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom'],
    series: [{ name: 'Visitas', data: [120, 200, 150, 80, 70, 110, 130], background: true }],
    legend: { show: false },
  });
  return () => chart.destroy();
}
