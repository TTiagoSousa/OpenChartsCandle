import { createBarChart } from 'openchartscandle/bar';

// Chuva e evaporação: barras agrupadas com o máximo, o mínimo e a média de cada série (marks).
const MONTHS = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];

export function mount(el: HTMLElement): () => void {
  const chart = createBarChart(el, {
    categories: MONTHS,
    series: [
      { name: 'Evaporação', data: [2.0, 4.9, 7.0, 23.2, 25.6, 76.7, 135.6, 162.2, 32.6, 20.0, 6.4, 3.3], marks: { max: true, min: true, average: true } },
      { name: 'Precipitação', data: [2.6, 5.9, 9.0, 26.4, 28.7, 70.7, 175.6, 182.2, 48.7, 18.8, 6.0, 2.3], marks: { max: true, min: true, average: true } },
    ],
    legend: { position: 'top', align: 'center' },
    valueFormatter: (v) => `${v} ml`,
  });
  return () => chart.destroy();
}
