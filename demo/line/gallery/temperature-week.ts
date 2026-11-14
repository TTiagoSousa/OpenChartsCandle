import { createLineChart } from 'openchartscandle/line';

// Previsão da semana: máximas e mínimas, com o valor mais alto e mais baixo marcados
// e uma linha na média de cada série (marks).
export function mount(el: HTMLElement): () => void {
  const chart = createLineChart(el, {
    categories: ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom'],
    series: [
      { name: 'Máxima', data: [10, 11, 13, 11, 12, 12, 9], color: '#f23645', marks: { max: true, min: true, average: true } },
      { name: 'Mínima', data: [1, -2, 2, 5, 3, 2, 0], color: '#2962ff', marks: { min: true, average: true } },
    ],
    points: { size: 4, hollow: true },
    yAxis: { format: (v) => `${v} °C` },
    legend: { position: 'top', align: 'center' },
    valueFormatter: (v) => `${v} °C`,
  });
  return () => chart.destroy();
}
