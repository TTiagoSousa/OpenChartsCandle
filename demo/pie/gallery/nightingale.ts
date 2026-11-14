import { createPieChart } from 'openchartscandle/pie';

// Gráfico de Nightingale (rosa): todas as fatias com o mesmo ângulo e o raio pelo valor (rose: 'area'),
// com um buraco ao centro e cantos arredondados.
export function mount(el: HTMLElement): () => void {
  const chart = createPieChart(el, {
    data: [40, 38, 32, 30, 28, 26, 22, 18].map((value, i) => ({ label: `rosa ${i + 1}`, value })),
    rose: 'area',
    innerRadius: 0.2,
    cornerRadius: 8,
    borderWidth: 2,
    labels: { position: 'inside', content: 'label', minPercent: 0, fontWeight: 500 },
    legend: { position: 'top', values: false },
    center: { show: false },
  });
  return () => chart.destroy();
}
