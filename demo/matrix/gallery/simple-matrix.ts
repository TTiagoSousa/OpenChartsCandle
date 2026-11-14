import { createMatrixChart, type MatrixCell } from 'openchartscandle/matrix';

// A matriz mais simples: colunas com dois níveis (ano › semestre), linhas com as regiões e um valor em cada
// célula. No Sul, 2025 ainda não tem dados e 2026 é uma só célula unida sobre os dois semestres.
const VALUES = [
  [120, 134, 141, 158],
  [88, 91, 97, 104],
  [210, 225, 248, 262],
];

export function mount(el: HTMLElement): () => void {
  const data: MatrixCell[] = VALUES.flatMap((row, y) => row.map((value, x): MatrixCell => ({ coord: [x, y], value })));
  data.push({ coord: ['2025', 'Sul'], text: 'Sem dados', label: { color: '#787b86' } });
  data.push({ coord: ['2026', 'Sul'], value: 175, color: 'rgba(41, 98, 255, 0.25)' });
  const chart = createMatrixChart(el, {
    title: { text: 'Vendas por região', subtext: 'Milhares de €, por semestre (dados inventados)', align: 'left' },
    x: { data: [{ value: '2025', children: ['S1', 'S2'] }, { value: '2026', children: ['S1', 'S2'] }] },
    y: { data: ['Norte', 'Centro', 'Lisboa', 'Sul'] },
    corner: { text: 'Região' },
    data,
    valueFormatter: (v) => `${v} mil €`,
  });
  return () => chart.destroy();
}
