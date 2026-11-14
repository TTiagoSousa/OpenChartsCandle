import { createBoxplotChart } from 'openchartscandle/boxplot';
import { MICHELSON } from '../data';

// A experiência de Michelson–Morley (1879): cinco séries de 20 medições da velocidade da luz. As caixas são
// calculadas a partir das medições, com os bigodes a 1,5 × IQR e os outliers como pontos. Dados públicos.
export function mount(el: HTMLElement): () => void {
  const chart = createBoxplotChart(el, {
    title: { text: 'Michelson–Morley, 1879', subtext: 'Bigodes: Q1 − 1,5 × IQR e Q3 + 1,5 × IQR', align: 'left' },
    categories: MICHELSON.map((_, i) => `Experiência ${i + 1}`),
    series: [{ name: 'Velocidade da luz', samples: MICHELSON }],
    valueAxis: { title: 'km/s − 299 000' },
    valueFormatter: (v) => `${(299000 + v).toLocaleString('pt-PT')} km/s`,
  });
  return () => chart.destroy();
}
