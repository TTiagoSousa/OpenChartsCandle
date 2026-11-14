import { createChart } from 'openchartscandle/candlestick';
import { chartOptions, makeBars } from '../data';

// Um trade aberto em tempo real: o P&L muda a cada tique (chart.update) e, quando o preço
// toca no alvo ou no stop, o trade fecha com updateTrade(id, { exitTime, exitPrice }) e abre outro.
export function mount(el: HTMLElement): () => void {
  const chart = createChart(el, chartOptions(el));
  const bars = makeBars(200, { seed: 2 });
  chart.setData(bars, 60);
  chart.showLastBars(70);

  let n = 1;
  let open = { id: `L-${n}`, entry: bars[bars.length - 1].close, side: 'long' as const };
  chart.setTrades([{ id: open.id, side: open.side, entryTime: bars[bars.length - 1].time, entryPrice: open.entry, qty: 2 }]);

  let last = { ...bars[bars.length - 1] };
  const timer = window.setInterval(() => {
    const price = Math.round(last.close * (1 + (Math.random() - 0.48) * 0.004) * 100) / 100;
    const newBar = Math.random() < 0.25;
    last = newBar
      ? { time: last.time + 60, open: last.close, high: Math.max(last.close, price), low: Math.min(last.close, price), close: price, volume: 100 }
      : { ...last, high: Math.max(last.high, price), low: Math.min(last.low, price), close: price };
    chart.update(last);
    const move = (price - open.entry) / open.entry;
    if (move > 0.008 || move < -0.005) {
      chart.updateTrade(open.id, { exitTime: last.time, exitPrice: price });
      open = { id: `L-${++n}`, entry: price, side: 'long' };
      chart.addTrade({ id: open.id, side: 'long', entryTime: last.time, entryPrice: price, qty: 2 });
    }
  }, 300);
  return () => {
    clearInterval(timer);
    chart.destroy();
  };
}
