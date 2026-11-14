import { createTreemap } from 'openchartscandle/treemap';
import { FAMILY } from '../data';

// O sunburst mais simples: uma árvore de família em anéis, do centro para fora.
// Cada setor tem o ângulo proporcional ao seu valor; clica num setor para o pôr ao centro.
export function mount(el: HTMLElement): () => void {
  const chart = createTreemap(el, {
    type: 'sunburst',
    data: FAMILY,
    rootName: 'Família',
    breadcrumb: false,
    sunburst: { innerRadius: 0, radius: 0.92 },
  });
  return () => chart.destroy();
}
