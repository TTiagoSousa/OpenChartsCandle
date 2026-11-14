import { createLineChart } from 'openchartscandle/line';

// Eixo logarítmico de base 3: crescimentos exponenciais ficam em linha reta.
export function mount(el: HTMLElement): () => void {
  const chart = createLineChart(el, {
    categories: ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I'],
    series: [
      { name: 'Log 3', data: [1, 3, 9, 27, 81, 247, 741, 2223, 6669] },
      { name: 'Log 2', data: [1, 2, 4, 8, 16, 32, 64, 128, 256] },
      { name: 'Log 1/2', data: [1 / 2, 1 / 4, 1 / 8, 1 / 16, 1 / 32, 1 / 64, 1 / 128, 1 / 256, 1 / 512] },
    ],
    yAxis: { log: 3, format: (v) => (v >= 1 ? String(Math.round(v)) : `1/${Math.round(1 / v)}`) },
    points: true,
    legend: { position: 'top', align: 'center' },
    valueFormatter: (v) => (v >= 1 ? String(v) : `1/${Math.round(1 / v)}`),
  });
  return () => chart.destroy();
}
