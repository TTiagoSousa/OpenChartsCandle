import { createScatterMatrix } from 'openchartscandle/scatter';
import { FOODS, FOOD_GROUPS } from '../data';

// Matriz de dispersão dos nutrientes: energia, proteína, gordura, hidratos e fibra cruzados dois a
// dois, com a cor do grupo do alimento. Seleciona alimentos numa célula para os ver nas outras e
// clica na legenda para esconder um grupo. Valores aproximados por 100 g.
export function mount(el: HTMLElement): () => void {
  const rows = FOODS.map(([, g, ...v]) => [...v.slice(0, 5), FOOD_GROUPS[g]]);
  const matrix = createScatterMatrix(el, {
    rows,
    dimensions: ['Energia', 'Proteína', 'Gordura', 'Hidratos', 'Fibra', 'Grupo'],
    groupBy: 5,
    symbolSize: 5,
    gap: 4,
  });
  return () => matrix.destroy();
}
