import { createBarChart, type BarOptions } from 'openchartscandle/bar';

// Valores rodados dentro das colunas (labels.rotate); escolhe a posição e o ângulo em cima.
export function mount(el: HTMLElement): () => void {
  el.style.position = 'relative';
  const labels: NonNullable<BarOptions['labels']> = { show: true, rotate: 90, position: 'base', format: (v, d) => `${v}  ${d.series.name}` };
  const bar = document.createElement('div');
  bar.style.cssText = 'position:absolute;right:16px;top:8px;display:flex;gap:8px;align-items:center;font-size:12px;z-index:2';
  const pos = document.createElement('select');
  pos.className = 'ex-input';
  for (const [v, t] of [['base', 'Base'], ['inside', 'Dentro'], ['center', 'Centro'], ['outside', 'Fora']]) pos.append(new Option(t, v, v === 'base', v === 'base'));
  const rot = document.createElement('input');
  Object.assign(rot, { type: 'range', min: '0', max: '90', value: '90' });
  bar.append(pos, 'Rodar', rot);
  const chart = createBarChart(el, {
    categories: ['2012', '2013', '2014', '2015', '2016'],
    series: [
      { name: 'Floresta', data: [320, 332, 301, 334, 390] },
      { name: 'Estepe', data: [220, 182, 191, 234, 290] },
      { name: 'Deserto', data: [150, 232, 201, 154, 190] },
      { name: 'Pântano', data: [98, 77, 101, 99, 40] },
    ],
    labels,
    barGap: 2,
  });
  el.append(bar);
  const apply = (): void => {
    labels.position = pos.value as typeof labels.position;
    labels.rotate = Number(rot.value);
    chart.setOptions({ labels: { ...labels } }, false);
  };
  pos.addEventListener('change', apply);
  rot.addEventListener('input', apply);
  return () => {
    chart.destroy();
    bar.remove();
  };
}
