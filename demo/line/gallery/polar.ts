import { createLineChart, type LinePoint } from 'openchartscandle/line';

// Coordenadas polares com dois eixos de valores: o ângulo (0–360°) e o raio.
// Aqui uma cardioide r = 5·(1 + sin θ) e uma rosa de 4 pétalas r = 8·|cos 2θ|.
const curve = (f: (deg: number) => number): LinePoint[] => Array.from({ length: 361 }, (_, d) => ({ x: d, y: +f(d).toFixed(3) }));

export function mount(el: HTMLElement): () => void {
  const rad = (d: number): number => (d * Math.PI) / 180;
  const chart = createLineChart(el, {
    series: [
      { name: 'Cardioide', data: curve((d) => 5 * (1 + Math.sin(rad(d)))), width: 2 },
      { name: 'Rosa', data: curve((d) => 8 * Math.abs(Math.cos(2 * rad(d)))), width: 1.5, area: { opacity: 0.12 } },
    ],
    polar: true,
    xType: 'number',
    xAxis: { min: 0, max: 360, format: (v) => `${v}°` },
    yAxis: { min: 0, max: 10 },
    legend: { position: 'top', align: 'center' },
    valueFormatter: (v) => v.toFixed(2),
  });
  return () => chart.destroy();
}
