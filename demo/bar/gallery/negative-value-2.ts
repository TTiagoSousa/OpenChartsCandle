import { createBarChart } from 'openchartscandle/bar';

// Receitas para a direita e despesas para a esquerda, empilhadas por dia.
export function mount(el: HTMLElement): () => void {
  const chart = createBarChart(el, {
    orientation: 'horizontal',
    categories: ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom'],
    series: [
      { name: 'Lucro', data: [200, 170, 240, 244, 200, 220, 210], color: '#5470c6' },
      { name: 'Receita', data: [320, 302, 341, 374, 390, 450, 420], color: '#91cc75' },
      { name: 'Despesas', data: [-120, -132, -101, -134, -190, -230, -210], color: '#ee6666' },
    ],
    stacked: true,
    labels: { show: true, position: 'center' },
    legend: { position: 'top', align: 'center' },
    tooltip: { total: false },
  });
  return () => chart.destroy();
}
