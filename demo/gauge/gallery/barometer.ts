import { createGauge } from 'openchartscandle/gauge';

// Barómetro clássico: hPa por fora e mmHg por dentro (secondaryScale), o estado do tempo
// escrito no mostrador (zoneLabels) e um ponteiro fino vermelho, num fundo de papel.
const HPA_TO_MMHG = 0.750062;

export function mount(el: HTMLElement): () => void {
  const gauge = createGauge(el, {
    value: 1013,
    min: 950,
    max: 1050,
    startAngle: -135,
    endAngle: 135,
    thickness: 4,
    rounded: false,
    zones: [
      { from: 950, to: 980, color: 'rgba(84,110,122,0.55)', label: 'Tempestade' },
      { from: 980, to: 1000, color: 'rgba(66,165,245,0.55)', label: 'Chuva' },
      { from: 1000, to: 1020, color: 'rgba(158,158,158,0.55)', label: 'Variável' },
      { from: 1020, to: 1050, color: 'rgba(255,167,38,0.6)', label: 'Bom tempo' },
    ],
    zoneGap: 0,
    zoneLabels: { color: '#5d4037' },
    ticks: { position: 'outside', major: 11, minor: 4, color: '#3e2723' },
    secondaryScale: { min: 950 * HPA_TO_MMHG, max: 1050 * HPA_TO_MMHG, major: 6, minor: 4, color: '#6d4c41', format: (v) => String(Math.round(v)), label: 'mmHg' },
    needle: { shape: 'line', color: '#c62828', width: 4, length: 0.9 },
    unit: 'hPa',
    valueColorByZone: false,
    theme: { background: '#f3efe6', text: '#3e2723', muted: '#6d4c41', track: 'rgba(62,39,35,0.25)', needle: '#c62828' },
  });
  const timer = window.setInterval(() => gauge.setValue(Math.round(965 + Math.random() * 75)), 3000);
  return () => {
    clearInterval(timer);
    gauge.destroy();
  };
}
