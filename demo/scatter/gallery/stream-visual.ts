import { createScatterChart } from 'openchartscandle/scatter';
import { seeded } from '../data';

// 60 000 pontos a chegar aos poucos (appendData, como num stream), pintados pelo valor de cada um.
// Arrasta as pontas da barra de cores para ver só uma faixa de valores, mesmo enquanto os dados chegam.
export function mount(el: HTMLElement): () => void {
  const rnd = seeded(9);
  const chunk = (): number[][] =>
    Array.from({ length: 2000 }, () => {
      const x = rnd() * 100;
      const y = rnd() * 100;
      const v = Math.sin(x / 9) * Math.cos(y / 11) * 50 + Math.hypot(x - 50, y - 50) * 0.6;
      return [+x.toFixed(2), +y.toFixed(2), +v.toFixed(1)];
    });
  let n = 0;
  const chart = createScatterChart(el, {
    series: [{ id: 's', name: 'Leituras', data: [], symbolSize: 3, opacity: 0.9, large: true }],
    dimensions: ['x', 'y', 'Valor'],
    xAxis: { min: 0, max: 100 },
    yAxis: { min: 0, max: 100 },
    visualMap: {
      dimension: 2,
      min: -50,
      max: 85,
      colors: ['#313695', '#4575b4', '#74add1', '#abd9e9', '#fee090', '#fdae61', '#f46d43', '#d73027'],
      title: 'Valor',
      range: [-10, 60],
    },
    graphic: (ctx, api) => {
      ctx.font = `600 12px ${api.theme.font}`;
      ctx.fillStyle = api.theme.text;
      ctx.fillText(`${(n * 2000).toLocaleString('pt-PT')} pontos`, api.plot.x + 6, api.plot.y + 14);
    },
  });
  const timer = window.setInterval(() => {
    if (n >= 30) return clearInterval(timer);
    n++;
    chart.appendData('s', chunk());
  }, 120);
  return () => {
    clearInterval(timer);
    chart.destroy();
  };
}
