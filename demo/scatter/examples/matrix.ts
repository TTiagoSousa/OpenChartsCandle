import { createScatterMatrix } from 'openchartscandle/scatter';
import { IRIS_DIMS, h, irisLike } from '../data';

// createScatterMatrix: cada par de colunas num pequeno gráfico, com a cor do grupo (groupBy).
// Arrasta um retângulo em qualquer célula: as mesmas linhas ficam destacadas em todas e o evento
// 'brush' devolve os índices. Clica num espaço vazio para limpar. Dados gerados ao estilo Iris.
export function mount(el: HTMLElement): () => void {
  const rows = irisLike();
  el.style.display = 'flex';
  el.style.flexDirection = 'column';
  const info = h('div', { style: 'padding:6px 12px;font-size:12px;color:#9598a1' });
  info.textContent = 'Arrasta numa célula para selecionar flores.';
  const host = h('div', { style: 'flex:1;min-height:0' });
  el.append(host, info);
  const matrix = createScatterMatrix(host, { rows, dimensions: IRIS_DIMS, groupBy: 4, symbolSize: 5 });
  matrix.on('brush', (sel) => {
    if (!sel.length) return void (info.textContent = 'Nada selecionado.');
    const count: Record<string, number> = {};
    for (const i of sel) count[rows[i][4]] = (count[rows[i][4]] ?? 0) + 1;
    info.textContent = `${sel.length} flores: ${Object.entries(count).map(([k, v]) => `${v} ${k}`).join(', ')}`;
  });
  return () => matrix.destroy();
}
