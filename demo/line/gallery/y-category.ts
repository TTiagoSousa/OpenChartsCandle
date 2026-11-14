import { createLineChart } from 'openchartscandle/line';

// Categorias no eixo Y: os dias ficam na vertical (de cima para baixo) e o valor no eixo X.
// Os pontos usam o índice do dia como y e a linha segue a ordem dos dados.
const DAYS = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom'];
const values = [820, 932, 901, 934, 1290, 1330, 1320];

export function mount(el: HTMLElement): () => void {
  const chart = createLineChart(el, {
    series: [{ name: 'Visitas', data: values.map((v, i) => ({ x: v, y: i })), sortByX: false, points: { size: 5 }, curve: 'linear' }],
    xType: 'number',
    xAxis: { min: 700, max: 1400 },
    yAxis: { inverse: true, min: -0.5, max: 6.5, ticks: 8, format: (v) => (Number.isInteger(v) ? (DAYS[v] ?? '') : '') },
    tooltip: { mode: 'single', formatter: (c) => `<b>${DAYS[c.points[0].y]}</b> · ${c.points[0].x} visitas` },
    legend: { show: false },
  });
  return () => chart.destroy();
}
