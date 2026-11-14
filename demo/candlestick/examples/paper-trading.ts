import { createTerminal, tradePnl, tradeStats, type Trade } from 'openchartscandle/candlestick';
import { datafeed, h } from '../data';

// Paper trading: compra e vende ao preço atual com botões. Cada operação é um Trade
// desenhado no gráfico; ao fechar, updateTrade() acrescenta a saída e o P&L fica fixo.
export function mount(el: HTMLElement): () => void {
  const qtyInput = h('input', { class: 'ex-input', style: 'width: 70px' });
  qtyInput.type = 'number';
  qtyInput.value = '0.5';
  qtyInput.step = '0.1';
  const info = h('div', { class: 'ex-stats ex-stats--inline' });
  const bar = h(
    'div',
    { class: 'ex-toolbar' },
    h('span', { class: 'ex-label', text: 'Qtd' }),
    qtyInput,
    h('button', { class: 'ex-btn ex-btn--buy', text: 'Comprar', onclick: () => open('long') }),
    h('button', { class: 'ex-btn ex-btn--sell', text: 'Vender', onclick: () => open('short') }),
    h('button', { class: 'ex-btn', text: 'Fechar posição', onclick: () => close() }),
    h('button', { class: 'ex-btn', text: 'Limpar histórico', onclick: () => { terminal.chart.setTrades([]); update(); } }),
    info,
  );
  const host = h('div', { class: 'ex-fill' });
  el.append(bar, host);

  const terminal = createTerminal(host, {
    datafeed,
    symbol: 'SIMETH',
    timeframe: '1',
    watchlist: false,
    bottomBar: false,
    compact: true,
    storageKey: null,
  });

  const last = () => terminal.chart.bars[terminal.chart.bars.length - 1];
  const current = (): Trade | undefined => terminal.chart.trades.find((t) => t.exitPrice === undefined);

  function close(): void {
    const t = current();
    if (t?.id) terminal.chart.updateTrade(t.id, { exitTime: last().time, exitPrice: last().close });
    update();
  }

  function open(side: Trade['side']): void {
    const t = current();
    if (t?.side === side) return; // já estás nessa direção
    close(); // inverter: fecha a posição contrária primeiro
    const b = last();
    terminal.chart.addTrade({ id: `p${Date.now()}`, side, entryTime: b.time, entryPrice: b.close, qty: Number(qtyInput.value) || 1 });
    update();
  }

  function update(): void {
    const b = last();
    if (!b) return;
    const s = tradeStats(terminal.chart.trades, b.close);
    const t = current();
    const openPnl = t ? tradePnl(t, b.close).abs : 0;
    const realized = s.pnl - openPnl;
    const money = (v: number): string => `${v >= 0 ? '+' : '−'}${Math.abs(v).toFixed(2)}`;
    info.replaceChildren(
      h('span', { text: t ? `${t.side === 'long' ? 'Comprado' : 'Vendido'} ${t.qty} @ ${terminal.chart.fmt(t.entryPrice)}` : 'Sem posição' }),
      h('span', { class: openPnl >= 0 ? 'up' : 'down', text: t ? `Aberto ${money(openPnl)}` : '' }),
      h('span', { class: realized >= 0 ? 'up' : 'down', text: `Realizado ${money(realized)}` }),
    );
  }

  const off = terminal.chart.dataUpdated.on(update);
  return () => {
    off();
    terminal.destroy();
  };
}
