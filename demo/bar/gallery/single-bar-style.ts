import { createBarChart } from 'openchartscandle/bar';

// Estilo de uma só barra: o valor dado como { value, color } fica com cor própria.
export function mount(el: HTMLElement): () => void {
  const chart = createBarChart(el, {
    categories: ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom'],
    series: [{ name: 'Visitas', data: [120, { value: 200, color: '#a90000' }, 150, 80, 70, 110, 130] }],
    legend: { show: false },
  });
  return () => chart.destroy();
}
