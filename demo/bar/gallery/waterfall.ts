import { createBarChart, waterfall } from 'openchartscandle/bar';

// Cascata: cada gasto "flutua" sobre o que sobra. A base é uma série invisível (silent)
// e o helper waterfall() calcula as alturas.
export function mount(el: HTMLElement): () => void {
  const w = waterfall([-1200, -300, -200, -900, -300], 2900);
  const chart = createBarChart(el, {
    categories: ['Total', 'Renda', 'Serviços', 'Transporte', 'Refeições', 'Outros'],
    series: [
      { name: 'Base', data: w.base, color: 'transparent', silent: true },
      { name: 'Valor', data: w.up.map((v, i) => v ?? w.down[i]), color: '#5470c6' },
    ],
    stacked: true,
    labels: { show: true, position: 'inside' },
    legend: { show: false },
    tooltip: { mode: 'single' },
    valueFormatter: (v) => `${v} €`,
  });
  return () => chart.destroy();
}
