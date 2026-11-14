import { createGraphChart } from 'openchartscandle/graph';
import { communityNetwork } from '../data';

// As dependências entre 400 módulos de um motor de browser, por categoria, num layout de forças compacto
// (molas curtas, pouca repulsão e mais gravidade). Inspirado no grafo de dependências do WebKit; dados gerados.
const CATS = ['Core', 'DOM', 'CSS', 'SVG', 'JavaScript', 'Rede', 'Gráficos', 'Plataforma'];

export function mount(el: HTMLElement): () => void {
  const net = communityNetwork(400, CATS, 19, 0.7);
  const chart = createGraphChart(el, {
    ...net,
    nodes: net.nodes.map((n, i) => ({ ...n, name: `${CATS[n.category as number]}/módulo-${i + 1}` })),
    symbolSize: [5, 14],
    force: { repulsion: 22, edgeLength: 10, gravity: 0.18 },
    edge: { opacity: 0.6, width: 0.6 },
    nodeStyle: { borderWidth: 0.5 },
  });
  return () => chart.destroy();
}
