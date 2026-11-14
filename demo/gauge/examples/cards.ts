import { createGauge, type GaugeChart, type GaugeOptions } from 'openchartscandle/gauge';
import { h } from '../data';

// Velocímetros dentro de cards: background 'transparent' e tamanhos pequenos, em cards
// escuros, claros, de vidro e com gradiente.
interface Card {
  title: string;
  sub: string;
  className: string;
  height: number;
  options: GaugeOptions;
}

const cards: Card[] = [
  {
    title: 'Fear & Greed',
    sub: 'Sentimento do mercado cripto',
    className: 'pc-demo-card--dark',
    height: 170,
    options: {
      value: 71,
      shape: 'semi',
      zones: [
        { from: 0, to: 25, color: '#f23645', label: 'Medo extremo' },
        { from: 25, to: 45, color: '#ff7043', label: 'Medo' },
        { from: 45, to: 55, color: '#ffb300', label: 'Neutro' },
        { from: 55, to: 75, color: '#8bc34a', label: 'Ganância' },
        { from: 75, to: 100, color: '#089981', label: 'Ganância extrema' },
      ],
      zoneGap: 2,
      ticks: { show: false },
      title: 'Ganância',
    },
  },
  { title: 'RSI (14)', sub: 'BTCUSDT · 4h', className: 'pc-demo-card--dark', height: 170, options: { value: 63.2, shape: 'semi', zones: [{ from: 0, to: 30, color: '#089981', label: 'Sobrevendido' }, { from: 30, to: 70, color: '#5d606b', label: 'Neutro' }, { from: 70, to: 100, color: '#f23645', label: 'Sobrecomprado' }], ticks: { major: 6, minor: 1 }, valueFormatter: (v) => v.toFixed(1) } },
  { title: 'Meta do trimestre', sub: '78 de 100 M€', className: 'pc-demo-card--glass', height: 170, options: { value: 78, needle: false, shape: 'full', thickness: 0.14, unit: '%', progress: { color: '#00e0c6' }, ticks: { show: false } } },
  {
    title: 'Velocidade de execução',
    sub: 'latência média das ordens',
    className: 'pc-demo-card--light',
    height: 200,
    options: { value: 42, max: 200, unit: 'ms', theme: 'light', zones: [{ from: 0, to: 80, color: '#089981', label: 'Rápido' }, { from: 80, to: 140, color: '#ffb300', label: 'Lento' }, { from: 140, to: 200, color: '#f23645', label: 'Muito lento' }], ticks: { major: 5, minor: 3 } },
  },
  {
    title: 'Exposição da carteira',
    sub: 'alavancagem atual',
    className: 'pc-demo-card--gradient',
    height: 200,
    options: {
      value: 3.2,
      min: 1,
      max: 10,
      unit: 'x',
      needle: { color: '#ffffff' },
      theme: { text: '#ffffff', muted: 'rgba(255,255,255,0.8)', track: 'rgba(255,255,255,0.18)', needle: '#ffffff' },
      progress: { color: '#ffffff' },
      ticks: { major: 10, minor: 1, color: 'rgba(255,255,255,0.8)' },
      valueFormatter: (v) => v.toFixed(1),
    },
  },
];

export function mount(el: HTMLElement): () => void {
  const grid = h('div', { class: 'pc-demo-grid' });
  el.append(h('div', { class: 'ex-scroll pc-demo-bg' }, grid));
  const gauges: GaugeChart[] = [];
  for (const c of cards) {
    const body = h('div', { style: `height:${c.height}px` });
    grid.append(h('section', { class: `pc-demo-card ${c.className}` }, h('h3', { text: c.title }), h('p', { text: c.sub }), body));
    // the key line: transparent background so the card shows through
    gauges.push(createGauge(body, { background: 'transparent', ...c.options }));
  }
  return () => gauges.forEach((g) => g.destroy());
}
