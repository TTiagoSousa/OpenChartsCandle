import { createScatterChart } from 'openchartscandle/scatter';
import { REGIONS, REGION_COLORS, countries } from '../data';

// Etiquetas alinhadas em cima: o nome de cada país fica numa linha no topo, afastado dos vizinhos,
// com uma linha até à bolha. As que não cabem escondem-se (as bolhas maiores têm prioridade).
export function mount(el: HTMLElement): () => void {
  const data = countries(2015);
  const chart = createScatterChart(el, {
    series: REGIONS.map((r, i) => ({
      name: r,
      color: REGION_COLORS[i],
      labels: { layout: 'top', fontSize: 10.5 },
      data: data.filter((c) => c.region === r).map((c) => ({ x: c.gdp, y: c.life, values: [c.pop], name: c.name, size: 5 + Math.sqrt(c.pop) * 1.3 })),
    })),
    dimensions: ['PIB por pessoa ($)', 'Esperança de vida', 'População (milhões)'],
    xAxis: { type: 'log' },
    yAxis: { min: 50 },
    legend: { position: 'bottom' },
  });
  return () => chart.destroy();
}
