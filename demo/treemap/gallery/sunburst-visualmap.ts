import { createTreemap } from 'openchartscandle/treemap';
import { CO2 } from '../data';

// Cor por valor com visualMap: o ângulo é o total de CO₂ emitido e a cor as toneladas por pessoa,
// num gradiente contínuo com a barra de cores à esquerda (a marca segue o setor debaixo do rato).
export function mount(el: HTMLElement): () => void {
  const chart = createTreemap(el, {
    type: 'sunburst',
    data: CO2,
    rootName: 'Mundo',
    breadcrumb: false,
    dimensions: ['Mt CO₂', 't por pessoa'],
    valueFormatter: (v, dim) => (dim === 1 ? `${v.toFixed(1)} t` : `${v.toLocaleString('pt-PT')} Mt`),
    visualMap: { colors: ['#2f93c8', '#aec48f', '#ffdb5c', '#f98862'], dimension: 1, min: 0, max: 16, text: ['16 t', '0 t'] },
    sunburst: { innerRadius: 0.2, gap: 1.5 },
    levels: [{ label: { fontWeight: 600 } }, { label: { minAngle: 5 } }],
  });
  return () => chart.destroy();
}
