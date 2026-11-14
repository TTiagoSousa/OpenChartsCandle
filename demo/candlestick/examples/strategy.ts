import { createTerminal, tradeStats } from 'openchartscandle/candlestick';
import { datafeed, h, smaCrossTrades } from '../data';

// Estratégia simulada (cruzamento de médias 9/21): a cada vela fechada recalcula os sinais
// e desenha as entradas e saídas com setTrades(). As estatísticas vêm de tradeStats().
// Os indicadores da simulação chegam com simulationIndicators (ver docs/candlestick/entradas-saidas.md).
export function mount(el: HTMLElement): () => void {
  const stats = h('div', { class: 'ex-stats' });
  const host = h('div', { class: 'ex-fill' });
  el.append(stats, host);

  const terminal = createTerminal(host, {
    datafeed,
    symbol: 'SIMBTC',
    timeframe: '5',
    minimal: true,
    topbar: true, // para o botão "Indicadores"
    symbolSearch: false,
    timeframeSelector: false, // intervalo fixo neste exemplo
    chartTypes: false,
    legend: true,
    storageKey: null,
    indicators: [],
    // os indicadores que a simulação usou, com as definições dela: em "Indicadores" › "Da simulação"
    // cada um tem uma caixa para o mostrar ou esconder
    simulationIndicators: [
      { id: 'ma-rapida', type: 'sma', label: 'Média rápida (entrada)', params: { length: 9, color: '#ff9800', width: 2 } },
      { id: 'ma-lenta', type: 'sma', label: 'Média lenta (saída)', params: { length: 21, color: '#2962ff', width: 2 } },
      { id: 'rsi-filtro', type: 'rsi', label: 'RSI de filtro', params: { length: 14, upper: 65, lower: 35, maType: 'sma', maLength: 9 }, visible: false },
    ],
  });

  let barCount = 0;
  const refresh = (): void => {
    const chart = terminal.chart;
    const bars = chart.bars;
    if (!bars.length) return;
    if (bars.length !== barCount) {
      barCount = bars.length; // uma vela fechou: recalcular a estratégia
      chart.setTrades(smaCrossTrades(bars, 9, 21, 300, 0.1));
    }
    const s = tradeStats(chart.trades, bars[bars.length - 1].close);
    const open = chart.trades.find((t) => t.exitPrice === undefined);
    const item = (label: string, value: string, cls = ''): HTMLElement =>
      h('div', { class: 'ex-stat' }, h('span', { text: label }), h('strong', { class: cls, text: value }));
    stats.replaceChildren(
      item('Trades', String(s.total)),
      item('Taxa de acerto', `${s.winRate.toFixed(0)}%`),
      item('Ganhos / Perdas', `${s.wins} / ${s.losses}`),
      item('P&L total', `${s.pnl >= 0 ? '+' : '−'}${Math.abs(s.pnl).toFixed(2)} USD`, s.pnl >= 0 ? 'up' : 'down'),
      item('Posição atual', open ? `${open.side.toUpperCase()} @ ${chart.fmt(open.entryPrice)}` : '—'),
    );
  };

  const off = terminal.chart.dataUpdated.on(refresh);
  void terminal.ready.then(() => terminal.chart.showLastBars(220));

  return () => {
    off();
    terminal.destroy();
  };
}
