import { createHeatmapChart } from 'openchartscandle/heatmap';
import { noiseGrid } from '../data';

// 20 000 células (200 × 100) de um ruído suave. Arrasta as pegas da legenda para filtrar os valores, usa a
// roda do rato para fazer zoom e arrasta para mover (duplo clique volta ao início). Dados gerados.
export function mount(el: HTMLElement): () => void {
  const chart = createHeatmapChart(el, {
    data: noiseGrid(200, 100, 3),
    visualMap: { min: 0, max: 1, format: (v) => v.toFixed(2) },
    zoom: true,
  });
  return () => chart.destroy();
}
