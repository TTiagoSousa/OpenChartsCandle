import { createCustomChart } from 'openchartscandle/custom';
import { WEEKDAYS_PT, weekdayReturns } from '../data';

// Gráfico de ciclos: o retorno de cada dia da semana ao longo de 8 semanas. Cada dia é um pequeno gráfico
// de linhas dentro da sua faixa, com a média como traço horizontal — para ver se há "efeito segunda-feira".
export function mount(el: HTMLElement): () => void {
  const raw = weekdayReturns();
  const data = WEEKDAYS_PT.slice(0, 5).map((d, k) => {
    const vals = raw.filter((r) => r[0] === k).map((r) => r[2]);
    const mean = +(vals.reduce((a, b) => a + b, 0) / vals.length).toFixed(2);
    return [d, mean, ...vals];
  });
  const chart = createCustomChart(el, {
    xAxis: { type: 'category', splitArea: true },
    yAxis: { name: 'Retorno (%)', beginAtZero: true },
    series: [
      {
        name: 'Retorno',
        data,
        encode: { x: 0, y: [2, 3, 4, 5, 6, 7, 8, 9] },
        tooltip: (p) => `<b>${p.value[0]}</b><br>Média: ${p.value[1]}%<br>Semanas: ${p.value.slice(2).join(' · ')}`,
        renderItem: (p, api) => {
          const [cx] = api.coord([api.value(0), 0]);
          const w = api.size([1, 0])[0] * 0.78;
          const pts = Array.from({ length: 8 }, (_, i) => {
            const y = api.coord([api.value(0), api.value(2 + i)])[1];
            return [cx - w / 2 + (i / 7) * w, y] as [number, number];
          });
          const [, ym] = api.coord([api.value(0), api.value(1)]);
          const up = Number(api.value(1)) >= 0;
          return {
            type: 'group',
            children: [
              { type: 'line', shape: { x1: cx - w / 2, y1: ym, x2: cx + w / 2, y2: ym }, style: { stroke: up ? '#089981' : '#f23645', lineWidth: 2, lineDash: [5, 3] } },
              { type: 'polyline', shape: { points: pts }, style: { stroke: p.color, lineWidth: 1.6, lineJoin: 'round' } },
              ...pts.map(([x, y]) => ({ type: 'circle' as const, shape: { cx: x, cy: y, r: 2.5 }, style: { fill: p.color } })),
            ],
          };
        },
      },
    ],
  });
  return () => chart.destroy();
}
