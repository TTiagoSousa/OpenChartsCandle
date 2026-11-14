import { createLineChart, type LinePoint } from 'openchartscandle/line';

// 20 000 pontos numa área: a barra em baixo escolhe o intervalo visível (zoom.slider),
// a roda do rato faz zoom e arrastar move o gráfico.
const DAY = 86400;

function makeData(n: number): LinePoint[] {
  let seed = 7;
  const rand = (): number => ((seed = (seed * 16807) % 2147483647) / 2147483647);
  let v = 500;
  const start = Date.UTC(1970, 0, 1) / 1000;
  return Array.from({ length: n }, (_, i) => {
    v = Math.max(20, v + (rand() - 0.5) * 20);
    return { x: start + i * DAY, y: Math.round(v) };
  });
}

export function mount(el: HTMLElement): () => void {
  const chart = createLineChart(el, {
    series: [{ name: 'Valor', data: makeData(20000), color: '#ff7043', width: 1, area: { gradient: ['rgba(255,112,67,0.6)', 'rgba(255,158,68,0.05)'] } }],
    xType: 'time', // dates from 1970 start near 0, so say it explicitly
    zoom: { slider: true, start: 0, end: 10 },
    legend: { show: false },
    animation: false,
  });
  return () => chart.destroy();
}
