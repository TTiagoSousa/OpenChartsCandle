import { createChart } from 'openchartscandle/candlestick';
import { chartOptions, makeBars } from '../data';

// Tempo real: chart.update(vela). O mesmo tempo atualiza a última vela; um tempo novo acrescenta outra.
export function mount(el: HTMLElement): () => void {
  const chart = createChart(el, chartOptions(el));
  const bars = makeBars(150, { seed: 4, tf: 60 });
  chart.setData(bars, 60);
  chart.showLastBars(60);
  let last = { ...bars[bars.length - 1] };
  let ticks = 0;
  const timer = window.setInterval(() => {
    const price = Math.round(last.close * (1 + (Math.random() - 0.5) * 0.003) * 100) / 100;
    if (++ticks % 8 === 0) last = { time: last.time + 60, open: last.close, high: last.close, low: last.close, close: last.close, volume: 0 };
    last = { ...last, close: price, high: Math.max(last.high, price), low: Math.min(last.low, price), volume: last.volume + 10 };
    chart.update(last);
  }, 250);
  return () => {
    clearInterval(timer);
    chart.destroy();
  };
}
