import { createTerminal, type Marker } from 'openchartscandle/candlestick';
import { datafeed } from '../data';

// Marcadores: sinais de RSI. Sai da sobrevenda (cruza 30 para cima): seta verde.
// Sai da sobrecompra (cruza 70 para baixo): seta vermelha.
function rsi(closes: number[], len = 14): number[] {
  const out = new Array<number>(closes.length).fill(NaN);
  let ag = 0;
  let al = 0;
  for (let i = 1; i < closes.length; i++) {
    const d = closes[i] - closes[i - 1];
    if (i <= len) {
      ag += Math.max(d, 0) / len;
      al += Math.max(-d, 0) / len;
      if (i < len) continue;
    } else {
      ag = (ag * (len - 1) + Math.max(d, 0)) / len;
      al = (al * (len - 1) + Math.max(-d, 0)) / len;
    }
    out[i] = al === 0 ? 100 : 100 - 100 / (1 + ag / al);
  }
  return out;
}

export function mount(el: HTMLElement): () => void {
  const terminal = createTerminal(el, {
    datafeed,
    symbol: 'SIMSOL',
    timeframe: '15',
    minimal: true,
    legend: true,
    storageKey: null,
    indicators: [{ type: 'rsi' }],
  });

  let count = 0;
  const off = terminal.chart.dataUpdated.on(() => {
    const bars = terminal.chart.bars;
    if (bars.length === count) return; // só quando fecha uma vela
    count = bars.length;
    const r = rsi(bars.map((b) => b.close));
    const markers: Marker[] = [];
    for (let i = Math.max(1, bars.length - 600); i < bars.length - 1; i++) {
      if (r[i - 1] < 30 && r[i] >= 30) markers.push({ time: bars[i].time, price: bars[i].low, shape: 'arrowUp', color: '#089981', text: 'Compra' });
      if (r[i - 1] > 70 && r[i] <= 70) markers.push({ time: bars[i].time, price: bars[i].high, shape: 'arrowDown', color: '#f23645', text: 'Venda' });
    }
    terminal.chart.setMarkers(markers);
  });

  return () => {
    off();
    terminal.destroy();
  };
}
