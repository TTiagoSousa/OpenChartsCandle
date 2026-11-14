import { createBarChart } from 'openchartscandle/bar';
import { createGauge } from 'openchartscandle/gauge';
import { createLineChart } from 'openchartscandle/line';
import { createMatrixChart, type MatrixCell, type MatrixOptions } from 'openchartscandle/matrix';
import { createPieChart } from 'openchartscandle/pie';
import { createScatterChart } from 'openchartscandle/scatter';
import { MONTHS, seeded } from '../data';

// A matriz como grelha de um dashboard: cada célula tem um gráfico de outra família (linha, barras, circular,
// conta-quilómetros, dispersão) e as regras `media` mudam a grelha com a largura: 3 colunas, 2 ou 1. Os
// gráficos não são recriados, só mudam de sítio. Arrasta o canto inferior direito da caixa para a estreitar.
type Panel = { id: string; title: string; create: (el: HTMLElement) => { destroy(): void } };

const rnd = seeded(5);
const equity = Array.from({ length: 120 }, (_, i) => 100 * Math.exp(i * 0.002 + Math.sin(i / 9) * 0.03 + (rnd() - 0.5) * 0.02));

const PANELS: Panel[] = [
  {
    id: 'equity',
    title: 'Valor da carteira',
    create: (el) => createLineChart(el, { series: [{ name: 'Carteira', data: equity, color: '#2962ff' }], area: { opacity: 0.25, gradient: true }, background: 'transparent', padding: 4, legend: { show: false } }),
  },
  {
    id: 'pnl',
    title: 'Resultado por mês',
    create: (el) =>
      createBarChart(el, {
        categories: MONTHS,
        series: [{ name: 'Resultado', data: MONTHS.map(() => Math.round((rnd() - 0.35) * 40)), negativeColor: '#f23645', color: '#089981' }],
        background: 'transparent',
        padding: 4,
        legend: { show: false },
      }),
  },
  {
    id: 'alloc',
    title: 'Alocação',
    create: (el) =>
      createPieChart(el, {
        data: [
          { label: 'Ações', value: 58 },
          { label: 'Obrigações', value: 27 },
          { label: 'Liquidez', value: 9 },
          { label: 'Ouro', value: 6 },
        ],
        innerRadius: 0.55,
        background: 'transparent',
        legend: { show: false },
        labels: { show: false },
      }),
  },
  {
    id: 'risk',
    title: 'Risco (VaR usado)',
    create: (el) =>
      createGauge(el, {
        value: 63,
        shape: 'semi',
        unit: '%',
        zones: [
          { from: 0, to: 60, color: '#089981' },
          { from: 60, to: 85, color: '#ffb74d' },
          { from: 85, to: 100, color: '#f23645' },
        ],
        background: 'transparent',
      }),
  },
  {
    id: 'scatter',
    title: 'Risco × retorno',
    create: (el) =>
      createScatterChart(el, {
        series: [{ name: 'Ativos', data: Array.from({ length: 24 }, () => [+(5 + rnd() * 30).toFixed(1), +((rnd() - 0.3) * 25).toFixed(1)]), color: '#ab47bc' }],
        background: 'transparent',
        padding: 4,
        legend: { show: false },
        xAxis: { title: 'Volatilidade %' },
      }),
  },
];

/** Where each panel goes for 3, 2 and 1 columns. */
const LAYOUTS: Record<number, Record<string, MatrixCell['coord']>> = {
  3: { equity: [[0, 1], 0], risk: [2, 0], pnl: [0, 1], alloc: [1, 1], scatter: [2, 1] },
  2: { equity: [[0, 1], 0], pnl: [0, 1], alloc: [1, 1], risk: [0, 2], scatter: [1, 2] },
  1: { equity: [0, 0], pnl: [0, 1], alloc: [0, 2], risk: [0, 3], scatter: [0, 4] },
};

export function mount(el: HTMLElement): () => void {
  // a box you can resize, to see the grid re-flow
  const box = document.createElement('div');
  box.style.cssText = 'position:relative;width:100%;height:100%;min-width:200px;max-width:100%;resize:horizontal;overflow:hidden;background:#0b0e16';
  el.append(box);
  const grid = (cols: number, rows: number): Partial<MatrixOptions> => ({
    x: { data: cols, show: false },
    y: { data: rows, show: false },
    data: PANELS.map((p) => ({ coord: LAYOUTS[cols][p.id], id: p.id, value: p.title, data: p })),
  });
  const chart = createMatrixChart(box, {
    ...grid(3, 2),
    media: [
      { query: { maxWidth: 620 }, option: grid(2, 3) },
      { query: { maxWidth: 250 }, option: grid(1, 5) },
    ],
    gap: 10,
    padding: 6,
    background: 'transparent',
    itemStyle: { color: '#161a25', borderColor: '#2a2e39', borderWidth: 1, radius: 8 },
    label: { show: false },
    emphasis: false,
    tooltip: false,
    mountPadding: 6,
    mount: (cellEl, cell) => {
      const p = cell.data && ((cell.data as MatrixCell).data as Panel);
      if (!p) return;
      cellEl.style.display = 'flex';
      cellEl.style.flexDirection = 'column';
      const head = document.createElement('div');
      head.textContent = p.title;
      head.style.cssText = 'flex:none;font:600 12px sans-serif;color:#b2b5be;padding:2px 4px 4px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis';
      const body = document.createElement('div');
      body.style.cssText = 'flex:1;min-height:0;position:relative';
      cellEl.append(head, body);
      const c = p.create(body);
      return () => c.destroy();
    },
  });
  return () => {
    chart.destroy();
    box.remove();
  };
}
