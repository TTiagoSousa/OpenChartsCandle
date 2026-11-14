import { createScatterChart, type ScatterChart, type ScatterOptions } from 'openchartscandle/scatter';
import { gauss, seeded } from '../data';

// Temas: escuro (por defeito), claro, um tema próprio e um gráfico sem fundo dentro de um card.
export function mount(el: HTMLElement): () => void {
  const rnd = seeded(4);
  const data = (k: number): [number, number][] => Array.from({ length: 60 }, () => [+(rnd() * 100).toFixed(1), +(50 + k * 10 + gauss(rnd) * 15).toFixed(1)]);
  const base = (): ScatterOptions => ({
    series: [
      { name: 'A', data: data(0), symbolSize: 9 },
      { name: 'B', data: data(1), symbolSize: 9, symbol: 'diamond' },
    ],
    legend: { position: 'top', align: 'end' },
  });
  const looks: [string, string, ScatterOptions][] = [
    ['Escuro', '#131722', {}],
    ['Claro', '#ffffff', { theme: 'light' }],
    ['Tema próprio', '#1b1033', { theme: { background: '#1b1033', text: '#e9defa', muted: '#a28bd0', grid: 'rgba(162,139,208,0.15)', axis: '#4b3577', tooltipBg: '#2a1a4d', tooltipText: '#fff', tooltipBorder: '#4b3577' }, colors: ['#ff6ec7', '#7df9ff'] }],
    ['Card transparente', 'linear-gradient(135deg,#0f5132,#155e75)', { background: 'transparent', colors: ['#fff', '#ffd54f'], theme: { text: '#fff', muted: 'rgba(255,255,255,0.7)', grid: 'rgba(255,255,255,0.12)' } }],
  ];
  const grid = document.createElement('div');
  grid.style.cssText = 'display:grid;grid-template-columns:repeat(auto-fit,minmax(320px,1fr));gap:12px;padding:12px;height:100%;box-sizing:border-box;overflow:auto';
  el.append(grid);
  const charts: ScatterChart[] = looks.map(([title, bg, o]) => {
    const card = document.createElement('div');
    card.style.cssText = `display:flex;flex-direction:column;min-height:260px;border-radius:12px;overflow:hidden;background:${bg};border:1px solid rgba(120,123,134,0.25)`;
    const head = document.createElement('div');
    head.textContent = title;
    head.style.cssText = `padding:10px 12px 0;font-weight:600;color:${bg === '#ffffff' ? '#131722' : '#fff'}`;
    const host = document.createElement('div');
    host.style.cssText = 'flex:1;min-height:0';
    card.append(head, host);
    grid.append(card);
    return createScatterChart(host, { ...base(), ...o });
  });
  return () => charts.forEach((c) => c.destroy());
}
