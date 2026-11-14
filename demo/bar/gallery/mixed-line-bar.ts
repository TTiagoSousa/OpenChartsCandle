import { createBarChart } from 'openchartscandle/bar';

// Barras e linha juntas: chuva e evaporação em barras, temperatura numa linha no eixo da direita.
const MONTHS = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];

export function mount(el: HTMLElement): () => void {
  const chart = createBarChart(el, {
    categories: MONTHS,
    series: [
      { name: 'Evaporação', data: [2.0, 4.9, 7.0, 23.2, 25.6, 76.7, 135.6, 162.2, 32.6, 20.0, 6.4, 3.3] },
      { name: 'Precipitação', data: [2.6, 5.9, 9.0, 26.4, 28.7, 70.7, 175.6, 182.2, 48.7, 18.8, 6.0, 2.3] },
    ],
    overlays: [{ type: 'line', name: 'Temperatura', data: [2.0, 2.2, 3.3, 4.5, 6.3, 10.2, 20.3, 23.4, 23.0, 16.5, 12.0, 6.2], axis: 'right', points: true, color: '#ffd54f' }],
    valueAxis: { title: 'Água', format: (v) => `${v} ml` },
    rightAxis: { title: 'Temperatura', format: (v) => `${v} °C` },
    legend: { position: 'top', align: 'center' },
    valueFormatter: (v) => `${v} ml`,
  });
  return () => chart.destroy();
}
