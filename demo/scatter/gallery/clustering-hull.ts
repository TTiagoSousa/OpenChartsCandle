import { SCATTER_COLORS, createScatterChart, kmeans } from 'openchartscandle/scatter';
import { choice, gauss, seeded, withToolbar } from '../data';

// O resultado do k-means com o número de grupos à escolha: cada grupo tem a sua cor e um contorno
// (hull) à volta dos pontos, e a cruz marca o centro. Muda o k e vê os pontos a trocar de grupo.
const rnd = seeded(77);
const POINTS = Array.from({ length: 300 }, (_, i) => {
  const c = [[25, 70], [70, 80], [50, 30], [80, 35], [20, 25]][i % 5];
  return [+(c[0] + gauss(rnd) * 8).toFixed(1), +(c[1] + gauss(rnd) * 8).toFixed(1)];
});

export function mount(el: HTMLElement): () => void {
  const series = (k: number) => {
    const r = kmeans(POINTS, k, { seed: 3 });
    return [
      ...r.centroids.map((_, c) => ({
        id: `g${c}`,
        name: `Grupo ${c + 1}`,
        color: SCATTER_COLORS[c],
        symbolSize: 7,
        hull: true,
        data: POINTS.map((p, i) => ({ x: p[0], y: p[1], id: i })).filter((_, i) => r.labels[i] === c),
      })),
      { id: 'centros', name: 'Centros', legend: false, symbol: 'cross' as const, symbolSize: 16, color: '#fff', opacity: 1, data: r.centroids.map((c, i) => ({ x: c[0], y: c[1], id: `c${i}` })) },
    ];
  };
  const host = withToolbar(el, choice('Grupos (k)', [['2', 2], ['3', 3], ['4', 4], ['5', 5], ['6', 6]], 5, (k) => chart.setSeries(series(k))));
  const chart = createScatterChart(host, { series: series(5), legend: { position: 'right' } });
  return () => chart.destroy();
}
