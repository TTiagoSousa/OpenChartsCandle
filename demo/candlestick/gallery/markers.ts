import { createChart, type Marker } from 'openchartscandle/candlestick';
import { chartOptions, makeBars, sma } from '../data';

// Marcadores soltos (sinais, notas, execuções): setas, círculos e quadrados com texto.
// Aqui, cruzamentos das médias de 10 e 30 velas.
export function mount(el: HTMLElement): () => void {
  const chart = createChart(el, chartOptions(el));
  const bars = makeBars(300, { seed: 7 });
  chart.setData(bars, 3600);
  const fast = sma(bars, 10);
  const slow = sma(bars, 30);
  const markers: Marker[] = [];
  for (let i = 31; i < bars.length; i++) {
    const a = fast[i - 1] - slow[i - 1];
    const b = fast[i] - slow[i];
    if (a <= 0 && b > 0) markers.push({ time: bars[i].time, price: bars[i].low, shape: 'arrowUp', color: '#089981', text: 'Compra' });
    if (a >= 0 && b < 0) markers.push({ time: bars[i].time, price: bars[i].high, shape: 'arrowDown', color: '#f23645', text: 'Venda' });
  }
  // o máximo do período com um círculo
  const top = bars.reduce((m, x) => (x.high > m.high ? x : m));
  markers.push({ time: top.time, price: top.high, shape: 'circle', color: '#f7a600', text: 'Máximo' });
  chart.setMarkers(markers);
  chart.showLastBars(120);
  return () => chart.destroy();
}
