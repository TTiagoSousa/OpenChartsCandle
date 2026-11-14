import { createLineChart, type LinePoint } from 'openchartscandle/line';

// Gráfico de funções: eixo X numérico, muitas amostras por função e os eixos x = 0 e y = 0 marcados.
const plot = (f: (x: number) => number, from = -10, to = 10, n = 400): LinePoint[] =>
  Array.from({ length: n + 1 }, (_, i) => {
    const x = from + ((to - from) * i) / n;
    const y = f(x);
    return { x: +x.toFixed(4), y: Number.isFinite(y) ? +y.toFixed(4) : null };
  });

export function mount(el: HTMLElement): () => void {
  const chart = createLineChart(el, {
    series: [
      { name: 'y = sin(x)', data: plot(Math.sin) },
      { name: 'y = sin(x) / x', data: plot((x) => (x === 0 ? 1 : Math.sin(x) / x)) },
      { name: 'y = x² / 40 − 1', data: plot((x) => (x * x) / 40 - 1) },
    ],
    xType: 'number',
    xAxis: { format: (x) => String(+x.toFixed(2)) },
    yAxis: { min: -1.5, max: 2 },
    tooltip: { mode: 'single' },
    annotations: {
      x: [{ value: 0, color: '#787b86', dash: [] }],
      y: [{ value: 0, color: '#787b86', dash: [] }],
    },
    legend: { position: 'top', align: 'center' },
    valueFormatter: (v) => v.toFixed(3),
  });
  return () => chart.destroy();
}
