import { createCustomChart } from 'openchartscandle/custom';
import { monthlyPnl } from '../data';

// Barras e tendência: uma série desenha as barras do volume mensal e outra, com um só item, desenha a linha
// suave que liga o topo das barras (com api.coord para cada mês).
export function mount(el: HTMLElement): () => void {
  const data = monthlyPnl().map(([m, v], i) => [m, Math.round(120 + i * 9 + v * 0.8)] as [string, number]);
  const chart = createCustomChart(el, {
    xAxis: { type: 'category' },
    yAxis: { name: 'Volume (M€)' },
    legend: { position: 'top' },
    series: [
      {
        name: 'Volume',
        data,
        color: '#2962ff',
        dimensions: ['Mês', 'Volume'],
        encode: { itemName: 0, tooltip: [1] },
        renderItem: (p, api) => {
          const [x, y] = api.coord([api.value(0), api.value(1)]);
          const [, y0] = api.coord([api.value(0), 0]);
          const w = api.size([1, 0])[0] * 0.5;
          return {
            type: 'rect',
            shape: { x: x - w / 2, y, width: w, height: y0 - y, r: [3, 3, 0, 0] },
            style: { fill: { type: 'linear', x: 0, y: 0, x2: 0, y2: 1, stops: [[0, '#2962ff'], [1, 'rgba(41, 98, 255, 0.25)']] } },
            enterFrom: { shape: { y: y0, height: 0 } },
          };
        },
      },
      {
        name: 'Tendência',
        color: '#ff9800',
        data: [0],
        excludeFromRange: true,
        tooltip: false,
        silent: true,
        renderItem: (p, api) => {
          const pts = data.map((d) => api.coord([d[0], d[1]]));
          return {
            type: 'group',
            children: [
              { type: 'polyline', shape: { points: pts, smooth: true }, style: { stroke: '#ff9800', lineWidth: 2.5, lineCap: 'round' } },
              ...pts.map(([x, y]) => ({ type: 'circle' as const, shape: { cx: x, cy: y, r: 3.5 }, style: { fill: '#131722', stroke: '#ff9800', lineWidth: 2 } })),
            ],
          };
        },
      },
    ],
    animation: { delay: (i, s) => (s === 0 ? i * 40 : 450) },
  });
  return () => chart.destroy();
}
