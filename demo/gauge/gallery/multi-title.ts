import { createGauge, type GaugePointer } from 'openchartscandle/gauge';

// Três ponteiros no mesmo mostrador, cada um com nome, cor e valor (pointers).
export function mount(el: HTMLElement): () => void {
  const pointers = (): GaugePointer[] => [
    { label: 'Bom', value: Math.round(Math.random() * 100), color: '#91cc75' },
    { label: 'Melhor', value: Math.round(Math.random() * 100), color: '#fac858' },
    { label: 'Perfeito', value: Math.round(Math.random() * 100), color: '#ee6666' },
  ];
  const gauge = createGauge(el, {
    pointers: pointers(),
    progress: false,
    ticks: { major: 6, minor: 4 },
    needle: { width: 5 },
  });
  const timer = window.setInterval(() => gauge.setOptions({ pointers: pointers() }), 2500);
  return () => {
    clearInterval(timer);
    gauge.destroy();
  };
}
