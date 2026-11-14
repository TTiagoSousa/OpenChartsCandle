import { createBarChart } from 'openchartscandle/bar';

// População mundial (milhares) em barras horizontais agrupadas por ano.
export function mount(el: HTMLElement): () => void {
  const mi = (v: number): string => `${(v / 1000).toFixed(1)} M`;
  const chart = createBarChart(el, {
    orientation: 'horizontal',
    categories: ['Brasil', 'Indonésia', 'EUA', 'Índia', 'China', 'Mundo'],
    series: [
      { name: '2011', data: [18203, 23489, 29034, 104970, 131744, 630230] },
      { name: '2012', data: [19325, 23438, 31000, 121594, 134141, 681807] },
    ],
    legend: { position: 'top', align: 'center' },
    valueAxis: { format: (v) => `${Math.round(v / 1000)} M` },
    valueFormatter: mi,
  });
  return () => chart.destroy();
}
