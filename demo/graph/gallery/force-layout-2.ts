import { createGraphChart, type GraphLink } from 'openchartscandle/graph';
import { seeded } from '../data';

// Outro layout de forças: nós grandes, numerados, que não se sobrepõem (collide). Arrasta um nó e o resto
// da rede segue-o; ao largar volta a acalmar. Dados gerados.
export function mount(el: HTMLElement): () => void {
  const rnd = seeded(21);
  const nodes = Array.from({ length: 36 }, (_, i) => ({ id: String(i + 1), value: 10 + Math.round(rnd() * 90), category: i % 4 }));
  const links: GraphLink[] = nodes.slice(1).map((n, i) => ({ source: n.id, target: String(1 + Math.floor(rnd() * (i + 1))) }));
  for (let k = 0; k < 10; k++) links.push({ source: String(1 + Math.floor(rnd() * 36)), target: String(1 + Math.floor(rnd() * 36)) });
  const chart = createGraphChart(el, {
    nodes,
    links,
    categories: ['Norte', 'Sul', 'Este', 'Oeste'],
    symbolSize: [22, 48],
    label: { show: true, position: 'inside', fontWeight: 600 },
    force: { repulsion: 220, edgeLength: 60, collide: 4, gravity: 0.12 },
    edge: { width: 2, curveness: 0.15 },
  });
  return () => chart.destroy();
}
