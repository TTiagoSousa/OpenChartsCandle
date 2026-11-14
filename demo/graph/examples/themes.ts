import { createGraphChart, type GraphOptions } from 'openchartscandle/graph';
import { treemapGrid } from '../../treemap/data';
import { communityNetwork } from '../data';

// Temas: escuro (por omissão), claro, um tema próprio e um grafo sem fundo dentro de um card. Dados gerados.
const net = communityNetwork(40, ['A', 'B', 'C'], 3);
const base: GraphOptions = { ...net, symbolSize: [8, 20], legend: false, force: { repulsion: 70, edgeLength: 30 } };

export function mount(el: HTMLElement): () => void {
  const hosts = treemapGrid(el, ['Escuro', 'Claro', 'Tema próprio', "Num card (background: 'transparent')"], 300);
  hosts[1].parentElement!.className = 'pc-demo-card';
  hosts[3].parentElement!.style.background = 'linear-gradient(135deg, #1e3c72, #2a5298)';
  const charts = [
    createGraphChart(hosts[0], base),
    createGraphChart(hosts[1], { ...base, theme: 'light' }),
    createGraphChart(hosts[2], {
      ...base,
      theme: { background: '#0b0f19', text: '#e0e6f0', muted: '#5c6b84', edge: 'rgba(0,229,255,0.35)', nodeBorder: '#0b0f19' },
      colors: ['#00e5ff', '#d500f9', '#76ff03'],
      symbol: 'diamond',
      edge: { curveness: 0.25 },
    }),
    createGraphChart(hosts[3], {
      ...base,
      background: 'transparent',
      colors: ['#ffffff', '#ffd54f', '#80deea'],
      edge: { color: 'rgba(255,255,255,0.35)' },
      nodeStyle: { borderWidth: 0 },
    }),
  ];
  return () => charts.forEach((c) => c.destroy());
}
