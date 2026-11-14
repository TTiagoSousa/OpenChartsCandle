import { createBarChart } from 'openchartscandle/bar';

// Pilhas com cantos arredondados: só o segmento de cima de cada pilha fica redondo.
export function mount(el: HTMLElement): () => void {
  const chart = createBarChart(el, {
    categories: ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun'],
    series: [
      { name: 'Spot', data: [120, 200, 150, 80, 70, 110] },
      { name: 'Futuros', data: [90, 120, 130, 110, 140, 160] },
      { name: 'Opções', data: [40, 60, 80, 50, 70, 90] },
    ],
    stacked: true,
    radius: 8,
    categoryGap: 0.4,
    legend: { position: 'top', align: 'center' },
  });
  return () => chart.destroy();
}
