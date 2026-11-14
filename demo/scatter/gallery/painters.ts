import { createScatterChart } from 'openchartscandle/scatter';
import { PAINTERS, choice, hsl, withToolbar } from '../data';

// As cores dominantes de uma obra famosa de cada pintor, ao longo da história: cada ponto é pintado
// com a própria cor e o eixo vertical mostra o matiz, a saturação ou a luminosidade.
// As paletas foram escolhidas a olho e são aproximadas.
type Dim = 0 | 1 | 2;
const NAMES = ['Matiz (°)', 'Saturação (%)', 'Luminosidade (%)'];

export function mount(el: HTMLElement): () => void {
  let dim: Dim = 0;
  const series = () => [
    {
      name: 'Cores',
      opacity: 1,
      borderWidth: 1,
      borderColor: 'rgba(255,255,255,0.25)',
      data: PAINTERS.flatMap(([painter, year, colors]) =>
        colors.map((c, i) => {
          const v = hsl(c);
          return { x: year + (i - 2) * 3, y: +v[dim].toFixed(0), color: c, size: 10 + v[1] / 7, name: painter, id: `${painter}${i}`, data: c };
        }),
      ),
    },
  ];
  const host = withToolbar(
    el,
    choice('Eixo vertical', NAMES.map((n, i) => [n, i as Dim]), 0 as Dim, (v) => {
      dim = v;
      chart.setOptions({ series: series(), yAxis: { title: NAMES[dim], min: 0, max: dim ? 100 : 360 } });
    }),
  );
  const chart = createScatterChart(host, {
    series: series(),
    xAxis: { title: 'Ano', format: (v) => String(v) },
    yAxis: { title: NAMES[0], min: 0, max: 360 },
    tooltip: {
      formatter: (p) =>
        `<b>${p.name}</b> (${Math.round(Number(p.x))})<br><i style="display:inline-block;width:12px;height:12px;border-radius:3px;vertical-align:-2px;background:${p.data}"></i> ${p.data}`,
    },
  });
  return () => chart.destroy();
}
