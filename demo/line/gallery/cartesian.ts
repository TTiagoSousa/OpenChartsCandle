import { createLineChart } from 'openchartscandle/line';

// Plano cartesiano: x e y são valores, e a linha segue a ordem dos dados (sortByX: false),
// por isso pode voltar para trás no eixo X.
export function mount(el: HTMLElement): () => void {
  const chart = createLineChart(el, {
    series: [
      {
        name: 'Percurso',
        data: [
          { x: 10, y: 40 },
          { x: 50, y: 100 },
          { x: 40, y: 20 },
          { x: 70, y: 60 },
          { x: 25, y: 75 },
        ],
        sortByX: false,
        points: { size: 6 },
        width: 2.5,
      },
    ],
    xType: 'number',
    xAxis: { min: 0, max: 80 },
    yAxis: { min: 0, max: 120 },
    tooltip: { mode: 'single' },
    legend: { show: false },
  });
  return () => chart.destroy();
}
