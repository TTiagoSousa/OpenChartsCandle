import { createChart, type Bar } from 'openchartscandle/candlestick';
import { h } from '../data';

// Tempo real com chart.update(): um "WebSocket" falso envia um preço a cada 150 ms.
// Velas de 5 segundos: a mesma hora atualiza a vela atual, uma hora nova abre outra.
export function mount(el: HTMLElement): () => void {
  const status = h('span', { class: 'ex-label' });
  let paused = false;
  const pauseBtn = h('button', { class: 'ex-btn', text: 'Pausar', onclick: () => { paused = !paused; pauseBtn.textContent = paused ? 'Retomar' : 'Pausar'; } });
  const bar = h('div', { class: 'ex-toolbar' }, pauseBtn, status);
  const host = h('div', { class: 'ex-fill' });
  el.append(bar, host);

  const TF = 5; // segundos por vela
  const chart = createChart(host, { symbol: { symbol: 'TICK', name: 'Ticks ao vivo', precision: 2 }, drawingStorage: null });

  // histórico inicial
  const now = Math.floor(Date.now() / 1000 / TF) * TF;
  const history: Bar[] = [];
  let price = 100;
  for (let t = now - 150 * TF; t < now; t += TF) {
    const o = price;
    price *= 1 + (Math.random() - 0.5) * 0.004;
    history.push({ time: t, open: o, high: Math.max(o, price) * 1.0008, low: Math.min(o, price) * 0.9992, close: price, volume: 10 });
  }
  chart.setData(history, TF);

  // "mensagens do servidor"
  let current: Bar = { time: now, open: price, high: price, low: price, close: price, volume: 0 };
  let messages = 0;
  const timer = window.setInterval(() => {
    if (paused) return;
    price *= 1 + (Math.random() - 0.5) * 0.0015;
    const t = Math.floor(Date.now() / 1000 / TF) * TF;
    if (t > current.time) current = { time: t, open: current.close, high: current.close, low: current.close, close: current.close, volume: 0 };
    current = { ...current, high: Math.max(current.high, price), low: Math.min(current.low, price), close: price, volume: current.volume + 1 };
    chart.update(current); // ← é só isto
    messages++;
    status.textContent = `${messages} mensagens · último ${price.toFixed(2)}`;
  }, 150);

  return () => {
    clearInterval(timer);
    chart.destroy();
  };
}
