import { createGraphChart } from 'openchartscandle/graph';
import { communityNetwork } from '../data';

// Layout de forças: 160 nós em oito comunidades organizam-se sozinhos (repulsão entre todos, molas nas
// ligações e gravidade para o centro). O tamanho é o número de ligações. Dados gerados.
export function mount(el: HTMLElement): () => void {
  const net = communityNetwork(160, ['Alfa', 'Beta', 'Gama', 'Delta', 'Épsilon', 'Zeta', 'Eta', 'Teta'], 7);
  const chart = createGraphChart(el, {
    ...net,
    layout: 'force',
    symbolSize: [6, 26],
    force: { repulsion: 70, edgeLength: 30, gravity: 0.1 },
    edge: { color: 'source', opacity: 0.45 },
  });
  return () => chart.destroy();
}
