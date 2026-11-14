import { createCalendarChart } from 'openchartscandle/calendar';
import { dailyValues } from '../data';

// Três anos lado a lado na vertical: uma linha por semana, uma coluna por dia da semana. Dados gerados.
export function mount(el: HTMLElement): () => void {
  const years = [2024, 2025, 2026];
  const chart = createCalendarChart(el, {
    range: years,
    orient: 'vertical',
    data: years.flatMap((y, i) => dailyValues(y, 20 + i, 1000)),
    visualMap: { min: 0, max: 1000, colors: ['#123d38', '#089981', '#b9f6ca'], position: 'right' },
    dayLabel: { names: ['S', 'T', 'Q', 'Q', 'S', 'S', 'D'] },
  });
  return () => chart.destroy();
}
