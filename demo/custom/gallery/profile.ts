import { createCustomChart } from 'openchartscandle/custom';
import { profileEvents } from '../data';

// Perfil de carregamento de uma página: cada tarefa é um retângulo na sua linha (thread), do início ao fim,
// com o nome por dentro quando cabe. A roda do rato faz zoom no tempo, arrastar move, duplo clique repõe.
export function mount(el: HTMLElement): () => void {
  const lanes = ['Principal', 'Worker 1', 'Worker 2', 'GPU'];
  const colors: Record<string, string> = { Rede: '#2962ff', Script: '#ffc107', Render: '#9c27b0', Pintura: '#089981' };
  const chart = createCustomChart(el, {
    xAxis: { name: 'ms', splitLine: true, min: 0, max: 1850, format: (v) => `${v} ms` },
    yAxis: { type: 'category', data: lanes, inverse: true, splitLine: true },
    zoom: { axis: 'x', minSpan: 20 },
    series: [
      {
        name: 'Tarefas',
        data: profileEvents(),
        dimensions: ['Linha', 'Início (ms)', 'Fim (ms)', 'Tarefa', 'Tipo'],
        encode: { x: [1, 2], y: 0, itemName: 3, tooltip: [4, 1, 2] },
        renderItem: (p, api) => {
          const [x0, y] = api.coord([api.value(1), api.value(0)]);
          const [x1] = api.coord([api.value(2), api.value(0)]);
          const h = api.size([0, 1])[1] * 0.6;
          return {
            type: 'rect',
            shape: { x: x0, y: y - h / 2, width: Math.max(1, x1 - x0), height: h, r: 2 },
            style: { fill: colors[api.value(4)] },
            label: { text: api.value(3), position: 'insideLeft', fontSize: 10 },
          };
        },
      },
    ],
  });
  return () => chart.destroy();
}
