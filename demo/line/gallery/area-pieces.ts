import { createLineChart } from 'openchartscandle/line';

// Área só em alguns intervalos (area.ranges), com linhas verticais a marcar os limites.
const DAY = 86400;
const start = Date.UTC(2026, 9, 1) / 1000;
const values = [200, 560, 750, 580, 250, 300, 450, 300, 100, 210, 320, 410, 560, 480, 300, 260, 420, 610, 520, 330];
const date = (i: number): number => start + i * DAY;

export function mount(el: HTMLElement): () => void {
  const pieces: [number, number][] = [
    [date(1), date(3)],
    [date(5), date(7)],
    [date(10), date(13)],
    [date(16), date(18)],
  ];
  const chart = createLineChart(el, {
    series: [
      {
        name: 'Valor',
        data: values.map((y, i) => ({ x: date(i), y })),
        color: '#5470c6',
        area: { gradient: ['rgba(84,112,198,0.6)', 'rgba(84,112,198,0.05)'], ranges: pieces },
      },
    ],
    curve: 'smooth',
    legend: { show: false },
    yAxis: { beginAtZero: true },
    annotations: { x: pieces.flat().map((x) => ({ value: x, color: '#5470c6', dash: [3, 3] })) },
  });
  return () => chart.destroy();
}
