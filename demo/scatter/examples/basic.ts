import { createScatterChart } from 'openchartscandle/scatter';
import { heightWeight } from '../data';

// Dispersão com duas séries: altura e peso de mulheres e homens (dados gerados).
// Passa o rato para ver os valores, clica na legenda para esconder uma série
// e repara na entrada: os pontos aparecem da esquerda para a direita (animation.delay: 'x').
export function mount(el: HTMLElement): () => void {
  const { women, men } = heightWeight();
  const chart = createScatterChart(el, {
    title: { text: 'Altura e peso', subtext: '520 pessoas (dados gerados)', align: 'left' },
    series: [
      { name: 'Mulheres', data: women, color: '#e91e63', symbolSize: 8, opacity: 0.7 },
      { name: 'Homens', data: men, color: '#2962ff', symbolSize: 8, opacity: 0.7 },
    ],
    dimensions: ['Altura', 'Peso'],
    xAxis: { title: 'Altura (cm)' },
    yAxis: { title: 'Peso (kg)' },
    legend: { position: 'top', align: 'end' },
    valueFormatter: (v, d) => (d === 0 ? `${v} cm` : `${v} kg`),
    animation: { duration: 600, delay: 'x' },
  });
  return () => chart.destroy();
}
