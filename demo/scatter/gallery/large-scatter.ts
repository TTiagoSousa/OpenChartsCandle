import { createScatterChart } from 'openchartscandle/scatter';
import { gauss, seeded } from '../data';

// 100 000 pontos em duas séries, desenhados num instante (modo large: pontos agrupados por cor,
// sem bordas). Roda do rato para fazer zoom, arrasta para mover, duplo clique para voltar.
export function mount(el: HTMLElement): () => void {
  const rnd = seeded(12);
  const cloud = (n: number, cx: number, cy: number, sx: number, sy: number, rot: number): [number, number][] =>
    Array.from({ length: n }, () => {
      const a = gauss(rnd) * sx;
      const b = gauss(rnd) * sy;
      return [+(cx + a * Math.cos(rot) - b * Math.sin(rot)).toFixed(3), +(cy + a * Math.sin(rot) + b * Math.cos(rot)).toFixed(3)];
    });
  const chart = createScatterChart(el, {
    series: [
      { name: 'Série A', data: cloud(50000, 40, 45, 18, 6, 0.6), symbolSize: 2, color: '#2962ff', opacity: 0.5 },
      { name: 'Série B', data: cloud(50000, 62, 55, 16, 7, -0.5), symbolSize: 2, color: '#ff9800', opacity: 0.5 },
    ],
    zoom: true,
    legend: { position: 'top' },
  });
  return () => chart.destroy();
}
