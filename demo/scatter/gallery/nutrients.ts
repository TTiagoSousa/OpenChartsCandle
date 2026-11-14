import { createScatterChart, type ScatterSeries } from 'openchartscandle/scatter';
import { FOODS, FOOD_GROUPS, NUTRIENT_DIMS, select, withToolbar } from '../data';

// Nutrientes por 100 g de 60 alimentos: escolhe o que vai em cada eixo e os pontos deslizam para o
// novo lugar. A cor é o grupo do alimento; clica na legenda para esconder um grupo. Valores aproximados.
export function mount(el: HTMLElement): () => void {
  let dx = 0;
  let dy = 1;
  const series = (): ScatterSeries[] =>
    FOOD_GROUPS.map((g, gi) => ({
      name: g,
      symbolSize: 10,
      data: FOODS.filter((f) => f[1] === gi).map(([name, , ...v]) => ({ x: v[dx], y: v[dy], name, id: name })),
    }));
  const dims = NUTRIENT_DIMS.map((d, i) => [d, i] as [string, number]);
  const update = (): void => chart.setOptions({ series: series(), xAxis: { title: NUTRIENT_DIMS[dx] }, yAxis: { title: NUTRIENT_DIMS[dy] } });
  const host = withToolbar(
    el,
    select('X', dims, dx, (v) => {
      dx = v;
      update();
    }),
    select('Y', dims, dy, (v) => {
      dy = v;
      update();
    }),
  );
  const chart = createScatterChart(host, {
    series: series(),
    xAxis: { title: NUTRIENT_DIMS[dx] },
    yAxis: { title: NUTRIENT_DIMS[dy] },
    legend: { position: 'right' },
    tooltip: { formatter: (p) => `<b>${p.name}</b><br>${NUTRIENT_DIMS[dx]}: ${p.x}<br>${NUTRIENT_DIMS[dy]}: ${p.y}` },
  });
  return () => chart.destroy();
}
