import { createLineChart } from 'openchartscandle/line';
import { usd, walk } from '../data';

// Várias linhas no mesmo gráfico: eixo de tempo automático, tooltip partilhado
// (todas as séries no dia sob o cursor) e legenda clicável para esconder/mostrar séries.
export function mount(el: HTMLElement): () => void {
  const chart = createLineChart(el, {
    series: [
      { name: 'Bitcoin', data: walk(1, 180, 60000, 0.025, 0.001) },
      { name: 'Ether', data: walk(2, 180, 52000, 0.03, 0.0006) },
      { name: 'Solana', data: walk(3, 180, 45000, 0.035, 0.0012) },
    ],
    valueFormatter: usd,
  });

  return () => chart.destroy();
}
