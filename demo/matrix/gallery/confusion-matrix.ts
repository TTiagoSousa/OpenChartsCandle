import { createMatrixChart, type MatrixCell } from 'openchartscandle/matrix';

// Matriz de confusão de um classificador de sinais (comprar / manter / vender) num ano de dados de teste
// (inventados): linhas = o que aconteceu, colunas = o que o modelo previu. Cada célula tem a contagem e a %
// da linha; verde na diagonal (acertos), vermelho fora dela. Totais, recall e precisão nas margens e a
// exatidão numa célula unida no canto.
const CLASSES = ['Comprar', 'Manter', 'Vender'];
const M = [
  [142, 31, 7],
  [24, 310, 36],
  [5, 28, 117],
];

export function mount(el: HTMLElement): () => void {
  const rowSum = M.map((r) => r.reduce((a, b) => a + b, 0));
  const colSum = CLASSES.map((_, j) => M.reduce((a, r) => a + r[j], 0));
  const total = rowSum.reduce((a, b) => a + b, 0);
  const diag = M.reduce((a, r, i) => a + r[i], 0);
  const p = (v: number): string => `${(v * 100).toLocaleString('pt-PT', { maximumFractionDigits: 1 })}%`;
  const margin = { color: '#1a1e2b' };
  const data: MatrixCell[] = [];
  M.forEach((row, i) =>
    row.forEach((v, j) => {
      const share = v / rowSum[i];
      const hit = i === j;
      data.push({
        coord: [j, i],
        value: v,
        text: `${v}\n${p(share)}`,
        color: hit ? `rgba(8, 153, 129, ${(0.25 + share * 0.75).toFixed(2)})` : `rgba(242, 54, 69, ${Math.min(0.9, 0.08 + share * 2.2).toFixed(2)})`,
        label: { fontWeight: hit ? 600 : 400 },
      });
    }),
  );
  CLASSES.forEach((_, i) => {
    data.push({ coord: ['Total', i], value: rowSum[i], itemStyle: margin });
    data.push({ coord: ['Recall', i], value: M[i][i] / rowSum[i], text: p(M[i][i] / rowSum[i]), itemStyle: margin });
    data.push({ coord: [i, 'Total'], value: colSum[i], itemStyle: margin });
    data.push({ coord: [i, 'Precisão'], value: M[i][i] / colSum[i], text: p(M[i][i] / colSum[i]), itemStyle: margin });
  });
  data.push({
    coord: [['Total', 'Recall'], ['Total', 'Precisão']],
    value: diag / total,
    text: `Exatidão\n${p(diag / total)}`,
    color: '#1e3a8a',
    label: { fontWeight: 600 },
  });

  const chart = createMatrixChart(el, {
    x: { data: [{ value: 'Previsto', children: CLASSES }, 'Total', 'Recall'], cellSize: ['1fr', '1fr', '1fr', '0.75fr', '0.75fr'] },
    y: { data: [{ value: 'Real', children: CLASSES }, 'Total', 'Precisão'], cellSize: ['1fr', '1fr', '1fr', '0.6fr', '0.6fr'] },
    corner: { text: `${total} dias` },
    data,
    gap: 2,
    label: { fontSize: 13 },
    tooltip: {
      formatter: (c) =>
        c.x < 3 && c.y < 3
          ? `<b>Real: ${c.yName} · Previsto: ${c.xName}</b><br/>${c.value} dias (${p((c.value as number) / rowSum[c.y])} da linha)`
          : `<b>${c.yName} · ${c.xName}</b><br/>${c.text.replace(/\n/g, ' ')}`,
    },
  });
  return () => chart.destroy();
}
