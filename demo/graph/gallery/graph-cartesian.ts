import { createGraphChart, type GraphLink } from 'openchartscandle/graph';

// Um grafo num sistema de eixos: cada nó está no seu mês (x) e valor (y) e as ligações seguem a ordem,
// com algumas curvas a saltar meses. Roda do rato para zoom (os eixos acompanham). Dados gerados.
const VALUES = [42, 58, 51, 73, 66, 88, 79, 95, 70, 84, 62, 90];

export function mount(el: HTMLElement): () => void {
  const nodes = VALUES.map((v, i) => ({ id: `m${i + 1}`, name: `Mês ${i + 1}`, x: i + 1, y: v, value: v }));
  const links: GraphLink[] = nodes.slice(1).map((n, i) => ({ source: nodes[i].id, target: n.id }));
  links.push(
    { source: 'm2', target: 'm6', curveness: 0.3, dash: [4, 3] },
    { source: 'm6', target: 'm8', curveness: 0.3, dash: [4, 3] },
    { source: 'm4', target: 'm10', curveness: -0.2, dash: [4, 3] },
  );
  const chart = createGraphChart(el, {
    nodes,
    links,
    axes: { x: { min: 0, max: 13, name: 'Mês' }, y: { min: 30, max: 100, name: 'Valor' } },
    symbolSize: 16,
    label: { show: true, position: 'top', format: (n) => String(n.value) },
    edge: { arrow: true, width: 1.5, color: '#5b8cff' },
  });
  return () => chart.destroy();
}
