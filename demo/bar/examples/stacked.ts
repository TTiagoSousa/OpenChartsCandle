import { createBarChart, type BarOptions } from 'openchartscandle/bar';
import { MONTHS, choice, h } from '../data';

// Barras empilhadas: normal (total por mês) ou 100% (proporção). O tooltip mostra o total.
export function mount(el: HTMLElement): () => void {
  const host = h('div', { class: 'ex-fill' });
  let chart: ReturnType<typeof createBarChart>;
  el.append(
    h(
      'div',
      { class: 'ex-toolbar' },
      choice<BarOptions['stacked']>('Empilhar', [['Normal', true], ['100%', 'percent'], ['Agrupar', false]], true, (v) =>
        chart.setOptions({ stacked: v, labels: { show: v !== false } }),
      ),
    ),
    host,
  );
  chart = createBarChart(host, {
    categories: MONTHS,
    series: [
      { name: 'Spot', data: [120, 132, 101, 134, 90, 230, 210, 182, 191, 234, 290, 330] },
      { name: 'Futuros', data: [220, 182, 191, 234, 290, 330, 310, 232, 201, 154, 190, 330] },
      { name: 'Opções', data: [150, 232, 201, 154, 190, 330, 410, 182, 191, 234, 290, 330] },
      { name: 'Earn', data: [82, 93, 90, 93, 129, 133, 132, 120, 110, 98, 120, 140] },
    ],
    stacked: true,
    labels: { show: true },
    radius: 4,
    valueFormatter: (v) => `${v} k€`,
  });
  return () => chart.destroy();
}
