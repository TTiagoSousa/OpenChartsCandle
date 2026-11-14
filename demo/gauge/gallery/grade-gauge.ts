import { createGauge } from 'openchartscandle/gauge';

// Avaliação por notas: meio círculo com quatro zonas e os nomes escritos no mostrador
// (zoneLabels); o valor vai de 0 a 1 e aparece de 0 a 100.
export function mount(el: HTMLElement): () => void {
  const gauge = createGauge(el, {
    value: 0.7,
    min: 0,
    max: 1,
    shape: 'semi',
    zones: [
      { from: 0, to: 0.25, color: '#ff6e76', label: 'Nota D' },
      { from: 0.25, to: 0.5, color: '#fddd60', label: 'Nota C' },
      { from: 0.5, to: 0.75, color: '#58d9f9', label: 'Nota B' },
      { from: 0.75, to: 1, color: '#7cffb2', label: 'Nota A' },
    ],
    zoneLabels: true,
    zoneGap: 0,
    thickness: 0.05,
    rounded: false,
    ticks: { major: 5, minor: 4, labels: false, position: 'outside' },
    needle: { shape: 'arrow', color: 'zone', length: 0.6 },
    title: 'Avaliação',
    valueFormatter: (v) => String(Math.round(v * 100)),
  });
  const timer = window.setInterval(() => gauge.setValue(+Math.random().toFixed(2)), 2500);
  return () => {
    clearInterval(timer);
    gauge.destroy();
  };
}
