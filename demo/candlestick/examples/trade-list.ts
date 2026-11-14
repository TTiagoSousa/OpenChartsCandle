import { createTerminal, type Trade } from 'openchartscandle/candlestick';
import { datafeed, externalTrades, h } from '../data';

// Trades vindos de fora (backend, corretora ou backtest), cada um com o seu id.
// - A opção tradeList põe por baixo do gráfico a lista com Ambas / Entradas / Saídas, o interruptor
//   da linha e o campo "Ir para id…" (Enter vai à entrada, Shift+Enter à saída).
// - Clicar numa linha da lista leva à entrada; clicar no preço de entrada ou de saída leva a esse ponto.
// - Clicar num trade no gráfico seleciona-o na lista (evento tradeClick).
export function mount(el: HTMLElement): () => void {
  const log = h('div', { class: 'ex-stats' }, h('div', { class: 'ex-stat' }, h('span', { text: 'Último clique no gráfico' }), h('strong', { text: '—' })));
  const host = h('div', { class: 'ex-fill' });
  el.append(log, host);

  const terminal = createTerminal(host, {
    datafeed,
    symbol: 'SIMBTC',
    timeframe: '5',
    watchlist: false,
    storageKey: null,
    indicators: [
      { type: 'sma', params: { length: 10, color: '#ff9800' } },
      { type: 'sma', params: { length: 30, color: '#2962ff' } },
    ],
    tradeList: { rowClick: 'entry' },
    tradeListHeight: 220,
  });
  const chart = terminal.chart;

  // "o backend" responde com os trades (aqui: cruzamento das médias 10/30 sobre as velas carregadas)
  const fetchTrades = (): Trade[] => externalTrades(chart.bars.slice(-1500), { openLast: true, qty: 0.1, idByTime: true });

  let count = 0;
  const off = chart.dataUpdated.on(() => {
    if (chart.bars.length === count) return;
    count = chart.bars.length; // uma vela fechou: pedir de novo
    chart.setTrades(fetchTrades());
  });
  const offClick = chart.tradeClick.on(({ trade, point }) => {
    log.querySelector('strong')!.textContent = `#${trade.id} · ${point === 'entry' ? 'entrada' : 'saída'} · ${trade.side}`;
  });
  void terminal.ready.then(() => chart.showLastBars(160));

  return () => {
    off();
    offClick();
    terminal.destroy();
  };
}
