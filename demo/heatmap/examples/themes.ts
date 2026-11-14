import { createHeatmapChart, type HeatmapOptions } from 'openchartscandle/heatmap';
import { treemapGrid } from '../../treemap/data';
import { HOURS, WEEKDAYS, punchCard } from '../data';

// Temas: escuro (por omissão), claro, um tema próprio e um mapa de calor sem fundo dentro de um card. Dados gerados.
const base: HeatmapOptions = {
  xAxis: { data: HOURS },
  yAxis: { data: WEEKDAYS.map((d) => d.slice(0, 3)), inverse: true },
  data: punchCard(5),
  visualMap: { min: 0, max: 10, show: false },
  cell: { gap: 2, radius: 2 },
};

export function mount(el: HTMLElement): () => void {
  const hosts = treemapGrid(el, ['Escuro', 'Claro', 'Tema próprio', "Num card (background: 'transparent')"], 260);
  hosts[1].parentElement!.className = 'pc-demo-card';
  hosts[3].parentElement!.style.background = 'linear-gradient(135deg, #1e3c72, #2a5298)';
  const charts = [
    createHeatmapChart(hosts[0], base),
    createHeatmapChart(hosts[1], { ...base, theme: 'light', visualMap: { min: 0, max: 10, show: false, colors: ['#ebedf0', '#9be9a8', '#40c463', '#216e39'] } }),
    createHeatmapChart(hosts[2], {
      ...base,
      theme: { background: '#0b0f19', text: '#e0e6f0', muted: '#5c6b84', axis: '#1c2740', cell: '#141c2e' },
      visualMap: { min: 0, max: 10, show: false, colors: ['#141c2e', '#d500f9', '#00e5ff'] },
      cell: { gap: 3, radius: 6 },
      emphasis: 'cross',
    }),
    createHeatmapChart(hosts[3], {
      ...base,
      background: 'transparent',
      theme: { muted: 'rgba(255,255,255,0.75)', axis: 'rgba(255,255,255,0.3)', cell: 'rgba(255,255,255,0.06)' },
      visualMap: { min: 0, max: 10, show: false, colors: ['rgba(255,255,255,0.08)', 'rgba(255,255,255,0.95)'] },
    }),
  ];
  return () => charts.forEach((c) => c.destroy());
}
