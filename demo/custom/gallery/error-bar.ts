import { createCustomChart, type CustomRenderItem } from 'openchartscandle/custom';
import { sectorVolatility } from '../data';

// Barras com barras de erro: duas séries (2025 e 2026) lado a lado em cada setor, posicionadas com
// api.barLayout(), e o intervalo mínimo–máximo desenhado por cima de cada barra no mesmo renderItem.
export function mount(el: HTMLElement): () => void {
  const a = sectorVolatility();
  const b = a.map(([s, m, lo, hi], i) => [s, +(m * (0.8 + (i % 3) * 0.15)).toFixed(2), +(lo * 0.85).toFixed(2), +(hi * 0.95).toFixed(2)] as [string, number, number, number]);
  const bar =
    (k: number): CustomRenderItem =>
    (p, api) => {
      const lay = api.barLayout({ count: 2, gap: 0.15 })[k];
      const [x, y] = api.coord([api.value(0), api.value(1)]);
      const [, y0] = api.coord([api.value(0), 0]);
      const [, yl] = api.coord([api.value(0), api.value(2)]);
      const [, yh] = api.coord([api.value(0), api.value(3)]);
      const cx = x + lay.offset;
      const cap = lay.width * 0.25;
      const err = { stroke: api.theme.text, lineWidth: 1.2 };
      return {
        type: 'group',
        children: [
          { type: 'rect', shape: { x: cx - lay.width / 2, y, width: lay.width, height: y0 - y }, style: { fill: p.color, fillOpacity: 0.85 }, enterFrom: { shape: { y: y0, height: 0 } } },
          { type: 'line', shape: { x1: cx, y1: yl, x2: cx, y2: yh }, style: err },
          { type: 'line', shape: { x1: cx - cap, y1: yl, x2: cx + cap, y2: yl }, style: err },
          { type: 'line', shape: { x1: cx - cap, y1: yh, x2: cx + cap, y2: yh }, style: err },
        ],
      };
    };
  const dims = ['Setor', 'Média', 'Mínimo', 'Máximo'];
  const chart = createCustomChart(el, {
    xAxis: { type: 'category', rotate: 30 },
    yAxis: { name: 'Volatilidade diária (%)' },
    legend: { position: 'top' },
    series: [
      { name: '2025', data: a, dimensions: dims, encode: { x: 0, y: [1, 2, 3], itemName: 0, tooltip: [1, 2, 3] }, color: '#2962ff', renderItem: bar(0) },
      { name: '2026', data: b, dimensions: dims, encode: { x: 0, y: [1, 2, 3], itemName: 0, tooltip: [1, 2, 3] }, color: '#00bcd4', renderItem: bar(1) },
    ],
    valueFormatter: (v) => `${v}%`,
  });
  return () => chart.destroy();
}
