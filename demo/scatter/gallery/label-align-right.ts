import { createScatterChart } from 'openchartscandle/scatter';
import { REGIONS, REGION_COLORS, countries } from '../data';

// A mesma ideia com as etiquetas numa coluna à direita: cada nome fica à altura do seu ponto,
// empurrado para cima ou para baixo para não tocar nos outros, com uma linha até ao ponto.
export function mount(el: HTMLElement): () => void {
  const data = countries(2015).filter((c) => c.region === 'Europa' || c.region === 'Américas');
  const chart = createScatterChart(el, {
    series: REGIONS.filter((r) => r === 'Europa' || r === 'Américas').map((r) => ({
      name: r,
      color: REGION_COLORS[REGIONS.indexOf(r)],
      labels: { layout: 'right', fontSize: 10.5 },
      symbolSize: 9,
      data: data.filter((c) => c.region === r).map((c) => ({ x: c.gdp, y: c.life, name: c.name })),
    })),
    dimensions: ['PIB por pessoa ($)', 'Esperança de vida'],
    xAxis: { type: 'log' },
    legend: { position: 'bottom' },
  });
  return () => chart.destroy();
}
