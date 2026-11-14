import { createScatterChart } from 'openchartscandle/scatter';
import { gauss, seeded } from '../data';

// Uma nebulosa de 60 000 pontos minúsculos: com blend 'lighter' as cores somam-se onde os pontos se
// juntam e o centro brilha. A cor vem da distância ao centro (visualMap sem controlo).
export function mount(el: HTMLElement): () => void {
  const rnd = seeded(21);
  const data: [number, number, number][] = [];
  for (let i = 0; i < 60000; i++) {
    const arm = i % 3;
    const r = Math.pow(rnd(), 0.6) * 46;
    const a = arm * ((Math.PI * 2) / 3) + r * 0.11 + gauss(rnd) * (0.18 + 6 / (r + 8));
    const x = 50 + Math.cos(a) * r + gauss(rnd) * 1.6;
    const y = 50 + Math.sin(a) * r * 0.62 + gauss(rnd) * 1.6;
    data.push([+x.toFixed(2), +y.toFixed(2), +r.toFixed(1)]);
  }
  const chart = createScatterChart(el, {
    background: '#05060f',
    series: [{ name: 'Estrelas', data, symbolSize: 1.6, opacity: 0.55, blend: 'lighter' }],
    xAxis: { show: false, min: 0, max: 100 },
    yAxis: { show: false, min: 15, max: 85 },
    visualMap: { dimension: 2, min: 0, max: 46, colors: ['#fff6d5', '#ffb347', '#ff4f7b', '#7b4dff', '#2a6bff'], show: false },
    tooltip: { show: false },
    aspect: 'equal',
  });
  return () => chart.destroy();
}
