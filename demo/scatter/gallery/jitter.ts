import { createScatterChart } from 'openchartscandle/scatter';
import { choice, gauss, seeded, WEEKDAYS, withToolbar } from '../data';

// Num eixo de categorias os pontos ficariam todos na mesma linha. Com jitter espalham-se para o lado:
// sem se sobreporem (como uma colmeia) ou ao acaso. Tempos de entrega por dia da semana (gerados).
export function mount(el: HTMLElement): () => void {
  const rnd = seeded(8);
  const data = WEEKDAYS.flatMap((day, d) => Array.from({ length: 45 }, () => [day, Math.max(8, Math.round(32 + d * 2.5 + (d > 4 ? 10 : 0) + gauss(rnd) * 8))]));
  const host = withToolbar(
    el,
    choice('Jitter', [['Sem sobreposição', 'beeswarm'], ['Ao acaso', 'random'], ['Nenhum', 'none']], 'beeswarm', (v) =>
      chart.setOptions({ xAxis: { jitter: v === 'none' ? 0 : 44, jitterOverlap: v === 'random' } }),
    ),
  );
  const chart = createScatterChart(host, {
    series: [{ name: 'Entregas', data, symbolSize: 7, color: '#00bcd4' }],
    xAxis: { jitter: 44 },
    yAxis: { title: 'Minutos' },
    valueFormatter: (v) => `${v} min`,
  });
  return () => chart.destroy();
}
