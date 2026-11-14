import { createGauge, type GaugeChart } from 'openchartscandle/gauge';
import { gaugeGrid } from '../data';

// Formatos: velocímetro (240°), meio círculo (180°), anel completo (360°) e ângulos próprios
// com startAngle / endAngle (0° = topo, sentido dos ponteiros).
export function mount(el: HTMLElement): () => void {
  const [a, b, c, d] = gaugeGrid(el, ["shape: 'speedometer'", "shape: 'semi'", "shape: 'full'", 'startAngle: -45, endAngle: 135'], 250);
  const gauges: GaugeChart[] = [
    createGauge(a, { value: 72, shape: 'speedometer', background: 'transparent', unit: '%', zones: [{ from: 0, to: 100, color: '#2962ff' }] }),
    createGauge(b, {
      value: 38,
      shape: 'semi',
      background: 'transparent',
      unit: '°C',
      min: -10,
      max: 60,
      gradient: ['#2962ff', '#00bcd4', '#089981', '#ffb300', '#f23645'],
      ticks: { major: 8 },
    }),
    createGauge(c, { value: 64, shape: 'full', needle: false, background: 'transparent', unit: '%', title: 'Progresso', ticks: { show: false } }),
    createGauge(d, { value: 3.4, min: 0, max: 8, startAngle: -45, endAngle: 135, background: 'transparent', unit: 'bar', title: 'Pressão', progress: { color: '#ff9800' }, valueFormatter: (v) => v.toFixed(1) }),
  ];
  return () => gauges.forEach((g) => g.destroy());
}
