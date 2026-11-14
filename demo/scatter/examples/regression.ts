import { createScatterChart, regression, type ScatterRegressionType } from 'openchartscandle/scatter';
import { choice, h, noisy, withToolbar } from '../data';

// Regressões: a série desenha a curva que melhor passa pelos pontos, com a fórmula e o R².
// A mesma conta existe como função, regression(tipo, pontos), para usares fora do gráfico
// (a tabela em baixo compara os quatro tipos sobre estes pontos).
const DATA = noisy(70, 1, 40, (x) => 4 + 6 * Math.log(x) + 0.004 * x * x, 1.6, 7);
const TYPES: [string, ScatterRegressionType][] = [['Linear', 'linear'], ['Exponencial', 'exponential'], ['Logarítmica', 'logarithmic'], ['Polinomial (3)', 'polynomial']];

export function mount(el: HTMLElement): () => void {
  const table = h('div', { style: 'padding:6px 12px;font-size:12px;color:#9598a1;display:flex;gap:18px;flex-wrap:wrap' });
  table.innerHTML = TYPES.map(([name, t]) => `<span>${name}: <b style="color:#d1d4dc">R² ${regression(t, DATA, 3).r2.toFixed(3)}</b></span>`).join('');
  const host = withToolbar(
    el,
    choice('Tipo', TYPES, 'logarithmic' as ScatterRegressionType, (type) =>
      chart.setOptions({ series: [{ name: 'Medições', data: DATA, symbolSize: 8, regression: { type, order: 3 } }] }, false),
    ),
  );
  el.append(table);
  const chart = createScatterChart(host, {
    series: [{ name: 'Medições', data: DATA, symbolSize: 8, regression: { type: 'logarithmic', order: 3 } }],
    xAxis: { title: 'x' },
    yAxis: { title: 'y' },
  });
  return () => chart.destroy();
}
