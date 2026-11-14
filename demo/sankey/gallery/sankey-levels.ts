import { createSankeyChart } from 'openchartscandle/sankey';
import { incomeLevels, incomeStatement } from '../data';

// Níveis (levels): a demonstração de resultados de uma tecnológica imaginária (mil milhões de $, inventado).
// Cada coluna tem a sua cor e a sua opacidade das ligações; os lucros são verdes e os custos vermelhos
// (itemStyle de cada nó, por cima dos níveis).
export function mount(el: HTMLElement): () => void {
  const chart = createSankeyChart(el, {
    ...incomeStatement(),
    nodeAlign: 'left',
    levels: incomeLevels,
    nodeGap: 12,
    label: { formatter: (n) => `${n.name}\n$${n.value} mM` },
    valueFormat: (v) => `$${v} mM`,
  });
  return () => chart.destroy();
}
