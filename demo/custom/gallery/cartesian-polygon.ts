import { createCustomChart } from 'openchartscandle/custom';
import { seeded } from '../data';

// Um polígono no plano cartesiano: um item só junta os pontos da série num polígono (a zona de
// risco × retorno de uma carteira) com os vértices por cima. A cada 2,5 s há pontos novos e a forma
// muda com animação (os elementos têm id, por isso deslizam para o sítio novo).
export function mount(el: HTMLElement): () => void {
  let seed = 3;
  const make = (): [number, number][] => {
    const rnd = seeded(seed++);
    return Array.from({ length: 9 }, (_, i) => {
      const a = (i / 9) * Math.PI * 2;
      const r = 0.55 + rnd() * 0.45;
      return [+(20 + Math.cos(a) * 11 * r).toFixed(1), +(8 + Math.sin(a) * 8 * r).toFixed(1)];
    });
  };
  let pts = make();
  const chart = createCustomChart(el, {
    xAxis: { name: 'Risco (%)', nameLocation: 'middle', min: 5, max: 35, splitLine: true },
    yAxis: { name: 'Retorno (%)', min: -2, max: 18 },
    series: [
      {
        name: 'Carteira',
        data: [0],
        tooltip: false,
        renderItem: (p, api) => ({
          type: 'group',
          children: [
            { type: 'polygon', id: 'area', shape: { points: pts.map((q) => api.coord(q)) }, style: { fill: 'rgba(41, 98, 255, 0.25)', stroke: '#2962ff', lineWidth: 2, lineJoin: 'round' } },
            ...pts.map((q, i) => {
              const [x, y] = api.coord(q);
              return { type: 'circle' as const, id: `p${i}`, shape: { cx: x, cy: y, r: 4 }, style: { fill: '#2962ff', stroke: '#ffffff', lineWidth: 1.5 } };
            }),
          ],
        }),
      },
    ],
    animation: { duration: 900, easing: 'cubicInOut' },
  });
  const timer = window.setInterval(() => {
    pts = make();
    chart.refresh(true);
  }, 2500);
  return () => {
    clearInterval(timer);
    chart.destroy();
  };
}
