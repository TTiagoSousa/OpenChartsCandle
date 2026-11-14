import { createCustomChart, type CustomElement } from 'openchartscandle/custom';
import { windSeries } from '../data';

// Barbelas de vento ao longo de 48 horas num porto: a linha é a velocidade (nós) e cada barbela, desenhada no
// renderItem, aponta de onde sopra o vento, com meia pena por 5 nós, pena por 10 e bandeira por 50.
export function mount(el: HTMLElement): () => void {
  const data = windSeries();
  const barb = (speed: number, color: string): CustomElement[] => {
    const L = 26;
    const out: CustomElement[] = [{ type: 'line', shape: { x1: 0, y1: 0, x2: 0, y2: -L }, style: { stroke: color, lineWidth: 1.5 } }];
    let s = Math.round(speed / 5) * 5;
    let y = -L;
    while (s >= 50) {
      out.push({ type: 'polygon', shape: { points: [[0, y], [10, y + 3], [0, y + 6]] }, style: { fill: color } });
      y += 8;
      s -= 50;
    }
    while (s >= 10) {
      out.push({ type: 'line', shape: { x1: 0, y1: y, x2: 10, y2: y - 4 }, style: { stroke: color, lineWidth: 1.5 } });
      y += 4;
      s -= 10;
    }
    if (s >= 5) out.push({ type: 'line', shape: { x1: 0, y1: y + (y === -L ? 4 : 0), x2: 5, y2: y + (y === -L ? 4 : 0) - 2 }, style: { stroke: color, lineWidth: 1.5 } });
    return out;
  };
  const color = (sp: number): string => (sp > 25 ? '#f23645' : sp > 15 ? '#ff9800' : '#089981');
  const chart = createCustomChart(el, {
    xAxis: { type: 'time', splitLine: true },
    yAxis: { name: 'Vento (nós)', nameLocation: 'middle', max: 45 },
    grid: { top: 62 },
    legend: false,
    series: [
      {
        name: 'Velocidade',
        data: [0],
        tooltip: false,
        silent: true,
        excludeFromRange: true,
        renderItem: (p, api) => {
          const pts = data.map((d) => api.coord([d[0], d[1]]));
          const [, y0] = api.coord([data[0][0], 0]);
          return {
            type: 'group',
            children: [
              { type: 'polygon', shape: { points: [[pts[0][0], y0], ...pts, [pts[pts.length - 1][0], y0]], smooth: false }, style: { fill: { type: 'linear', x: 0, y: 0, x2: 0, y2: 1, stops: [[0, 'rgba(41,98,255,0.35)'], [1, 'rgba(41,98,255,0)']] } } },
              { type: 'polyline', shape: { points: pts, smooth: true }, style: { stroke: '#2962ff', lineWidth: 2 } },
            ],
          };
        },
      },
      {
        name: 'Vento',
        data,
        dimensions: ['Hora', 'Velocidade (nós)', 'Direção (°)'],
        encode: { x: 0, y: 1, tooltip: [0, 1, 2] },
        renderItem: (p, api) => {
          if (p.dataIndex % 2) return null;
          const [x] = api.coord([api.value(0), 0]);
          if (x < api.rect.x + 8 || x > api.rect.x + api.rect.width - 8) return null;
          const sp = Number(api.value(1));
          const y = api.rect.y - 30;
          // the barb points to where the wind comes from (0° = north, clockwise)
          return { type: 'group', x, y, rotation: (Number(api.value(2)) * Math.PI) / 180, children: [...barb(sp, color(sp)), { type: 'circle', shape: { cx: 0, cy: 0, r: 2.5 }, style: { fill: color(sp) } }] };
        },
        clip: false,
      },
    ],
  });
  return () => chart.destroy();
}
