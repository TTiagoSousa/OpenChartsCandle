import { createGauge, type GaugePointer } from 'openchartscandle/gauge';

// Relógio: um mostrador completo de 0 a 12 e três ponteiros (horas, minutos, segundos)
// com comprimentos e larguras diferentes, atualizados a cada segundo.
function hands(d: Date): GaugePointer[] {
  const h = d.getHours() % 12;
  const m = d.getMinutes();
  const s = d.getSeconds();
  return [
    { label: 'Horas', value: h + m / 60, length: 0.5, width: 7, color: '#d1d4dc' },
    { label: 'Minutos', value: m / 5 + s / 300, length: 0.75, width: 4.5, color: '#d1d4dc' },
    { label: 'Segundos', value: s / 5, length: 0.88, width: 2.5, color: '#f23645', shape: 'line' },
  ];
}

export function mount(el: HTMLElement): () => void {
  const gauge = createGauge(el, {
    shape: 'full',
    min: 0,
    max: 12,
    pointers: hands(new Date()),
    pointerValues: false,
    progress: false,
    thickness: 0.02,
    ticks: { major: 13, minor: 4, format: (v) => (v === 0 ? '12' : String(v)) },
    animation: { easing: 'smooth', duration: 300 },
    tooltip: false,
  });
  const timer = window.setInterval(() => {
    const now = new Date();
    // when a hand passes 12 it would spin backwards: jump instead
    gauge.setOptions({ pointers: hands(now) }, now.getSeconds() !== 0);
  }, 1000);
  return () => {
    clearInterval(timer);
    gauge.destroy();
  };
}
