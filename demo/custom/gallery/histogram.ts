import { createCustomChart, customHistogram } from 'openchartscandle/custom';
import { dailyReturns } from '../data';

// Histograma feito com uma série própria: customHistogram() agrupa 500 retornos diários em classes e o
// renderItem desenha cada classe como um retângulo de x0 a x1, encostado aos vizinhos.
export function mount(el: HTMLElement): () => void {
  const bins = customHistogram(dailyReturns(), { binWidth: 0.5 });
  const chart = createCustomChart(el, {
    xAxis: { name: 'Retorno diário (%)', nameLocation: 'middle', beginAtZero: false, min: 'dataMin', max: 'dataMax' },
    yAxis: { name: 'Dias' },
    series: [
      {
        name: 'Dias',
        data: bins.map((b) => [b.x0, b.x1, b.count]),
        dimensions: ['De (%)', 'Até (%)', 'Dias'],
        encode: { x: [0, 1], y: 2, tooltip: [0, 1, 2] },
        renderItem: (p, api) => {
          const [x0, y0] = api.coord([api.value(0), 0]);
          const [x1, y1] = api.coord([api.value(1), api.value(2)]);
          return {
            type: 'rect',
            shape: { x: x0 + 0.5, y: y1, width: Math.max(0.5, x1 - x0 - 1), height: y0 - y1 },
            style: { fill: Number(api.value(1)) <= 0 ? '#f23645' : '#089981' },
            enterFrom: { shape: { y: y0, height: 0 } },
          };
        },
      },
    ],
    animation: { delay: (i) => i * 25 },
  });
  return () => chart.destroy();
}
