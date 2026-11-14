import { createGauge } from 'openchartscandle/gauge';

// Só o arco de progresso, sem ponteiro: pontas redondas e números por fora.
export function mount(el: HTMLElement): () => void {
  const gauge = createGauge(el, {
    value: 70,
    unit: '%',
    needle: false,
    thickness: 0.14,
    rounded: true,
    progress: { color: '#91cc75' },
    ticks: { position: 'outside', major: 6, minor: 0 },
    title: 'Concluído',
  });
  const timer = window.setInterval(() => gauge.setValue(Math.round(Math.random() * 100)), 2500);
  return () => {
    clearInterval(timer);
    gauge.destroy();
  };
}
