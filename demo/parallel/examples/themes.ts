import { createParallelChart, type ParallelOptions } from 'openchartscandle/parallel';
import { STOCK_AXES, stocks, treemapGrid } from '../data';

// Temas: escuro (por omissão), claro, um tema próprio e um gráfico sem fundo dentro de um card.
const list = stocks(120, 21);
const base: ParallelOptions = {
  axes: STOCK_AXES,
  series: [{ name: 'Empresas', data: list.map((s) => ({ name: s.name, value: s.value })) }],
  visualMap: { dimension: 4, show: false },
  opacity: 0.55,
  lineWidth: 1,
  axisName: { fontSize: 11 },
  axisLabel: { fontSize: 10 },
};

export function mount(el: HTMLElement): () => void {
  const hosts = treemapGrid(el, ['Escuro', 'Claro', 'Tema próprio', "Num card (background: 'transparent')"], 300);
  hosts[1].parentElement!.className = 'pc-demo-card';
  hosts[3].parentElement!.style.background = 'linear-gradient(135deg, #1e3c72, #2a5298)';
  const charts = [
    createParallelChart(hosts[0], base),
    createParallelChart(hosts[1], { ...base, theme: 'light', visualMap: { dimension: 4, show: false, colors: ['#1565c0', '#90caf9', '#ffcc80', '#e65100'] } }),
    createParallelChart(hosts[2], {
      ...base,
      theme: { background: '#0b0f19', text: '#e0e6f0', axis: 'rgba(0, 229, 255, 0.5)', muted: '#6b8299', brushFill: 'rgba(0, 229, 255, 0.15)', brushBorder: '#00e5ff' },
      visualMap: { dimension: 2, show: false, colors: ['#00e5ff', '#7c4dff', '#ff4081'] },
      smooth: true,
    }),
    createParallelChart(hosts[3], {
      ...base,
      background: 'transparent',
      layout: 'vertical',
      visualMap: undefined,
      series: [{ name: 'Empresas', color: '#ffd54f', data: list.map((s) => ({ name: s.name, value: s.value })) }],
      theme: { text: '#ffffff', muted: 'rgba(255, 255, 255, 0.7)', axis: 'rgba(255, 255, 255, 0.5)', inactive: '#ffffff' },
      opacity: 0.6,
    }),
  ];
  charts[0].setBrush([{ axis: 2, from: 1.1, to: 2 }]);
  charts[2].setBrush([{ axis: 0, from: 20, to: 60 }]);
  return () => charts.forEach((c) => c.destroy());
}
