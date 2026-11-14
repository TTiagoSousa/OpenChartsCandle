import { createLineChart, type LinePoint } from 'openchartscandle/line';

// Área com eixo de tempo: as datas formatam-se sozinhas (dias, meses, anos) conforme o zoom.
function makeData(): LinePoint[] {
  let seed = 11;
  const rand = (): number => ((seed = (seed * 16807) % 2147483647) / 2147483647);
  const start = Date.UTC(2010, 0, 1) / 1000;
  let v = 200;
  return Array.from({ length: 5000 }, (_, i) => {
    v = Math.max(10, v + (rand() - 0.48) * 10);
    return { x: start + i * 86400, y: Math.round(v) };
  });
}

export function mount(el: HTMLElement): () => void {
  const chart = createLineChart(el, {
    series: [{ name: 'Valor', data: makeData(), color: '#5470c6', width: 1, area: { opacity: 0.35 } }],
    zoom: { slider: true, start: 0, end: 20 },
    legend: { show: false },
    animation: false,
  });
  return () => chart.destroy();
}
