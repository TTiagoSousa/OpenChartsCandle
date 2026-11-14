import { createGauge, type GaugeChart, type GaugeOptions } from 'openchartscandle/gauge';
import { gaugeGrid } from '../data';

// Ponteiros: clássico (afunilado), linha e seta; cor, espessura, comprimento e o eixo central.
// Também o tipo de animação: 'spring' (com mola), 'smooth' ou 'linear'.
export function mount(el: HTMLElement): () => void {
  const cells = gaugeGrid(el, ["shape: 'classic' · spring", "shape: 'line' · smooth", "shape: 'arrow' · linear", 'cor e tamanho próprios'], 240);
  const base: GaugeOptions = { value: 0, background: 'transparent', gradient: ['#089981', '#ffb300', '#f23645'], thickness: 0.08, ticks: { major: 6, minor: 4 } };
  const gauges: GaugeChart[] = [
    createGauge(cells[0], { ...base, needle: { shape: 'classic' }, animation: { easing: 'spring' } }),
    createGauge(cells[1], { ...base, needle: { shape: 'line' }, animation: { easing: 'smooth' } }),
    createGauge(cells[2], { ...base, needle: { shape: 'arrow' }, animation: { easing: 'linear', duration: 600 } }),
    createGauge(cells[3], { ...base, needle: { shape: 'classic', color: '#ff9800', width: 6, length: 0.95 }, animation: { duration: 1600 } }),
  ];
  const move = (): void => {
    const v = Math.round(10 + Math.random() * 85);
    gauges.forEach((g) => g.setValue(v));
  };
  move();
  const timer = window.setInterval(move, 2200);
  return () => {
    clearInterval(timer);
    gauges.forEach((g) => g.destroy());
  };
}
