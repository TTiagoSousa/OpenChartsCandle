import { CHANGE_COLORS, createTreemap, type TreemapOptions } from 'openchartscandle/treemap';
import { marketData, seeded, treemapGrid } from '../data';

// Cores por nível: paleta nos grupos, filhos com a cor do pai em tons diferentes (saturação ou luminosidade),
// gradiente pelo valor de uma dimensão, uma lista de cores por nível ou uma cor fixa num nó.
const data = marketData(seeded(5));
const CASES: [string, Partial<TreemapOptions>][] = [
  ['Paleta nos grupos (colors)', { colors: ['#5470c6', '#91cc75', '#fac858', '#ee6666', '#73c0de', '#3ba272', '#fc8452', '#9a60b4'] }],
  ['Luminosidade entre irmãos (colorLightness)', { levels: [{ gap: 3 }, { colorLightness: [0.3, 0.65] }] }],
  ['Saturação entre irmãos (colorSaturation)', { levels: [{ gap: 3 }, { colorSaturation: [0.15, 0.85] }] }],
  ['Gradiente pela variação (visualDimension)', { levels: [{ gap: 3 }, { color: CHANGE_COLORS, colorMappingBy: 'value', visualDimension: 1, visualMin: -3, visualMax: 3 }] }],
  ['Uma lista por nível (colorMappingBy: index)', { levels: [{ gap: 3, color: ['#2962ff', '#9c27b0', '#00bcd4'], colorMappingBy: 'index' }, { colorLightness: [0.4, 0.6] }] }],
  [
    'Cor fixa num nó (color)',
    { data: data.map((s) => ({ ...s, color: s.name === 'Tecnologia' ? '#ff9800' : '#434651' })), levels: [{ gap: 3 }, { colorLightness: [0.35, 0.55] }] },
  ],
];

export function mount(el: HTMLElement): () => void {
  const hosts = treemapGrid(
    el,
    CASES.map(([t]) => t),
    300,
  );
  const charts = CASES.map(([, o], i) => createTreemap(hosts[i], { data, upperLabel: true, breadcrumb: false, ...o }));
  return () => charts.forEach((c) => c.destroy());
}
