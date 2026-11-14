import { createLineChart, type LineChart, type LineOptions } from 'openchartscandle/line';
import { MONTHS, h, revenue, usd, walk } from '../data';

// Linhas dentro de cards: background 'transparent', eixos escondidos para mini gráficos (KPIs)
// e um card claro com tema light.
interface Card {
  title: string;
  value: string;
  change: string;
  up: boolean;
  className: string;
  height: number;
  options: LineOptions;
}

const mini = (seed: number, color: string, vol: number, drift: number): LineOptions => ({
  series: [{ name: 'Valor', data: walk(seed, 60, 100, vol, drift), color, area: { opacity: 0.3 } }],
  curve: 'smooth',
  legend: { show: false },
  xAxis: { show: false, grid: false },
  yAxis: { show: false, grid: false },
  crosshair: { show: false },
  padding: 0,
  valueFormatter: (v) => v.toFixed(2),
});

const cards: Card[] = [
  { title: 'Receita', value: '$2.4M', change: '+12.4%', up: true, className: 'pc-demo-card--dark', height: 90, options: mini(61, '#089981', 0.02, 0.003) },
  { title: 'Utilizadores ativos', value: '18 240', change: '+3.1%', up: true, className: 'pc-demo-card--dark', height: 90, options: mini(62, '#2962ff', 0.015, 0.001) },
  { title: 'Churn', value: '2.8%', change: '−0.4%', up: false, className: 'pc-demo-card--dark', height: 90, options: mini(63, '#f23645', 0.03, -0.002) },
  {
    title: 'Vendas por mês',
    value: '86 M€',
    change: '+10.3% vs mês anterior',
    up: true,
    className: 'pc-demo-card--light pc-demo-card--wide',
    height: 230,
    options: { series: [{ name: 'Vendas', data: revenue, points: true, color: '#2962ff', area: { opacity: 0.15 } }], categories: MONTHS, theme: 'light', legend: { show: false }, curve: 'smooth', valueFormatter: (v) => `${v} M€` },
  },
  {
    title: 'Carteira vs índice',
    value: usd(128450),
    change: '+28.4% no ano',
    up: true,
    className: 'pc-demo-card--gradient pc-demo-card--wide',
    height: 230,
    options: {
      series: [
        { name: 'Carteira', data: walk(64, 200, 100000, 0.012, 0.0013), color: '#ffffff', width: 2.5 },
        { name: 'Índice', data: walk(65, 200, 100000, 0.01, 0.0008), color: 'rgba(255,255,255,0.55)', dash: [5, 4], width: 1.5 },
      ],
      theme: { text: '#ffffff', muted: 'rgba(255,255,255,0.75)', grid: 'rgba(255,255,255,0.12)', axis: 'rgba(255,255,255,0.25)', crosshair: 'rgba(255,255,255,0.7)' },
      legend: { position: 'top', align: 'end' },
      yAxis: { format: (v) => `${(v / 1000).toFixed(0)}k` },
      valueFormatter: usd,
    },
  },
];

export function mount(el: HTMLElement): () => void {
  const grid = h('div', { class: 'pc-demo-grid' });
  el.append(h('div', { class: 'ex-scroll pc-demo-bg' }, grid));
  const charts: LineChart[] = [];
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
    charts.push(createLineChart(body, { background: 'transparent', ...c.options }));
  }
  return () => charts.forEach((x) => x.destroy());
}
