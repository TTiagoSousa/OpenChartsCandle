import { createBarChart } from 'openchartscandle/bar';

// Seleção por área (brush): arrasta um retângulo para escolher barras; o evento 'brush' dá as escolhidas.
const MONTHS = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];

export function mount(el: HTMLElement): () => void {
  el.style.position = 'relative';
  const info = document.createElement('div');
  info.style.cssText = 'position:absolute;right:16px;top:10px;z-index:2;font-size:12px;padding:6px 10px;border-radius:6px;background:rgba(41,98,255,.15);pointer-events:none';
  info.textContent = 'Arrasta para selecionar · clique limpa';
  const chart = createBarChart(el, {
    categories: MONTHS,
    series: [
      { name: 'Compras', data: [42, 51, 38, 60, 72, 55, 64, 80, 58, 49, 67, 75] },
      { name: 'Vendas', data: [35, 44, 52, 41, 63, 70, 52, 61, 74, 66, 50, 59] },
    ],
    brush: true,
    legend: { position: 'bottom', align: 'center' }, // the selection info sits at the top
  });
  el.append(info);
  const off = chart.on('brush', (items) => {
    const sum = items.reduce((a, d) => a + d.value, 0);
    info.textContent = items.length ? `${items.length} barras · soma ${sum}` : 'Arrasta para selecionar · clique limpa';
  });
  return () => {
    off();
    chart.destroy();
    info.remove();
  };
}
