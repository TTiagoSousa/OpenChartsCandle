import { createChart, createIndicator } from 'openchartscandle/candlestick';
import { chartOptions, makeBars } from '../data';

// Linhas e zonas no tempo com setTimeRanges: o aquecimento dos indicadores, o início da simulação
// e dois períodos excluídos. Cada limite fica na vela que contém o instante.
export function mount(el: HTMLElement): () => void {
  const chart = createChart(el, chartOptions(el));
  const bars = makeBars(300, { seed: 21 });
  chart.setData(bars, 3600);
  chart.addIndicator(createIndicator('sma', { length: 50, color: '#ff9800', width: 2 })!);
  const t = (i: number): number => bars[i].time;
  chart.setTimeRanges([
    { from: t(150), to: t(200), color: '#787b86', label: 'Aquecimento' },
    { from: t(200), color: '#2962ff', label: 'Início da simulação', lineStyle: 'solid', lineWidth: 2 },
    { from: t(232) + 1800, to: t(244), color: '#f23645', label: 'Excluído', opacity: 0.1, border: true, lineStyle: 'dotted' },
    { from: t(268), to: t(276), color: '#f23645', label: 'Excluído', opacity: 0.1, border: true, lineStyle: 'dotted' },
  ]);
  chart.showLastBars(160);
  return () => chart.destroy();
}
