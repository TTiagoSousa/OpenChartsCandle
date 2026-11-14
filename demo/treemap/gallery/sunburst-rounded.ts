import { createTreemap } from 'openchartscandle/treemap';
import { HOUSEHOLD } from '../data';

// Cantos arredondados: cada setor com borderRadius e um espaço entre irmãos (gap e padAngle).
// O orçamento mensal de uma casa, por categoria e despesa.
export function mount(el: HTMLElement): () => void {
  const chart = createTreemap(el, {
    type: 'sunburst',
    data: HOUSEHOLD,
    rootName: 'Por mês',
    breadcrumb: false,
    valueFormatter: (v) => `${v.toLocaleString('pt-PT')} €`,
    sunburst: { innerRadius: 0.3, gap: 3, padAngle: 1, borderRadius: 7, labelRotate: 'radial' },
    levels: [{ label: { fontWeight: 600 } }, { colorLightness: [0.42, 0.66], label: { minAngle: 8 } }],
  });
  return () => chart.destroy();
}
