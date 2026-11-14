import { createBarChart } from 'openchartscandle/bar';

// 20 000 barras: só as da janela visível são desenhadas; a barra em baixo e a roda do rato fazem zoom.
export function mount(el: HTMLElement): () => void {
  let v = 500;
  const data = Array.from({ length: 20000 }, () => Math.round((v = Math.max(20, v + (Math.random() - 0.5) * 40))));
  const chart = createBarChart(el, {
    categories: data.map((_, i) => `#${i + 1}`),
    series: [{ name: 'Valor', data }],
    zoom: { slider: true, start: 0, end: 5 },
    animation: false,
    radius: 0,
    categoryGap: 0.1,
    legend: { show: false },
  });
  return () => chart.destroy();
}
