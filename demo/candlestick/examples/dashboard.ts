import { createTerminal, lightTheme, tradeStats, type Terminal, type TerminalOptions } from 'openchartscandle/candlestick';
import { datafeed, smaCrossTrades } from '../data';

// Dashboard: a biblioteca em tamanho pequeno, dentro de cards, com aparências diferentes
// e uma estratégia simulada a desenhar entradas e saídas.

let grid: HTMLElement;
let terminals: Terminal[] = [];

interface CardSpec {
  title: string;
  subtitle: string;
  wide?: boolean;
  height: number;
  light?: boolean;
  options: Omit<TerminalOptions, 'datafeed'>;
  /** extra content under the title (stats…) */
  stats?: boolean;
  onReady?: (t: Terminal, card: HTMLElement) => void;
}

function el<K extends keyof HTMLElementTagNameMap>(tag: K, cls = '', text = ''): HTMLElementTagNameMap[K] {
  const e = document.createElement(tag);
  if (cls) e.className = cls;
  if (text) e.textContent = text;
  return e;
}

function addCard(spec: CardSpec): void {
  const card = el('section', `card${spec.wide ? ' card--wide' : ''}${spec.light ? ' card--light' : ''}`);
  const head = el('header', 'card__head');
  const titles = el('div', 'card__titles');
  titles.append(el('h2', 'card__title', spec.title), el('p', 'card__subtitle', spec.subtitle));
  const price = el('div', 'card__price');
  head.append(titles, price);
  const body = el('div', 'card__body');
  body.style.height = `${spec.height}px`;
  card.append(head);
  if (spec.stats) card.append(el('div', 'card__stats'));
  card.append(body);
  grid.append(card);

  // mouseWheel: false → the page scrolls normally over the cards (zoom with drag on the time axis / buttons)
  // mouseWheel: false → a página faz scroll normalmente por cima dos cards
  const t = createTerminal(body, { datafeed, storageKey: null, keyboard: false, mouseWheel: false, ...spec.options });
  terminals.push(t);
  void t.ready.then(() => {
    const update = (): void => {
      const bars = t.chart.bars;
      const last = bars[bars.length - 1];
      if (!last) return;
      let i = bars.length - 1;
      while (i > 0 && bars[i].time > last.time - 86400) i--;
      const ch = ((last.close - bars[i].close) / bars[i].close) * 100;
      price.innerHTML = '';
      price.append(
        el('span', 'card__last', t.chart.fmt(last.close)),
        el('span', `card__chg ${ch >= 0 ? 'is-up' : 'is-down'}`, `${ch >= 0 ? '+' : '−'}${Math.abs(ch).toFixed(2)}%`),
      );
    };
    t.chart.dataUpdated.on(update);
    update();
    spec.onReady?.(t, card);
  });
}

export function mount(root: HTMLElement): () => void {
  grid = el('main', 'cards');
  root.append(el('div', 'ex-scroll'));
  root.firstElementChild!.append(grid);
  terminals = [];

  // 1) Strategy simulation: entries and exits drawn on the chart, stats in the card header
  addCard({
    title: 'Estratégia simulada · SIMBTC',
    subtitle: 'Cruzamento de médias 9/21 em 5m · entradas e saídas em tempo real',
    wide: true,
    height: 360,
    stats: true,
    options: {
      symbol: 'SIMBTC',
      timeframe: '5',
      minimal: true,
      timeframeSelector: false, // intervalo fixo neste exemplo
      legend: true,
      compact: true,
      indicators: [
        { type: 'sma', params: { length: 9, color: '#ff9800' } },
        { type: 'sma', params: { length: 21, color: '#2962ff' } },
      ],
    },
    onReady: (t, card) => {
      const stats = card.querySelector('.card__stats') as HTMLElement;
      let barCount = 0;
      const qty = 0.1;
      const refresh = (): void => {
        const bars = t.chart.bars;
        if (bars.length !== barCount) {
          // a bar closed: re-run the strategy (new signals may have appeared)
          barCount = bars.length;
          t.chart.setTrades(smaCrossTrades(bars, 9, 21, 220, qty));
        }
        const last = bars[bars.length - 1].close;
        const s = tradeStats(t.chart.trades, last);
        const open = t.chart.trades.find((x) => x.exitPrice === undefined);
        const item = (label: string, value: string, cls = ''): HTMLElement => {
          const d = el('div', 'stat');
          d.append(el('span', 'stat__label', label), el('span', `stat__value ${cls}`, value));
          return d;
        };
        stats.innerHTML = '';
        stats.append(
          item('Trades', String(s.total)),
          item('Taxa de acerto', `${s.winRate.toFixed(0)}%`),
          item('Ganhos / Perdas', `${s.wins} / ${s.losses}`),
          item('P&L total', `${s.pnl >= 0 ? '+' : '−'}${Math.abs(s.pnl).toFixed(2)} USD`, s.pnl >= 0 ? 'is-up' : 'is-down'),
          item('Posição', open ? `${open.side === 'long' ? 'Long' : 'Short'} @ ${t.chart.fmt(open.entryPrice)}` : '—', open ? (open.side === 'long' ? 'is-long' : 'is-short') : ''),
        );
      };
      t.chart.dataUpdated.on(refresh);
      refresh();
      t.chart.showLastBars(160);
    },
  });

  // 2) Light theme, rounded, only the chart + legend
  addCard({
    title: 'SIMETH · tema claro',
    subtitle: 'theme: lightTheme · minimal · legend',
    height: 280,
    light: true,
    options: {
      symbol: 'SIMETH',
      timeframe: '15',
      minimal: true,
      timeframeSelector: false, // intervalo fixo neste exemplo
      legend: true,
      compact: true,
      theme: { ...lightTheme, up: '#26a69a', down: '#ef5350' },
      indicators: [{ type: 'sma', params: { length: 30, color: '#7e57c2' } }],
    },
  });

  // 3) Custom candle colors, borders, no grid, no time axis
  addCard({
    title: 'SIMSOL · cores personalizadas',
    subtitle: 'velas com contorno · sem grelha · sem eixo de tempo',
    height: 280,
    options: {
      symbol: 'SIMSOL',
      timeframe: '5',
      minimal: true,
      timeframeSelector: false, // intervalo fixo neste exemplo
      timeAxis: false,
      indicators: [],
      theme: {
        bg: '#0b1020',
        grid: 'transparent',
        up: '#0b1020',
        down: '#ff4d8d',
        borderUp: '#00e0c6',
        wickUp: '#00e0c6',
        borderDown: '#ff4d8d',
        wickDown: '#ff4d8d',
        candleBorder: true,
        accent: '#00e0c6',
      },
    },
  });

  // 4) The full terminal, compact, inside a card
  addCard({
    title: 'XAUSIM · terminal compacto',
    subtitle: 'compact · barra de topo + ferramentas de desenho',
    wide: true,
    height: 400,
    options: {
      symbol: 'XAUSIM',
      timeframe: '60',
      compact: true,
      watchlist: false,
      bottomBar: false,
      screenshot: false,
      fullscreen: false,
      timeframeSelector: ['5', '15', '60', '240', '1D'],
      chartTypes: ['candles', 'heikin', 'line', 'area'],
      border: '1px solid #2a2e39',
      radius: 6,
    },
  });

  // 5) Sparkline-style area chart, no axes at all
  addCard({
    title: 'EURSIM · área',
    subtitle: 'chartType area · sem eixos · sem crosshair',
    height: 160,
    options: {
      symbol: 'EURSIM',
      timeframe: '30',
      minimal: true,
      timeframeSelector: false, // intervalo fixo neste exemplo
      chartType: 'area',
      priceAxis: false,
      timeAxis: false,
      crosshair: false,
      lastPriceLine: false,
      indicators: [],
      theme: { line: '#f7a600', grid: 'transparent' },
    },
  });

  // 6) Bars chart, custom palette
  addCard({
    title: 'SIMNDX · barras OHLC',
    subtitle: 'chartType bars · paleta azul/laranja',
    height: 160,
    options: {
      symbol: 'SIMNDX',
      timeframe: '60',
      minimal: true,
      timeframeSelector: false, // intervalo fixo neste exemplo
      chartType: 'bars',
      indicators: [],
      theme: { up: '#4c8dff', down: '#ff9f43', grid: 'rgba(255,255,255,0.04)' },
    },
  });

  return () => terminals.forEach((t) => t.destroy());
}
