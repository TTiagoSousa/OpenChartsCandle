import { createTreemap } from 'openchartscandle/treemap';
import { marketData, seeded, treemapGrid } from '../data';

// Temas: escuro (por omissão), claro e um tema próprio; e um treemap sem fundo dentro de um card.
const data = marketData(seeded(9));

export function mount(el: HTMLElement): () => void {
  const hosts = treemapGrid(el, ['Escuro', 'Claro', 'Tema próprio', "Num card (background: 'transparent')"], 320);
  hosts[1].parentElement!.className = 'pc-demo-card';
  hosts[3].parentElement!.style.background = 'linear-gradient(135deg, #1e3c72, #2a5298)';
  const charts = [
    createTreemap(hosts[0], { data, upperLabel: true }),
    createTreemap(hosts[1], { data, upperLabel: true, theme: 'light', levels: [{ gap: 3 }, { colorLightness: [0.5, 0.72] }] }),
    createTreemap(hosts[2], {
      data,
      upperLabel: true,
      theme: { background: '#0b0f19', text: '#e0e6f0', muted: '#5c6b84', tooltipBg: '#101828', tooltipBorder: '#22304a' },
      colors: ['#00e5ff', '#76ff03', '#ffea00', '#ff3d00', '#d500f9', '#2979ff', '#ff4081', '#1de9b6'],
      levels: [{ gap: 4 }, { gap: 2, colorLightness: [0.25, 0.45] }],
    }),
    createTreemap(hosts[3], {
      data,
      background: 'transparent',
      breadcrumb: false,
      colors: ['rgba(255,255,255,0.3)'],
      levels: [{ gap: 4 }, { gap: 2, colorAlpha: [0.12, 0.45] }],
    }),
  ];
  return () => charts.forEach((c) => c.destroy());
}
