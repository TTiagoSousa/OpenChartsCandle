import { createGauge, type GaugeRing } from 'openchartscandle/gauge';

// Anéis concêntricos: três valores em anéis completos, com os nomes e valores ao centro (rings).
export function mount(el: HTMLElement): () => void {
  const rings = (): GaugeRing[] => [
    { label: 'Perfeito', value: Math.round(Math.random() * 100), color: '#5470c6' },
    { label: 'Bom', value: Math.round(Math.random() * 100), color: '#91cc75' },
    { label: 'Normal', value: Math.round(Math.random() * 100), color: '#fac858' },
  ];
  const gauge = createGauge(el, {
    shape: 'full',
    rings: rings(),
    thickness: 0.13,
    unit: '%',
    animation: { easing: 'smooth', duration: 900 },
  });
  const timer = window.setInterval(() => gauge.setOptions({ rings: rings() }), 2500);
  return () => {
    clearInterval(timer);
    gauge.destroy();
  };
}
