import { createTerminal, type Trade } from 'openchartscandle/candlestick';
import { PagedDatafeed, h } from '../data';

// Histórico aos blocos, como no TradingView, com um datafeed que serve 5 anos de velas de 1m em blocos de 1000:
//   getBars(symbol, tf, { to, countBack, signal }) → { bars, noMore }
// - Arrasta para a esquerda: o bloco anterior é pedido e junta-se sem a vista saltar; com noMore deixa de pedir.
// - Troca o tempo gráfico: o instante do centro mantém-se (1m → 1h → 1D → 1m).
// - "Trade de há 3 anos" e "Ir para a data" carregam o que falta antes de lá chegar.
// - "Desligar" para as velas ao vivo; "Ligar" chama onResync e o gráfico preenche o buraco.
// - Um datafeed antigo, cujo getBars(symbol, tf) devolve tudo, continua a funcionar (os outros exemplos).
export function mount(el: HTMLElement): () => void {
  const feed = new PagedDatafeed();
  const stat = (label: string): HTMLElement => {
    const v = h('strong', { text: '—' });
    stats.append(h('div', { class: 'ex-stat' }, h('span', { text: label }), v));
    return v;
  };
  const stats = h('div', { class: 'ex-stats' });
  const sLoaded = stat('Velas carregadas');
  const sRequests = stat('Pedidos getBars');
  const sLast = stat('Último pedido');
  const sState = stat('Estado');
  const sError = stat('Último erro');

  const date = h('input', { class: 'ex-input' });
  date.type = 'date';
  date.value = '2022-03-15';
  const tf = h('span', { class: 'ex-label' });
  const connBtn = h('button', { class: 'ex-btn', text: 'Desligar ligação' });
  const bar = h(
    'div',
    { class: 'ex-toolbar' },
    date,
    h('button', { class: 'ex-btn', text: 'Ir para a data', onclick: () => void chart.goToTime(Date.parse(date.value) / 1000) }),
    h('div', { class: 'ex-sep' }),
    h('button', { class: 'ex-btn', text: 'Trade de há 3 anos', onclick: () => void goToOldTrade() }),
    h('button', { class: 'ex-btn', text: 'Mais recente', onclick: () => chart.scrollToRealtime() }),
    h('div', { class: 'ex-sep' }),
    connBtn,
    h('button', { class: 'ex-btn', text: 'Falhar o próximo pedido', onclick: () => (feed.failNext = true) }),
    tf,
  );
  const host = h('div', { class: 'ex-fill' });
  el.append(bar, stats, host);

  const terminal = createTerminal(host, {
    datafeed: feed,
    symbol: 'GWBTC',
    timeframe: '1',
    watchlist: false,
    storageKey: null,
    indicators: [],
    countBack: 1000,
  });
  const chart = terminal.chart;

  // trades vindos de fora, um deles de há 3 anos (o gráfico só tem o último bloco carregado)
  const now = Math.floor(Date.now() / 1000);
  const trade = (id: string, daysAgo: number, hours: number, side: 'long' | 'short'): Trade => {
    const entryTime = Math.floor((now - daysAgo * 86400) / 60) * 60 + 37 * 60; // às hh:37, cai na vela que o contém
    const exitTime = entryTime + hours * 3600;
    return { id, side, entryTime, entryPrice: feed.priceAt('GWBTC', entryTime), exitTime, exitPrice: feed.priceAt('GWBTC', exitTime) };
  };
  const trades = [trade('T-3Y', 3 * 365, 3, 'long'), trade('T-1Y', 365, 12, 'short'), trade('T-1M', 30, 6, 'long')];
  const syncTrades = (): void => chart.setTrades(chart.symbol.symbol === 'GWBTC' ? trades : []);
  const goToOldTrade = async (): Promise<void> => {
    if (chart.symbol.symbol !== 'GWBTC') await terminal.setSymbol('GWBTC');
    await chart.goToTrade('T-3Y', 'both');
  };

  connBtn.addEventListener('click', () => {
    if (feed.isConnected) feed.disconnect();
    else feed.reconnect();
    connBtn.textContent = feed.isConnected ? 'Desligar ligação' : 'Ligar (resync)';
    sState.textContent = feed.isConnected ? 'ligado' : 'desligado: sem velas ao vivo';
  });

  const render = (): void => {
    const b = chart.bars;
    const fmt = (t: number): string => new Date(t * 1000).toISOString().slice(0, 16).replace('T', ' ');
    sLoaded.textContent = b.length ? `${b.length.toLocaleString('pt-PT')} · ${fmt(b[0].time)} → ${fmt(b[b.length - 1].time)}` : '—';
    sLoaded.title = sLoaded.textContent;
    sRequests.textContent = `${feed.stats.requests} (${feed.stats.aborted} cancelados)`;
    sLast.textContent = feed.stats.last || '—';
    sLast.title = sLast.textContent;
    tf.textContent = `Intervalo: ${terminal.timeframe.label}`;
  };
  feed.onStats = render;
  const offs = [
    chart.dataUpdated.on(render),
    chart.historyLoaded.on(render),
    terminal.timeframeChanged.on(render),
    terminal.symbolChanged.on(syncTrades),
    terminal.loadingChanged.on((loading) => {
      sState.textContent = loading ? 'a carregar…' : feed.isConnected ? 'ligado' : 'desligado: sem velas ao vivo';
    }),
    terminal.error.on((err) => {
      sError.textContent = err instanceof Error ? err.message : String(err);
      sError.title = sError.textContent;
    }),
  ];
  void terminal.ready.then(() => {
    syncTrades();
    render();
  });

  return () => {
    offs.forEach((off) => off());
    feed.onStats = null;
    terminal.destroy();
  };
}
