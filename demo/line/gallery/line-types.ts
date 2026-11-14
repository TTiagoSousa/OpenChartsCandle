import { createLineChart } from 'openchartscandle/line';
import { walk } from '../data';

// Três estilos no mesmo gráfico: linha normal, linha pontilhada (dash) e linha com área por baixo.
export function mount(el: HTMLElement): () => void {
  const chart = createLineChart(el, {
    series: [
      { name: 'Normal', data: walk(11, 90, 100), color: '#2962ff' },
      { name: 'Pontilhada', data: walk(23, 90, 100), color: '#ff9800', dash: [2, 4] },
      { name: 'Área', data: walk(37, 90, 100), color: '#26a69a', area: { opacity: 0.35, gradient: true } },
    ],
    legend: { position: 'top' },
  });
  return () => chart.destroy();
}
