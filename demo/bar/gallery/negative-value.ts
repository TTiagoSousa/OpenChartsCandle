import { createBarChart } from 'openchartscandle/bar';

// Valores negativos em barras horizontais: verde acima de zero, vermelho abaixo.
export function mount(el: HTMLElement): () => void {
  const chart = createBarChart(el, {
    orientation: 'horizontal',
    categories: ['dez', 'nove', 'oito', 'sete', 'seis', 'cinco', 'quatro', 'três', 'dois', 'um'],
    series: [{ name: 'Custo', data: [-0.07, -0.09, 0.2, 0.44, -0.23, 0.08, -0.17, 0.47, -0.36, 0.18] }],
    colorBy: (v) => (v >= 0 ? '#089981' : '#f23645'),
    labels: { show: true, format: (v) => `${(v * 100).toFixed(0)}%` },
    legend: { show: false },
    valueAxis: { min: -0.5, format: (v) => `${Math.round(v * 100)}%` }, // room for the labels of the negative bars
    valueFormatter: (v) => `${(v * 100).toFixed(1)}%`,
  });
  return () => chart.destroy();
}
