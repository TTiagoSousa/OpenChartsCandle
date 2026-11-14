import { createLineChart } from 'openchartscandle/line';
import { createPieChart } from 'openchartscandle/pie';

// Um só conjunto de dados para dois gráficos: a pizza em cima mostra o ano debaixo do rato
// e as linhas em baixo mostram cada produto ao longo dos anos.
const YEARS = ['2020', '2021', '2022', '2023', '2024', '2025'];
const DATASET: Record<string, number[]> = {
  'Leite em pó': [56.5, 82.1, 88.7, 70.1, 53.4, 85.1],
  'Chá com leite': [51.1, 51.4, 55.1, 53.3, 73.8, 68.7],
  Café: [40.1, 62.2, 69.5, 36.4, 45.2, 32.5],
  Chocolate: [25.2, 37.1, 41.2, 18, 33.9, 49.1],
};
const COLORS = ['#2962ff', '#089981', '#ff9800', '#e91e63'];

export function mount(el: HTMLElement): () => void {
  const pieBox = document.createElement('div');
  const lineBox = document.createElement('div');
  pieBox.style.height = '50%';
  lineBox.style.height = '50%';
  el.append(pieBox, lineBox);
  const names = Object.keys(DATASET);
  const pieFor = (i: number) => names.map((label, j) => ({ label, value: DATASET[label][i], color: COLORS[j] }));
  let current = 0;
  const pie = createPieChart(pieBox, {
    title: `Ano ${YEARS[current]}`,
    data: pieFor(current),
    legend: { show: false },
    labels: { position: 'outside', content: (s) => `${s.label}: ${s.value} (${s.percent.toFixed(0)}%)`, fontWeight: 500 },
  });
  const line = createLineChart(lineBox, {
    categories: YEARS,
    series: names.map((name, j) => ({ name, data: DATASET[name], points: true, color: COLORS[j] })),
    curve: 'smooth',
    legend: { position: 'top', align: 'center' },
  });
  const off = line.on('hover', (c) => {
    if (!c || c.x === current) return;
    current = c.x;
    pie.setOptions({ title: `Ano ${YEARS[current]}` }, false);
    pie.setData(pieFor(current));
  });
  return () => {
    off();
    line.destroy();
    pie.destroy();
    pieBox.remove();
    lineBox.remove();
  };
}
