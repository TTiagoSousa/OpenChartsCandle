import { createBarChart, fromDataset } from 'openchartscandle/bar';

// Dataset simples: uma tabela com cabeçalho; a primeira coluna são as categorias e as outras as séries.
const TABLE: (string | number)[][] = [
  ['produto', '2023', '2024', '2025'],
  ['Matcha Latte', 43.3, 85.8, 93.7],
  ['Chá com leite', 83.1, 73.4, 55.1],
  ['Cacau com queijo', 86.4, 65.2, 82.5],
  ['Brownie de noz', 72.4, 53.9, 39.1],
];

export function mount(el: HTMLElement): () => void {
  const chart = createBarChart(el, { ...fromDataset(TABLE), legend: { position: 'top', align: 'center' } });
  return () => chart.destroy();
}
