import { colorScale, createBarChart, fromDataset } from 'openchartscandle/bar';

// Encode simples: de uma tabela, o produto vai para as categorias, a quantidade para as barras
// e a pontuação para a cor (colorScale).
const TABLE: (string | number)[][] = [
  ['score', 'amount', 'product'],
  [89.3, 58212, 'Matcha Latte'],
  [57.1, 78254, 'Chá com leite'],
  [74.4, 41032, 'Cacau com queijo'],
  [50.1, 12755, 'Brownie de queijo'],
  [89.7, 20145, 'Cacau matcha'],
  [68.1, 79146, 'Chá'],
  [19.6, 91852, 'Sumo de laranja'],
  [10.6, 101852, 'Sumo de limão'],
  [32.7, 20112, 'Brownie de noz'],
];

export function mount(el: HTMLElement): () => void {
  // encode: product → categories, amount → bars
  const { categories, series } = fromDataset(TABLE, { category: 'product', series: ['amount'] });
  const score = TABLE.slice(1).map((r) => r[0] as number);
  const color = colorScale(10, 100, ['#65B581', '#FFCE34', '#FD665F']);
  const chart = createBarChart(el, {
    orientation: 'horizontal',
    categories,
    series,
    colorBy: (_v, c) => color(score[c]),
    legend: { show: false },
    tooltip: { formatter: (ctx) => `<b>${ctx.category}</b><br>Quantidade: ${ctx.total.toLocaleString('pt-PT')}<br>Pontuação: ${score[ctx.categoryIndex]}` },
  });
  return () => chart.destroy();
}
