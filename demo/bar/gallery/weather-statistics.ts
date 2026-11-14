import { createBarChart } from 'openchartscandle/bar';

// Estatísticas do tempo: dias de cada tipo por cidade, com ícones nos nomes das categorias.
const LABELS: Record<string, string> = { sunny: '☀️ Ensolarado', cloudy: '☁️ Nublado', showers: '🌧️ Aguaceiros' };

export function mount(el: HTMLElement): () => void {
  const chart = createBarChart(el, {
    orientation: 'horizontal',
    categories: ['sunny', 'cloudy', 'showers'],
    series: [
      { name: 'Lisboa', data: [165, 170, 30] },
      { name: 'Porto', data: [120, 180, 65] },
      { name: 'Faro', data: [210, 130, 25] },
    ],
    categoryAxis: { format: (c) => LABELS[c] ?? c },
    labels: { show: true, position: 'outside' },
    legend: { position: 'top', align: 'center' },
    valueFormatter: (v) => `${v} dias`,
  });
  return () => chart.destroy();
}
