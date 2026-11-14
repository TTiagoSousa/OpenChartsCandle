import { createBoxplotChart } from 'openchartscandle/boxplot';
import { normalSamples } from '../data';

// Três séries agrupadas lado a lado em cada categoria: a temperatura máxima de cada dia, mês a mês, em três
// cidades. Clica na legenda para esconder uma cidade. Dados gerados.
const MONTHS = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
const CITIES: [name: string, winter: number, summer: number][] = [
  ['Porto', 14, 7],
  ['Lisboa', 15, 10],
  ['Évora', 13, 15],
];

export function mount(el: HTMLElement): () => void {
  const chart = createBoxplotChart(el, {
    title: { text: 'Temperatura máxima diária', subtext: 'Dados gerados', align: 'left' },
    categories: MONTHS,
    series: CITIES.map(([name, winter, summer], s) => ({
      name,
      // warmest in July, more spread in the warm months
      samples: MONTHS.map((_, m) => normalSamples(30, winter + summer * Math.max(0, Math.sin(((m - 0.5) * Math.PI) / 11)), 1.8 + summer / 8, 100 + s * 12 + m)),
    })),
    valueAxis: { title: '°C' },
    valueFormatter: (v) => `${v.toLocaleString('pt-PT', { maximumFractionDigits: 1 })} °C`,
  });
  return () => chart.destroy();
}
