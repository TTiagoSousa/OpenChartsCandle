import { createFunnelChart, type FunnelOptions } from 'openchartscandle/funnel';
import { treemapGrid } from '../../treemap/data';
import { signupFunnel } from '../data';

// Temas: escuro (por omissão), claro, um tema próprio e um funil sem fundo dentro de um card.
const base: FunnelOptions = { data: signupFunnel(), legend: false, label: { fontSize: 11 }, gap: 2 };

export function mount(el: HTMLElement): () => void {
  const hosts = treemapGrid(el, ['Escuro', 'Claro', 'Tema próprio', "Num card (background: 'transparent')"], 300);
  hosts[1].parentElement!.className = 'pc-demo-card';
  hosts[3].parentElement!.style.background = 'linear-gradient(135deg, #1e3c72, #2a5298)';
  const charts = [
    createFunnelChart(hosts[0], base),
    createFunnelChart(hosts[1], { ...base, theme: 'light' }),
    createFunnelChart(hosts[2], {
      ...base,
      theme: { background: '#0b0f19', text: '#e0e6f0' },
      colors: ['#00e5ff', '#18c8f0', '#3aa8e6', '#6a86dc', '#d500f9'],
      minSize: '20%',
      label: { position: 'inside', fontSize: 11 },
    }),
    createFunnelChart(hosts[3], {
      ...base,
      background: 'transparent',
      sort: 'ascending',
      colors: ['#ffffff', '#e3f2fd', '#bbdefb', '#90caf9', '#ffd54f'],
      label: { fontSize: 11, color: '#ffffff' },
      labelLine: { color: 'rgba(255, 255, 255, 0.6)' },
    }),
  ];
  return () => charts.forEach((c) => c.destroy());
}
