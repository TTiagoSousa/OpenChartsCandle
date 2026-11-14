import { createGauge, type GaugeChart } from 'openchartscandle/gauge';
import { gaugeGrid, h } from '../data';

// Arco de progresso sem ponteiro (needle: false): ótimo para KPIs, metas e percentagens.
// Espessura, pontas redondas ou retas e cor do progresso.
export function mount(el: HTMLElement): () => void {
  const cells = gaugeGrid(el, ['Meta de vendas', 'Armazenamento', 'Win rate', 'Margem usada'], 220);
  const gauges: GaugeChart[] = [
    createGauge(cells[0], { value: 78, needle: false, background: 'transparent', unit: '%', title: '78 de 100 M€', progress: { color: '#089981' }, ticks: { show: false }, showMinMax: true }),
    createGauge(cells[1], { value: 412, max: 512, needle: false, shape: 'full', thickness: 0.12, background: 'transparent', unit: 'GB', title: 'de 512 GB', progress: { color: '#2962ff' }, ticks: { show: false } }),
    createGauge(cells[2], { value: 61.4, needle: false, shape: 'semi', thickness: 0.3, rounded: false, background: 'transparent', unit: '%', title: '214 trades', progress: { color: '#9c27b0' }, ticks: { show: false }, showMinMax: true, valueFormatter: (v) => v.toFixed(1) }),
    createGauge(cells[3], {
      value: 84,
      needle: false,
      background: 'transparent',
      unit: '%',
      title: 'Risco de liquidação',
      zones: [
        { from: 0, to: 50, color: '#089981', label: 'Seguro' },
        { from: 50, to: 80, color: '#ffb300', label: 'Atenção' },
        { from: 80, to: 100, color: '#f23645', label: 'Perigo' },
      ],
      progress: true,
      ticks: { show: false },
      showMinMax: true,
    }),
  ];
  const timer = window.setInterval(() => gauges.forEach((g, i) => g.setValue(Math.max(0, Math.min(i === 1 ? 512 : 100, g.value + (Math.random() - 0.5) * (i === 1 ? 40 : 12))))), 2000);
  el.append(h('div', { class: 'ex-muted gc-note', text: 'Os valores mudam a cada 2 s com setValue().' }));
  return () => {
    clearInterval(timer);
    gauges.forEach((g) => g.destroy());
  };
}
