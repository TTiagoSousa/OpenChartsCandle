import { createPieChart } from 'openchartscandle/pie';
import { choice, h, marketShare } from '../data';

// Muitas fatias pequenas? groupBelow junta tudo abaixo de X% numa fatia "Outros".
// O tooltip dessa fatia lista o que lá está dentro.
export function mount(el: HTMLElement): () => void {
  const host = h('div', { class: 'ex-fill' });
  const bar = h('div', { class: 'ex-toolbar' });
  el.append(bar, host);

  const chart = createPieChart(host, {
    data: marketShare,
    innerRadius: 0.5,
    sort: 'desc',
    groupBelow: 5,
    othersLabel: 'Outras exchanges',
    valueFormatter: (v) => `${v.toFixed(1)}%`,
    center: { title: 'Volume spot' },
  });

  bar.append(choice('Agrupar abaixo de', [['Desligado', 0], ['3%', 3], ['5%', 5], ['10%', 10]], 5, (groupBelow) => chart.setOptions({ groupBelow })));

  return () => chart.destroy();
}
