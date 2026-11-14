import { createBarChart } from 'openchartscandle/bar';

// Gráfico de Pareto: barras ordenadas do maior para o menor e o acumulado em % no eixo da
// direita. A linha de 80% mostra que poucas causas explicam a maior parte das perdas.
export function mount(el: HTMLElement): () => void {
  const chart = createBarChart(el, {
    categories: ['Slippage', 'Taxas', 'Stop cedo', 'Entrada tardia', 'Spread', 'Funding', 'Erro manual', 'Outros'],
    series: [{ name: 'Perdas', data: [3.1, 12.4, 8.7, 5.2, 2.3, 1.6, 0.9, 1.1], color: '#f23645' }],
    sort: 'desc',
    overlays: [
      { type: 'cumulative', percent: true, name: 'Acumulado', color: '#ffd54f', points: true },
      // a flat line on the right axis marks the 80% threshold
      { type: 'line', name: '80%', data: new Array(8).fill(80), axis: 'right', color: '#9598a1', dash: [3, 4], width: 1 },
    ],
    rightAxis: { title: 'Acumulado (%)', format: (v) => `${v}%` },
    valueAxis: { title: 'Perdas (k€)' },
    labels: { show: true },
    legend: { show: true, position: 'top', align: 'end' },
    valueFormatter: (v) => `${v.toFixed(1)} k€`,
  });
  return () => chart.destroy();
}
