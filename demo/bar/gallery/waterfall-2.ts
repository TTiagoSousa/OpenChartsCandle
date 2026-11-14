import { createBarChart, waterfall } from 'openchartscandle/bar';

// Cascata de entradas (verde) e saídas (vermelho) ao longo de 11 dias.
const changes = [900, 345, 393, -108, -154, 135, 178, 286, -119, -361, -203];

export function mount(el: HTMLElement): () => void {
  const w = waterfall(changes);
  const chart = createBarChart(el, {
    categories: changes.map((_, i) => `Dia ${i + 1}`),
    series: [
      { name: 'Base', data: w.base, color: 'transparent', silent: true },
      { name: 'Entradas', data: w.up, color: '#089981' },
      { name: 'Saídas', data: w.down, color: '#f23645' },
    ],
    stacked: true,
    labels: { show: true, position: 'outside' },
    tooltip: { total: false },
    legend: { position: 'top', align: 'center' },
  });
  return () => chart.destroy();
}
