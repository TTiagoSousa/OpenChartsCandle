import { createGauge } from 'openchartscandle/gauge';

// Velocímetro de carro: 0–240 km/h, arco de progresso grosso e ponteiro em seta.
export function mount(el: HTMLElement): () => void {
  const gauge = createGauge(el, {
    value: 120,
    max: 240,
    unit: 'km/h',
    thickness: 0.12,
    progress: { color: '#5470c6' },
    needle: { shape: 'arrow', color: '#5470c6' },
    ticks: { major: 13, minor: 3 },
    valueSize: 40,
  });
  const timer = window.setInterval(() => gauge.setValue(Math.round(Math.random() * 240)), 2500);
  return () => {
    clearInterval(timer);
    gauge.destroy();
  };
}
