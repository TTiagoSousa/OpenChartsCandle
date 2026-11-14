import { createLineChart } from 'openchartscandle/line';

export function mount(el: HTMLElement): () => void {
  const chart = createLineChart(el, {
    categories: ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom'],
    series: [{ name: 'Visitas', data: [150, 230, 224, 218, 135, 147, 260] }],
    points: true,
    legend: { show: false },
  });
  return () => chart.destroy();
}
