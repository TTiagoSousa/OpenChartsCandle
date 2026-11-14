import { createTreemap, type TreeNode } from 'openchartscandle/treemap';

// Rotação das etiquetas por nível: radial no primeiro anel, tangencial no segundo e direita (0°) no terceiro.
// Cada etiqueta diz o modo em que está escrita; um nó pode ainda escolher o seu (label.rotate: 45).
const leaf = (name: string, value: number): TreeNode => ({ name, value });
const DATA: TreeNode[] = [
  { name: 'A', children: [{ name: 'A1', children: [leaf('a', 2), leaf('b', 1), leaf('c', 1), leaf('d', 0.5)] }, { name: 'A2', value: 2 }] },
  { name: 'B', children: [{ name: 'B1', children: [leaf('e', 2)] }, { name: 'B2', value: 2 }] },
  { name: 'C', children: [{ name: 'C1', children: [leaf('f', 2)] }, { name: 'C2', children: [leaf('g', 1), leaf('h', 1)] }] },
  { name: 'D', children: [{ name: 'D1', children: [leaf('i', 1)] }, { name: 'D2', value: 1.5, label: { rotate: 45 } }] },
];
const MODE = ['radial', 'tangential', '0°'];

export function mount(el: HTMLElement): () => void {
  const chart = createTreemap(el, {
    type: 'sunburst',
    data: DATA,
    sort: false,
    breadcrumb: false,
    sunburst: { innerRadius: 0, gap: 2 },
    label: {
      fontSize: 12,
      formatter: (n) => {
        const own = n.node?.label;
        return typeof own === 'object' && typeof own.rotate === 'number' ? `${own.rotate}°` : MODE[n.depth];
      },
    },
    levels: [
      { itemStyle: { color: '#cd4949' }, label: { rotate: 'radial' } },
      { itemStyle: { color: '#f47251' }, label: { rotate: 'tangential' } },
      { itemStyle: { color: '#ffc75f' }, label: { rotate: 0 } },
    ],
  });
  return () => chart.destroy();
}
