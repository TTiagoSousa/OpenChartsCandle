import { createLineChart, type LineOptions } from 'openchartscandle/line';
import { MONTHS, choice, h } from '../data';

// Áreas empilhadas: cada série fica por cima da anterior. Em modo 'percent' o total é sempre 100%
// (mostra a proporção de cada uma). O tooltip mostra sempre os valores reais.
const channels = [
  { name: 'Orgânico', data: [120, 132, 140, 151, 160, 172, 181, 190, 204, 215, 230, 246] },
  { name: 'Pago', data: [80, 86, 95, 92, 104, 112, 118, 125, 122, 134, 141, 150] },
  { name: 'Referências', data: [40, 42, 48, 55, 53, 61, 66, 64, 72, 75, 82, 88] },
  { name: 'Email', data: [20, 24, 23, 27, 31, 30, 34, 38, 37, 41, 44, 47] },
];

export function mount(el: HTMLElement): () => void {
  const host = h('div', { class: 'ex-fill' });
  const bar = h('div', { class: 'ex-toolbar' });
  el.append(bar, host);

  const chart = createLineChart(host, {
    series: channels,
    categories: MONTHS,
    stacked: true,
    curve: 'smooth',
    tooltip: { sort: true },
    valueFormatter: (v) => `${v} mil visitas`,
  });

  bar.append(
    choice<LineOptions['stacked']>('Empilhar', [['Normal', true], ['100%', 'percent'], ['Não', false]], true, (stacked) =>
      chart.setOptions({ stacked, area: stacked ? undefined : { opacity: 0.12 } }),
    ),
  );

  return () => chart.destroy();
}
