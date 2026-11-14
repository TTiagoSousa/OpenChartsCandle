import { createBarChart } from 'openchartscandle/bar';
import { MONTHS, sales2025 } from '../data';

// Colunas simples: uma série por mês, valor por cima de cada barra e uma linha de média.
export function mount(el: HTMLElement): () => void {
  const avg = sales2025.reduce((a, b) => a + b, 0) / sales2025.length;
  const chart = createBarChart(el, {
    categories: MONTHS,
    series: [{ name: 'Vendas', data: sales2025 }],
    labels: { show: true },
    annotations: [{ value: avg, label: `Média ${avg.toFixed(0)}`, color: '#ff9800' }],
    valueFormatter: (v) => `${v} M€`,
  });
  return () => chart.destroy();
}
