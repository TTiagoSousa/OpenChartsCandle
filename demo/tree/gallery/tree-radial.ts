import { createTreeChart } from 'openchartscandle/tree';
import { marketsTree } from '../data';

// Árvore radial: a raiz no centro e cada nível num anel; os nomes seguem o raio e nunca ficam de pernas para o
// ar. Roda do rato para zoom e arrasta para mover (roam).
export function mount(el: HTMLElement): () => void {
  const chart = createTreeChart(el, {
    data: marketsTree(),
    layout: 'radial',
    symbolSize: 6,
    label: { fontSize: 10 },
    roam: true,
  });
  return () => chart.destroy();
}
