import { createGraphChart, type GraphLink, type GraphNode } from 'openchartscandle/graph';
import { seeded } from '../data';

// Um grafo que cresce: a cada segundo nasce um nó novo, ligado a um ou dois que já existem (mais vezes aos
// que já têm muitas ligações). O layout de forças aquece um pouco e acomoda-o. Aos 100 nós recomeça. Dados gerados.
const CATS = ['0–19', '20–39', '40–59', '60–79', '80–99'];

export function mount(el: HTMLElement): () => void {
  const rnd = seeded(8);
  let nodes: GraphNode[] = [];
  let links: GraphLink[] = [];
  let ends: string[] = [];
  const reset = (): void => {
    nodes = [{ id: '0', name: 'Nó 0', category: 0 }];
    links = [];
    ends = ['0'];
  };
  const grow = (): void => {
    const id = String(nodes.length);
    const targets = new Set<string>();
    for (let j = rnd() < 0.25 ? 2 : 1; j > 0; j--) targets.add(ends[Math.floor(rnd() * ends.length)]);
    for (const t of targets) {
      links.push({ source: id, target: t });
      ends.push(t);
    }
    ends.push(id);
    nodes.push({ id, name: `Nó ${id}`, category: Math.floor(nodes.length / 20) });
  };
  reset();
  for (let i = 0; i < 4; i++) grow();
  const chart = createGraphChart(el, {
    nodes,
    links,
    categories: CATS,
    symbolSize: 12,
    force: { repulsion: 60, edgeLength: 28 },
    legend: { interactive: false },
  });
  const timer = setInterval(() => {
    if (nodes.length >= 100) reset();
    grow();
    chart.setData({ nodes: [...nodes], links: [...links], categories: CATS });
  }, 1000);
  return () => {
    clearInterval(timer);
    chart.destroy();
  };
}
