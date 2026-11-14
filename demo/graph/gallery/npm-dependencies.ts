import { createGraphChart, graphForceLayout } from 'openchartscandle/graph';
import { npmGraph } from '../data';

// 1500 pacotes e as suas dependências, como no npm. As posições são calculadas uma vez com
// graphForceLayout() e o grafo é desenhado com layout 'none', por isso o zoom e o pan são fluidos. A cor é
// o ecossistema de cada pacote (com o nome do pacote que está na raiz); o tamanho, quantos pacotes dependem
// dele. Só os mais usados têm o nome à vista: faz zoom para ver mais. Dados gerados.
export function mount(el: HTMLElement): () => void {
  const { nodes, links } = npmGraph(1500, 8, 2);
  const pos = graphForceLayout(nodes, links, { repulsion: 40, edgeLength: 18, gravity: 0.06, iterations: 160 });
  const chart = createGraphChart(el, {
    nodes: nodes.map((n, i) => ({ ...n, x: pos[i].x, y: pos[i].y, label: (n.value ?? 0) >= 12 })),
    links,
    categories: nodes.slice(0, 8).map((n) => n.name!),
    layout: 'none',
    symbolSize: [3, 30],
    label: { fontSize: 10, hideOverlap: true },
    edge: { width: 0.5, opacity: 0.6 },
    nodeStyle: { borderWidth: 0 },
    legend: { position: 'right' },
  });
  return () => chart.destroy();
}
