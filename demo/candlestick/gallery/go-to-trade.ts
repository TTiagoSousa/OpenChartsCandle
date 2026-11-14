import { createChart } from 'openchartscandle/candlestick';
import { button, chartOptions, externalTrades, makeBars, withBar } from '../data';

// Ir para um trade pelo id: chart.goToTrade(id, 'entry' | 'exit' | 'both').
// O gráfico desliza até lá e marca o trade com um anel na entrada e na saída.
export function mount(el: HTMLElement): () => void {
  const info = document.createElement('span');
  info.className = 'ex-label';
  let i = 0;
  const show = (point: 'entry' | 'exit' | 'both'): void => {
    const t = trades[i];
    chart.goToTrade(t.id!, point);
    info.textContent = `#${t.id} · ${t.side === 'long' ? 'Long' : 'Short'} (${i + 1} de ${trades.length})`;
  };
  const host = withBar(
    el,
    button('◀', () => { i = Math.max(0, i - 1); show('entry'); }),
    button('▶', () => { i = Math.min(trades.length - 1, i + 1); show('entry'); }),
    button('Entrada', () => show('entry')),
    button('Saída', () => show('exit')),
    button('Trade inteiro', () => show('both')),
    info,
  );
  const chart = createChart(host, chartOptions(el));
  const bars = makeBars(600, { seed: 7 });
  chart.setData(bars, 3600);
  const trades = externalTrades(bars);
  chart.setTrades(trades);
  show('both');
  return () => chart.destroy();
}
