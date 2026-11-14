import { createTreemap } from 'openchartscandle/treemap';
import { COFFEE_FLAVORS } from '../data';

// A roda de sabores do café: categoria, grupo e sabor, cada um com a sua cor (color em cada nó).
// Anéis com raios próprios por nível; o anel de fora é fino e tem as etiquetas do lado de fora.
export function mount(el: HTMLElement): () => void {
  const chart = createTreemap(el, {
    type: 'sunburst',
    data: COFFEE_FLAVORS,
    rootName: 'Café',
    sort: false,
    breadcrumb: false,
    tooltip: { formatter: (n) => `<b>${n.path.join(' › ')}</b>` },
    sunburst: { innerRadius: 0, gap: 1 },
    levels: [
      { r0: '12%', r: '34%', label: { rotate: 'tangential', fontWeight: 600 } },
      { r0: '34%', r: '62%', label: { align: 'right', fontSize: 10 } },
      { r0: '62%', r: '65%', label: { position: 'outside', fontSize: 10 } },
    ],
  });
  return () => chart.destroy();
}
