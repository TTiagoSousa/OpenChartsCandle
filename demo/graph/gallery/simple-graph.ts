import { createGraphChart } from 'openchartscandle/graph';

// O grafo mais simples: quatro nós em posições fixas (layout 'none'), setas, ligações curvas nos dois
// sentidos e texto no meio de cada ligação. Os nós arrastam-se.
export function mount(el: HTMLElement): () => void {
  const chart = createGraphChart(el, {
    layout: 'none',
    nodes: [
      { id: '1', name: 'Nó 1', x: 300, y: 300 },
      { id: '2', name: 'Nó 2', x: 800, y: 300 },
      { id: '3', name: 'Nó 3', x: 550, y: 100 },
      { id: '4', name: 'Nó 4', x: 550, y: 500 },
    ],
    links: [
      { source: '2', target: '1', label: 'pede', curveness: 0.2 },
      { source: '1', target: '2', label: 'responde', curveness: 0.2 },
      { source: '1', target: '3', label: 'liga' },
      { source: '2', target: '3', label: 'liga' },
      { source: '2', target: '4', label: 'envia' },
      { source: '1', target: '4', label: 'envia' },
    ],
    symbolSize: 50,
    label: { show: true, position: 'inside', fontWeight: 600 },
    edge: { arrow: true, arrowSize: 9, width: 2 },
  });
  return () => chart.destroy();
}
