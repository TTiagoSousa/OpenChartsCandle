import { createBarChart } from 'openchartscandle/bar';

// Dados dinâmicos: a cada 2 s sai a primeira categoria e entra uma nova, com barras e uma linha de preço.
const time = (d: Date): string => d.toLocaleTimeString('pt-PT');

export function mount(el: HTMLElement): () => void {
  let t = Date.now() - 10 * 2000;
  const categories: string[] = [];
  const orders: number[] = [];
  const price: number[] = [];
  let p = 100;
  for (let i = 0; i < 10; i++) {
    categories.push(time(new Date((t += 2000))));
    orders.push(Math.round(20 + Math.random() * 80));
    price.push(+(p += (Math.random() - 0.5) * 2).toFixed(2));
  }
  const options = () => ({
    categories: [...categories],
    series: [{ name: 'Ordens', data: [...orders] }],
    overlays: [{ type: 'line' as const, name: 'Preço', data: [...price], axis: 'right' as const, points: true }],
  });
  const chart = createBarChart(el, { ...options(), legend: { position: 'top', align: 'center' } });
  const timer = window.setInterval(() => {
    categories.shift();
    orders.shift();
    price.shift();
    categories.push(time(new Date((t += 2000))));
    orders.push(Math.round(20 + Math.random() * 80));
    price.push(+(p += (Math.random() - 0.5) * 2).toFixed(2));
    chart.setOptions(options());
  }, 2000);
  return () => {
    clearInterval(timer);
    chart.destroy();
  };
}
