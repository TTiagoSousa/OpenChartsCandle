import { createBarChart, fromDataset, type BarChart } from 'openchartscandle/bar';

// A mesma tabela lida por colunas (uma série por ano) e por linhas (uma série por produto).
const TABLE: (string | number)[][] = [
  ['produto', '2023', '2024', '2025'],
  ['Matcha Latte', 41.1, 30.4, 65.1],
  ['Chá com leite', 86.5, 92.1, 85.7],
  ['Cacau com queijo', 24.1, 67.2, 79.5],
  ['Brownie de noz', 55.2, 67.1, 69.2],
];

export function mount(el: HTMLElement): () => void {
  const wrap = document.createElement('div');
  wrap.style.cssText = 'display:flex;height:100%;gap:8px';
  el.append(wrap);
  const panel = (title: string): HTMLElement => {
    const col = document.createElement('div');
    col.style.cssText = 'flex:1;min-width:0;display:flex;flex-direction:column';
    const h = document.createElement('div');
    h.textContent = title;
    h.style.cssText = 'font-size:12px;font-weight:600;opacity:.8;padding:8px 10px 0';
    const box = document.createElement('div');
    box.style.cssText = 'flex:1;min-height:0';
    col.append(h, box);
    wrap.append(col);
    return box;
  };
  const charts: BarChart[] = [
    createBarChart(panel('Por coluna (séries = anos)'), { ...fromDataset(TABLE), legend: { position: 'bottom', align: 'center' } }),
    createBarChart(panel('Por linha (séries = produtos)'), { ...fromDataset(TABLE, { seriesLayoutBy: 'row' }), legend: { position: 'bottom', align: 'center' } }),
  ];
  return () => {
    charts.forEach((c) => c.destroy());
    wrap.remove();
  };
}
