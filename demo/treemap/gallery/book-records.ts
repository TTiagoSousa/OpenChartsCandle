import { createTreemap } from 'openchartscandle/treemap';
import { BOOK_RECORDS } from '../data';

// Registo de leituras: género, subgénero, classificação e livro (o ângulo é o número de páginas).
// Cada nível tem os seus raios e etiquetas: centro com texto direito, anel das estrelas só com contorno
// e um anel fino de livros com os títulos do lado de fora.
export function mount(el: HTMLElement): () => void {
  const chart = createTreemap(el, {
    type: 'sunburst',
    data: BOOK_RECORDS,
    rootName: 'Leituras',
    breadcrumb: false,
    colors: ['#ff9800', '#00bcd4'],
    valueFormatter: (v) => `${v.toLocaleString('pt-PT')} páginas`,
    emphasis: { focus: 'ancestor' },
    sunburst: { innerRadius: 0, gap: 1.5, centerLabel: false },
    levels: [
      { r0: 0, r: '24%', label: { rotate: 0, fontWeight: 600 } },
      { r0: '24%', r: '47%', colorLightness: [0.38, 0.6], label: { fontWeight: 600 } },
      { r0: '49%', r: '57%', itemStyle: { opacity: 0.18, borderWidth: 1.5, borderColor: '#787b86' }, label: { rotate: 'tangential', fontSize: 10 } },
      { r0: '57%', r: '59%', label: { position: 'outside', fontSize: 10 } },
    ],
  });
  return () => chart.destroy();
}
