import { createScatterChart, type ScatterSeries } from 'openchartscandle/scatter';
import { heightWeight } from '../data';

// De dispersão para barras: cada pessoa é um ponto (altura × peso) e depois uma fatia da barra com
// o peso médio do seu grupo. Os pontos voam para o lugar e mudam de círculo para retângulo.
// Alterna sozinho a cada 3 s (ou clica no gráfico).
export function mount(el: HTMLElement): () => void {
  const { women, men } = heightWeight();
  const groups: [string, string, [number, number][]][] = [
    ['Mulheres', '#e91e63', women.slice(0, 90)],
    ['Homens', '#2962ff', men.slice(0, 90)],
  ];
  const scatter = (): ScatterSeries[] =>
    groups.map(([name, color, pts], g) => ({ name, color, symbolSize: 7, data: pts.map(([x, y], i) => ({ x, y, id: g * 1000 + i })) }));
  const bars = (): ScatterSeries[] =>
    groups.map(([name, color, pts], g) => {
      const mean = pts.reduce((a, p) => a + p[1], 0) / pts.length;
      const slice = mean / pts.length;
      const order = pts.map((p, i) => ({ w: p[1], i })).sort((a, b) => a.w - b.w);
      return { name, color, barWidth: '55%', opacity: 0.9, data: order.map((o, k) => ({ x: name, y: (k + 1) * slice, y0: k * slice, id: g * 1000 + o.i, values: [mean] })) };
    });
  let agg = false;
  const chart = createScatterChart(el, {
    series: scatter(),
    xAxis: { title: 'Altura (cm)' },
    yAxis: { title: 'Peso (kg)' },
    legend: { position: 'top' },
    animation: { duration: 1000 },
    tooltip: { formatter: (p) => (agg ? `<b>${p.series.name}</b><br>Peso médio: ${Number(p.values[2]).toFixed(1)} kg` : `<b>${p.series.name}</b><br>${p.x} cm · ${p.y} kg`) },
  });
  const flip = (): void => {
    agg = !agg;
    chart.setOptions(
      agg
        ? { series: bars(), xAxis: { type: 'category', categories: ['Mulheres', 'Homens'] }, yAxis: { title: 'Peso médio (kg)', beginAtZero: true } }
        : { series: scatter(), xAxis: { title: 'Altura (cm)' }, yAxis: { title: 'Peso (kg)' } },
    );
  };
  const timer = window.setInterval(flip, 3000);
  el.addEventListener('click', flip);
  return () => {
    clearInterval(timer);
    el.removeEventListener('click', flip);
    chart.destroy();
  };
}
