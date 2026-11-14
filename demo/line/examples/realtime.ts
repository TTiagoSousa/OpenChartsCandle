import { createLineChart, type LinePoint } from 'openchartscandle/line';
import { h } from '../data';

// Tempo real: appendPoint() acrescenta um ponto a cada 250 ms; com maxPoints o gráfico mantém
// só os últimos 240 pontos (janela deslizante de 1 minuto).
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

  let bid = 100;
  const now = Date.now();
  const seed = (offset: number): LinePoint[] =>
    Array.from({ length: 120 }, (_, i) => ({ x: now - (120 - i) * 250, y: +(bid + offset + Math.sin(i / 9) * 0.2).toFixed(3) }));
  const chart = createLineChart(host, {
    series: [
      { name: 'Bid', data: seed(0), color: '#089981', width: 1.5 },
      { name: 'Ask', data: seed(0.05), color: '#f23645', width: 1.5 },
      { name: 'Média', data: seed(0.025), color: '#9598a1', width: 1, dash: [4, 4] },
    ],
    maxPoints: 240,
    animation: false,
    valueFormatter: (v) => v.toFixed(3),
  });

  let count = 0;
  const timer = window.setInterval(() => {
    if (paused) return;
    bid += (Math.random() - 0.5) * 0.08;
    const spread = 0.03 + Math.random() * 0.04;
    const x = Date.now();
    chart.appendPoint('Bid', { x, y: +bid.toFixed(3) });
    chart.appendPoint('Ask', { x, y: +(bid + spread).toFixed(3) });
    chart.appendPoint('Média', { x, y: +(bid + spread / 2).toFixed(3) });
    status.textContent = `${++count} atualizações · spread ${spread.toFixed(3)}`;
  }, 250);

  return () => {
    clearInterval(timer);
    chart.destroy();
  };
}
