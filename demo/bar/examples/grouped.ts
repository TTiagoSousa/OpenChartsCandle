import { createBarChart } from 'openchartscandle/bar';
import { QUARTERS } from '../data';

// Barras agrupadas: várias séries lado a lado em cada categoria. O tooltip mostra todas as
// séries do trimestre; clicar na legenda esconde uma série e as outras alargam.
export function mount(el: HTMLElement): () => void {
  const chart = createBarChart(el, {
    categories: QUARTERS,
    series: [
      { name: '2023', data: [98, 112, 121, 140], color: '#5d606b' },
      { name: '2024', data: [118, 131, 139, 162] },
      { name: '2025', data: [131, 149, 158, 181] },
    ],
    radius: 4,
    barGap: 4,
    categoryGap: 0.3,
    valueFormatter: (v) => `${v} M€`,
    valueAxis: { title: 'Receita (M€)' },
  });
  return () => chart.destroy();
}
