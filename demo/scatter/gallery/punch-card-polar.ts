import { createScatterChart } from 'openchartscandle/scatter';
import { HOURS, WEEKDAYS, punchCard } from '../data';

// O mesmo punch card em coordenadas polares: as horas dão a volta como num relógio de 24 h e cada
// anel é um dia da semana. `polar: true` usa x como ângulo e y como raio.
export function mount(el: HTMLElement): () => void {
  const data = punchCard();
  const max = Math.max(...data.map((d) => d[2]));
  const chart = createScatterChart(el, {
    series: [{ name: 'Commits', data: data.map(([hr, d, v]) => [HOURS[hr], WEEKDAYS[d], v]), symbolSize: (v) => 1 + Math.sqrt(Number(v[2]) / max) * 16, color: '#ff9800' }],
    dimensions: ['Hora', 'Dia', 'Commits'],
    polar: { startAngle: 90, innerRadius: 0.12 },
    xAxis: { categories: HOURS },
    yAxis: { categories: WEEKDAYS, gridDash: [2, 4] },
  });
  return () => chart.destroy();
}
