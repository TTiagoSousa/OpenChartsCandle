import { createFunnelChart } from 'openchartscandle/funnel';
import { ACTUAL, TARGET } from '../data';

// A meta e o real no mesmo sítio: a meta é só o contorno (tracejado, sem rato) com o nome por fora, e o real
// fica por dentro, mais estreito, com o valor. Assim vê-se logo onde se perde mais.
export function mount(el: HTMLElement): () => void {
  const chart = createFunnelChart(el, {
    funnels: [
      {
        name: 'Meta',
        data: TARGET,
        silent: true,
        itemStyle: { color: 'transparent', borderWidth: 1.5, borderDash: [4, 3] },
        label: { position: 'right', format: (i) => `${i.name}\nmeta ${i.value}%` },
        gap: 6,
      },
      {
        name: 'Real',
        data: ACTUAL,
        max: 100,
        maxSize: '80%',
        itemStyle: { opacity: 0.85, borderWidth: 0 },
        label: { position: 'inside', format: (i) => `${i.value}%` },
        gap: 6,
      },
    ],
    right: '4%',
    top: 14,
    bottom: 14,
    legend: { position: 'bottom' },
    valueFormatter: (v) => `${v}%`,
  });
  return () => chart.destroy();
}
