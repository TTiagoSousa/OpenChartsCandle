import { createBarChart } from 'openchartscandle/bar';
import { MONTHS, eur, pnl } from '../data';

// Valores negativos (P&L): as barras descem abaixo do zero e colorBy pinta cada barra
// pela cor do valor. Também dá para usar negativeColor numa série.
export function mount(el: HTMLElement): () => void {
  const total = pnl.reduce((a, b) => a + b, 0);
  const chart = createBarChart(el, {
    categories: MONTHS,
    series: [{ name: 'P&L', data: pnl }],
    colorBy: (v) => (v >= 0 ? '#089981' : '#f23645'),
    labels: { show: true, format: (v) => (v > 0 ? '+' : '') + v.toFixed(1) },
    annotations: [{ value: total / pnl.length, label: `Média ${eur(total / pnl.length)}`, color: '#2962ff' }],
    legend: { show: false },
    valueFormatter: eur,
  });
  return () => chart.destroy();
}
