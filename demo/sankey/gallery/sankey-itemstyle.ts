import { createSankeyChart } from 'openchartscandle/sankey';
import { eur, rebalance } from '../data';

// Cada nó com o seu itemStyle (cor, borda e cantos redondos): o rebalanceamento de uma carteira, de janeiro para
// dezembro (valores inventados). Cada classe de ativos tem a mesma cor nas duas colunas.
export function mount(el: HTMLElement): () => void {
  const chart = createSankeyChart(el, {
    ...rebalance(),
    nodeWidth: 14,
    nodeGap: 12,
    lineStyle: { color: 'source', opacity: 0.3, curveness: 0.6 },
    label: { formatter: (n) => n.name.split(' · ')[0] },
    valueFormat: eur,
  });
  return () => chart.destroy();
}
