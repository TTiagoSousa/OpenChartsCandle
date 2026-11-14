import { createMatrixChart } from 'openchartscandle/matrix';
import { createPieChart } from 'openchartscandle/pie';

// Um gráfico circular da família pie em cada célula: a carteira de três perfis de risco ao longo de quatro
// anos. A matriz cria um elemento por cima de cada célula (mount) e destrói os gráficos quando é destruída.
const CLASSES = ['Ações', 'Obrigações', 'Liquidez', 'Ouro'];
const COLORS = ['#2962ff', '#26a69a', '#ffb74d', '#ffd54f'];
const PROFILES = ['Conservador', 'Equilibrado', 'Dinâmico'];
const YEARS = ['2023', '2024', '2025', '2026'];
const BASE = [
  [20, 60, 15, 5],
  [45, 40, 8, 7],
  [75, 15, 4, 6],
];

export function mount(el: HTMLElement): () => void {
  el.style.display = 'flex';
  el.style.flexDirection = 'column';
  const legend = document.createElement('div');
  legend.style.cssText = 'display:flex;gap:12px;justify-content:center;padding:6px 8px 0;font:12px sans-serif;color:#b2b5be;background:#131722;flex-wrap:wrap';
  legend.innerHTML = CLASSES.map((c, i) => `<span><i style="display:inline-block;width:9px;height:9px;border-radius:50%;background:${COLORS[i]};margin-right:5px"></i>${c}</span>`).join('');
  const host = document.createElement('div');
  host.style.cssText = 'flex:1;min-height:0';
  el.append(legend, host);
  const chart = createMatrixChart(host, {
    x: { data: [{ value: 'Ano', children: YEARS }] },
    y: { data: PROFILES },
    // each cell holds the allocation of a profile in a year (equities grow a little each year)
    data: PROFILES.map((_, p) => YEARS.map((_, y) => BASE[p].map((v, k) => (k === 0 ? v + y * 3 : k === 1 ? v - y * 2 : k === 2 ? Math.max(2, v - y) : v)))),
    mount: (cellEl, cell) => {
      const pie = createPieChart(cellEl, {
        data: (cell.value as number[]).map((value, i) => ({ label: CLASSES[i], value })),
        colors: COLORS,
        innerRadius: 0.55,
        background: 'transparent',
        legend: { show: false },
        labels: { show: false },
        center: { show: false },
        hoverOffset: 3,
        seriesName: `${cell.yName} ${cell.xName}`,
      });
      return () => pie.destroy();
    },
    mountPadding: 4,
  });
  return () => {
    chart.destroy();
    legend.remove();
    host.remove();
  };
}
