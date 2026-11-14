import { createPieChart } from 'openchartscandle/pie';
import { monthlyVolume } from '../data';

// Rosa (Nightingale): todas as fatias com o mesmo ângulo, o raio mostra o valor.
// Bom para comparar meses, dias da semana, etc.
export function mount(el: HTMLElement): () => void {
  const chart = createPieChart(el, {
    data: monthlyVolume,
    rose: true,
    innerRadius: 0.15,
    padAngle: 1,
    cornerRadius: 3,
    labels: { content: 'label', position: 'outside' },
    valueFormatter: (v) => `${v} M€`,
    center: { show: false },
    colors: ['#2962ff', '#2f6bff', '#3574ff', '#3b7dff', '#4286ff', '#4a90ff', '#5399ff', '#5ca2ff', '#66abff', '#70b4ff', '#7bbdff', '#86c6ff'],
  });

  return () => chart.destroy();
}
