import { createTreeChart, type TreeChartOptions } from 'openchartscandle/tree';
import { treemapGrid } from '../../treemap/data';
import { orgTree } from '../data';

// Temas: escuro (por omissão), claro, um tema próprio e uma árvore sem fundo dentro de um card.
const base: TreeChartOptions = { data: orgTree(), label: { fontSize: 10 }, symbolSize: 6 };

export function mount(el: HTMLElement): () => void {
  const hosts = treemapGrid(el, ['Escuro', 'Claro', 'Tema próprio', "Num card (background: 'transparent')"], 300);
  hosts[1].parentElement!.className = 'pc-demo-card';
  hosts[3].parentElement!.style.background = 'linear-gradient(135deg, #1e3c72, #2a5298)';
  const charts = [
    createTreeChart(hosts[0], base),
    createTreeChart(hosts[1], { ...base, theme: 'light' }),
    createTreeChart(hosts[2], {
      ...base,
      theme: { background: '#0b0f19', text: '#e0e6f0', edge: 'rgba(0, 229, 255, 0.35)', symbolFill: '#0b0f19' },
      color: '#00e5ff',
      edgeShape: 'polyline',
      symbol: 'diamond',
    }),
    createTreeChart(hosts[3], {
      ...base,
      background: 'transparent',
      color: '#ffd54f',
      symbol: 'circle',
      layout: 'radial',
      edge: { color: 'rgba(255, 255, 255, 0.4)' },
      label: { fontSize: 10, color: '#ffffff' },
    }),
  ];
  return () => charts.forEach((c) => c.destroy());
}
