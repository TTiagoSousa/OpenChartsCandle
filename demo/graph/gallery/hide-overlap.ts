import { createGraphChart } from 'openchartscandle/graph';
import { communityNetwork, personNames } from '../data';

// Todos os nós têm nome, mas com `hideOverlap` os nomes que se tapam escondem-se (ficam os dos nós
// maiores). Faz zoom com a roda do rato para ver mais nomes. Uma rede de colegas com nomes gerados.
export function mount(el: HTMLElement): () => void {
  const net = communityNetwork(150, ['Lisboa', 'Porto', 'Coimbra', 'Braga', 'Faro'], 31);
  const names = personNames(150, 4);
  const chart = createGraphChart(el, {
    ...net,
    nodes: net.nodes.map((n, i) => ({ ...n, name: names[i] })),
    symbolSize: [6, 24],
    force: { repulsion: 110, edgeLength: 35 },
    label: { show: true, hideOverlap: true },
    edge: { color: 'source', opacity: 0.4, curveness: 0.15 },
  });
  return () => chart.destroy();
}
