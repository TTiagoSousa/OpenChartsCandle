import { createCustomChart, type CustomElement } from 'openchartscandle/custom';
import { estimates } from '../data';

// Estimativas dos analistas: cada ação é um ponto (lucro por ação × preço-alvo) com barras de erro nos dois
// eixos, do mínimo ao máximo das estimativas. Os traços e o ponto saem todos do mesmo renderItem.
export function mount(el: HTMLElement): () => void {
  const chart = createCustomChart(el, {
    xAxis: { name: 'Lucro por ação estimado ($)', nameLocation: 'middle', beginAtZero: false, splitLine: true },
    yAxis: { name: 'Preço-alvo ($)', beginAtZero: false },
    series: [
      {
        name: 'Estimativas',
        data: estimates(),
        dimensions: ['LPA', 'Preço-alvo', 'LPA mín.', 'LPA máx.', 'Alvo mín.', 'Alvo máx.', 'Ação'],
        encode: { x: [0, 2, 3], y: [1, 4, 5], itemName: 6, tooltip: [0, 2, 3, 1, 4, 5] },
        emphasis: { focus: 'self' },
        renderItem: (p, api) => {
          const c = api.coord([api.value(0), api.value(1)]);
          const xl = api.coord([api.value(2), api.value(1)])[0];
          const xh = api.coord([api.value(3), api.value(1)])[0];
          const yl = api.coord([api.value(0), api.value(4)])[1];
          const yh = api.coord([api.value(0), api.value(5)])[1];
          const cap = 4;
          const ln = (x1: number, y1: number, x2: number, y2: number): CustomElement => ({ type: 'line', shape: { x1, y1, x2, y2 }, style: { stroke: p.color, lineWidth: 1.2 } });
          return {
            type: 'group',
            children: [
              ln(xl, c[1], xh, c[1]),
              ln(xl, c[1] - cap, xl, c[1] + cap),
              ln(xh, c[1] - cap, xh, c[1] + cap),
              ln(c[0], yl, c[0], yh),
              ln(c[0] - cap, yl, c[0] + cap, yl),
              ln(c[0] - cap, yh, c[0] + cap, yh),
              { type: 'circle', shape: { cx: c[0], cy: c[1], r: 4 }, style: { fill: p.color, stroke: '#131722', lineWidth: 1 } },
            ],
          };
        },
      },
    ],
  });
  return () => chart.destroy();
}
