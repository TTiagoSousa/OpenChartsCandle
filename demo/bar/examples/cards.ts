import { createBarChart, type BarChart, type BarOptions } from 'openchartscandle/bar';
import { MONTHS, QUARTERS, h, pnl, sales2025 } from '../data';

// Barras dentro de cards: background 'transparent', eixos escondidos para mini gráficos
// e cards grandes com tema claro e com gradiente.
interface Card {
  title: string;
  value: string;
  change: string;
  up: boolean;
  className: string;
  height: number;
  options: BarOptions;
}

const mini = (data: number[], color: string): BarOptions => ({
  categories: data.map((_, i) => `Dia ${i + 1}`),
  series: [{ name: 'Valor', data, color }],
  categoryAxis: { show: false },
  valueAxis: { show: false, grid: false },
  categoryGap: 0.35,
  radius: 2,
  padding: 0,
});

const days = (seed: number): number[] => Array.from({ length: 24 }, (_, i) => Math.round(40 + 30 * Math.sin(i / 3 + seed) + ((i * 37 + seed * 11) % 17)));

const cards: Card[] = [
  { title: 'Ordens por dia', value: '1 284', change: '+8.2%', up: true, className: 'pc-demo-card--dark', height: 90, options: mini(days(1), '#2962ff') },
  { title: 'Depósitos', value: '412 k€', change: '+3.4%', up: true, className: 'pc-demo-card--dark', height: 90, options: mini(days(2), '#089981') },
  {
    title: 'P&L diário',
    value: '−1.2 k€',
    change: 'hoje',
    up: false,
    className: 'pc-demo-card--dark',
    height: 90,
    options: { ...mini(pnl.concat(pnl.map((v) => -v * 0.6)), '#089981'), colorBy: (v) => (v >= 0 ? '#089981' : '#f23645') },
  },
  {
    title: 'Vendas por mês',
    value: '86 M€',
    change: '+10.3% vs mês anterior',
    up: true,
    className: 'pc-demo-card--light pc-demo-card--wide',
    height: 230,
    options: { categories: MONTHS, series: [{ name: 'Vendas', data: sales2025, color: '#2962ff' }], theme: 'light', radius: 4, valueFormatter: (v) => `${v} M€` },
  },
  {
    title: 'Receita por região',
    value: '1.2 B€',
    change: '+18% no ano',
    up: true,
    className: 'pc-demo-card--gradient pc-demo-card--wide',
    height: 230,
    options: {
      categories: QUARTERS,
      series: [
        { name: 'Europa', data: [120, 132, 141, 160], color: '#ffffff' },
        { name: 'Américas', data: [98, 110, 118, 131], color: 'rgba(255,255,255,0.6)' },
        { name: 'Ásia', data: [60, 71, 85, 96], color: 'rgba(255,255,255,0.32)' },
      ],
      stacked: true,
      radius: 4,
      theme: { text: '#ffffff', muted: 'rgba(255,255,255,0.75)', grid: 'rgba(255,255,255,0.12)', axis: 'rgba(255,255,255,0.3)', hover: 'rgba(255,255,255,0.08)' },
      legend: { position: 'top', align: 'end' },
      valueFormatter: (v) => `${v} M€`,
    },
  },
];

export function mount(el: HTMLElement): () => void {
  const grid = h('div', { class: 'pc-demo-grid' });
  el.append(h('div', { class: 'ex-scroll pc-demo-bg' }, grid));
  const charts: BarChart[] = [];
  for (const c of cards) {
    const body = h('div', { style: `height:${c.height}px` });
    grid.append(
      h('section', { class: `pc-demo-card ${c.className}` },
        h('h3', { text: c.title }),
        h('div', { class: 'lc-kpi' }, h('strong', { text: c.value }), h('span', { class: c.up ? 'up' : 'down', text: c.change })),
        body,
      ),
    );
    // the key line: transparent background so the card shows through
    charts.push(createBarChart(body, { background: 'transparent', ...c.options }));
  }
  return () => charts.forEach((x) => x.destroy());
}
