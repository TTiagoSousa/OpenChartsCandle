import { createCustomChart } from 'openchartscandle/custom';
import { PORTUGAL, colorRamp, windField } from '../data';

// Campo de vento sobre a Península Ibérica: cada seta é desenhada por um renderItem numa grelha de longitude ×
// latitude, rodada para onde o vento vai, com comprimento e cor da velocidade. Outra série desenha o
// contorno de Portugal continental (aproximado) por baixo.
export function mount(el: HTMLElement): () => void {
  const data = windField();
  const max = Math.max(...data.map((d) => Math.hypot(d[2], d[3])));
  const ramp = ['#26c6da', '#66bb6a', '#ffee58', '#ff7043', '#e53935'];
  const chart = createCustomChart(el, {
    xAxis: { name: 'Longitude', beginAtZero: false, min: -12.5, max: 2.5, splitLine: true, format: (v) => `${v}°` },
    yAxis: { name: 'Latitude', beginAtZero: false, min: 34.5, max: 45.5, format: (v) => `${v}°` },
    series: [
      {
        name: 'Portugal',
        data: [0],
        silent: true,
        excludeFromRange: true,
        legend: false,
        renderItem: (p, api) => ({ type: 'polygon', shape: { points: PORTUGAL.map((q) => api.coord(q)), smooth: true }, style: { fill: 'rgba(255,255,255,0.06)', stroke: 'rgba(255,255,255,0.35)', lineWidth: 1 } }),
      },
      {
        name: 'Vento',
        data,
        dimensions: ['Longitude', 'Latitude', 'u (m/s)', 'v (m/s)'],
        tooltip: (p) => {
          const [, , u, v] = p.value as number[];
          const dir = ((Math.atan2(-u, -v) * 180) / Math.PI + 360) % 360;
          return `<b>${Math.hypot(u, v).toFixed(1)} m/s</b><br>de ${Math.round(dir)}°`;
        },
        emphasis: { style: { stroke: '#ffffff', fill: '#ffffff' } },
        renderItem: (p, api) => {
          const [x, y] = api.coord([api.value(0), api.value(1)]);
          const u = Number(api.value(2));
          const v = Number(api.value(3));
          const sp = Math.hypot(u, v);
          const cell = Math.min(api.size([1, 0])[0], api.size([0, 1])[1]);
          const L = cell * (0.35 + 0.6 * (sp / max));
          const c = colorRamp(ramp, sp / max);
          return {
            type: 'group',
            x,
            y,
            // screen y goes down: north (+v) is up
            rotation: Math.atan2(-v, u),
            children: [
              { type: 'line', shape: { x1: -L / 2, y1: 0, x2: L / 2 - 3, y2: 0 }, style: { stroke: c, lineWidth: 1.6 } },
              { type: 'polygon', shape: { points: [[L / 2, 0], [L / 2 - 5, -3], [L / 2 - 5, 3]] }, style: { fill: c } },
            ],
          };
        },
      },
    ],
  });
  return () => chart.destroy();
}
