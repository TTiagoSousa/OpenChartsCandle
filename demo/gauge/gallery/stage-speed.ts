import { createGauge } from 'openchartscandle/gauge';

// Velocidade por fases: três zonas de cor, marcas brancas por cima do arco (position: 'on')
// e o ponteiro e o valor com a cor da zona onde estão (needle.color: 'zone').
export function mount(el: HTMLElement): () => void {
  const gauge = createGauge(el, {
    value: 60,
    unit: 'km/h',
    zones: [
      { from: 0, to: 30, color: '#67e0e3', label: 'Lento' },
      { from: 30, to: 70, color: '#37a2da', label: 'Normal' },
      { from: 70, to: 100, color: '#fd666d', label: 'Rápido' },
    ],
    zoneGap: 0,
    rounded: false,
    thickness: 0.13,
    ticks: { position: 'on', major: 11, minor: 4 },
    needle: { color: 'zone' },
  });
  const timer = window.setInterval(() => gauge.setValue(Math.round(Math.random() * 100)), 2000);
  return () => {
    clearInterval(timer);
    gauge.destroy();
  };
}
