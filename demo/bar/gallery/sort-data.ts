import { createBarChart } from 'openchartscandle/bar';

// Barras ordenadas pelo valor: a cada 2 s os valores mudam e as barras deslizam
// para o novo lugar (sort). O botão troca entre crescente e decrescente.
const PRODUCTS = ['Chá', 'Café', 'Leite', 'Sumo', 'Água', 'Cacau', 'Iogurte', 'Refrigerante'];
const random = (): number[] => PRODUCTS.map(() => Math.round(20 + Math.random() * 180));

export function mount(el: HTMLElement): () => void {
  el.style.position = 'relative';
  let sort: 'asc' | 'desc' = 'desc';
  const btn = document.createElement('button');
  btn.className = 'ex-btn';
  btn.textContent = 'Crescente';
  btn.style.cssText = 'position:absolute;right:16px;top:8px;z-index:2';
  const chart = createBarChart(el, {
    categories: PRODUCTS,
    series: [{ name: 'Vendas', data: random() }],
    sort,
    labels: { show: true },
    legend: { show: false },
  });
  el.append(btn);
  btn.addEventListener('click', () => {
    sort = sort === 'desc' ? 'asc' : 'desc';
    btn.textContent = sort === 'desc' ? 'Crescente' : 'Decrescente';
    chart.setOptions({ sort });
  });
  const timer = window.setInterval(() => chart.setData(PRODUCTS, [{ name: 'Vendas', data: random() }]), 2000);
  return () => {
    clearInterval(timer);
    chart.destroy();
    btn.remove();
  };
}
