import { createPieChart } from 'openchartscandle/pie';
import { h } from '../data';

// Meio donut (gauge): startAngle -180 → endAngle 0. Dois exemplos lado a lado:
// alocação por classe e um "medidor" de sentimento de mercado.
export function mount(el: HTMLElement): () => void {
  const left = h('div', { class: 'ex-cell' });
  const right = h('div', { class: 'ex-cell' });
  el.append(h('div', { class: 'ex-grid-2' }, left, right));

  const allocation = createPieChart(left, {
    data: [
      { label: 'Ações', value: 60 },
      { label: 'Obrigações', value: 25 },
      { label: 'Liquidez', value: 15 },
    ],
    startAngle: -180,
    endAngle: 0,
    innerRadius: 0.6,
    padAngle: 1.5,
    cornerRadius: 5,
    legend: { position: 'bottom' },
    labels: { position: 'inside' },
    center: { title: 'Alocação', value: '100%' },
  });

  // gauge: a "agulha" é o valor; o resto fica a cinzento e sem interação útil
  const sentiment = 72;
  const gauge = createPieChart(right, {
    data: [
      { label: 'Ganância', value: sentiment, color: '#089981' },
      { label: 'Restante', value: 100 - sentiment, color: '#2a2e39' },
    ],
    startAngle: -180,
    endAngle: 0,
    innerRadius: 0.72,
    cornerRadius: 8,
    borderWidth: 0,
    hoverOffset: 0,
    selectable: false,
    tooltip: { show: false },
    labels: { show: false },
    legend: { show: false },
    center: { title: 'Índice medo & ganância', value: String(sentiment), followHover: false },
  });

  return () => {
    allocation.destroy();
    gauge.destroy();
  };
}
