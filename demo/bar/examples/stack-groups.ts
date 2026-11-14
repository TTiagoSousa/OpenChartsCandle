import { createBarChart } from 'openchartscandle/bar';
import { QUARTERS } from '../data';

// Grupos de pilhas: séries com o mesmo `stack` empilham juntas e cada grupo fica ao lado do
// outro. Aqui compras e vendas de cada ano, por produto.
export function mount(el: HTMLElement): () => void {
  const chart = createBarChart(el, {
    categories: QUARTERS,
    series: [
      { name: 'BTC 2024', data: [40, 52, 48, 61], stack: '2024', color: '#f7931a' },
      { name: 'ETH 2024', data: [25, 31, 28, 35], stack: '2024', color: '#627eea' },
      { name: 'Outros 2024', data: [10, 14, 16, 19], stack: '2024', color: '#5d606b' },
      { name: 'BTC 2025', data: [55, 63, 70, 82], stack: '2025', color: '#ffb74d' },
      { name: 'ETH 2025', data: [30, 36, 41, 47], stack: '2025', color: '#9fa8da' },
      { name: 'Outros 2025', data: [14, 18, 22, 27], stack: '2025', color: '#9598a1' },
    ],
    stacked: true,
    barGap: 6,
    categoryGap: 0.35,
    radius: 4,
    tooltip: { total: true },
    legend: { position: 'bottom', align: 'center' },
    valueFormatter: (v) => `${v} M€`,
  });
  return () => chart.destroy();
}
