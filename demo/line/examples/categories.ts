import { createLineChart } from 'openchartscandle/line';
import { MONTHS, costs, revenue } from '../data';

// Eixo de categorias (meses) com o valor por cima de cada ponto (labels: true) e o eixo a começar no zero.
export function mount(el: HTMLElement): () => void {
  const chart = createLineChart(el, {
    series: [
      { name: 'Receita', data: revenue, labels: true, points: true, color: '#2962ff' },
      { name: 'Custos', data: costs, labels: true, points: { hollow: true }, color: '#f23645' },
    ],
    categories: MONTHS,
    yAxis: { beginAtZero: true, title: 'Milhões €' },
    legend: { position: 'bottom', align: 'center', marker: 'circle' },
    valueFormatter: (v) => `${v}`,
  });

  return () => chart.destroy();
}
