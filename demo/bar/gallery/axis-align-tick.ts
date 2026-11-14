import { createBarChart } from 'openchartscandle/bar';

// Marcas do eixo alinhadas com o centro de cada coluna (categoryAxis.ticks: 'center').
export function mount(el: HTMLElement): () => void {
  const chart = createBarChart(el, {
    categories: ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom'],
    series: [{ name: 'Direto', data: [10, 52, 200, 334, 390, 330, 220] }],
    categoryAxis: { ticks: 'center' },
    categoryGap: 0.4,
    tooltip: { mode: 'single' },
    legend: { show: false },
  });
  return () => chart.destroy();
}
