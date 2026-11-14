import { createRadarChart } from 'openchartscandle/radar';
import { BROWSERS } from '../data';

// A quota dos browsers de computador de 2010 a 2024: um polígono por ano, com a cor do ano (do azul ao
// vermelho). Vê-se o Chrome a crescer e o Internet Explorer a encolher. Valores aproximados.
export function mount(el: HTMLElement): () => void {
  const chart = createRadarChart(el, {
    title: 'Quota dos browsers (%)',
    indicators: ['Chrome', 'Safari', 'Edge / IE', 'Firefox', 'Outros'].map((name) => ({ name, max: 70 })),
    series: [{ name: 'Browsers', width: 1.5, points: false, data: BROWSERS.map(([year, value]) => ({ name: String(year), value })) }],
    visualMap: { colors: ['#2962ff', '#ab47bc', '#f23645'], title: 'Ano' },
    axisLabel: { format: (v) => `${v}%` },
    valueFormatter: (v) => `${v}%`,
    hoverDim: 0.15,
  });
  return () => chart.destroy();
}
