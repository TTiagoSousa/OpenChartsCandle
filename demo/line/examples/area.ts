import { createLineChart } from 'openchartscandle/line';
import { usd, walk } from '../data';

// Gráfico de área: a série com preenchimento em gradiente e curva suave.
// A curva "smooth" é monotónica: nunca inventa máximos ou mínimos entre pontos.
export function mount(el: HTMLElement): () => void {
  const chart = createLineChart(el, {
    series: [{ name: 'Valor da carteira', data: walk(7, 120, 100000, 0.012, 0.0015), color: '#089981', area: { opacity: 0.35 } }],
    curve: 'smooth',
    legend: { show: false },
    yAxis: { format: (v) => `${(v / 1000).toFixed(0)}k` },
    valueFormatter: usd,
  });

  return () => chart.destroy();
}
