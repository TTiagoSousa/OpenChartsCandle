import { createHeatmapChart } from 'openchartscandle/heatmap';
import { noiseGrid } from '../data';

// A mesma grelha com cores por intervalos: clica num intervalo da legenda para esconder as suas células. Dados gerados.
export function mount(el: HTMLElement): () => void {
  const chart = createHeatmapChart(el, {
    data: noiseGrid(200, 100, 8),
    visualMap: {
      position: 'right',
      pieces: [
        { max: 0.2, color: '#313695', label: '< 0,2' },
        { min: 0.2, max: 0.35, color: '#4575b4' },
        { min: 0.35, max: 0.45, color: '#74add1' },
        { min: 0.45, max: 0.55, color: '#e0f3f8' },
        { min: 0.55, max: 0.65, color: '#fee090' },
        { min: 0.65, max: 0.8, color: '#f46d43' },
        { min: 0.8, color: '#a50026', label: '≥ 0,8' },
      ],
      format: (v) => v.toLocaleString('pt-PT'),
    },
  });
  return () => chart.destroy();
}
