import { createBoxplotChart, type BoxplotSeries } from 'openchartscandle/boxplot';
import { normalSamples, seeded, withToolbar } from '../data';

// Tempos de resposta de três serviços por dia da semana (ms, dados gerados): a biblioteca calcula as caixas a
// partir dos valores. Passa o rato numa caixa ou num outlier, clica na legenda para esconder um serviço, e
// "Novos dados" troca os valores com setSeries() animado.
const DAYS = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom'];

export function mount(el: HTMLElement): () => void {
  let seed = 1;
  const series = (): BoxplotSeries[] =>
    ['API', 'Base de dados', 'Cache'].map((name, s) => {
      const rnd = seeded(seed * 97 + s);
      return {
        name,
        samples: DAYS.map((_, d) => {
          const v = normalSamples(60, [180, 120, 40][s] * (d > 4 ? 0.8 : 1) * (0.85 + rnd() * 0.3), [30, 25, 8][s], seed * 1000 + s * 10 + d);
          // a few slow requests
          return v.concat([v[0] * 2.2, v[1] * 1.9].slice(0, Math.floor(rnd() * 3)));
        }),
      };
    });
  const button = document.createElement('button');
  button.className = 'ex-btn';
  button.textContent = 'Novos dados';
  const info = document.createElement('span');
  info.className = 'ex-label';
  info.textContent = 'Clica numa caixa.';
  const chart = createBoxplotChart(withToolbar(el, button, info), {
    title: { text: 'Tempo de resposta', subtext: 'Por serviço e dia da semana (dados gerados)', align: 'left' },
    categories: DAYS,
    series: series(),
    mean: true,
    valueAxis: { title: 'ms', beginAtZero: true },
    valueFormatter: (v) => `${Math.round(v)} ms`,
  });
  button.addEventListener('click', () => {
    seed++;
    chart.setSeries(series());
  });
  chart.on('click', (p) => {
    info.textContent =
      p.kind === 'box'
        ? `${p.series.name}, ${p.category}: mediana ${Math.round(p.stats.median)} ms, ${p.stats.count} pedidos`
        : `${p.series.name}, ${p.category}: ${Math.round(p.point!)} ms`;
  });
  return () => chart.destroy();
}
