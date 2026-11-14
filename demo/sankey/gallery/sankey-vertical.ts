import { createSankeyChart } from 'openchartscandle/sankey';
import { budgetFlow, eur } from '../data';

// O mesmo orçamento a correr de cima para baixo (orient: 'vertical'), com as etiquetas por baixo dos nós e por
// cima dos da última linha.
export function mount(el: HTMLElement): () => void {
  const chart = createSankeyChart(el, {
    ...budgetFlow(),
    orient: 'vertical',
    nodeWidth: 16,
    nodeGap: 14,
    label: { fontSize: 11 },
    lineStyle: { color: 'gradient', opacity: 0.4 },
    valueFormat: eur,
  });
  return () => chart.destroy();
}
