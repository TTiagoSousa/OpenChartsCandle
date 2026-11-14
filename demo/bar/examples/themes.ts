import { createBarChart, type BarChart, type BarOptions } from 'openchartscandle/bar';
import { QUARTERS, h } from '../data';

// Temas: escuro (padrão), claro e um tema próprio (fundo, texto, grelha, eixos, tooltip).
export function mount(el: HTMLElement): () => void {
  const cells = [0, 1, 2].map(() => h('div', { class: 'ex-cell' }));
  el.append(h('div', { class: 'ex-grid-3' }, ...cells));
  const common: BarOptions = {
    categories: QUARTERS,
    series: [
      { name: 'Receita', data: [131, 149, 158, 181] },
      { name: 'Custos', data: [98, 104, 111, 120] },
      { name: 'Lucro', data: [33, 45, 47, 61] },
    ],
    legend: { position: 'bottom', align: 'center' },
    radius: 4,
  };
  const charts: BarChart[] = [
    createBarChart(cells[0], { ...common, theme: 'dark' }),
    createBarChart(cells[1], { ...common, theme: 'light' }),
    createBarChart(cells[2], {
      ...common,
      colors: ['#00e0c6', '#ff4d8d', '#ffe600'],
      radius: 0,
      theme: {
        background: '#0b1020',
        text: '#e6e9ef',
        muted: '#7f8aa3',
        grid: 'rgba(0,224,198,0.08)',
        axis: '#1f2a44',
        hover: 'rgba(0,224,198,0.06)',
        tooltipBg: '#111a33',
        tooltipBorder: '#00e0c6',
        tooltipText: '#e6e9ef',
      },
    }),
  ];
  return () => charts.forEach((c) => c.destroy());
}
