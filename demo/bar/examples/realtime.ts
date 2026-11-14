import { createBarChart } from 'openchartscandle/bar';
import { h } from '../data';

// Tempo real: profundidade do livro de ordens. setData() a cada 600 ms faz uma transição
// suave entre os valores antigos e os novos (bids em verde, asks em vermelho).
export function mount(el: HTMLElement): () => void {
  const status = h('span', { class: 'ex-label' });
  let paused = false;
  const pause: HTMLButtonElement = h('button', { class: 'ex-btn', text: 'Pausar' });
  pause.addEventListener('click', () => {
    paused = !paused;
    pause.textContent = paused ? 'Retomar' : 'Pausar';
  });
  const host = h('div', { class: 'ex-fill' });
  el.append(h('div', { class: 'ex-toolbar' }, pause, status), host);

  const LEVELS = 10;
  const mid = 64250;
  const depth = (): { categories: string[]; bids: (number | null)[]; asks: (number | null)[] } => {
    const categories: string[] = [];
    const bids: (number | null)[] = [];
    const asks: (number | null)[] = [];
    for (let i = LEVELS; i >= 1; i--) {
      categories.push((mid - i * 5).toFixed(0));
      bids.push(+(Math.random() * 3 + (LEVELS - i) * 0.4 + 0.5).toFixed(2));
      asks.push(null);
    }
    for (let i = 1; i <= LEVELS; i++) {
      categories.push((mid + i * 5).toFixed(0));
      bids.push(null);
      asks.push(+(Math.random() * 3 + (LEVELS - i) * 0.4 + 0.5).toFixed(2));
    }
    return { categories, bids, asks };
  };
  const d = depth();
  const chart = createBarChart(host, {
    categories: d.categories,
    series: [
      { name: 'Bids', data: d.bids, color: '#089981' },
      { name: 'Asks', data: d.asks, color: '#f23645' },
    ],
    stacked: true,
    categoryGap: 0.15,
    radius: 2,
    tooltip: { mode: 'single' },
    valueAxis: { title: 'BTC' },
    categoryAxis: { title: 'Preço (USDT)' },
    animation: { duration: 450 },
    valueFormatter: (v) => `${v.toFixed(2)} BTC`,
  });

  let count = 0;
  const timer = window.setInterval(() => {
    if (paused) return;
    // keep the same price levels so bars morph instead of jumping
    const next = depth();
    chart.setData(d.categories, [
      { name: 'Bids', data: next.bids, color: '#089981' },
      { name: 'Asks', data: next.asks, color: '#f23645' },
    ]);
    status.textContent = `${++count} atualizações`;
  }, 600);

  return () => {
    clearInterval(timer);
    chart.destroy();
  };
}
