import { createLineChart } from 'openchartscandle/line';

export function mount(el: HTMLElement): () => void {
  const chart = createLineChart(el, {
    categories: ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom'],
    series: [{ name: 'Visitas', data: [820, 932, 901, 934, 1290, 1330, 1320] }],
    area: { opacity: 0.35, gradient: false },
    yAxis: { beginAtZero: true },
    legend: { show: false },
  });
  return () => chart.destroy();
}
