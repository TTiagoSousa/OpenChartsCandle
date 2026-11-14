import { CHANGE_COLORS, createTreemap, type TreemapOptions } from 'openchartscandle/treemap';
import { BUDGET, choice } from '../data';

// Como se gastam 3,7 biliões de dólares (orçamento federal dos EUA de 2012, valores aproximados).
// Cada departamento tem três valores: 2012, 2011 e o crescimento. Os botões trocam
// o que define a área e a cor; os retângulos animam até ao novo tamanho.
const money = (v: number): string => (v >= 1000 ? `$${(v / 1000).toFixed(2)} T` : `$${v.toFixed(v < 10 ? 1 : 0)} B`);

const VIEWS: Record<string, Partial<TreemapOptions>> = {
  // tamanho = 2012, cor por departamento
  budget2012: { sizeDimension: 0, levels: [{ gap: 3 }, { gap: 1, colorLightness: [0.35, 0.55] }] },
  // tamanho = 2011
  budget2011: { sizeDimension: 1, levels: [{ gap: 3 }, { gap: 1, colorLightness: [0.35, 0.55] }] },
  // tamanho = 2012, cor = crescimento (vermelho cortes, verde aumentos)
  growth: {
    sizeDimension: 0,
    levels: [
      { gap: 3, color: CHANGE_COLORS, colorMappingBy: 'value', visualDimension: 2, visualMin: -25, visualMax: 25 },
      { gap: 1, color: CHANGE_COLORS, colorMappingBy: 'value', visualDimension: 2, visualMin: -40, visualMax: 40 },
    ],
  },
};

export function mount(el: HTMLElement): () => void {
  el.style.display = 'flex';
  el.style.flexDirection = 'column';
  const bar = document.createElement('div');
  bar.className = 'ex-toolbar';
  const host = document.createElement('div');
  host.style.cssText = 'flex:1;min-height:0';
  el.append(bar, host);
  const chart = createTreemap(host, {
    data: BUDGET,
    rootName: 'Orçamento',
    upperLabel: true,
    dimensions: ['2012', '2011', 'Crescimento'],
    valueFormatter: (v, dim) => (dim === 2 ? `${v > 0 ? '+' : ''}${v}%` : money(v)),
    label: { formatter: (n) => `${n.name}\n${money(n.value)}` },
    ...VIEWS.budget2012,
  });
  bar.append(
    choice(
      'Ver',
      [['Orçamento 2012', 'budget2012'], ['Orçamento 2011', 'budget2011'], ['Crescimento', 'growth']],
      'budget2012',
      (v) => chart.setOptions(VIEWS[v]),
    ),
  );
  return () => {
    chart.destroy();
    bar.remove();
    host.remove();
  };
}
