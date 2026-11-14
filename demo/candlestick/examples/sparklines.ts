import { createTerminal, type Terminal } from 'openchartscandle/candlestick';
import { SIM_SYMBOLS, datafeed, h } from '../data';

// Mini gráficos numa tabela (estilo watchlist): área sem eixos, sem crosshair, sem zoom.
export function mount(el: HTMLElement): () => void {
  const table = h('div', { class: 'ex-spark-table' });
  el.append(h('div', { class: 'ex-scroll' }, table));
  const terminals: Terminal[] = [];

  for (const s of SIM_SYMBOLS) {
    const price = h('strong', { text: '—' });
    const change = h('span', { text: '' });
    const spark = h('div', { class: 'ex-spark' });
    table.append(
      h('div', { class: 'ex-spark-row' },
        h('div', {}, h('div', { class: 'ex-spark-sym', text: s.symbol }), h('div', { class: 'ex-muted', text: s.name ?? '' })),
        spark,
        h('div', { class: 'ex-spark-price' }, price, change),
      ),
    );

    const t = createTerminal(spark, {
      datafeed,
      symbol: s.symbol,
      timeframe: '15',
      minimal: true,
      chartType: 'area',
      priceAxis: false,
      timeAxis: false,
      crosshair: false,
      lastPriceLine: false,
      mouseWheel: false,
      indicators: [],
      storageKey: null,
      theme: { grid: 'transparent', bg: '#161a25', appBg: '#161a25' },
    });
    terminals.push(t);

    t.chart.dataUpdated.on(() => {
      const bars = t.chart.bars;
      if (!bars.length) return;
      const last = bars[bars.length - 1];
      const first = bars[Math.max(0, bars.length - 96)]; // ~24h em velas de 15m
      const pct = ((last.close - first.close) / first.close) * 100;
      const up = pct >= 0;
      price.textContent = t.chart.fmt(last.close);
      change.textContent = `${up ? '+' : '−'}${Math.abs(pct).toFixed(2)}%`;
      change.className = up ? 'up' : 'down';
      const line = up ? '#089981' : '#f23645';
      if (t.chart.theme.line !== line) t.chart.applyTheme({ line }); // verde/vermelho conforme a variação
    });
    void t.ready.then(() => t.chart.showLastBars(96));
  }

  return () => terminals.forEach((t) => t.destroy());
}
