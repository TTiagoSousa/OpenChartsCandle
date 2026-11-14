import { createChart, createIndicator, timeframeById } from 'openchartscandle/candlestick';
import { PagedDatafeed, chartOptions, choice, inCard, withBar } from '../data';

// Indicadores com tempo gráfico próprio: a média de 20 velas de 4h e o RSI 14 de 4h num gráfico de 1h, 15m ou 1m.
// As velas de 4h vêm do datafeed (setTimeframeFeed), aos blocos, e cada vela do gráfico usa a última vela de 4h
// já fechada: a linha liga as velas onde entra cada vela de 4h nova, sem degraus.
export function mount(el: HTMLElement): () => void {
  const SYMBOL = 'GWBTC';
  const datafeed = new PagedDatafeed(); // serve as velas aos blocos de 1000, como um servidor real
  let unsub: (() => void) | null = null;
  const tfs: [string, string][] = [['1m', '1'], ['15m', '15'], ['1h', '60']];
  const host = inCard(el) ? el : withBar(el, choice(tfs, '60', (id) => void load(id)));
  const chart = createChart(host, chartOptions(el));
  chart.setTimeframeFeed({
    getBars: (tf, req) => datafeed.getBars(SYMBOL, tf, req),
    subscribeBars: (tf, onBar) => datafeed.subscribeBars(SYMBOL, tf, onBar),
  });
  chart.addIndicator(createIndicator('sma', { length: 20, color: '#2962ff' })!); // a do gráfico
  chart.addIndicator(createIndicator('sma', { length: 20, timeframe: '4h', color: '#ff9800', width: 2 })!);
  chart.addIndicator(createIndicator('rsi', { length: 14, timeframe: '4h' })!);

  const load = async (id: string): Promise<void> => {
    const tf = timeframeById(id);
    unsub?.();
    unsub = null;
    if (!(await chart.setDataSource((req) => datafeed.getBars(SYMBOL, tf, req), tf.seconds))) return;
    unsub = datafeed.subscribeBars(SYMBOL, tf, (bar) => chart.update(bar));
    chart.showLastBars(id === '60' ? 160 : 240);
  };
  void load('60');
  return () => {
    unsub?.();
    chart.destroy();
  };
}
