import { createLineChart, type LineChart } from 'openchartscandle/line';

// Dois gráficos ligados: o caudal em cima e a chuva em baixo (eixo invertido, a "cair" do topo).
// O hover e o zoom de um passam para o outro com showHover() e setZoom().
const HOURS = 24 * 10;
const start = Date.UTC(2026, 5, 1) / 1000;
const t = (i: number): number => start + i * 3600;
const rain = Array.from({ length: HOURS }, (_, i) => {
  const storm = Math.max(0, Math.sin((i - 40) / 18)) * Math.max(0, Math.sin(i / 7)) * 4;
  return +(storm + (i % 53 === 0 ? 2 : 0)).toFixed(2);
});
const flow = rain.map((_, i) => {
  let f = 1.2;
  for (let k = Math.max(0, i - 30); k <= i; k++) f += rain[k] * Math.exp(-(i - k) / 9) * 0.6;
  return +f.toFixed(2);
});

export function mount(el: HTMLElement): () => void {
  const top = document.createElement('div');
  const bottom = document.createElement('div');
  top.style.height = '55%';
  bottom.style.height = '45%';
  el.append(top, bottom);
  const charts: LineChart[] = [
    createLineChart(top, {
      series: [{ name: 'Caudal (m³/s)', data: flow.map((y, i) => ({ x: t(i), y })), color: '#2962ff', width: 1.5, area: true }],
      zoom: true,
      yAxis: { title: 'Caudal (m³/s)' },
      legend: { position: 'top', align: 'end' },
    }),
    createLineChart(bottom, {
      series: [{ name: 'Chuva (mm)', data: rain.map((y, i) => ({ x: t(i), y })), color: '#00bcd4', width: 1.5, area: true }],
      zoom: true,
      yAxis: { title: 'Chuva (mm)', inverse: true, beginAtZero: true },
      legend: { position: 'bottom', align: 'end' },
    }),
  ];
  // link hover and zoom both ways (setZoom ignores an unchanged range, so there is no loop)
  const [a, b] = charts;
  const offs = [
    a.on('hover', (c) => b.showHover(c?.x ?? null)),
    b.on('hover', (c) => a.showHover(c?.x ?? null)),
    a.on('zoom', (r) => (r ? b.setZoom(r.from, r.to) : b.resetZoom())),
    b.on('zoom', (r) => (r ? a.setZoom(r.from, r.to) : a.resetZoom())),
  ];
  return () => {
    offs.forEach((off) => off());
    charts.forEach((c) => c.destroy());
    top.remove();
    bottom.remove();
  };
}
