import { createGraphChart } from 'openchartscandle/graph';
import { communityNetwork, withToolbar } from '../data';

// Uma rede com cinco comunidades num layout de forças (dados gerados). Passa o rato num nó para acender os
// vizinhos, arrasta-o para ver a rede reagir, clica na legenda para esconder uma comunidade e usa a roda do
// rato para zoom (duplo clique no fundo volta ao início). "Nova rede" troca os dados com setData().
export function mount(el: HTMLElement): () => void {
  let seed = 11;
  const network = () => {
    const net = communityNetwork(90, ['Finanças', 'Tecnologia', 'Saúde', 'Energia', 'Consumo'], seed++);
    // the five biggest hubs keep their name on
    const hubs = new Set([...net.nodes].sort((a, b) => (b.value ?? 0) - (a.value ?? 0)).slice(0, 5).map((n) => n.id));
    return { ...net, nodes: net.nodes.map((n) => (hubs.has(n.id) ? { ...n, label: true } : n)) };
  };
  const button = document.createElement('button');
  button.className = 'ex-btn';
  button.textContent = 'Nova rede';
  const info = document.createElement('span');
  info.className = 'ex-label';
  info.textContent = 'Clica num nó.';
  const chart = createGraphChart(withToolbar(el, button, info), {
    title: { text: 'Rede de empresas', subtext: 'Ligações entre empresas de cinco setores (dados gerados)', align: 'left' },
    ...network(),
    symbolSize: [8, 28],
    force: { repulsion: 90, edgeLength: 45 },
    edge: { color: 'source', curveness: 0.1 },
    legend: { position: 'right' },
  });
  button.addEventListener('click', () => chart.setData(network()));
  chart.on('click', (p) => (info.textContent = p.type === 'node' ? `${p.name} (${p.category}): ${p.degree} ligações` : `Ligação ${p.name}`));
  return () => chart.destroy();
}
