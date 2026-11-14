import { createLineChart } from 'openchartscandle/line';

// Linhas em degraus: o degrau no início do intervalo, ao meio ou no fim.
export function mount(el: HTMLElement): () => void {
  const chart = createLineChart(el, {
    categories: ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom'],
    series: [
      { name: 'Início', data: [120, 132, 101, 134, 90, 230, 210], curve: 'step-start' },
      { name: 'Meio', data: [220, 282, 201, 234, 290, 430, 410], curve: 'step-middle' },
      { name: 'Fim', data: [450, 432, 401, 454, 590, 530, 510], curve: 'step-end' },
    ],
    points: true,
    legend: { position: 'top', align: 'center' },
  });
  return () => chart.destroy();
}
