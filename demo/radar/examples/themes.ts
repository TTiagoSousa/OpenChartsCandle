import { createRadarChart, type RadarOptions } from 'openchartscandle/radar';
import { treemapGrid } from '../../treemap/data';

// Temas: escuro (por omissão), claro, um tema próprio e um radar sem fundo dentro de um card.
const base: RadarOptions = {
  indicators: ['Velocidade', 'Força', 'Defesa', 'Técnica', 'Resistência'].map((name) => ({ name, max: 100 })),
  series: [
    { name: 'A', data: [92, 64, 70, 85, 60], area: true },
    { name: 'B', data: [60, 85, 88, 55, 78], area: true },
  ],
  legend: false,
};

export function mount(el: HTMLElement): () => void {
  const hosts = treemapGrid(el, ['Escuro', 'Claro', 'Tema próprio', "Num card (background: 'transparent')"], 300);
  hosts[1].parentElement!.className = 'pc-demo-card';
  hosts[3].parentElement!.style.background = 'linear-gradient(135deg, #1e3c72, #2a5298)';
  const charts = [
    createRadarChart(hosts[0], { ...base, splitArea: true }),
    createRadarChart(hosts[1], { ...base, theme: 'light', splitArea: true }),
    createRadarChart(hosts[2], {
      ...base,
      shape: 'circle',
      theme: { background: '#0b0f19', text: '#e0e6f0', muted: '#5c6b84', grid: 'rgba(0,229,255,0.25)', bands: ['rgba(0,229,255,0.03)', 'rgba(0,229,255,0.08)'] },
      colors: ['#00e5ff', '#d500f9'],
      splitArea: true,
    }),
    createRadarChart(hosts[3], {
      ...base,
      background: 'transparent',
      colors: ['#ffffff', '#ffd54f'],
      splitLine: { color: 'rgba(255,255,255,0.3)' },
      axisLine: { color: 'rgba(255,255,255,0.3)' },
      axisName: { color: 'rgba(255,255,255,0.85)' },
    }),
  ];
  return () => charts.forEach((c) => c.destroy());
}
