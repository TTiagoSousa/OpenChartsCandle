import { createTreeChart } from 'openchartscandle/tree';
import { libraryTree } from '../data';

// Árvore de baixo para cima: a raiz em baixo, como uma árvore a sério, com uma cor própria nos nós.
export function mount(el: HTMLElement): () => void {
  const chart = createTreeChart(el, {
    data: libraryTree(),
    orient: 'BT',
    color: '#089981',
    symbolSize: 8,
    label: { fontSize: 11 },
  });
  return () => chart.destroy();
}
