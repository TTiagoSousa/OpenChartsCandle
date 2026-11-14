import { createTreeChart } from 'openchartscandle/tree';
import { orgTree } from '../data';

// Ligações em cotovelo (edgeShape: 'polyline'), como num organigrama, com nós quadrados e caixas nos nomes.
export function mount(el: HTMLElement): () => void {
  const chart = createTreeChart(el, {
    data: orgTree(),
    orient: 'LR',
    edgeShape: 'polyline',
    symbol: 'roundRect',
    symbolSize: 9,
    color: '#ff9800',
    edge: { width: 1.2 },
    label: { fontSize: 11, background: 'rgba(42, 46, 57, 0.85)' },
  });
  return () => chart.destroy();
}
