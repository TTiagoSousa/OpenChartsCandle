import { boxplotAggregate, createBoxplotChart } from 'openchartscandle/boxplot';
import { incomeRows } from '../data';

// Linhas em bruto (país, ano, rendimento) agrupadas por país com boxplotAggregate(): a biblioteca calcula a
// caixa de cada país a partir dos 66 anos. Os países ficam ordenados pela mediana. Dados gerados.
export function mount(el: HTMLElement): () => void {
  const { categories, series } = boxplotAggregate(incomeRows(), { category: 'country', value: 'income', name: 'Rendimento' });
  const samples = series[0].samples as number[][];
  const median = (s: number[]): number => [...s].sort((a, b) => a - b)[s.length >> 1];
  const order = categories.map((_, i) => i).sort((a, b) => median(samples[b]) - median(samples[a]));
  const chart = createBoxplotChart(el, {
    title: { text: 'Rendimento por pessoa, 1950–2015', subtext: 'Uma caixa por país a partir das linhas de cada ano (dados gerados)', align: 'left' },
    orient: 'horizontal',
    categories: order.map((i) => categories[i]),
    series: [{ name: 'Rendimento', samples: order.map((i) => samples[i]) }],
    valueAxis: { title: 'US$ por pessoa' },
    valueFormatter: (v) => `${Math.round(v).toLocaleString('pt-PT')} US$`,
  });
  return () => chart.destroy();
}
