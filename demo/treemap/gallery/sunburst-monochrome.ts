import { createTreemap } from 'openchartscandle/treemap';
import { PT_POPULATION } from '../data';

// Sunburst monocromático: um só tom, mais escuro no centro e mais claro para fora, mais forte nos maiores.
// Passar o rato acende o setor e os seus antepassados (emphasis.focus: 'ancestor'); o resto fica esbatido.
export function mount(el: HTMLElement): () => void {
  const chart = createTreemap(el, {
    type: 'sunburst',
    data: PT_POPULATION,
    rootName: 'Portugal',
    breadcrumb: false,
    colors: ['#2962ff'],
    valueFormatter: (v) => `${v.toLocaleString('pt-PT')} mil`,
    emphasis: { focus: 'ancestor', blurOpacity: 0.25 },
    sunburst: { innerRadius: 0.22, gap: 0, labelRotate: 'radial' },
    levels: [
      { colorLightness: [0.3, 0.46], itemStyle: { borderWidth: 2 }, label: { fontWeight: 600 } },
      { colorLightness: [0.5, 0.74], itemStyle: { borderWidth: 1 }, label: { minAngle: 4 } },
    ],
  });
  return () => chart.destroy();
}
