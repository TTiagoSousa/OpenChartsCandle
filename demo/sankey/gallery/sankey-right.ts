import { createSankeyChart } from 'openchartscandle/sankey';
import { energyFlows } from '../data';

// nodeAlign: 'right': cada nó fica encostado ao fim, pela distância ao último destino, por isso as fontes que
// têm um caminho mais curto (a hídrica, a eólica, a solar e a geotermia, que vão direto às redes) começam uma
// coluna mais à direita.
export function mount(el: HTMLElement): () => void {
  const chart = createSankeyChart(el, {
    ...energyFlows(),
    nodeAlign: 'right',
    nodeWidth: 12,
    nodeGap: 6,
    lineStyle: { color: 'target', opacity: 0.3 },
    label: { fontSize: 10 },
    valueFormat: (v) => `${v.toLocaleString('pt-PT')} PJ`,
  });
  return () => chart.destroy();
}
