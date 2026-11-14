import { createBarChart } from 'openchartscandle/bar';

// Drilldown: clica numa barra para ver o que a compõe; 'Voltar' regressa ao topo.
const GROUPS: Record<string, Record<string, number>> = {
  Animais: { Gatos: 4, Cães: 2, Vacas: 1, Ovelhas: 2, Porcos: 1 },
  Frutas: { Maçãs: 4, Laranjas: 2, Bananas: 3, Peras: 1, Uvas: 5 },
  Carros: { Toyota: 4, Opel: 2, Volkswagen: 2, Renault: 3, Tesla: 1 },
};

export function mount(el: HTMLElement): () => void {
  el.style.position = 'relative';
  const top = () => ({
    categories: Object.keys(GROUPS),
    series: [{ name: 'Total', data: Object.values(GROUPS).map((g) => Object.values(g).reduce((a, b) => a + b, 0)) }],
  });
  const chart = createBarChart(el, { ...top(), labels: { show: true }, legend: { show: false } });
  const back = document.createElement('button');
  back.className = 'ex-btn';
  back.textContent = '← Voltar';
  back.style.cssText = 'position:absolute;right:16px;top:8px;z-index:2;display:none';
  el.append(back);
  let level: string | null = null;
  const off = chart.on('click', (d) => {
    if (level) return;
    level = d.category;
    const g = GROUPS[level];
    chart.setData(Object.keys(g), [{ name: level, data: Object.values(g) }]);
    back.style.display = '';
  });
  back.addEventListener('click', () => {
    level = null;
    const t = top();
    chart.setData(t.categories, t.series);
    back.style.display = 'none';
  });
  return () => {
    off();
    chart.destroy();
    back.remove();
  };
}
