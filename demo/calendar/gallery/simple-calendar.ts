import { createCalendarChart } from 'openchartscandle/calendar';

// O calendário mais simples: um ano sem dados, uma coluna por semana, os meses contornados.
export function mount(el: HTMLElement): () => void {
  const chart = createCalendarChart(el, { range: 2026 });
  return () => chart.destroy();
}
