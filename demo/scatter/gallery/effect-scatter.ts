import { createScatterChart } from 'openchartscandle/scatter';
import { gauss, seeded } from '../data';

// Ondas à volta dos pontos que interessam: os cinco maiores valores pulsam (effect),
// os outros ficam quietos.
export function mount(el: HTMLElement): () => void {
  const rnd = seeded(3);
  const data = Array.from({ length: 80 }, () => [+(rnd() * 100).toFixed(1), +(50 + gauss(rnd) * 18).toFixed(1)] as [number, number]);
  const top = [...data].sort((a, b) => b[1] - a[1]).slice(0, 5);
  const chart = createScatterChart(el, {
    series: [
      { name: 'Medições', data: data.filter((d) => !top.includes(d)), symbolSize: 9 },
      { name: 'Top 5', data: top, symbolSize: 16, color: '#f23645', effect: { scale: 3, period: 2.5 } },
    ],
    legend: { position: 'top' },
  });
  return () => chart.destroy();
}
