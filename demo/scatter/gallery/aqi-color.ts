import { createScatterChart } from 'openchartscandle/scatter';
import { AQI_DIMS, airQuality } from '../data';

// Qualidade do ar em três cidades ao longo de um mês: a posição é o dia e o índice AQI, o tamanho
// segue as PM2.5 e a cor o NO2 (dois visualMap). Arrasta as pontas das barras à direita para filtrar.
// Dados gerados.
export function mount(el: HTMLElement): () => void {
  const cities = airQuality();
  const chart = createScatterChart(el, {
    series: cities.map((c, i) => ({ name: c.city, data: c.data, symbol: (['circle', 'rect', 'triangle'] as const)[i], opacity: 0.85 })),
    dimensions: AQI_DIMS,
    xAxis: { title: 'Dia', ticks: 6 },
    yAxis: { title: 'AQI' },
    legend: { position: 'top' },
    visualMap: [
      { dimension: 2, sizes: [6, 30], title: 'PM2.5' },
      { dimension: 5, colors: ['#50a3ba', '#eac736', '#d94e5d'], title: 'NO2' },
    ],
  });
  return () => chart.destroy();
}
