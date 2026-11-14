import { createFunnelChart } from 'openchartscandle/funnel';
import { TARGET } from '../data';

// O funil mais simples: cinco etapas da maior para a menor, com os nomes por fora ligados por uma linha.
// Clica na legenda para esconder uma etapa; o tooltip mostra a conversão desde a primeira e desde a anterior.
export function mount(el: HTMLElement): () => void {
  const chart = createFunnelChart(el, {
    title: { text: 'Funil de abertura de conta', subtext: 'Em % das visitas (dados inventados)', align: 'left' },
    data: TARGET,
    minSize: '0%',
    maxSize: '100%',
    gap: 2,
    legend: { position: 'bottom' },
    valueFormatter: (v) => `${v}%`,
  });
  return () => chart.destroy();
}
