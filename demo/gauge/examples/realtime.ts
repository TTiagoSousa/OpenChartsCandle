import { createGauge, trafficZones } from 'openchartscandle/gauge';
import { h } from '../data';

// Tempo real: carga do CPU atualizada a cada 500 ms com setValue(); o evento 'zone' avisa
// quando o valor muda de zona (Normal → Atenção → Crítico).
export function mount(el: HTMLElement): () => void {
  const host = h('div', { class: 'ex-fill' });
  const log = h('div', { class: 'ex-log' });
  el.append(h('div', { class: 'ex-row' }, host, h('div', { class: 'ex-side' }, h('div', { class: 'ex-label', text: "Evento 'zone'" }), log)));

  const gauge = createGauge(host, {
    value: 35,
    unit: '%',
    title: 'CPU',
    zones: trafficZones(0, 100, [0.6, 0.85]),
    markers: [{ value: 90, label: 'Alerta', color: '#f23645' }],
    animation: { duration: 450, easing: 'smooth' },
  });
  const off = gauge.on('zone', (z) => {
    log.prepend(h('div', {}, h('span', { class: 'ex-muted', text: `${new Date().toLocaleTimeString()} ` }), h('b', { text: z?.label ?? '—', style: `color:${z?.color ?? 'inherit'}` }), ` (${gauge.value.toFixed(0)}%)`));
    while (log.childElementCount > 40) log.lastChild?.remove();
  });

  let v = 35;
  let trend = 0;
  const timer = window.setInterval(() => {
    trend = Math.max(-6, Math.min(6, trend + (Math.random() - 0.5) * 4));
    v = Math.max(2, Math.min(99, v + trend + (Math.random() - 0.5) * 6));
    if (v > 95 || v < 8) trend = -trend;
    gauge.setValue(v);
  }, 500);

  return () => {
    clearInterval(timer);
    off();
    gauge.destroy();
  };
}
