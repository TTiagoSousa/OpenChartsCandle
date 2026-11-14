import { createBarChart } from 'openchartscandle/bar';

// Polar com ângulo final: o eixo de valores ocupa só três quartos do círculo (0° a 270°).
export function mount(el: HTMLElement): () => void {
  const chart = createBarChart(el, {
    categories: ['Seg', 'Ter', 'Qua', 'Qui'],
    series: [
      { name: '2024', data: [1, 2, 3, 4] },
      { name: '2025', data: [2, 3, 4, 3] },
    ],
    polar: { categories: 'radius', startAngle: 0, endAngle: 270, innerRadius: 0.15 },
    legend: { position: 'top', align: 'center' },
  });
  return () => chart.destroy();
}
