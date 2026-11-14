import { createTreemap, type TreeNode } from 'openchartscandle/treemap';
import { seeded } from '../data';

// Cor por valor (gradient mapping): o tamanho é o volume de vendas e a cor a variação face ao ano anterior,
// num gradiente vermelho → cinzento → verde entre -40% e +40% (colorMappingBy: 'value', visualDimension: 1).
const rnd = seeded(7);
const REGIONS: Record<string, string[]> = {
  Norte: ['Porto', 'Braga', 'Viana', 'Vila Real', 'Bragança', 'Guimarães'],
  Centro: ['Coimbra', 'Aveiro', 'Viseu', 'Leiria', 'Guarda', 'Castelo Branco'],
  Lisboa: ['Lisboa', 'Sintra', 'Cascais', 'Oeiras', 'Almada', 'Setúbal', 'Loures'],
  Alentejo: ['Évora', 'Beja', 'Portalegre', 'Sines'],
  Algarve: ['Faro', 'Portimão', 'Lagos', 'Tavira', 'Albufeira'],
  Ilhas: ['Funchal', 'Ponta Delgada', 'Angra'],
};
const DATA: TreeNode[] = Object.entries(REGIONS).map(([name, cities]) => ({
  name,
  children: cities.map((c) => ({ name: c, value: [Math.round(20 + rnd() * 180), +((rnd() - 0.45) * 80).toFixed(1)] })),
}));

export function mount(el: HTMLElement): () => void {
  const chart = createTreemap(el, {
    data: DATA,
    dimensions: ['Vendas (mil €)', 'Variação (%)'],
    valueFormatter: (v, dim) => (dim === 1 ? `${v > 0 ? '+' : ''}${v}%` : `${v}`),
    upperLabel: true,
    label: { formatter: (n) => `${n.name}\n${n.values[1] > 0 ? '+' : ''}${n.values[1]}%` },
    levels: [
      { gap: 3, borderColor: '#1e222d' },
      { color: ['#942e38', '#5d606b', '#269f3c'], colorMappingBy: 'value', visualDimension: 1, visualMin: -40, visualMax: 40 },
    ],
  });
  return () => chart.destroy();
}
