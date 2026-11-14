import { createGraphChart } from 'openchartscandle/graph';
import { lesMiserables } from '../data';

// As mesmas personagens de Os Miseráveis num layout de forças: as que aparecem juntas muitas vezes ficam
// mais perto (ligações com valor maior são mais curtas). Só as personagens principais têm o nome à vista.
// Nomes e grupos do conjunto de Knuth; ligações reduzidas e aproximadas.
export function mount(el: HTMLElement): () => void {
  const data = lesMiserables();
  const chart = createGraphChart(el, {
    ...data,
    nodes: data.nodes.map((n) => ({ ...n, label: (n.value ?? 0) >= 25 })),
    symbolSize: [5, 30],
    force: { repulsion: 120, edgeLength: [25, 80], gravity: 0.1 },
    edge: { color: 'source', opacity: 0.4 },
  });
  return () => chart.destroy();
}
