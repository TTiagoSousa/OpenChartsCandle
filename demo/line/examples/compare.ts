import { createLineChart } from 'openchartscandle/line';
import { rebase, walk } from '../data';

// Comparar desempenho: cada ativo em % desde o início (rebase), com uma linha no 0%
// e o tooltip ordenado do melhor para o pior.
export function mount(el: HTMLElement): () => void {
  const assets = [
    { name: 'Ações EUA', data: rebase(walk(41, 365, 100, 0.012, 0.0006)) },
    { name: 'Ações Europa', data: rebase(walk(42, 365, 100, 0.013, 0.0003)) },
    { name: 'Ouro', data: rebase(walk(43, 365, 100, 0.008, 0.0004)) },
    { name: 'Bitcoin', data: rebase(walk(44, 365, 100, 0.03, 0.0011)) },
    { name: 'Obrigações', data: rebase(walk(45, 365, 100, 0.004, 0.0001)) },
  ];
  const chart = createLineChart(el, {
    series: assets,
    yAxis: { format: (v) => `${v > 0 ? '+' : ''}${v.toFixed(0)}%` },
    tooltip: { sort: true },
    crosshair: { horizontal: true },
    valueFormatter: (v) => `${v > 0 ? '+' : ''}${v.toFixed(2)}%`,
    annotations: { y: [{ value: 0, color: '#787b86', dash: [2, 3] }] },
    legend: { position: 'right' },
  });

  return () => chart.destroy();
}
