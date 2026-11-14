import { createMatrixChart, type MatrixCell } from 'openchartscandle/matrix';
import { DOWN, UP, drawSpark, pct, seeded } from '../data';

// Vendas semanais por país (linhas, agrupadas por continente) e trimestre (colunas, agrupadas por ano): uma
// sparkline em cada célula, desenhada com renderCell (rápido mesmo com centenas de células), verde se o
// trimestre acabou acima de onde começou. A variação aparece no canto de cada célula. Dados inventados.
const REGIONS = [
  { value: 'Europa', children: ['Portugal', 'Espanha', 'França'] },
  { value: 'América', children: ['EUA', 'Brasil'] },
  { value: 'Ásia', children: ['Japão', 'China'] },
];
const YEARS = ['2024', '2025'].map((y) => ({ value: y, children: ['T1', 'T2', 'T3', 'T4'] }));

export function mount(el: HTMLElement): () => void {
  const rnd = seeded(21);
  const countries = REGIONS.flatMap((r) => r.children);
  const data: MatrixCell[] = [];
  countries.forEach((_, y) => {
    let level = 100;
    for (let x = 0; x < 8; x++) {
      const drift = (rnd() - 0.45) * 2;
      const weeks = [level];
      for (let w = 1; w < 13; w++) weeks.push(weeks[w - 1] * (1 + (drift + (rnd() - 0.5) * 5) / 100));
      level = weeks[12];
      data.push({ coord: [x, y], value: weeks });
    }
  });
  const change = (w: number[]): number => (w[w.length - 1] / w[0] - 1) * 100;
  const chart = createMatrixChart(el, {
    x: { data: YEARS },
    y: { data: REGIONS },
    corner: { text: 'Vendas' },
    data,
    label: {
      formatter: (c) => pct(change(c.value as number[]), 0),
      fontSize: 9,
      align: 'right',
      verticalAlign: 'top',
      padding: 3,
      color: '#787b86',
    },
    renderCell: (ctx, r, c, api) => {
      const w = c.value as number[];
      ctx.globalAlpha *= api.progress;
      drawSpark(ctx, { x: r.x, y: r.y + (r.h > 40 ? 8 : 0), w: r.w, h: r.h - (r.h > 40 ? 8 : 0) }, w, change(w) >= 0 ? UP : DOWN, { area: true, dot: true, pad: 5 });
    },
    tooltip: { formatter: (c) => `<b>${c.yName} · ${c.xPath.join(' ')}</b><br/>Variação: ${pct(change(c.value as number[]))}` },
  });
  return () => chart.destroy();
}
