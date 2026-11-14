import { createCustomChart } from 'openchartscandle/custom';
import { WEEKDAYS_PT, colorRamp, tradesByHour } from '../data';

// Mapa de calor polar: ordens por hora do dia (à volta) e dia da semana (do centro para fora).
// Cada célula é um setor de anel calculado com api.coord / api.size em coordenadas polares.
export function mount(el: HTMLElement): () => void {
  const data = tradesByHour();
  const max = Math.max(...data.map((d) => d[2]));
  const ramp = ['#0b1a3a', '#1e3a8a', '#2962ff', '#00bcd4', '#ffeb3b'];
  const chart = createCustomChart(el, {
    coordinateSystem: 'polar',
    polar: { radius: ['14%', '80%'] },
    angleAxis: { type: 'category', data: Array.from({ length: 24 }, (_, i) => `${i}h`), splitLine: false },
    radiusAxis: { type: 'category', data: WEEKDAYS_PT, splitLine: false },
    series: [
      {
        name: 'Ordens',
        data,
        dimensions: ['Hora', 'Dia', 'Ordens'],
        encode: { angle: 0, radius: 1 },
        tooltip: (p) => `<b>${WEEKDAYS_PT[p.value[1] as number]}, ${p.value[0]}h</b><br>${p.value[2]} ordens`,
        renderItem: (p, api) => {
          const P = api.polar!;
          const a = P.angle(api.value(0));
          const r = P.radius(api.value(1));
          const [da, dr] = api.size([1, 1]);
          return {
            type: 'sector',
            shape: { cx: P.cx, cy: P.cy, r0: r - dr / 2, r: r + dr / 2, startAngle: a - da / 2, endAngle: a + da / 2 },
            style: { fill: colorRamp(ramp, Number(api.value(2)) / max), stroke: api.theme.background, lineWidth: 0.6 },
            emphasis: { style: { stroke: '#ffffff', lineWidth: 1.5 } },
          };
        },
      },
    ],
    animation: { delay: (i) => (i % 24) * 18 },
  });
  return () => chart.destroy();
}
