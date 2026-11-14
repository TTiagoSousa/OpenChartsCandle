import { createBarChart } from 'openchartscandle/bar';

// Corrida de barras: o top 10 de 30 ativos, ordenado; a cada 2 s os valores sobem e as barras trocam de lugar.
export function mount(el: HTMLElement): () => void {
  const categories = Array.from({ length: 30 }, (_, i) => `Ativo ${i + 1}`);
  const values = categories.map(() => Math.round(Math.random() * 200));
  const chart = createBarChart(el, {
    orientation: 'horizontal',
    categories,
    series: [{ name: 'Valor', data: [...values] }],
    sort: 'desc',
    limit: 10,
    labels: { show: true, position: 'outside' },
    animation: { duration: 1800 },
    legend: { show: false },
  });
  const timer = window.setInterval(() => {
    values.forEach((v, i) => (values[i] = v + Math.round(Math.random() * (Math.random() > 0.9 ? 200 : 40))));
    chart.setData(categories, [{ name: 'Valor', data: [...values] }]);
  }, 2000);
  return () => {
    clearInterval(timer);
    chart.destroy();
  };
}
