import { createLineChart, type LineCurve, type PointShape } from 'openchartscandle/line';
import { MONTHS, choice, costs, h, profit, revenue } from '../data';

// Tipos de curva (reta, suave, degraus), pontos com formas diferentes e linhas tracejadas.
export function mount(el: HTMLElement): () => void {
  const host = h('div', { class: 'ex-fill' });
  const bar = h('div', { class: 'ex-toolbar' });
  el.append(bar, host);

  let curve: LineCurve = 'smooth';
  let shape: PointShape = 'circle';
  const series = () => [
    { name: 'Receita', data: revenue, points: { shape, size: 4 } },
    { name: 'Custos', data: costs, dash: [6, 4], points: { shape, size: 4, hollow: true } },
    { name: 'Lucro', data: profit, width: 3, points: { shape, size: 4 } },
  ];
  const chart = createLineChart(host, { series: series(), categories: MONTHS, curve, valueFormatter: (v) => `${v} M€` });

  bar.append(
    choice<LineCurve>('Curva', [['Reta', 'linear'], ['Suave', 'smooth'], ['Degraus', 'step']], curve, (c) => {
      curve = c;
      chart.setOptions({ curve });
    }),
    choice<PointShape>('Pontos', [['●', 'circle'], ['■', 'square'], ['◆', 'diamond'], ['▲', 'triangle']], shape, (s) => {
      shape = s;
      chart.setSeries(series());
    }),
  );

  return () => chart.destroy();
}
