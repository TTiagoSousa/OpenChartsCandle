import { createLineChart, type LineChart } from 'openchartscandle/line';
import { MONTHS, costs, h, profit, revenue } from '../data';

// Temas: escuro (padrão), claro e um tema próprio (fundo, texto, grelha, eixos, tooltip).
export function mount(el: HTMLElement): () => void {
  const cells = [0, 1, 2].map(() => h('div', { class: 'ex-cell' }));
  el.append(h('div', { class: 'ex-grid-3' }, ...cells));
  const series = [
    { name: 'Receita', data: revenue },
    { name: 'Custos', data: costs },
    { name: 'Lucro', data: profit, area: true },
  ];
  const common = { series, categories: MONTHS, curve: 'smooth' as const, legend: { position: 'bottom' as const, align: 'center' as const } };
  const charts: LineChart[] = [
    createLineChart(cells[0], { ...common, theme: 'dark' }),
    createLineChart(cells[1], { ...common, theme: 'light' }),
    createLineChart(cells[2], {
      ...common,
      colors: ['#00e0c6', '#ff4d8d', '#ffe600'],
      theme: {
        background: '#0b1020',
        text: '#e6e9ef',
        muted: '#7f8aa3',
        grid: 'rgba(0,224,198,0.08)',
        axis: '#1f2a44',
        crosshair: '#00e0c6',
        tooltipBg: '#111a33',
        tooltipBorder: '#00e0c6',
        tooltipText: '#e6e9ef',
      },
    }),
  ];
  return () => charts.forEach((c) => c.destroy());
}
