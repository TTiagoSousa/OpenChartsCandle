import { createScatterChart } from 'openchartscandle/scatter';
import { HOURS, WEEKDAYS, punchCard } from '../data';

// O "punch card" do GitHub: dia da semana × hora do dia, e o tamanho de cada círculo é o número de
// commits. Dois eixos de categorias. Dados gerados.
export function mount(el: HTMLElement): () => void {
  const data = punchCard();
  const max = Math.max(...data.map((d) => d[2]));
  const chart = createScatterChart(el, {
    series: [{ name: 'Commits', data: data.map(([hr, d, v]) => [HOURS[hr], WEEKDAYS[d], v]), symbolSize: (v) => 2 + Math.sqrt(Number(v[2]) / max) * 22, color: '#2962ff' }],
    dimensions: ['Hora', 'Dia', 'Commits'],
    xAxis: { categories: HOURS, gridDash: [2, 4] },
    yAxis: { categories: WEEKDAYS, inverse: true, gridDash: [2, 4] },
  });
  return () => chart.destroy();
}
