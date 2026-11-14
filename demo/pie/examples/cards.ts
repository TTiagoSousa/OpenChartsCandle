import { createPieChart, type PieChart, type PieOptions } from 'openchartscandle/pie';
import { eur, h, portfolio, sectors } from '../data';

// Pizzas dentro de cards: com background 'transparent' o gráfico usa a cor (ou o gradiente,
// ou a imagem) do card, e os espaços entre fatias também ficam transparentes.
interface CardSpec {
  title: string;
  subtitle: string;
  className: string;
  options: PieOptions;
}

const cards: CardSpec[] = [
  {
    title: 'Carteira',
    subtitle: 'card escuro · donut',
    className: 'pc-demo-card--dark',
    options: { data: portfolio, innerRadius: 0.62, padAngle: 1.5, cornerRadius: 5, sort: 'desc', valueFormatter: eur, legend: { position: 'bottom', values: false, marker: 'circle' }, labels: { show: false } },
  },
  {
    title: 'Exposição por setor',
    subtitle: 'card claro · tema light',
    className: 'pc-demo-card--light',
    options: { data: sectors, theme: 'light', sort: 'desc', groupBelow: 5, borderWidth: 2, legend: { position: 'right', values: false, fontSize: 12 }, labels: { position: 'inside' }, valueFormatter: (v) => `${v}%` },
  },
  {
    title: 'Alocação alvo',
    subtitle: 'card com gradiente · gauge',
    className: 'pc-demo-card--gradient',
    options: {
      data: [{ label: 'Ações', value: 60, color: '#ffffff' }, { label: 'Obrigações', value: 25, color: 'rgba(255,255,255,0.65)' }, { label: 'Liquidez', value: 15, color: 'rgba(255,255,255,0.35)' }],
      startAngle: -180, endAngle: 0, innerRadius: 0.66, cornerRadius: 6, padAngle: 2, borderWidth: 0,
      legend: { position: 'bottom', marker: 'line' }, labels: { show: false },
      theme: { text: '#ffffff', muted: 'rgba(255,255,255,0.75)' },
      center: { title: 'Alocação', value: '100%', followHover: false },
    },
  },
  {
    title: 'Risco',
    subtitle: 'card vidro · sombra + gradiente',
    className: 'pc-demo-card--glass',
    options: {
      data: [{ label: 'Baixo', value: 48, color: '#089981' }, { label: 'Médio', value: 34, color: '#ff9800' }, { label: 'Alto', value: 18, color: '#f23645' }],
      innerRadius: 0.5, gradient: true, shadow: { blur: 16, offsetY: 6 }, padAngle: 2, cornerRadius: 4,
      legend: { position: 'right', marker: 'circle' }, labels: { content: 'percent' }, valueFormatter: (v) => `${v}%`,
    },
  },
  {
    title: 'Mini KPI',
    subtitle: 'sem legenda nem etiquetas',
    className: 'pc-demo-card--dark pc-demo-card--small',
    options: {
      data: [{ label: 'Objetivo atingido', value: 82, color: '#2962ff' }, { label: 'Em falta', value: 18, color: '#2a2e39' }],
      innerRadius: 0.78, cornerRadius: 10, borderWidth: 0, hoverOffset: 0, selectable: false,
      legend: { show: false }, labels: { show: false }, tooltip: { show: false },
      center: { title: 'do objetivo', value: '82%', followHover: false, fontScale: 1.2 },
    },
  },
  {
    title: 'Volume por exchange',
    subtitle: 'rosa · sentido anti-horário',
    className: 'pc-demo-card--dark pc-demo-card--small',
    options: {
      data: [{ label: 'Binance', value: 38 }, { label: 'Coinbase', value: 15 }, { label: 'OKX', value: 12 }, { label: 'Bybit', value: 10 }, { label: 'Kraken', value: 7 }],
      rose: true, clockwise: false, innerRadius: 0.2, padAngle: 2, cornerRadius: 3, legend: { show: false }, labels: { content: 'label', position: 'inside', fontSize: 11 },
      valueFormatter: (v) => `${v}%`,
    },
  },
];

export function mount(el: HTMLElement): () => void {
  const grid = h('div', { class: 'pc-demo-grid' });
  el.append(h('div', { class: 'ex-scroll pc-demo-bg' }, grid));
  const charts: PieChart[] = [];
  for (const c of cards) {
    const body = h('div', { class: 'pc-demo-card__body' });
    grid.append(h('section', { class: `pc-demo-card ${c.className}` }, h('h3', { text: c.title }), h('p', { text: c.subtitle }), body));
    // the key line: transparent background so the card shows through
    charts.push(createPieChart(body, { background: 'transparent', ...c.options }));
  }
  return () => charts.forEach((x) => x.destroy());
}
