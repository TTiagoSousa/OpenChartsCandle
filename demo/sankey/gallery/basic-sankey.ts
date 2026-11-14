import { createSankeyChart } from 'openchartscandle/sankey';
import { budgetFlow, eur } from '../data';

// Sankey básico: o orçamento mensal de uma família (valores inventados), dos rendimentos às despesas e à
// poupança. Passa o rato num nó ou numa ligação; arrasta um nó para cima ou para baixo.
export function mount(el: HTMLElement): () => void {
  const chart = createSankeyChart(el, {
    ...budgetFlow(),
    valueFormat: eur,
  });
  return () => chart.destroy();
}
