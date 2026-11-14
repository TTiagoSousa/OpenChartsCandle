import { SCATTER_COLORS, createScatterChart, kmeans } from 'openchartscandle/scatter';
import { gauss, seeded } from '../data';

// O k-means passo a passo: começa com centros ao acaso (losangos), pinta cada ponto com a cor do
// centro mais próximo e move cada centro para o meio dos seus pontos, até nada mudar.
// Depois recomeça com outros dados.
function blobs(seed: number): number[][] {
  const rnd = seeded(seed);
  const centers = Array.from({ length: 4 }, () => [10 + rnd() * 80, 10 + rnd() * 80]);
  return Array.from({ length: 220 }, (_, i) => {
    const c = centers[i % 4];
    return [+(c[0] + gauss(rnd) * 9).toFixed(1), +(c[1] + gauss(rnd) * 9).toFixed(1)];
  });
}

export function mount(el: HTMLElement): () => void {
  const chart = createScatterChart(el, { series: [], xAxis: { min: -10, max: 110 }, yAxis: { min: -10, max: 110 }, legend: { show: false }, animation: { duration: 600 } });
  let seed = 1;
  let step = 0;
  let res = kmeans(blobs(seed), 4, { seed });
  let points = blobs(seed);
  const show = (): void => {
    const s = res.steps[Math.min(step, res.steps.length - 1)];
    chart.setOptions({ title: { text: `Iteração ${Math.min(step, res.steps.length - 1) + 1} de ${res.steps.length}`, align: 'left' } }, false);
    chart.setSeries([
      ...s.centroids.map((_, k) => ({
        id: `c${k}`,
        name: `Grupo ${k + 1}`,
        color: SCATTER_COLORS[k],
        symbolSize: 7,
        data: points.map((p, i) => ({ x: p[0], y: p[1], id: i })).filter((_, i) => s.labels[i] === k),
      })),
      { id: 'centros', name: 'Centros', color: '#fff', symbol: 'diamond', symbolSize: 18, borderWidth: 2, borderColor: '#fff', opacity: 1, data: s.centroids.map((c, k) => ({ x: c[0], y: c[1], id: `c${k}`, color: SCATTER_COLORS[k] })) },
    ]);
  };
  show();
  const timer = window.setInterval(() => {
    step++;
    if (step > res.steps.length + 2) {
      seed++;
      step = 0;
      points = blobs(seed);
      res = kmeans(points, 4, { seed });
    }
    show();
  }, 1000);
  return () => {
    clearInterval(timer);
    chart.destroy();
  };
}
