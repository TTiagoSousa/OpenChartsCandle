import { createScatterMatrix } from 'openchartscandle/scatter';
import { IRIS_DIMS, irisLike } from '../data';

// Matriz de dispersão: cada par de medidas de 150 flores num pequeno gráfico, com a cor da espécie.
// Arrasta um retângulo numa célula e as mesmas flores ficam destacadas em todas. Dados gerados ao
// estilo do conjunto Iris.
export function mount(el: HTMLElement): () => void {
  const matrix = createScatterMatrix(el, { rows: irisLike(), dimensions: IRIS_DIMS, groupBy: 4, symbolSize: 4 });
  return () => matrix.destroy();
}
