import { createMatrixChart, type MatrixCell } from 'openchartscandle/matrix';
import { PT_REGIONS, drawBars, drawTiles } from '../data';

// Vendas por região de Portugal: barras por trimestre, o total, a quota com uma barra horizontal e, na última
// coluna, onde fica a região. Não há mapas na biblioteca, por isso o "mapa" é um cartograma de quadrados
// arredondados (um por distrito, mais Açores e Madeira) desenhado à mão com renderCell. Dados inventados.
export function mount(el: HTMLElement): () => void {
  const max = Math.max(...PT_REGIONS.flatMap((r) => r.sales));
  const data: MatrixCell[] = [];
  PT_REGIONS.forEach((reg) => {
    data.push({
      coord: ['T1–T4', reg.name],
      value: reg.sales,
      render: (ctx, r, _c, api) => drawBars(ctx, r, reg.sales.map((v) => v * api.progress), '#5b8def', { max, highlight: '#2962ff', pad: 5 }),
    });
    data.push({ coord: ['Total', reg.name], value: reg.sales.reduce((a, b) => a + b, 0), label: { align: 'right', fontWeight: 600 } });
    data.push({
      coord: ['Quota', reg.name],
      value: reg.share,
      text: `${reg.share.toLocaleString('pt-PT')}%`,
      label: { align: 'left', padding: 6, fontSize: 11 },
      render: (ctx, r, _c, api) => {
        const w = (r.w - 44) * (reg.share / 35) * api.progress;
        ctx.fillStyle = 'rgba(255, 183, 77, 0.85)';
        ctx.fillRect(r.x + 40, r.y + r.h / 2 - 4, Math.max(0, w), 8);
      },
    });
    data.push({
      coord: ['Mapa', reg.name],
      value: reg.name,
      label: { show: false },
      render: (ctx, r) => drawTiles(ctx, r, reg.name, '#ffb74d', 'rgba(120, 123, 134, 0.3)'),
    });
  });
  const chart = createMatrixChart(el, {
    x: {
      data: [{ value: 'Vendas (mil €)', children: ['T1–T4', 'Total'] }, 'Quota', 'Mapa'],
      cellSize: ['1.2fr', '0.8fr', '1.3fr', '0.9fr'],
      levelSize: 22,
    },
    y: { data: PT_REGIONS.map((r) => r.name) },
    corner: { text: 'Região' },
    data,
    emphasis: 'row',
    tooltip: {
      formatter: (c) => {
        const reg = PT_REGIONS.find((r) => r.name === c.yName)!;
        return `<b>${reg.name}</b><br/>Por trimestre: ${reg.sales.join(' · ')}<br/>Quota: ${reg.share.toLocaleString('pt-PT')}%`;
      },
    },
  });
  return () => chart.destroy();
}
