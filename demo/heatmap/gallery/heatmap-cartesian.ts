import { createHeatmapChart } from 'openchartscandle/heatmap';
import { HOURS, WEEKDAYS, punchCard } from '../data';

// Atividade por hora e dia da semana, como um punch card, com o valor em cada célula. Dados gerados.
export function mount(el: HTMLElement): () => void {
  const chart = createHeatmapChart(el, {
    xAxis: { data: HOURS },
    yAxis: { data: WEEKDAYS },
    data: punchCard(11),
    label: true,
    cell: { gap: 1 },
    visualMap: { min: 0, max: 10 },
  });
  return () => chart.destroy();
}
