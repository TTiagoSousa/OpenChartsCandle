import { createLineChart } from 'openchartscandle/line';

// Caudal (eixo da esquerda) e chuva (eixo da direita, invertido) no mesmo gráfico:
// a chuva "cai" do topo e o caudal sobe depois. Barra de zoom em baixo.
const start = Date.UTC(2026, 3, 1) / 1000;
const n = 24 * 20;
const t = (i: number): number => start + i * 3600;
const rain = Array.from({ length: n }, (_, i) => +Math.max(0, 3 * Math.sin(i / 22) * Math.sin(i / 9) - 0.6).toFixed(2));
const flow = rain.map((_, i) => {
  let f = 0.8;
  for (let k = Math.max(0, i - 40); k <= i; k++) f += rain[k] * Math.exp(-(i - k) / 12) * 0.35;
  return +f.toFixed(2);
});

export function mount(el: HTMLElement): () => void {
  const chart = createLineChart(el, {
    series: [
      { name: 'Caudal', data: flow.map((y, i) => ({ x: t(i), y })), color: '#2962ff', width: 1.5, area: { opacity: 0.25 } },
      { name: 'Chuva', data: rain.map((y, i) => ({ x: t(i), y })), color: '#26c6da', width: 1, axis: 'right', area: { opacity: 0.45, gradient: false } },
    ],
    yAxis: { title: 'Caudal (m³/s)', beginAtZero: true },
    y2Axis: { title: 'Chuva (mm)', inverse: true, beginAtZero: true, max: 8 },
    zoom: { slider: true, start: 0, end: 60 },
    legend: { position: 'top', align: 'center' },
  });
  return () => chart.destroy();
}
