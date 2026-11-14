import { createLineChart, type LinePoint } from 'openchartscandle/line';

// Clica no gráfico para acrescentar pontos: o evento 'plotclick' dá os valores debaixo do rato.
export function mount(el: HTMLElement): () => void {
  let data: LinePoint[] = [
    { x: 10, y: 20 },
    { x: 30, y: 55 },
    { x: 60, y: 35 },
  ];
  const chart = createLineChart(el, {
    series: [{ name: 'Pontos', data, points: { size: 6 } }],
    xType: 'number',
    xAxis: { min: 0, max: 100 },
    yAxis: { min: 0, max: 100 },
    legend: { show: false },
    tooltip: { mode: 'single' },
    animation: false,
    graphic: (ctx, api) => {
      ctx.fillStyle = api.theme.muted;
      ctx.font = `12px ${api.theme.font}`;
      ctx.fillText(`Clica para acrescentar um ponto · ${data.length} pontos`, api.plot.x + 10, api.plot.y + 16);
    },
  });
  const off = chart.on('plotclick', ({ x, y }) => {
    data = [...data, { x: Math.round(x), y: Math.round(y) }];
    chart.setSeries([{ name: 'Pontos', data, points: { size: 6 } }]);
  });
  return () => {
    off();
    chart.destroy();
  };
}
