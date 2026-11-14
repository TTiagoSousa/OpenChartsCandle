import { createTreemap } from 'openchartscandle/treemap';
import { choice, h, kb, projectTree } from '../data';

// Treemap clássico: o código desta biblioteca por pasta e ficheiro (tamanho em bytes).
// A área é proporcional ao valor; clica numa pasta para entrar e usa o caminho em baixo para voltar.
export function mount(el: HTMLElement): () => void {
  const host = h('div', { class: 'ex-fill' });
  let chart: ReturnType<typeof createTreemap> | null = null;
  let dead = false;
  el.append(
    h(
      'div',
      { class: 'ex-toolbar' },
      choice('Forma', [['Treemap', 'treemap' as const], ['Sunburst', 'sunburst' as const]], 'treemap', (v) => chart?.setType(v)),
      choice('Cabeçalhos', [['Sim', true], ['Não', false]], true, (v) => chart?.setOptions({ upperLabel: v })),
      choice('Valores', [['Não', false], ['Sim', true]], false, (v) => chart?.setOptions({ label: { showValue: v } }, false)),
    ),
    host,
  );
  void projectTree('src').then((data) => {
    if (dead) return;
    chart = createTreemap(host, { data, rootName: 'src', upperLabel: true, valueFormatter: kb, levels: [{ gap: 3 }, { colorLightness: [0.38, 0.58] }] });
  });
  return () => {
    dead = true;
    chart?.destroy();
  };
}
