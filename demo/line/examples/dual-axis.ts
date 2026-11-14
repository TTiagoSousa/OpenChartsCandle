import { createLineChart } from 'openchartscandle/line';
import { rng, usd, walk } from '../data';

// Dois eixos Y: o preço (esquerda) e uma série com outra escala (direita), cada uma com
// os seus números. Basta `axis: 'right'` na série.
export function mount(el: HTMLElement): () => void {
  const price = walk(11, 120, 64000, 0.022, 0.0008);
  const r = rng(12);
  const funding = price.map((p) => ({ x: p.x, y: +((r() - 0.45) * 0.06).toFixed(4) }));

  const chart = createLineChart(el, {
    series: [
      { name: 'Preço BTC', data: price, area: { opacity: 0.18 } },
      { name: 'Funding rate', data: funding, axis: 'right', color: '#ff9800', width: 1.5, curve: 'step' },
    ],
    yAxis: { title: 'Preço (USD)', format: (v) => `${(v / 1000).toFixed(0)}k` },
    y2Axis: { title: 'Funding (%)', format: (v) => `${v.toFixed(2)}%` },
    valueFormatter: (v, s) => (s.axis === 'right' ? `${v.toFixed(4)}%` : usd(v)),
    annotations: { y: [{ value: 0, axis: 'right', color: '#787b86', dash: [2, 3] }] },
  });

  return () => chart.destroy();
}
