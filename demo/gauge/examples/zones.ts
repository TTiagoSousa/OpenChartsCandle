import { createGauge, zoneAt, type GaugeZone } from 'openchartscandle/gauge';
import { h } from '../data';

// Zonas e marcadores: o Fear & Greed Index com cinco zonas com nome (aparecem no tooltip
// ao passar o rato) e marcadores para ontem e a semana passada.
const zones: GaugeZone[] = [
  { from: 0, to: 25, color: '#f23645', label: 'Medo extremo' },
  { from: 25, to: 45, color: '#ff7043', label: 'Medo' },
  { from: 45, to: 55, color: '#ffb300', label: 'Neutro' },
  { from: 55, to: 75, color: '#8bc34a', label: 'Ganância' },
  { from: 75, to: 100, color: '#089981', label: 'Ganância extrema' },
];

export function mount(el: HTMLElement): () => void {
  const info = h('span', { class: 'ex-label' });
  const host = h('div', { class: 'ex-fill' });
  const next = h('button', { class: 'ex-btn', text: 'Novo valor' });
  el.append(h('div', { class: 'ex-toolbar' }, next, info), host);
  const gauge = createGauge(host, {
    value: 71,
    shape: 'semi',
    title: 'Fear & Greed Index',
    zones,
    zoneGap: 2,
    thickness: 0.2,
    markers: [
      { value: 64, label: 'Ontem', color: '#9598a1' },
      { value: 38, label: 'Semana passada', color: '#2962ff' },
    ],
    ticks: { major: 5, minor: 4 },
    needle: { shape: 'arrow' },
  });
  next.addEventListener('click', () => gauge.setValue(Math.round(Math.random() * 100)));
  const show = (): void => {
    info.textContent = `Valor ${gauge.value} · ${zoneAt(gauge.value, zones)?.label ?? ''}`;
  };
  const off = gauge.on('change', show);
  show();
  return () => {
    off();
    gauge.destroy();
  };
}
