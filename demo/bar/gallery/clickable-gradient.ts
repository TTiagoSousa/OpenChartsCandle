import { createBarChart } from 'openchartscandle/bar';

// Colunas com gradiente; clicar numa coluna faz zoom à volta dela (setZoom),
// duplo clique repõe.
const WORDS = ['Cada', 'gráfico', 'conta', 'uma', 'história', 'clara', 'com', 'cor', 'forma', 'e', 'movimento', 'para', 'quem', 'lê', 'os', 'dados', 'com', 'calma', 'todos', 'dias'];
const values = [220, 182, 191, 234, 290, 330, 310, 123, 442, 321, 90, 149, 210, 122, 133, 334, 198, 123, 125, 220];

export function mount(el: HTMLElement): () => void {
  el.style.position = 'relative';
  const hint = document.createElement('div');
  hint.textContent = 'Clica numa barra para fazer zoom · duplo clique repõe';
  hint.style.cssText = 'position:absolute;right:16px;top:10px;font-size:12px;opacity:.7;pointer-events:none;z-index:2';
  const chart = createBarChart(el, {
    categories: WORDS.map((w, i) => `${w} ${i + 1}`),
    series: [{ name: 'Valor', data: values, gradient: ['#83bff6', '#188df0', '#188df0'] }],
    zoom: true,
    legend: { show: false },
  });
  el.append(hint);
  const off = chart.on('click', (d) => {
    const n = WORDS.length;
    chart.setZoom(Math.max(0, d.categoryIndex - 3), Math.min(n - 1, d.categoryIndex + 3));
  });
  return () => {
    off();
    chart.destroy();
    hint.remove();
  };
}
