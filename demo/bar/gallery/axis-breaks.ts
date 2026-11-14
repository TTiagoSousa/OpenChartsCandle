import { createBarChart } from 'openchartscandle/bar';

// Quebra no eixo de valores: duas barras enormes não esmagam as outras (valueAxis.breaks).
export function mount(el: HTMLElement): () => void {
  const chart = createBarChart(el, {
    categories: ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom', 'Feriado'],
    series: [{ name: 'Visitas', data: [420, 510, 380, 20400, 470, 18900, 560, 610] }],
    valueAxis: { breaks: [{ from: 1500, to: 18000 }] },
    labels: { show: true, position: 'outside' },
    legend: { show: false },
  });
  return () => chart.destroy();
}
