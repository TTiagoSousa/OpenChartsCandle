import { createBoxplotChart } from 'openchartscandle/boxplot';
import { MICHELSON } from '../data';

// As mesmas medições de Michelson–Morley na horizontal, com cada medição como um ponto disperso ao lado da
// caixa (points: { position: 'beside' }) e a média marcada com um losango. Dados públicos.
export function mount(el: HTMLElement): () => void {
  const chart = createBoxplotChart(el, {
    title: { text: 'Michelson–Morley, 1879', subtext: 'As 20 medições de cada experiência ao lado da caixa', align: 'left' },
    orient: 'horizontal',
    categories: MICHELSON.map((_, i) => `Exp. ${i + 1}`),
    series: [{ name: 'Velocidade da luz', samples: MICHELSON, color: '#00bcd4' }],
    points: { position: 'beside', size: 3, opacity: 0.7 },
    mean: true,
    bandWidth: 0.85,
    valueAxis: { title: 'km/s − 299 000' },
  });
  return () => chart.destroy();
}
