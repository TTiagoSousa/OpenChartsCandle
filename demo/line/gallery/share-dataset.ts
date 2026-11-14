import { createLineChart } from 'openchartscandle/line';
import { createPieChart } from 'openchartscandle/pie';

// Um só conjunto de dados para dois gráficos: as linhas mostram cada produto ao longo dos anos
// e a pizza mostra a divisão do ano que está debaixo do rato.
const YEARS = ['2020', '2021', '2022', '2023', '2024', '2025'];
const DATASET: Record<string, number[]> = {
  'Leite em pó': [56.5, 82.1, 88.7, 70.1, 53.4, 85.1],
  'Chá com leite': [51.1, 51.4, 55.1, 53.3, 73.8, 68.7],
  'Café': [40.1, 62.2, 69.5, 36.4, 45.2, 32.5],
  'Chocolate': [25.2, 37.1, 41.2, 18, 33.9, 49.1],
};

export function mount(el: HTMLElement): () => void {
  const lineBox = document.createElement('div');
  const pieBox = document.createElement('div');
  lineBox.style.height = '55%';
  pieBox.style.height = '45%';
  el.append(lineBox, pieBox);
  const pieFor = (i: number) => Object.entries(DATASET).map(([label, values]) => ({ label, value: values[i] }));
  const line = createLineChart(lineBox, {
    categories: YEARS,
    series: Object.entries(DATASET).map(([name, data]) => ({ name, data, points: true })),
    curve: 'smooth',
    legend: { position: 'top', align: 'center' },
  });
  const pie = createPieChart(pieBox, { data: pieFor(YEARS.length - 1), innerRadius: 0.5, legend: { show: false }, center: { title: YEARS[YEARS.length - 1] } });
  let current = YEARS.length - 1;
  const off = line.on('hover', (c) => {
    if (!c || c.x === current) return;
    current = c.x;
    pie.setData(pieFor(current));
    pie.setOptions({ center: { title: YEARS[current] } });
  });
  return () => {
    off();
    line.destroy();
    pie.destroy();
    lineBox.remove();
    pieBox.remove();
  };
}
