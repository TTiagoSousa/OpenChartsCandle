import { createChart, type TradeClickEvent } from 'openchartscandle/candlestick';
import { chartOptions, externalTrades, makeBars, withBar } from '../data';

// Clicar num trade no gráfico: o evento tradeClick diz qual (id) e se foi na entrada ou na saída.
// Aqui, clicar na entrada leva até à saída desse trade, e clicar na saída volta à entrada.
export function mount(el: HTMLElement): () => void {
  const info = document.createElement('span');
  info.className = 'ex-label';
  info.textContent = 'Clica numa seta ou etiqueta de um trade.';
  const host = withBar(el, info);
  const chart = createChart(host, chartOptions(el));
  const bars = makeBars(500, { seed: 7 });
  chart.setData(bars, 3600);
  chart.setTrades(externalTrades(bars, { openLast: true }));
  chart.setTradeDisplay({ lines: false });
  chart.showLastBars(90);

  const off = chart.tradeClick.on(({ trade, point }: TradeClickEvent) => {
    const other = point === 'entry' ? 'exit' : 'entry';
    if (point === 'entry' && trade.exitPrice === undefined) {
      info.textContent = `#${trade.id}: ainda aberto, sem saída.`;
      return;
    }
    chart.goToTrade(trade.id!, other);
    info.textContent = `#${trade.id}: ${point === 'entry' ? 'entrada → saída' : 'saída → entrada'}`;
  });
  return () => {
    off();
    chart.destroy();
  };
}
