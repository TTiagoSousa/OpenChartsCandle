import { createLineChart, type LineSeries } from 'openchartscandle/line';

// Each series: [top color, bottom color] of its gradient.
const GRADIENTS: [string, string][] = [
  ['rgb(128, 255, 165)', 'rgb(1, 191, 236)'],
  ['rgb(0, 221, 255)', 'rgb(77, 119, 255)'],
  ['rgb(55, 162, 255)', 'rgb(116, 21, 219)'],
  ['rgb(255, 0, 135)', 'rgb(135, 0, 157)'],
  ['rgb(255, 191, 0)', 'rgb(224, 62, 76)'],
];

const DATA = [
  [140, 232, 101, 264, 90, 340, 250],
  [120, 282, 111, 234, 220, 340, 310],
  [320, 132, 201, 334, 190, 130, 220],
  [220, 402, 231, 134, 190, 230, 120],
  [220, 302, 181, 234, 210, 290, 150],
];

export function mount(el: HTMLElement): () => void {
  const series: LineSeries[] = DATA.map((data, i) => ({
    name: `Linha ${i + 1}`,
    data,
    color: GRADIENTS[i][0], // legend and tooltip color
    width: 0, // no line on top: only the gradient area
    area: { gradient: GRADIENTS[i], opacity: 0.85 },
  }));
  const chart = createLineChart(el, {
    categories: ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom'],
    series,
    stacked: true,
    curve: 'smooth',
    legend: { marker: 'circle' },
  });
  return () => chart.destroy();
}
