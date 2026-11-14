import { createBarChart, fromDataset } from 'openchartscandle/bar';

// Dataset como lista de objetos (como vem de uma API): `category` diz qual é a chave das categorias.
const ROWS = [
  { produto: 'Matcha Latte', '2023': 43.3, '2024': 85.8, '2025': 93.7 },
  { produto: 'Chá com leite', '2023': 83.1, '2024': 73.4, '2025': 55.1 },
  { produto: 'Cacau com queijo', '2023': 86.4, '2024': 65.2, '2025': 82.5 },
  { produto: 'Brownie de noz', '2023': 72.4, '2024': 53.9, '2025': 39.1 },
];

export function mount(el: HTMLElement): () => void {
  const chart = createBarChart(el, { ...fromDataset(ROWS, { category: 'produto' }), legend: { position: 'top', align: 'center' } });
  return () => chart.destroy();
}
