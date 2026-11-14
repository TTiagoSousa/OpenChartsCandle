import { createMatrixChart, type MatrixCell, type MatrixOptions } from 'openchartscandle/matrix';
import { choice, h } from '../../line/data';
import { withToolbar } from '../../scatter/data';
import { DOWN, MONTHS, QUARTER_MONTHS, UP, drawSpark, monthlyReturns, pct } from '../data';

// Retornos mensais de um fundo (dados inventados): um ano por linha, os meses em colunas agrupados por
// trimestre (cabeçalho com dois níveis) e o ano inteiro na última coluna. Os botões mudam o conteúdo das
// células com setOptions(): só números, cores por visualMap ou o caminho do mês desenhado com renderCell.
// O rato acende a linha e a coluna; um click mostra o mês; com "Seleção" os cabeçalhos selecionam a linha
// ou a coluna inteira.
const YEARS = Array.from({ length: 10 }, (_, i) => String(2016 + i));

export function mount(el: HTMLElement): () => void {
  const months = monthlyReturns(YEARS.map(Number));
  const yearRet = months.map((row) => (row.reduce((a, m) => a * (1 + m.ret / 100), 1) - 1) * 100);
  const cells = (mode: string): MatrixCell[] => {
    const out: MatrixCell[] = [];
    months.forEach((row, y) => {
      row.forEach((m, x) =>
        out.push({
          coord: [x, y],
          value: m.ret,
          data: m,
          label: mode === 'values' ? { color: m.ret >= 0 ? UP : DOWN } : undefined,
        }),
      );
      out.push({ coord: ['Ano', y], value: yearRet[y], label: { fontWeight: 600, ...(mode !== 'colors' ? { color: yearRet[y] >= 0 ? UP : DOWN } : {}) }, color: mode === 'colors' ? undefined : '#1a1e2b' });
    });
    return out;
  };
  const modes: [string, MatrixOptions][] = [
    ['Cores', { data: cells('colors'), visualMap: { min: -6, max: 6, colors: ['#b71c1c', '#ef5350', '#2a2e39', '#26a69a', '#00695c'], formatter: (v) => `${v}%` }, renderCell: undefined, label: {} }],
    ['Valores', { data: cells('values'), visualMap: false, renderCell: undefined, label: {} }],
    [
      'Sparklines',
      {
        data: cells('spark'),
        visualMap: false,
        label: { show: false },
        renderCell: (ctx, r, c, api) => {
          const m = (c.data as MatrixCell).data as { path: number[]; ret: number } | undefined;
          if (!m) {
            // the year column keeps its number
            ctx.font = `600 12px ${api.theme.font}`;
            ctx.fillStyle = (c.value as number) >= 0 ? UP : DOWN;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(pct(c.value as number), r.x + r.w / 2, r.y + r.h / 2);
            return;
          }
          ctx.globalAlpha *= api.progress;
          drawSpark(ctx, r, m.path, m.ret >= 0 ? UP : DOWN, { base: 100, pad: 4 });
        },
      },
    ],
  ];
  const info = h('span', { class: 'ex-label', text: 'Clica num mês.' });
  const host = withToolbar(
    el,
    choice('Células', modes, modes[0][1], (o) => chart.setOptions(o)),
    choice<MatrixOptions['emphasis']>(
      'Realce',
      [
        ['Cruz', 'cross'],
        ['Linha', 'row'],
        ['Célula', 'cell'],
        ['Nenhum', false],
      ],
      'cross',
      (emphasis) => chart.setOptions({ emphasis }, false),
    ),
    choice<MatrixOptions['select']>(
      'Seleção',
      [
        ['Não', false],
        ['Várias', 'multiple'],
      ],
      false,
      (select) => {
        chart.clearSelection();
        chart.setOptions({ select }, false);
      },
    ),
    info,
  );
  const chart = createMatrixChart(host, {
    x: { data: [...QUARTER_MONTHS, 'Ano'], cellSize: [...MONTHS.map(() => '1fr'), '1.3fr'] },
    y: { data: YEARS },
    ...modes[0][1],
    valueFormatter: (v) => pct(v),
    tooltip: { headers: true },
  });
  chart.on('click', (c) => {
    if (c.kind === 'body') info.textContent = `${c.xName === 'Ano' ? 'Ano' : `${c.xName}`} ${c.yName}: ${pct(c.value as number, 2)}`;
  });
  chart.on('select', (sel) => {
    if (!sel.length) return;
    const avg = sel.reduce((a, c) => a + (c.value as number), 0) / sel.length;
    info.textContent = `${sel.length} células selecionadas · média ${pct(avg, 2)}`;
  });
  return () => chart.destroy();
}
