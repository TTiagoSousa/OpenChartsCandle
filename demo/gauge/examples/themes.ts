import { createGauge, trafficZones, type GaugeChart, type GaugeOptions } from 'openchartscandle/gauge';
import { h } from '../data';

// Temas: escuro (padrão), claro e um tema próprio (fundo, texto, trilho, ponteiro, tooltip).
export function mount(el: HTMLElement): () => void {
  const cells = [0, 1, 2].map(() => h('div', { class: 'ex-cell' }));
  el.append(h('div', { class: 'ex-grid-3' }, ...cells));
  const common: GaugeOptions = { value: 132, max: 220, unit: 'km/h', title: 'Velocidade', ticks: { major: 12, minor: 1 } };
  const gauges: GaugeChart[] = [
    createGauge(cells[0], { ...common, zones: trafficZones(0, 220), theme: 'dark' }),
    createGauge(cells[1], { ...common, zones: trafficZones(0, 220), theme: 'light' }),
    createGauge(cells[2], {
      ...common,
      gradient: ['#00e0c6', '#ff4d8d'],
      progress: true,
      thickness: 0.06,
      theme: { background: '#0b1020', text: '#e6e9ef', muted: '#7f8aa3', track: 'rgba(0,224,198,0.1)', needle: '#00e0c6', tooltipBg: '#111a33', tooltipBorder: '#00e0c6', tooltipText: '#e6e9ef' },
      valueColorByZone: false,
    }),
  ];
  return () => gauges.forEach((g) => g.destroy());
}
