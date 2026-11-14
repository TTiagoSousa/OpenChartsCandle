import { createPieChart } from 'openchartscandle/pie';
import { eur, portfolio } from '../data';

// Donut: innerRadius > 0. O centro mostra o total e, ao passar o rato, a fatia.
export function mount(el: HTMLElement): () => void {
  const chart = createPieChart(el, {
    data: portfolio,
    innerRadius: 0.62,
    padAngle: 1.2,
    cornerRadius: 4,
    sort: 'desc',
    valueFormatter: eur,
    center: { title: 'Valor da carteira' },
  });

  return () => chart.destroy();
}
