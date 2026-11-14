import { createCalendarChart } from 'openchartscandle/calendar';
import { dailyValues } from '../data';

// Mapa de calor de um ano: um valor por dia (dados gerados), cores pela legenda e os meses contornados.
// Passa o rato por um dia para ver o valor e clica para o escolher (evento 'click').
export function mount(el: HTMLElement): () => void {
  el.style.display = 'flex';
  el.style.flexDirection = 'column';
  const host = document.createElement('div');
  host.style.cssText = 'flex:1;min-height:0;position:relative';
  const info = document.createElement('div');
  info.className = 'ex-toolbar';
  info.textContent = 'Clica num dia.';
  el.append(host, info);
  const chart = createCalendarChart(host, {
    title: { text: 'Commits por dia', subtext: '2026 (dados gerados)', align: 'left' },
    range: 2026,
    data: dailyValues(2026, 7, 40),
    visualMap: { min: 0, max: 40, colors: ['#0e2a47', '#2962ff', '#ff9800'], title: 'Commits' },
    cell: { gap: 2, radius: 2, borderWidth: 0 },
    valueFormatter: (v) => `${v} commits`,
  });
  chart.on('click', (c) => (info.textContent = `${c.date.toLocaleDateString('pt-PT', { dateStyle: 'full' })}: ${c.value ?? 0} commits`));
  return () => chart.destroy();
}
