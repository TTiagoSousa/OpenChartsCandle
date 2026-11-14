import { createGauge } from 'openchartscandle/gauge';

// Termómetro: arco largo de 220° com gradiente laranja, progresso até ao valor,
// marcas por fora e o valor em °C ao centro.
export function mount(el: HTMLElement): () => void {
  const gauge = createGauge(el, {
    value: 20,
    min: 0,
    max: 60,
    startAngle: -110,
    endAngle: 110,
    thickness: 0.2,
    gradient: ['#ffab91', '#fd7347', '#e64a19'],
    progress: true,
    needle: false,
    ticks: { position: 'outside', major: 7, minor: 4 },
    unit: '°C',
    valueColorByZone: false,
    valueSize: 48,
  });
  const timer = window.setInterval(() => gauge.setValue(+(Math.random() * 60).toFixed(1)), 2500);
  return () => {
    clearInterval(timer);
    gauge.destroy();
  };
}
