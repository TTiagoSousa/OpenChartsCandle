import { createScatterChart, type ScatterChart } from 'openchartscandle/scatter';
import { ANSCOMBE, cells } from '../data';

// O quarteto de Anscombe: quatro conjuntos com a mesma média, variância e reta de regressão
// (y = 3 + 0,5x), mas com formas completamente diferentes. Vale sempre a pena desenhar os dados.
export function mount(el: HTMLElement): () => void {
  const charts: ScatterChart[] = cells(el, 4, 2).map((cell, i) =>
    createScatterChart(cell, {
      title: ANSCOMBE[i].name,
      series: [{ name: ANSCOMBE[i].name, data: ANSCOMBE[i].data, symbolSize: 8, regression: { type: 'linear', label: 'formula', dash: [5, 4], color: '#787b86', width: 1.5 } }],
      xAxis: { min: 0, max: 20, ticks: 4 },
      yAxis: { min: 0, max: 15, ticks: 3 },
      padding: 4,
    }),
  );
  return () => charts.forEach((c) => c.destroy());
}
