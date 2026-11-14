import { createTerminal, type Bar, type TimeRange, type TimeZoneId, type Trade } from 'openchartscandle/candlestick';
import { datafeed, h, smaCrossTrades } from '../data';

// Um backtest como chegaria de fora, com o que o rodeia marcado no tempo:
// - indicadores internos MA 9, MA 21 (por cima das velas) e RSI 14 (painel próprio);
// - setTimeRanges: o aquecimento dos indicadores, a linha do início da simulação e dois períodos excluídos;
// - fuso horário do eixo: os botões em cima ou o relógio na barra de baixo (opção timezone / setTimezone).
export function mount(el: HTMLElement): () => void {
  const zones: [string, TimeZoneId][] = [
    ['Browser', 'local'],
    ['UTC', 'UTC'],
    ['Lisboa', 'Europe/Lisbon'],
    ['Nova Iorque', 'America/New_York'],
    ['Tóquio', 'Asia/Tokyo'],
  ];
  const tzBtns = zones.map(([label, id]) => h('button', { class: 'ex-btn', text: label, onclick: () => terminal.setTimezone(id) }));
  const zonesBtn = h('button', { class: 'ex-btn is-on', text: 'Zonas', onclick: () => toggleZones() });
  const info = h('span', { class: 'ex-label' });
  const bar = h('div', { class: 'ex-toolbar' }, h('span', { class: 'ex-label', text: 'Fuso:' }), ...tzBtns, h('div', { class: 'ex-sep' }), zonesBtn, info);
  const host = h('div', { class: 'ex-fill' });
  el.append(bar, host);

  const terminal = createTerminal(host, {
    datafeed,
    symbol: 'SIMBTC',
    timeframe: '5',
    watchlist: false,
    timeframeSelector: false, // o backtest corre em 5 minutos
    rangeButtons: false,
    storageKey: null,
    timezone: 'UTC',
    indicators: [
      { type: 'sma', params: { length: 9, color: '#ff9800' } },
      { type: 'sma', params: { length: 21, color: '#2962ff' } },
      { type: 'rsi', params: { length: 14 } },
    ],
  });
  const chart = terminal.chart;

  const SIM = 260; // velas simuladas
  const WARMUP = 21; // velas que a MA 21 precisa antes da primeira decisão
  let showZones = true;
  let ranges: TimeRange[] = [];
  let count = 0;

  const build = (bars: Bar[]): void => {
    const n = bars.length;
    if (n < SIM + WARMUP + 10) return;
    const start = bars[n - SIM].time;
    const ex1: [number, number] = [bars[n - 190].time, bars[n - 172].time];
    const ex2: [number, number] = [bars[n - 95].time, bars[n - 84].time];
    ranges = [
      { id: 'warmup', from: bars[n - SIM - WARMUP].time, to: start, color: '#787b86', label: `Aquecimento (${WARMUP} velas)` },
      { id: 'start', from: start, color: '#2962ff', label: 'Início da simulação', lineStyle: 'solid', lineWidth: 2 },
      { id: 'ex1', from: ex1[0], to: ex1[1], color: '#f23645', label: 'Excluído: notícia', opacity: 0.1, border: true, lineStyle: 'dotted' },
      { id: 'ex2', from: ex2[0], to: ex2[1], color: '#f23645', label: 'Excluído: sem liquidez', opacity: 0.1, border: true, lineStyle: 'dotted' },
    ];
    const inside = (t: number, [a, b]: [number, number]): boolean => t >= a && t < b;
    // os trades da simulação, sem os que abrem num período excluído
    const trades: Trade[] = smaCrossTrades(bars, 9, 21, SIM, 0.1).filter((t) => t.entryTime >= start && !inside(t.entryTime, ex1) && !inside(t.entryTime, ex2));
    chart.setTrades(trades);
    chart.setTimeRanges(showZones ? ranges : []);
  };

  const toggleZones = (): void => {
    showZones = !showZones;
    zonesBtn.classList.toggle('is-on', showZones);
    chart.setTimeRanges(showZones ? ranges : []);
  };

  const syncTz = (): void => {
    tzBtns.forEach((b, i) => b.classList.toggle('is-on', zones[i][1] === terminal.timezone));
    info.textContent = `Eixo em ${chart.timeZone.id === 'local' ? 'hora do browser' : chart.timeZone.id} (${chart.timeZone.label()})`;
  };

  const offs = [
    chart.dataUpdated.on(() => {
      if (chart.bars.length === count) return;
      count = chart.bars.length; // uma vela fechou: refazer a simulação
      build(chart.bars);
    }),
    terminal.timezoneChanged.on(syncTz),
  ];
  syncTz();
  void terminal.ready.then(() => chart.showLastBars(SIM + WARMUP + 20));

  return () => {
    offs.forEach((off) => off());
    terminal.destroy();
  };
}
