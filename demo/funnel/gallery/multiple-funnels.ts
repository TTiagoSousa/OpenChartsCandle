import { createFunnelChart, type FunnelSpec } from 'openchartscandle/funnel';
import { TARGET } from '../data';

// Quatro funis no mesmo gráfico, um em cada canto: alinhados à esquerda, à direita, ao centro e uma pirâmide
// (sort: 'ascending'). Todos partilham as cores e a legenda.
export function mount(el: HTMLElement): () => void {
  const quad = (left: string, top: string): Pick<FunnelSpec, 'left' | 'right' | 'top' | 'bottom'> => ({
    left,
    right: left === '2%' ? '52%' : '2%',
    top,
    bottom: top === '2%' ? '52%' : '2%',
  });
  const label = { position: 'inside' as const, fontSize: 11 };
  const chart = createFunnelChart(el, {
    funnels: [
      { name: 'À esquerda', data: TARGET, ...quad('2%', '2%'), funnelAlign: 'left', label },
      { name: 'À direita', data: TARGET, ...quad('52%', '2%'), funnelAlign: 'right', label },
      { name: 'Ao centro', data: TARGET, ...quad('2%', '52%'), label },
      { name: 'Pirâmide', data: TARGET, ...quad('52%', '52%'), sort: 'ascending', label },
    ],
    gap: 1,
    legend: { position: 'bottom' },
    valueFormatter: (v) => `${v}%`,
  });
  return () => chart.destroy();
}
