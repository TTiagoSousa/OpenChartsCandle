import { createLineChart } from 'openchartscandle/line';

// Dois anos no mesmo gráfico: 2025 no eixo de baixo e 2024 no eixo de cima (x2Axis),
// cada eixo com a cor da sua série.
const months = (year: number): string[] => Array.from({ length: 12 }, (_, i) => `${year}-${i + 1}`);

export function mount(el: HTMLElement): () => void {
  const chart = createLineChart(el, {
    categories: months(2025),
    series: [
      { name: 'Precipitação 2025', data: [3.9, 5.9, 11.1, 18.7, 48.3, 69.2, 231.6, 46.6, 55.4, 18.4, 10.3, 0.7], color: '#5470c6' },
      { name: 'Precipitação 2024', data: [2.6, 5.9, 9.0, 26.4, 28.7, 70.7, 175.6, 182.2, 48.7, 18.8, 6.0, 2.3], color: '#ee6666' },
    ],
    curve: 'smooth',
    xAxis: { color: '#5470c6' },
    x2Axis: { categories: months(2024), color: '#ee6666' },
    yAxis: { format: (v) => `${v} mm` },
    legend: { position: 'bottom', align: 'center' },
    valueFormatter: (v) => `${v} mm`,
  });
  return () => chart.destroy();
}
