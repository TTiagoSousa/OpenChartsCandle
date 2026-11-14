import { createLineChart } from 'openchartscandle/line';
import { h, usd, walk } from '../data';

// Zoom e pan: roda do rato faz zoom no eixo X, arrastar move, duplo clique repõe.
// 5 anos de dados diários (1800+ pontos por série); o eixo Y ajusta-se à parte visível.
export function mount(el: HTMLElement): () => void {
  const info = h('span', { class: 'ex-label', text: 'Roda do rato = zoom · arrastar = mover · duplo clique = repor' });
  const host = h('div', { class: 'ex-fill' });
  const bar = h('div', { class: 'ex-toolbar' });
  el.append(bar, host);

  const a = walk(31, 1825, 20000, 0.022, 0.0012);
  const b = walk(32, 1825, 20000, 0.018, 0.0009);
  const chart = createLineChart(host, {
    series: [
      { name: 'Estratégia', data: a, color: '#2962ff' },
      { name: 'Benchmark', data: b, color: '#787b86', width: 1.5 },
    ],
    zoom: true,
    valueFormatter: usd,
  });

  const days = (n: number) => () => chart.setZoom((a[a.length - 1].x as number) - n * 86400, a[a.length - 1].x);
  bar.append(
    h('button', { class: 'ex-btn', text: '1M', onclick: days(30) }),
    h('button', { class: 'ex-btn', text: '6M', onclick: days(182) }),
    h('button', { class: 'ex-btn', text: '1A', onclick: days(365) }),
    h('button', { class: 'ex-btn', text: 'Tudo', onclick: () => chart.resetZoom() }),
    info,
  );
  chart.on('zoom', (r) => (info.textContent = r ? `De ${new Date(r.from * 1000).toLocaleDateString()} a ${new Date(r.to * 1000).toLocaleDateString()}` : 'Tudo visível'));

  return () => chart.destroy();
}
