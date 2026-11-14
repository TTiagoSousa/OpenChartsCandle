import { createGauge, trafficZones } from 'openchartscandle/gauge';
import { h } from '../data';

// Painel de carro: conta-rotações, velocímetro e combustível a mexer juntos. Carrega em
// "Acelerar" (ou mantém premido) e larga para travar.
export function mount(el: HTMLElement): () => void {
  const rpmBox = h('div', { class: 'gc-dash__side' });
  const speedBox = h('div', { class: 'gc-dash__main' });
  const fuelBox = h('div', { class: 'gc-dash__side' });
  const gas = h('button', { class: 'ex-btn ex-btn--buy', text: 'Acelerar (mantém premido)' });
  el.append(h('div', { class: 'ex-toolbar' }, gas), h('div', { class: 'gc-dash' }, rpmBox, speedBox, fuelBox));

  const common = { background: 'transparent', animation: { duration: 250, easing: 'smooth' as const } };
  const rpm = createGauge(rpmBox, { ...common, value: 0.8, min: 0, max: 8, title: 'x1000 rpm', zones: trafficZones(0, 8, [0.7, 0.85]), ticks: { major: 9, minor: 4 }, valueFormatter: (v) => v.toFixed(1) });
  const speed = createGauge(speedBox, {
    ...common,
    value: 0,
    max: 260,
    unit: 'km/h',
    gradient: ['#2962ff', '#00bcd4', '#9c27b0'],
    progress: true,
    thickness: 0.07,
    ticks: { major: 14, minor: 1 },
    needle: { color: '#f23645' },
    valueColorByZone: false,
  });
  const fuel = createGauge(fuelBox, { ...common, value: 70, shape: 'semi', title: 'Combustível', unit: '%', needle: { shape: 'line' }, zones: [{ from: 0, to: 15, color: '#f23645', label: 'Reserva' }, { from: 15, to: 100, color: '#5d606b' }], ticks: { major: 5, minor: 1 } });

  let pressing = false;
  let v = 0;
  let gear = 1;
  let fuelLeft = 70;
  const start = (): void => void (pressing = true);
  const stop = (): void => void (pressing = false);
  gas.addEventListener('pointerdown', start);
  window.addEventListener('pointerup', stop);
  const timer = window.setInterval(() => {
    v = Math.max(0, Math.min(250, v + (pressing ? 2.4 - v / 160 : -1.6)));
    // simple gearbox: rpm climbs inside each gear and drops when it shifts up
    const limits = [0, 30, 60, 100, 145, 190, 260];
    gear = limits.findIndex((l, i) => v >= l && v < limits[i + 1]) + 1 || 6;
    const lo = limits[gear - 1];
    const hi = limits[gear];
    const r = 0.8 + ((v - lo) / (hi - lo)) * 5.6 + (pressing ? 0.6 : 0);
    fuelLeft = Math.max(0, fuelLeft - (pressing ? 0.03 : 0.004));
    speed.setValue(v);
    rpm.setValue(Math.min(8, r));
    fuel.setValue(fuelLeft);
    gas.textContent = `Acelerar (mantém premido) · mudança ${gear}`;
  }, 50);

  return () => {
    clearInterval(timer);
    window.removeEventListener('pointerup', stop);
    [rpm, speed, fuel].forEach((g) => g.destroy());
  };
}
