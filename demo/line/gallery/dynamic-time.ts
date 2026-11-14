import { createLineChart, type LinePoint } from 'openchartscandle/line';

// Dados dinâmicos com eixo de tempo: um ponto novo a cada segundo (appendPoint),
// os mais antigos saem pela esquerda (maxPoints).
export function mount(el: HTMLElement): () => void {
  const DAY = 86400;
  let v = Math.random() * 1000;
  let x = Date.UTC(2000, 0, 1) / 1000;
  const next = (): LinePoint => {
    x += DAY;
    v = v + Math.random() * 21 - 10;
    return { x, y: Math.round(v) };
  };
  const data = Array.from({ length: 1000 }, next);
  const chart = createLineChart(el, {
    series: [{ name: 'Valor', data, color: '#5470c6', width: 1.5 }],
    maxPoints: 1000,
    legend: { show: false },
    animation: false,
  });
  const timer = window.setInterval(() => {
    for (let i = 0; i < 5; i++) chart.appendPoint('Valor', next());
  }, 1000);
  return () => {
    clearInterval(timer);
    chart.destroy();
  };
}
