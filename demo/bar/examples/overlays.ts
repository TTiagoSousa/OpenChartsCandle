import { createBarChart, type BarOverlay } from 'openchartscandle/bar';
import { h } from '../data';

// Linhas sobre as barras: médias móveis (simples, exponencial, ponderada), tendência linear
// e exponencial, média e uma linha com valores próprios (por exemplo vindos do backend).
// Liga e desliga cada uma nos botões; o período das médias muda no seletor.
const DAYS = Array.from({ length: 30 }, (_, i) => `${i + 1}`);
const volume = DAYS.map((_, i) => Math.round(120 * Math.pow(1.025, i) * (0.75 + 0.5 * Math.abs(Math.sin(i * 1.7) * Math.cos(i * 0.6)))));
const target = DAYS.map((_, i) => Math.round(110 + i * 4.2));

type Kind = 'sma' | 'ema' | 'wma' | 'linear' | 'exponential' | 'average' | 'line';
const LABELS: [Kind, string][] = [
  ['sma', 'Média móvel'],
  ['ema', 'Média exponencial'],
  ['wma', 'Média ponderada'],
  ['linear', 'Tendência linear'],
  ['exponential', 'Tendência exponencial'],
  ['average', 'Média'],
  ['line', 'Meta (backend)'],
];

export function mount(el: HTMLElement): () => void {
  const on = new Set<Kind>(['sma', 'ema', 'exponential']);
  let period = 7;
  const host = h('div', { class: 'ex-fill' });
  const bar = h('div', { class: 'ex-toolbar' });
  el.append(bar, host);

  const overlays = (): BarOverlay[] =>
    LABELS.filter(([k]) => on.has(k)).map(([type]): BarOverlay => {
      if (type === 'line') return { type, name: 'Meta', data: target, color: '#9598a1', dash: [2, 3], width: 1.5 };
      if (type === 'sma' || type === 'ema' || type === 'wma') return { type, period };
      return { type };
    });

  const chart = createBarChart(host, {
    categories: DAYS,
    series: [{ name: 'Volume', data: volume, color: '#2962ff' }],
    overlays: overlays(),
    categoryGap: 0.3,
    radius: 2,
    legend: { show: true },
    categoryAxis: { format: (d) => `Dia ${d}` },
    valueFormatter: (v) => `${v.toFixed(0)} BTC`,
  });

  for (const [kind, label] of LABELS) {
    const b = h('button', { class: `ex-btn${on.has(kind) ? ' is-on' : ''}`, text: label });
    b.addEventListener('click', () => {
      if (on.has(kind)) on.delete(kind);
      else on.add(kind);
      b.classList.toggle('is-on', on.has(kind));
      chart.setOverlays(overlays());
    });
    bar.append(b);
  }
  const sel = h('select', { class: 'ex-input' });
  for (const p of [3, 5, 7, 10, 14]) {
    const opt = h('option', { text: `Período ${p}` });
    opt.value = String(p);
    opt.selected = p === period;
    sel.append(opt);
  }
  sel.addEventListener('change', () => {
    period = Number(sel.value);
    chart.setOverlays(overlays());
  });
  bar.append(h('span', { class: 'ex-sep' }), sel);

  return () => chart.destroy();
}
