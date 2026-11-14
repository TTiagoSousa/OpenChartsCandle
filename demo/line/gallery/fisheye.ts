import { createLineChart, type LinePoint } from 'openchartscandle/line';

// Lupa olho-de-peixe: passa o rato pelo gráfico e o eixo X alarga-se à volta do cursor,
// para ver de perto uma zona com muitos pontos sem fazer zoom.
function makeData(): LinePoint[] {
  let seed = 5;
  const rand = (): number => ((seed = (seed * 16807) % 2147483647) / 2147483647);
  let v = 100;
  const start = Date.UTC(2026, 0, 1) / 1000;
  return Array.from({ length: 365 }, (_, i) => {
    v = Math.max(20, v + (rand() - 0.5) * 8 + Math.sin(i / 9) * 1.5);
    return { x: start + i * 86400, y: +v.toFixed(1) };
  });
}

export function mount(el: HTMLElement): () => void {
  const chart = createLineChart(el, {
    series: [{ name: 'Preço', data: makeData(), width: 1.5, points: { size: 3.5, hollow: true }, area: { opacity: 0.18 } }],
    fisheye: { radius: 140, strength: 4 },
    legend: { show: false },
  });
  return () => chart.destroy();
}
