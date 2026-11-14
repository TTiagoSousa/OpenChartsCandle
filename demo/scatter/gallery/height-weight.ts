import { createScatterChart } from 'openchartscandle/scatter';
import { heightWeight } from '../data';

// Altura e peso de 520 pessoas: a caixa mostra o intervalo de cada grupo, os pinos o mais pesado e
// o mais leve, e a linha tracejada a média. Dados gerados.
export function mount(el: HTMLElement): () => void {
  const { women, men } = heightWeight();
  const chart = createScatterChart(el, {
    series: [
      { name: 'Mulheres', data: women, color: '#e91e63', symbolSize: 6, opacity: 0.6, marks: { area: 'Mulheres', max: true, min: true, average: true } },
      { name: 'Homens', data: men, color: '#2962ff', symbolSize: 6, opacity: 0.6, marks: { area: 'Homens', max: true, min: true, average: true } },
    ],
    xAxis: { title: 'Altura (cm)' },
    yAxis: { title: 'Peso (kg)' },
    legend: { position: 'top' },
    valueFormatter: (v, d) => (d === 0 ? `${v} cm` : `${v} kg`),
  });
  return () => chart.destroy();
}
