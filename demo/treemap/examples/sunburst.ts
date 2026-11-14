import { createTreemap, type TreemapSunburstOptions } from 'openchartscandle/treemap';
import { choice, h, marketData, seeded } from '../data';

// Sunburst: os mesmos dados em anéis (setores dentro de setores). Clica num setor para o pôr ao centro
// e no centro para voltar. Passar o rato destaca o ramo. Etiquetas radiais, tangenciais ou direitas.
export function mount(el: HTMLElement): () => void {
  const host = h('div', { class: 'ex-fill' });
  let sunburst: TreemapSunburstOptions = { innerRadius: 0.15, labelRotate: 'radial', gap: 1.5 };
  const set = (patch: TreemapSunburstOptions, animate = true): void => {
    sunburst = { ...sunburst, ...patch };
    chart.setOptions({ sunburst }, animate);
  };
  el.append(
    h(
      'div',
      { class: 'ex-toolbar' },
      choice('Etiquetas', [['Radiais', 'radial' as const], ['Tangenciais', 'tangential' as const], ['Direitas', 'none' as const]], 'radial', (v) =>
        set({ labelRotate: v }, false),
      ),
      choice('Buraco', [['Pequeno', 0.15], ['Grande', 0.4], ['Sem', 0]], 0.15, (v) => set({ innerRadius: v })),
      choice('Forma', [['Sunburst', 'sunburst' as const], ['Treemap', 'treemap' as const]], 'sunburst', (v) => chart.setType(v)),
    ),
    host,
  );
  const chart = createTreemap(host, {
    type: 'sunburst',
    data: marketData(seeded(3)),
    rootName: 'S&P 500',
    breadcrumb: false,
    valueFormatter: (v) => `$${v.toLocaleString('pt-PT')} B`,
    sunburst,
    levels: [{}, { colorLightness: [0.36, 0.62] }],
  });
  return () => chart.destroy();
}
