import { createChart } from 'openchartscandle/candlestick';
import { chartOptions, externalTrades, makeBars } from '../data';

// Trades vindos de fora (backend, corretora, backtest), cada um com o seu id.
// Entrada: seta e etiqueta. Saída: seta verde (lucro) ou vermelha (perda). Linha tracejada com o P&L.
// O último está aberto: a linha vai até ao preço atual e mostra o P&L ao vivo.
export function mount(el: HTMLElement): () => void {
  const chart = createChart(el, chartOptions(el));
  const bars = makeBars(300, { seed: 7 });
  chart.setData(bars, 3600);
  chart.setTrades(externalTrades(bars, { openLast: true }));
  chart.showLastBars(110);
  return () => chart.destroy();
}
