import { createTreeChart } from 'openchartscandle/tree';
import { libraryTree } from '../data';

// Árvore da direita para a esquerda: a raiz fica à direita e as etiquetas trocam de lado.
export function mount(el: HTMLElement): () => void {
  const chart = createTreeChart(el, {
    data: libraryTree(),
    orient: 'RL',
    symbolSize: 8,
    label: { fontSize: 11 },
  });
  return () => chart.destroy();
}
