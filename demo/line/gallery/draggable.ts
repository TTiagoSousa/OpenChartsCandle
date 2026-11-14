import { createLineChart, type LinePoint } from 'openchartscandle/line';

// Pontos arrastáveis: agarra num ponto e move-o; o evento 'change' dá o novo valor.
export function mount(el: HTMLElement): () => void {
  const data: LinePoint[] = [
    { x: 15, y: 0 },
    { x: -50, y: 10 },
    { x: -56.5, y: 20 },
    { x: -46.5, y: 30 },
    { x: -22.1, y: 40 },
  ];
  const info = document.createElement('div');
  info.style.cssText = 'position:absolute;right:16px;top:12px;font-size:12px;opacity:.8;pointer-events:none';
  info.textContent = 'Arrasta os pontos';
  el.style.position = 'relative';
  const chart = createLineChart(el, {
    series: [{ name: 'Perfil', data, draggable: 'xy', sortByX: false, points: { size: 8, color: '#ffffff', borderColor: '#2962ff', borderWidth: 3 }, width: 2.5 }],
    xType: 'number',
    xAxis: { min: -100, max: 80 },
    yAxis: { min: -10, max: 50 },
    legend: { show: false },
    tooltip: { mode: 'single' },
    animation: false,
  });
  el.append(info);
  const off = chart.on('change', (e) => (info.textContent = `Ponto ${e.index + 1}: x = ${e.x.toFixed(1)}, y = ${e.y.toFixed(1)}`));
  return () => {
    off();
    chart.destroy();
    info.remove();
  };
}
