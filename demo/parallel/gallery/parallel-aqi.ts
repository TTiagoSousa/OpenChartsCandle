import { createParallelChart } from 'openchartscandle/parallel';
import { AQI_AXES, aqiMonth } from '../data';

// Qualidade do ar de um mês em três cidades: uma linha por dia, com um eixo de categorias (a qualidade) no fim.
// As cores vêm do AQI (visualMap por intervalos: clica num intervalo para o esconder). Arrasta num eixo para
// selecionar dias; vários eixos juntam as condições. Dados gerados.
export function mount(el: HTMLElement): () => void {
  const city = (name: string, level: number, seed: number) => ({
    name,
    data: aqiMonth(level, seed).map((value) => ({ name: `${name}, dia ${value[0]}`, value })),
  });
  const chart = createParallelChart(el, {
    background: '#161627',
    axes: AQI_AXES,
    series: [city('Lisboa', 1.1, 3), city('Porto', 0.8, 5), city('Coimbra', 0.55, 7)],
    visualMap: {
      dimension: 1,
      title: 'AQI',
      pieces: [
        { max: 50, color: '#50a3ba' },
        { min: 50, max: 100, color: '#8ac06f' },
        { min: 100, max: 150, color: '#eac736' },
        { min: 150, max: 200, color: '#f58e3c' },
        { min: 200, color: '#d94e5d' },
      ],
    },
    lineWidth: 1.5,
    opacity: 0.6,
    smooth: true,
    theme: { axis: 'rgba(238, 197, 102, 0.55)', text: 'rgb(238, 197, 102)' },
    legend: { position: 'top' },
  });
  // a range already chosen: days with PM2.5 above 80
  chart.setBrush([{ axis: 2, from: 80, to: 250 }]);
  return () => chart.destroy();
}
