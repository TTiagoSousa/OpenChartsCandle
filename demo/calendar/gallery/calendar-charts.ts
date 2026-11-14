import { createCalendarChart } from 'openchartscandle/calendar';
import { dailyValues } from '../data';

// Um ano de passos em círculos: o tamanho é o número de passos e os 12 melhores dias pulsam a vermelho.
// Dados gerados.
export function mount(el: HTMLElement): () => void {
  const days = dailyValues(2026, 14, 12000);
  const best = new Set([...days].sort((a, b) => b[1] - a[1]).slice(0, 12).map(([d]) => d));
  const chart = createCalendarChart(el, {
    range: 2026,
    type: 'scatter',
    color: '#089981',
    data: days.map(([date, value]) => ({ date, value, color: best.has(date) ? '#f23645' : undefined })),
    effect: { top: 12 },
    valueFormatter: (v) => `${v.toLocaleString('pt-PT')} passos`,
  });
  return () => chart.destroy();
}
