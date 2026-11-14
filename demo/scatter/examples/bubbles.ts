import { createScatterChart } from 'openchartscandle/scatter';
import { choice, countries, withToolbar } from '../data';

// visualMap: a cor e o tamanho de cada bolha vêm de outra dimensão dos dados.
// Aqui x = PIB por pessoa, y = esperança de vida, tamanho = população e cor = esperança de vida.
// Arrasta as pontas das barras à direita para filtrar; os botões mudam o intervalo com setVisualRange.
export function mount(el: HTMLElement): () => void {
  const data = countries(2015).map((c) => ({ x: c.gdp, y: c.life, values: [c.pop, c.life], name: c.name }));
  const host = withToolbar(
    el,
    choice('Esperança de vida', [['Todas', 'all'], ['< 70 anos', 'low'], ['≥ 75 anos', 'high']], 'all', (k) =>
      chart.setVisualRange(1, k === 'low' ? [0, 70] : k === 'high' ? [75, 100] : [0, 100]),
    ),
  );
  const chart = createScatterChart(host, {
    series: [{ name: 'Países', data, borderWidth: 1, borderColor: 'rgba(255,255,255,0.35)' }],
    dimensions: ['PIB por pessoa ($)', 'Esperança de vida', 'População (milhões)', 'Esperança de vida'],
    xAxis: { type: 'log', title: 'PIB por pessoa ($)' },
    yAxis: { title: 'Esperança de vida (anos)' },
    visualMap: [
      // tamanho pela população (dimensão 2)
      { dimension: 2, sizes: [8, 48], title: 'População', format: (v) => `${Math.round(v)} M` },
      // cor pela esperança de vida (dimensão 3)
      { dimension: 3, colors: ['#f23645', '#ff9800', '#ffeb3b', '#089981'], title: 'Anos', format: (v) => v.toFixed(0) },
    ],
    valueFormatter: (v, d) => (d === 0 ? `$${v.toLocaleString('pt-PT')}` : d === 2 ? `${v} M` : `${v} anos`),
  });
  return () => chart.destroy();
}
