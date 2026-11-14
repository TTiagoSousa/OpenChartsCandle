import { createFunnelChart } from 'openchartscandle/funnel';
import { ACTUAL, TARGET } from '../data';

// Dois funis lado a lado para comparar: a meta à esquerda, alinhada à direita, e o mês real à direita,
// alinhado à esquerda, com os valores por dentro. A legenda esconde a mesma etapa nos dois.
export function mount(el: HTMLElement): () => void {
  const label = { position: 'inside' as const, format: (i: { name: string; value: number }) => `${i.value}%` };
  const chart = createFunnelChart(el, {
    funnels: [
      { name: 'Meta', data: TARGET, left: '4%', right: '51%', funnelAlign: 'right', showName: true, label },
      { name: 'Real', data: ACTUAL, left: '51%', right: '4%', funnelAlign: 'left', showName: true, label, max: 100 },
    ],
    gap: 2,
    legend: { position: 'bottom' },
    valueFormatter: (v) => `${v}%`,
  });
  return () => chart.destroy();
}
