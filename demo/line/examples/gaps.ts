import { createLineChart } from 'openchartscandle/line';
import { choice, h } from '../data';

// Dados em falta: um `null` parte a linha (o sensor esteve desligado). Com spanGaps a linha
// liga por cima da falha.
const hours = Array.from({ length: 48 }, (_, i) => `${String(i % 24).padStart(2, '0')}:00`);
const temp = hours.map((_, i) => (i >= 14 && i <= 19) || (i >= 33 && i <= 35) ? null : +(18 + 6 * Math.sin((i - 8) / 3.8) + Math.sin(i * 1.7)).toFixed(1));
const hum = hours.map((_, i) => (i >= 24 && i <= 27 ? null : +(60 - 15 * Math.sin((i - 8) / 3.8)).toFixed(0)));

export function mount(el: HTMLElement): () => void {
  const host = h('div', { class: 'ex-fill' });
  const bar = h('div', { class: 'ex-toolbar' });
  el.append(bar, host);

  const chart = createLineChart(host, {
    series: [
      { name: 'Temperatura', data: temp, color: '#ff9800', points: { size: 2.5 } },
      { name: 'Humidade', data: hum, axis: 'right', color: '#00bcd4', points: { size: 2.5 } },
    ],
    categories: hours,
    yAxis: { format: (v) => `${v}°` },
    y2Axis: { format: (v) => `${v}%` },
    valueFormatter: (v, s) => (s.axis === 'right' ? `${v}%` : `${v} °C`),
  });

  bar.append(choice('Falhas', [['Partir a linha', false], ['Ligar (spanGaps)', true]], false, (spanGaps) => chart.setOptions({ spanGaps })));

  return () => chart.destroy();
}
