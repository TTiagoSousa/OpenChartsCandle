import { createCalendarChart } from 'openchartscandle/calendar';
import { dailyValues } from '../data';

// Três anos um por baixo do outro, com cores por intervalos: clica num intervalo da legenda para o esconder.
// Dados gerados.
export function mount(el: HTMLElement): () => void {
  const years = [2024, 2025, 2026];
  const chart = createCalendarChart(el, {
    range: years,
    data: years.flatMap((y, i) => dailyValues(y, 40 + i, 1000)),
    visualMap: {
      pieces: [
        { max: 200, color: '#1b3a2b', label: '< 200' },
        { min: 200, max: 400, color: '#0e6b3c' },
        { min: 400, max: 600, color: '#26a641' },
        { min: 600, color: '#39d353', label: '≥ 600' },
      ],
    },
    cell: { gap: 2, radius: 2, borderWidth: 0 },
  });
  return () => chart.destroy();
}
