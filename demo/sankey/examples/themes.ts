import { createSankeyChart, type SankeyOptions } from 'openchartscandle/sankey';
import { treemapGrid } from '../../treemap/data';
import { budgetFlow, eur } from '../data';

// Temas: escuro (por omissão), claro, um tema próprio e um sankey sem fundo dentro de um card.
const base: SankeyOptions = { ...budgetFlow(), label: { fontSize: 11 }, nodeWidth: 14, valueFormat: eur };

export function mount(el: HTMLElement): () => void {
  const hosts = treemapGrid(el, ['Escuro', 'Claro', 'Tema próprio', "Num card (background: 'transparent')"], 300);
  hosts[1].parentElement!.className = 'pc-demo-card';
  hosts[3].parentElement!.style.background = 'linear-gradient(135deg, #1e3c72, #2a5298)';
  const charts = [
    createSankeyChart(hosts[0], base),
    createSankeyChart(hosts[1], { ...base, theme: 'light', lineStyle: { color: 'gradient', opacity: 0.35 } }),
    createSankeyChart(hosts[2], {
      ...base,
      theme: { background: '#0b0f19', text: '#e0e6f0', tooltipBg: '#111827', tooltipBorder: '#00e5ff55' },
      colors: ['#00e5ff', '#7c4dff', '#ff4081', '#69f0ae', '#ffd740'],
      itemStyle: { borderRadius: 4 },
      lineStyle: { color: 'gradient', opacity: 0.5, curveness: 0.7 },
    }),
    createSankeyChart(hosts[3], {
      ...base,
      background: 'transparent',
      itemStyle: { color: '#ffd54f' },
      lineStyle: { color: 'rgba(255, 255, 255, 0.9)', opacity: 0.25 },
      label: { fontSize: 11, color: '#ffffff' },
    }),
  ];
  return () => charts.forEach((c) => c.destroy());
}
