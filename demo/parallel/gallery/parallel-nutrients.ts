import { createParallelChart } from 'openchartscandle/parallel';
import { FOOD_GROUPS, NUTRIENT_AXES, nutrients } from '../data';

// Perto de 300 alimentos (por 100 g) em oito dimensões, uma série por grupo. Arrasta nos eixos para filtrar
// (por exemplo: muita proteína e pouco açúcar); a legenda esconde grupos. Dados gerados à volta de valores
// típicos de cada grupo.
export function mount(el: HTMLElement): () => void {
  const data = nutrients();
  const chart = createParallelChart(el, {
    axes: NUTRIENT_AXES,
    series: FOOD_GROUPS.map((g) => ({ name: g, data: data[g] })),
    colors: ['#80deea', '#f23645', '#2962ff', '#ffb74d', '#4caf50', '#e91e63', '#d4e157', '#ba68c8', '#26c6da'],
    lineWidth: 1,
    opacity: 0.45,
    legend: { position: 'bottom' },
    valueFormatter: (v, axis) => (typeof v === 'number' ? `${v.toLocaleString('pt-PT')} ${axis.name.match(/\((.+)\)/)?.[1] ?? ''}` : v),
  });
  chart.setBrush([{ axis: 0, from: 15, to: 40 }]);
  return () => chart.destroy();
}
