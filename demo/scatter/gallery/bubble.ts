import { createScatterChart } from 'openchartscandle/scatter';
import { countries } from '../data';

// Gráfico de bolhas: riqueza (eixo log), esperança de vida e população (tamanho), em 1990 e em 2015.
// As bolhas têm um brilho (gradient) e sombra. Dados aproximados.
export function mount(el: HTMLElement): () => void {
  const series = [1990, 2015].map((year, i) => ({
    name: String(year),
    color: ['#2962ff', '#f23645'][i],
    gradient: true,
    shadow: { blur: 8, color: 'rgba(0,0,0,0.4)' },
    opacity: 0.8,
    data: countries(year).map((c) => ({ x: c.gdp, y: c.life, values: [c.pop], name: c.name, size: 5 + Math.sqrt(c.pop) * 1.2 })),
  }));
  const chart = createScatterChart(el, {
    series,
    dimensions: ['PIB por pessoa ($)', 'Esperança de vida', 'População (milhões)'],
    xAxis: { type: 'log', title: 'PIB por pessoa ($)' },
    yAxis: { title: 'Esperança de vida', min: 30, max: 90 },
    legend: { position: 'top' },
    valueFormatter: (v, d) => (d === 0 ? `$${v.toLocaleString('pt-PT')}` : d === 1 ? `${v} anos` : `${v} M`),
  });
  return () => chart.destroy();
}
