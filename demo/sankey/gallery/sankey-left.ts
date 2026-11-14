import { createSankeyChart } from 'openchartscandle/sankey';
import { energyFlows } from '../data';

// nodeAlign: 'left': cada nó fica na coluna da sua profundidade (o caminho mais longo desde uma fonte), por isso
// as perdas e os destinos que acabam cedo ficam a meio do gráfico em vez de irem para a última coluna.
export function mount(el: HTMLElement): () => void {
  const chart = createSankeyChart(el, {
    ...energyFlows(),
    nodeAlign: 'left',
    nodeWidth: 12,
    nodeGap: 6,
    lineStyle: { color: 'source', opacity: 0.3 },
    label: { fontSize: 10 },
    valueFormat: (v) => `${v.toLocaleString('pt-PT')} PJ`,
  });
  return () => chart.destroy();
}
