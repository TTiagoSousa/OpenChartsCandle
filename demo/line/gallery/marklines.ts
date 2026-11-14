import { createLineChart } from 'openchartscandle/line';

// Linhas de marcação: máximo, mínimo e média automáticos (marks), uma linha de meta
// e um segmento com seta do mínimo ao máximo (annotations.segments).
const DAYS = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom'];
const visits = [820, 932, 701, 1134, 1290, 1330, 1120];

export function mount(el: HTMLElement): () => void {
  const iMin = visits.indexOf(Math.min(...visits));
  const iMax = visits.indexOf(Math.max(...visits));
  const chart = createLineChart(el, {
    categories: DAYS,
    series: [{ name: 'Visitas', data: visits, color: '#5470c6', points: true, marks: { max: true, min: true, average: true } }],
    legend: { show: false },
    annotations: {
      y: [{ value: 1200, label: 'Meta 1200', color: '#089981' }],
      segments: [{ from: { x: DAYS[iMin], y: visits[iMin] }, to: { x: DAYS[iMax], y: visits[iMax] }, label: `+${visits[iMax] - visits[iMin]}`, color: '#ff9800', dash: [4, 3] }],
    },
  });
  return () => chart.destroy();
}
