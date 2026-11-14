import { createTreeChart } from 'openchartscandle/tree';
import { marketsTree } from '../data';

// Árvore da esquerda para a direita: a raiz à esquerda, as folhas à direita. Clica num nó para o fechar ou abrir.
export function mount(el: HTMLElement): () => void {
  const chart = createTreeChart(el, {
    data: marketsTree(),
    orient: 'LR',
    initialDepth: 2,
    label: { fontSize: 11 },
  });
  return () => chart.destroy();
}
