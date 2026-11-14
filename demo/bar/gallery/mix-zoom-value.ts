import { createBarChart } from 'openchartscandle/bar';

// Zoom nos dois eixos: a barra em baixo escolhe as categorias e o controlo em cima o máximo do eixo de valores.
export function mount(el: HTMLElement): () => void {
  el.style.position = 'relative';
  const data = Array.from({ length: 60 }, (_, i) => Math.round(20 + 60 * Math.abs(Math.sin(i / 7)) + ((i * 37) % 23)));
  const chart = createBarChart(el, {
    categories: data.map((_, i) => `D${i + 1}`),
    series: [{ name: 'Valor', data }],
    zoom: { slider: true, start: 0, end: 40 },
    legend: { show: false },
  });
  const box = document.createElement('label');
  box.style.cssText = 'position:absolute;right:16px;top:8px;z-index:2;font-size:12px;display:flex;gap:6px;align-items:center';
  const range = document.createElement('input');
  Object.assign(range, { type: 'range', min: '20', max: '120', value: '120' });
  box.append('Máximo do eixo', range);
  range.addEventListener('input', () => chart.setOptions({ valueAxis: { max: Number(range.value) } }, false));
  el.append(box);
  return () => {
    chart.destroy();
    box.remove();
  };
}
