import { createCustomChart, customHexagon, customHexbin } from 'openchartscandle/custom';
import { colorRamp, hexPoints } from '../data';

// Agrupamento hexagonal: 1400 operações (volatilidade × retorno) contadas em hexágonos com customHexbin().
// Cada hexágono é um polígono com a cor da contagem; os hexágonos são calculados em píxeis, por isso o
// gráfico volta a agrupar quando muda de tamanho.
export function mount(el: HTMLElement): () => void {
  const pts = hexPoints();
  const ramp = ['#132a4a', '#1565c0', '#00bcd4', '#c6ff00'];
  const chart = createCustomChart(el, {
    xAxis: { name: 'Volatilidade (%)', nameLocation: 'middle', beginAtZero: false, splitLine: true },
    yAxis: { name: 'Retorno (%)', beginAtZero: false },
    series: [
      {
        name: 'Operações',
        data: pts,
        renderItem: (p, api) => {
          // all hexagons are drawn by the first item (binning needs every point in px)
          if (p.dataIndex) return null;
          const r = Math.max(7, Math.min(api.rect.width, api.rect.height) / 22);
          const bins = customHexbin(pts.map((q) => api.coord(q)), r);
          const max = Math.max(...bins.map((b) => b.points.length));
          return {
            type: 'group',
            children: bins.map((b) => ({
              type: 'polygon' as const,
              shape: { points: customHexagon(b.x, b.y, r - 0.6) },
              style: { fill: colorRamp(ramp, Math.sqrt(b.points.length / max)) },
              info: b.points.length,
            })),
          };
        },
        emphasis: { scope: 'element', style: { stroke: '#ffffff', lineWidth: 1.5 } },
        tooltip: (p) => `<b>${p.info} operações</b>`,
      },
    ],
  });
  return () => chart.destroy();
}
