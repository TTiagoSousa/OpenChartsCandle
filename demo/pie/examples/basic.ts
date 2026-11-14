import { createPieChart } from 'openchartscandle/pie';
import { portfolio } from '../data';

// Pizza simples: tooltip, legenda clicável (esconde/mostra fatias), etiquetas e animação de entrada.
// Passa o rato pelas fatias e clica para as selecionar.
export function mount(el: HTMLElement): () => void {
  const chart = createPieChart(el, {
    data: portfolio,
    valueFormatter: (v) => v.toLocaleString('pt-PT', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }),
  });

  return () => chart.destroy();
}
