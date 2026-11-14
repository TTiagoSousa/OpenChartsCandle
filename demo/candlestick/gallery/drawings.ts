import { createChart } from 'openchartscandle/candlestick';
import { chartOptions, makeBars } from '../data';

// Desenhos por código: Fibonacci entre o mínimo e o máximo, uma linha de tendência,
// o máximo como raio horizontal e uma posição long com alvo e stop.
export function mount(el: HTMLElement): () => void {
  const chart = createChart(el, chartOptions(el));
  const bars = makeBars(200, { seed: 23 });
  chart.setData(bars, 3600);
  chart.showLastBars(120);
  const view = bars.slice(-110);
  const lo = view.reduce((m, x) => (x.low < m.low ? x : m));
  const hi = view.reduce((m, x) => (x.high > m.high ? x : m));
  const dm = chart.drawings;
  const [a, b] = lo.time < hi.time ? [{ time: lo.time, price: lo.low }, { time: hi.time, price: hi.high }] : [{ time: hi.time, price: hi.high }, { time: lo.time, price: lo.low }];
  dm.add('fib', [a, b]);
  dm.add('hray', [{ time: hi.time, price: hi.high }], { color: '#f23645', text: 'Máximo' });
  const first = view[0];
  const last = view[view.length - 1];
  dm.add('trendline', [{ time: first.time, price: first.close }, { time: last.time, price: last.close }], { color: '#ff9800', width: 2 });
  dm.add('long', [
    { time: last.time, price: last.close },
    { time: last.time + 15 * 3600, price: last.close * 1.03 }, // alvo
    { time: last.time + 15 * 3600, price: last.close * 0.985 }, // stop
  ]);
  return () => chart.destroy();
}
