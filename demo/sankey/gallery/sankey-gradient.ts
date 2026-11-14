import { createSankeyChart } from 'openchartscandle/sankey';
import { energyFlows } from '../data';

// Ligações em gradiente, da cor da origem à do destino: os fluxos de energia de um país imaginário (40 nós e 82
// ligações, valores inventados). Passa o rato num nó para ver por onde passa a energia (emphasis: 'trajectory').
export function mount(el: HTMLElement): () => void {
  const chart = createSankeyChart(el, {
    ...energyFlows(),
    nodeWidth: 12,
    nodeGap: 6,
    lineStyle: { color: 'gradient', opacity: 0.4, curveness: 0.5 },
    emphasis: 'trajectory',
    label: { fontSize: 10 },
    valueFormat: (v) => `${v.toLocaleString('pt-PT')} PJ`,
  });
  return () => chart.destroy();
}
