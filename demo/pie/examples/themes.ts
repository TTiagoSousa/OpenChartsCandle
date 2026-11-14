import { createPieChart, type PieChart } from 'openchartscandle/pie';
import { h, sectors } from '../data';

// Temas: escuro (padrão), claro e um tema próprio (fundo, texto, linhas, tooltip, contorno).
export function mount(el: HTMLElement): () => void {
  const cells = [0, 1, 2].map(() => h('div', { class: 'ex-cell' }));
  el.append(h('div', { class: 'ex-grid-3' }, ...cells));
  const common = { data: sectors, innerRadius: 0.5, sort: 'desc' as const, legend: { position: 'bottom' as const, values: false }, valueFormatter: (v: number) => `${v}%` };

  const charts: PieChart[] = [
    createPieChart(cells[0], { ...common, theme: 'dark', center: { title: 'Tema escuro', value: 'S&P 500' } }),
    createPieChart(cells[1], { ...common, theme: 'light', center: { title: 'Tema claro', value: 'S&P 500' } }),
    createPieChart(cells[2], {
      ...common,
      padAngle: 1.5,
      cornerRadius: 4,
      colors: ['#00e0c6', '#ff4d8d', '#ffe600', '#7c4dff', '#00b0ff', '#ff6d00', '#76ff03', '#f50057', '#18ffff', '#ffd740', '#e040fb'],
      theme: {
        background: '#0b1020',
        text: '#e6e9ef',
        muted: '#7f8aa3',
        line: '#2a3552',
        tooltipBg: '#111a33',
        tooltipBorder: '#00e0c6',
        tooltipText: '#e6e9ef',
      },
      center: { title: 'Tema próprio', value: 'S&P 500' },
    }),
  ];

  return () => charts.forEach((c) => c.destroy());
}
