import { createTreeChart, type TreeChartOptions } from 'openchartscandle/tree';
import { choice, h, withToolbar } from '../../scatter/data';
import { marketsTree } from '../data';

// Uma árvore de mercados (estrutura inventada para o exemplo). Clica num nó para o abrir ou fechar; os botões
// mudam a orientação com setOptions() e abrem ou fecham tudo com expandAll() / collapseAll(). Passa o rato
// para ver o caminho até à raiz.
export function mount(el: HTMLElement): () => void {
  const info = h('span', { class: 'ex-label', text: 'Clica num nó.' });
  const layouts: [string, TreeChartOptions][] = [
    ['→', { layout: 'orthogonal', orient: 'LR' }],
    ['←', { layout: 'orthogonal', orient: 'RL' }],
    ['↓', { layout: 'orthogonal', orient: 'TB' }],
    ['↑', { layout: 'orthogonal', orient: 'BT' }],
    ['Radial', { layout: 'radial' }],
  ];
  const host = withToolbar(
    el,
    choice('Orientação', layouts, layouts[0][1], (o) => chart.setOptions(o)),
    h('button', { class: 'ex-btn', text: 'Abrir tudo', onclick: () => chart.expandAll() }),
    h('button', { class: 'ex-btn', text: 'Fechar', onclick: () => chart.collapseAll(1) }),
    info,
  );
  const chart = createTreeChart(host, {
    data: marketsTree(),
    initialDepth: 2,
    label: { fontSize: 11 },
  });
  chart.on('click', (p) => (info.textContent = `${p.path.join(' › ')}${p.value !== undefined ? ` · ${p.value}` : ''}`));
  return () => chart.destroy();
}
