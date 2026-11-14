import { createTreemap } from 'openchartscandle/treemap';
import { BUDGET, choice, h } from '../data';

// Drill-down: com leafDepth só se vê um ou dois níveis de cada vez. Clica num departamento para entrar,
// usa o caminho em cima para voltar, ou os botões (zoomTo / zoomOut). Os eventos aparecem no registo.
const money = (v: number): string => `$${v.toFixed(v < 10 ? 1 : 0)} B`;

export function mount(el: HTMLElement): () => void {
  const host = h('div', { class: 'ex-fill' });
  const log = h('div', { style: 'height:70px;overflow:auto;font-size:12px;opacity:.8;padding:6px 12px;border-top:1px solid rgba(128,128,128,.2)' });
  el.append(
    h(
      'div',
      { class: 'ex-toolbar' },
      choice('Níveis visíveis', [['1', 1], ['2', 2]], 1, (v) => chart.setOptions({ leafDepth: v })),
      h('button', { class: 'ex-btn', text: 'Ir para Defesa', onclick: () => chart.zoomTo('Defesa') }),
      h('button', { class: 'ex-btn', text: '↑ Subir', onclick: () => chart.zoomOut() }),
      h('button', { class: 'ex-btn', text: 'Tudo', onclick: () => chart.zoomTo(null) }),
    ),
    host,
    log,
  );
  const chart = createTreemap(host, {
    data: BUDGET,
    rootName: 'Orçamento EUA 2012',
    leafDepth: 1,
    breadcrumb: { position: 'top' },
    dimensions: ['2012', '2011', 'Crescimento'],
    label: { position: 'center', formatter: (n) => `${n.name}\n${money(n.value)}` },
    valueFormatter: (v, dim) => (dim === 2 ? `${v > 0 ? '+' : ''}${v}%` : money(v)),
    levels: [{ gap: 2 }, { gap: 2, colorLightness: [0.35, 0.58] }],
  });
  const write = (s: string): void => {
    log.prepend(h('div', { text: `${new Date().toLocaleTimeString('pt-PT')}  ${s}` }));
  };
  const offs = [
    chart.on('click', (n) => write(`click → ${n.path.join(' / ')} (${money(n.value)})`)),
    chart.on('zoom', (n) => write(`zoom → ${n ? n.path.join(' / ') : 'tudo'}`)),
  ];
  return () => {
    offs.forEach((f) => f());
    chart.destroy();
  };
}
