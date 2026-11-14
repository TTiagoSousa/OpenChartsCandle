import { createTreemap } from 'openchartscandle/treemap';
import { choice, optionQuery } from '../data';

// Que opções do ECharts são mais consultadas na documentação (contagens inventadas).
// Mostra um nível de cada vez (leafDepth: 1): clica numa opção para ver as sub-opções.
// Os botões trocam entre o ECharts 2 e o 3; os retângulos animam para o novo tamanho.
export function mount(el: HTMLElement): () => void {
  el.style.display = 'flex';
  el.style.flexDirection = 'column';
  const bar = document.createElement('div');
  bar.className = 'ex-toolbar';
  const host = document.createElement('div');
  host.style.cssText = 'flex:1;min-height:0';
  el.append(bar, host);
  const chart = createTreemap(host, {
    data: optionQuery(2),
    rootName: 'option',
    leafDepth: 1,
    label: { formatter: (n) => `${n.name}${n.isLeaf ? '' : ' ›'}\n${n.value.toLocaleString('pt-PT')} pesquisas` },
    levels: [
      { gap: 2, colorSaturation: [0.3, 0.6] },
      { gap: 2, colorSaturation: [0.3, 0.6] },
      { gap: 2, colorSaturation: [0.3, 0.6] },
    ],
    valueFormatter: (v) => `${v.toLocaleString('pt-PT')} pesquisas`,
  });
  bar.append(choice('Versão', [['ECharts 2', 2 as const], ['ECharts 3', 3 as const]], 2, (v) => chart.setData(optionQuery(v))));
  return () => {
    chart.destroy();
    bar.remove();
    host.remove();
  };
}
