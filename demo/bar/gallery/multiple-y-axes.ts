import { createBarChart } from 'openchartscandle/bar';

// Três eixos de valores: evaporação à esquerda, precipitação à direita e temperatura num terceiro eixo.
const MONTHS = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];

export function mount(el: HTMLElement): () => void {
  const chart = createBarChart(el, {
    categories: MONTHS,
    series: [
      { name: 'Evaporação', data: [2.0, 4.9, 7.0, 23.2, 25.6, 76.7, 135.6, 162.2, 32.6, 20.0, 6.4, 3.3], color: '#5470c6' },
      { name: 'Precipitação', data: [2.6, 5.9, 9.0, 26.4, 28.7, 70.7, 175.6, 182.2, 48.7, 18.8, 6.0, 2.3], color: '#91cc75', axis: 'right' },
    ],
    overlays: [{ type: 'line', name: 'Temperatura', data: [2.0, 2.2, 3.3, 4.5, 6.3, 10.2, 20.3, 23.4, 23.0, 16.5, 12.0, 6.2], axis: 'right2', color: '#ee6666', points: true }],
    valueAxis: { title: 'Evaporação', format: (v) => `${v} ml` },
    rightAxis: { title: 'Precipitação', format: (v) => `${v} ml` },
    right2Axis: { title: 'Temperatura', format: (v) => `${v} °C` },
    legend: { position: 'top', align: 'center' },
  });
  return () => chart.destroy();
}
