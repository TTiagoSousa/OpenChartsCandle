import { createTreemap } from 'openchartscandle/treemap';

// O treemap mais simples: dois grupos com filhos; a área de cada retângulo é o seu valor.
// Clica num grupo para entrar nele e usa o caminho em baixo para voltar.
export function mount(el: HTMLElement): () => void {
  const chart = createTreemap(el, {
    data: [
      { name: 'nodeA', children: [{ name: 'nodeAa', value: 4 }, { name: 'nodeAb', value: 6 }] },
      { name: 'nodeB', children: [{ name: 'nodeBa', children: [{ name: 'nodeBa1', value: 20 }] }] },
    ],
    label: { showValue: true },
  });
  return () => chart.destroy();
}
