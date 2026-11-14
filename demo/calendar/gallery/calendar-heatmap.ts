import { createCalendarChart } from 'openchartscandle/calendar';
import { dailyValues } from '../data';

// Mapa de calor de um ano: a cor de cada dia é o seu valor, com a legenda de cores em baixo. Dados gerados.
export function mount(el: HTMLElement): () => void {
  const chart = createCalendarChart(el, {
    range: 2026,
    data: dailyValues(2026, 7, 1000),
    visualMap: { min: 0, max: 1000, colors: ['#0e2a47', '#2962ff', '#7fb2ff'] },
    cell: { gap: 2, radius: 2, borderWidth: 0 },
  });
  return () => chart.destroy();
}
