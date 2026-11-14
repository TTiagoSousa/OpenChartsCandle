import { createTreeChart } from 'openchartscandle/tree';
import { marketsTree } from '../data';

// Árvore de cima para baixo: as etiquetas rodam e seguem a profundidade para caberem lado a lado.
export function mount(el: HTMLElement): () => void {
  const chart = createTreeChart(el, {
    data: marketsTree(),
    orient: 'TB',
    symbolSize: 6,
    label: { fontSize: 10 },
  });
  return () => chart.destroy();
}
