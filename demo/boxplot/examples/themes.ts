import { createBoxplotChart, type BoxplotOptions } from 'openchartscandle/boxplot';
import { treemapGrid } from '../../treemap/data';
import { normalSamples } from '../data';

// Temas: escuro (por omissão), claro, um tema próprio e um boxplot sem fundo dentro de um card. Dados gerados.
const base: BoxplotOptions = {
  categories: ['A', 'B', 'C', 'D'],
  series: [
    { name: 'Antes', samples: [0, 1, 2, 3].map((i) => normalSamples(40, 50 + i * 6, 8, 20 + i)) },
    { name: 'Depois', samples: [0, 1, 2, 3].map((i) => normalSamples(40, 58 + i * 4, 6, 40 + i)) },
  ],
  legend: false,
};

export function mount(el: HTMLElement): () => void {
  const hosts = treemapGrid(el, ['Escuro', 'Claro', 'Tema próprio', "Num card (background: 'transparent')"], 300);
  hosts[1].parentElement!.className = 'pc-demo-card';
  hosts[3].parentElement!.style.background = 'linear-gradient(135deg, #1e3c72, #2a5298)';
  const charts = [
    createBoxplotChart(hosts[0], base),
    createBoxplotChart(hosts[1], { ...base, theme: 'light' }),
    createBoxplotChart(hosts[2], {
      ...base,
      theme: { background: '#0b0f19', text: '#e0e6f0', muted: '#5c6b84', grid: 'rgba(0,229,255,0.12)', axis: 'rgba(0,229,255,0.4)' },
      colors: ['#00e5ff', '#d500f9'],
      valueAxis: { gridDash: [3, 3] },
      mean: true,
    }),
    createBoxplotChart(hosts[3], {
      ...base,
      background: 'transparent',
      theme: { text: '#ffffff', muted: 'rgba(255,255,255,0.75)', grid: 'rgba(255,255,255,0.15)', axis: 'rgba(255,255,255,0.4)' },
      colors: ['#ffffff', '#ffd54f'],
      series: base.series!.map((s) => ({ ...s, fill: 0.15 })),
    }),
  ];
  return () => charts.forEach((c) => c.destroy());
}
