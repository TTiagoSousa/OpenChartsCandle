import { createGraphChart } from 'openchartscandle/graph';
import { lesMiserables } from '../data';

// As 77 personagens de Os Miseráveis (Victor Hugo) num círculo, juntas pelo grupo, com os nomes ao longo do
// raio. Nomes e grupos do conjunto de Knuth; as ligações são uma versão reduzida e aproximada (ver data.ts).
export function mount(el: HTMLElement): () => void {
  const chart = createGraphChart(el, {
    ...lesMiserables(),
    layout: 'circular',
    circular: { rotateLabel: true },
    symbolSize: [4, 24],
    label: { show: true, fontSize: 10 },
    edge: { color: 'source', curveness: 0.3, opacity: 0.35 },
    legend: false,
  });
  return () => chart.destroy();
}
