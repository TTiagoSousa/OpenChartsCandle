import { heatmapCorrelation } from 'openchartscandle/heatmap';
import { createMatrixChart, type MatrixOptions } from 'openchartscandle/matrix';
import { treemapGrid } from '../../treemap/data';
import { ASSETS, assetReturns } from '../data';

// Temas: escuro (por omissão), claro, um tema próprio e uma matriz sem fundo dentro de um card.
const names = ASSETS.slice(0, 5);
const corr = heatmapCorrelation(assetReturns().slice(0, 5)).map((r) => r.map((v) => +v.toFixed(2)));
const base: MatrixOptions = {
  x: { data: names, label: { fontSize: 10 } },
  y: { data: names, label: { fontSize: 10 } },
  data: corr,
  visualMap: { min: -1, max: 1, show: false },
  label: { fontSize: 11 },
  valueFormatter: (v) => v.toFixed(2),
};

export function mount(el: HTMLElement): () => void {
  const hosts = treemapGrid(el, ['Escuro', 'Claro', 'Tema próprio', "Num card (background: 'transparent')"], 300);
  hosts[1].parentElement!.className = 'pc-demo-card';
  hosts[3].parentElement!.style.background = 'linear-gradient(135deg, #1e3c72, #2a5298)';
  const charts = [
    createMatrixChart(hosts[0], base),
    createMatrixChart(hosts[1], { ...base, theme: 'light', visualMap: { min: -1, max: 1, show: false, colors: ['#1565c0', '#90caf9', '#f5f5f5', '#ef9a9a', '#c62828'] } }),
    createMatrixChart(hosts[2], {
      ...base,
      theme: { background: '#0b0f19', text: '#e0e6f0', headerBg: '#111827', cornerBg: '#111827', headerText: '#00e5ff', border: '#1f2937', hover: 'rgba(0, 229, 255, 0.12)' },
      visualMap: { min: -1, max: 1, show: false, colors: ['#d500f9', '#3b0a57', '#0b0f19', '#00525c', '#00e5ff'] },
      gap: 3,
      itemStyle: { radius: 6 },
    }),
    createMatrixChart(hosts[3], {
      ...base,
      background: 'transparent',
      visualMap: { min: -1, max: 1, show: false, colors: ['rgba(255,255,255,0.05)', 'rgba(255,255,255,0.15)', 'rgba(255,213,79,0.9)'] },
      label: { fontSize: 11, color: '#ffffff' },
      x: { data: names, label: { fontSize: 10, color: '#ffffff' } },
      y: { data: names, label: { fontSize: 10, color: '#ffffff' } },
    }),
  ];
  return () => charts.forEach((c) => c.destroy());
}
