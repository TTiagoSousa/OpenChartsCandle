import { createCustomChart } from 'openchartscandle/custom';
import { monthlyPnl } from '../data';

// Resultado mensal de uma mesa de trading: cada mês é uma barra com a ponta em seta (para cima nos ganhos,
// para baixo nas perdas) e o valor por cima. A forma é um polígono desenhado no renderItem.
export function mount(el: HTMLElement): () => void {
  const chart = createCustomChart(el, {
    xAxis: { type: 'category' },
    yAxis: { name: 'k€', min: -90, max: 110 },
    series: [
      {
        name: 'Resultado',
        data: monthlyPnl(),
        dimensions: ['Mês', 'Resultado'],
        encode: { tooltip: [1], itemName: 0 },
        renderItem: (p, api) => {
          const v = Number(api.value(1));
          const [x, y] = api.coord([api.value(0), v]);
          const [, y0] = api.coord([api.value(0), 0]);
          const w = api.size([1, 0])[0] * 0.56;
          const tip = Math.min(w * 0.45, Math.abs(y0 - y));
          const dir = v >= 0 ? 1 : -1;
          const color = v >= 0 ? '#089981' : '#f23645';
          const flat: [number, number][] = [
            [x - w / 2, y0],
            [x - w / 2, y0],
            [x, y0],
            [x + w / 2, y0],
            [x + w / 2, y0],
          ];
          return {
            type: 'group',
            children: [
              {
                type: 'polygon',
                shape: {
                  points: [
                    [x - w / 2, y0],
                    [x - w / 2, y + dir * tip],
                    [x, y],
                    [x + w / 2, y + dir * tip],
                    [x + w / 2, y0],
                  ],
                },
                style: { fill: color, fillOpacity: 0.85 },
                enterFrom: { shape: { points: flat } },
              },
              {
                type: 'text',
                x,
                y: y - dir * 4,
                style: { text: (v > 0 ? '+' : '') + v, fill: color, fontSize: 10, fontWeight: 600, align: 'center', verticalAlign: v >= 0 ? 'bottom' : 'top' },
                silent: true,
              },
            ],
          };
        },
      },
    ],
    valueFormatter: (v) => `${v > 0 ? '+' : ''}${v} k€`,
  });
  return () => chart.destroy();
}
