import { createChart, createIndicator, type Bar, type ChartType } from 'openchartscandle/candlestick';
import { h } from '../data';

// createChart(): só o gráfico, alimentado com um array de velas teu (aqui gerado ao acaso,
// no teu caso vindo da base de dados). Os botões usam a API do Chart diretamente.
function generateBars(count: number, start: number, tf: number): Bar[] {
  const bars: Bar[] = [];
  let price = 120;
  for (let i = 0; i < count; i++) {
    const open = price;
    const close = Math.max(1, open * (1 + (Math.random() - 0.48) * 0.04));
    const high = Math.max(open, close) * (1 + Math.random() * 0.015);
    const low = Math.min(open, close) * (1 - Math.random() * 0.015);
    bars.push({ time: start + i * tf, open, high, low, close, volume: 1000 + Math.random() * 5000 });
    price = close;
  }
  return bars;
}

export function mount(el: HTMLElement): () => void {
  const host = h('div', { class: 'ex-fill' });
  const bar = h('div', { class: 'ex-toolbar' });
  el.append(bar, host);

  const chart = createChart(host, {
    symbol: { symbol: 'MINHA', name: 'Os meus dados', precision: 2 },
    drawingStorage: null, // desenhos não são guardados
  });

  const DAY = 86400;
  const start = Math.floor(Date.now() / 1000 / DAY) * DAY - 400 * DAY;
  chart.setData(generateBars(400, start, DAY), DAY); // velas diárias

  const sma = createIndicator('sma', { length: 20, color: '#ff9800' })!;
  chart.addIndicator(sma);

  const types: [ChartType, string][] = [['candles', 'Velas'], ['hollow', 'Ocas'], ['bars', 'Barras'], ['heikin', 'Heikin Ashi'], ['line', 'Linha'], ['area', 'Área']];
  for (const [type, label] of types) bar.append(h('button', { class: 'ex-btn', text: label, onclick: () => chart.setChartType(type) }));
  bar.append(
    h('span', { class: 'ex-sep' }),
    h('button', { class: 'ex-btn', text: '＋', title: 'Zoom in', onclick: () => chart.zoomStep(1) }),
    h('button', { class: 'ex-btn', text: '－', title: 'Zoom out', onclick: () => chart.zoomStep(-1) }),
    h('button', { class: 'ex-btn', text: 'Últimas 60', onclick: () => chart.showLastBars(60) }),
    h('button', { class: 'ex-btn', text: 'Repor', onclick: () => chart.resetView() }),
    h('button', { class: 'ex-btn', text: 'Log', onclick: () => chart.setLog(!chart.mainPane.ps.log) }),
    h('button', { class: 'ex-btn', text: 'MA 20', onclick: () => (chart.indicators.includes(sma) ? chart.removeIndicator(sma) : chart.addIndicator(sma)) }),
    h('button', { class: 'ex-btn', text: 'Novos dados', onclick: () => chart.setData(generateBars(400, start, DAY), DAY) }),
    h('button', {
      class: 'ex-btn',
      text: 'PNG',
      onclick: () => {
        const a = document.createElement('a');
        a.href = chart.screenshot();
        a.download = 'grafico.png';
        a.click();
      },
    }),
  );

  return () => chart.destroy();
}
