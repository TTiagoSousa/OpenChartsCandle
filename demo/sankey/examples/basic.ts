import { createSankeyChart, type SankeyOptions } from 'openchartscandle/sankey';
import { choice, h, withToolbar } from '../../scatter/data';
import { eur, incomeLevels, incomeStatement, portfolioFlows } from '../data';

// Fluxos de uma carteira e a demonstração de resultados de uma empresa (valores inventados). Os botões trocam os
// dados, o alinhamento, a orientação e a cor das ligações com setOptions() (os nós deslizam para o novo lugar).
// Passa o rato para ver os totais; clica num nó ou numa ligação; arrasta os nós ao longo da coluna.
const usd = (v: number): string => `$${v} mM`;

// a demonstração de resultados sem as cores próprias das ligações (nem as dos níveis), para o botão das
// ligações mandar em todas
const income = incomeStatement();
income.links.forEach((l) => delete l.lineStyle);

const DATASETS: [string, SankeyOptions][] = [
  ['Carteira', { ...portfolioFlows(), levels: undefined, valueFormat: eur, label: {} }],
  ['Resultados', { ...income, levels: incomeLevels.map(({ lineStyle: _, ...l }) => l), valueFormat: usd, label: { formatter: (n) => `${n.name}\n${usd(n.value)}` } }],
];

export function mount(el: HTMLElement): () => void {
  let fmt = eur;
  const info = h('span', { class: 'ex-label', text: 'Clica num nó ou numa ligação.' });
  const host = withToolbar(
    el,
    choice('Dados', DATASETS, DATASETS[0][1], (o) => {
      fmt = o.valueFormat!;
      chart.setOptions(o);
    }),
    choice<SankeyOptions['nodeAlign']>('Alinhar', [['Justify', 'justify'], ['Left', 'left'], ['Right', 'right']], 'justify', (nodeAlign) => chart.setOptions({ nodeAlign })),
    choice<SankeyOptions['orient']>('Sentido', [['→', 'horizontal'], ['↓', 'vertical']], 'horizontal', (orient) => chart.setOptions({ orient })),
    choice('Ligações', [['Origem', 'source'], ['Destino', 'target'], ['Gradiente', 'gradient'], ['Cinza', '#787b86']], 'source', (color) =>
      chart.setOptions({ lineStyle: { color, opacity: color === '#787b86' ? 0.3 : 0.38 } }),
    ),
    h('button', { class: 'ex-btn', text: 'Repor nós', onclick: () => chart.resetLayout() }),
    info,
  );
  const chart = createSankeyChart(host, {
    ...DATASETS[0][1],
    lineStyle: { color: 'source', opacity: 0.38 },
  });
  chart.on('click', (p) => {
    info.textContent =
      p.dataType === 'link' ? `${p.source} → ${p.target}: ${fmt(p.value)}` : `${p.name} · entra ${fmt(p.inValue)} · sai ${fmt(p.outValue)} · coluna ${p.depth}`;
  });
  return () => chart.destroy();
}
