import { createBarChart } from 'openchartscandle/bar';
import { exchanges, volume24h } from '../data';

// Barras horizontais em ranking: orientation 'horizontal', ordenadas do maior para o menor,
// valor à frente de cada barra e barras com espessura máxima.
export function mount(el: HTMLElement): () => void {
  const chart = createBarChart(el, {
    orientation: 'horizontal',
    categories: exchanges,
    series: [{ name: 'Volume 24h', data: volume24h, color: '#2962ff' }],
    sort: 'desc',
    maxBarWidth: 26,
    radius: 5,
    labels: { show: true, format: (v) => `$${v.toFixed(1)}B` },
    valueAxis: { format: (v) => `$${v}B`, title: 'Volume spot (mil milhões USD)' },
    valueFormatter: (v) => `$${v.toFixed(1)}B`,
  });
  return () => chart.destroy();
}
