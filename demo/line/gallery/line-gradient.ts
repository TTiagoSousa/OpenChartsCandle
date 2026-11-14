import { createLineChart, type LineChart } from 'openchartscandle/line';

// A cor da linha muda ao longo do gráfico (lineGradient): em cima pelo valor,
// em baixo do primeiro para o último ponto.
const values = [116, 129, 135, 86, 73, 85, 73, 68, 92, 130, 245, 139, 115, 111, 309, 206, 137, 128, 85, 94, 71, 106, 84, 93, 85, 73, 83, 125, 107, 82, 44, 72, 106, 107, 66, 91, 92, 113, 107, 131, 111, 64, 69, 88, 77, 83, 111, 57, 55, 60];
const labels = values.map((_, i) => `${String((i % 28) + 1).padStart(2, '0')}/${i < 28 ? '06' : '07'}`);

export function mount(el: HTMLElement): () => void {
  const top = document.createElement('div');
  const bottom = document.createElement('div');
  top.style.height = bottom.style.height = '50%';
  el.append(top, bottom);
  const common = { categories: labels, legend: { show: false } };
  const charts: LineChart[] = [
    createLineChart(top, {
      ...common,
      series: [{ name: 'Qualidade do ar', data: values, width: 2.5, lineGradient: { colors: ['#089981', '#ffd54f', '#f23645', '#9c27b0'], min: 50, max: 300 } }],
    }),
    createLineChart(bottom, {
      ...common,
      series: [{ name: 'Qualidade do ar', data: values, width: 2.5, lineGradient: { colors: ['#00e5ff', '#2962ff', '#e040fb'], by: 'x' } }],
    }),
  ];
  return () => {
    charts.forEach((c) => c.destroy());
    top.remove();
    bottom.remove();
  };
}
