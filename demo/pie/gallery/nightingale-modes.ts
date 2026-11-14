import { createPieChart, type PieChart } from 'openchartscandle/pie';
import { cells } from '../data';

// Os dois modos da rosa de Nightingale lado a lado:
// 'radius' — o ângulo e o raio mostram o valor; 'area' — ângulos iguais, só o raio mostra o valor.
const DATA = [10, 5, 15, 25, 20, 35, 30, 40].map((value, i) => ({ label: `rosa ${i + 1}`, value }));

export function mount(el: HTMLElement): () => void {
  const [a, b] = cells(el, 2);
  const common = { data: DATA, innerRadius: 0.12, scale: 0.92, legend: { show: false }, center: { show: false } };
  const charts: PieChart[] = [
    createPieChart(a, { ...common, title: { text: "Modo raio (rose: 'radius')" }, rose: 'radius', labels: { position: 'outside', content: 'label' } }),
    createPieChart(b, { ...common, title: { text: "Modo área (rose: 'area')" }, rose: 'area', cornerRadius: 4, labels: { position: 'outside', content: 'label' } }),
  ];
  return () => charts.forEach((c) => c.destroy());
}
