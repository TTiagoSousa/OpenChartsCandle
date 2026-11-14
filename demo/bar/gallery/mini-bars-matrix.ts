import { createBarChart, type BarChart } from 'openchartscandle/bar';

// Matriz de mini barras: regiões nas linhas, métricas nas colunas, um gráfico sparkline por célula.
// (A versão do ECharts junta um mapa geográfico; os mapas não fazem parte desta biblioteca.)
const REGIONS = ['Norte', 'Centro', 'Lisboa', 'Alentejo', 'Algarve'];
const METRICS = ['Vendas', 'Clientes', 'Encomendas', 'Devoluções'];
const COLORS = ['#2962ff', '#089981', '#ff9800', '#f23645'];

function values(seed: number): number[] {
  let s = seed;
  const rand = (): number => ((s = (s * 16807) % 2147483647) / 2147483647);
  return Array.from({ length: 12 }, () => Math.round(20 + rand() * 80));
}

export function mount(el: HTMLElement): () => void {
  const table = document.createElement('table');
  table.style.cssText = 'width:100%;border-collapse:collapse;font-size:12px';
  const head = table.insertRow();
  for (const h of ['', ...METRICS]) {
    const th = document.createElement('th');
    th.textContent = h;
    th.style.cssText = 'text-align:left;padding:6px 8px;opacity:.7;font-weight:600;border-bottom:1px solid rgba(255,255,255,.08)';
    head.append(th);
  }
  const charts: BarChart[] = [];
  REGIONS.forEach((region, r) => {
    const row = table.insertRow();
    const name = row.insertCell();
    name.textContent = region;
    name.style.cssText = 'padding:6px 8px;font-weight:700;width:80px;border-bottom:1px solid rgba(255,255,255,.05)';
    METRICS.forEach((metric, m) => {
      const cell = row.insertCell();
      cell.style.cssText = 'padding:4px 8px;border-bottom:1px solid rgba(255,255,255,.05)';
      const box = document.createElement('div');
      box.style.height = '46px';
      cell.append(box);
      charts.push(
        createBarChart(box, {
          categories: ['J', 'F', 'M', 'A', 'M', 'J', 'J', 'A', 'S', 'O', 'N', 'D'],
          series: [{ name: `${region} · ${metric}`, data: values(r * 10 + m + 1), color: COLORS[m] }],
          sparkline: true,
          background: 'transparent',
          animation: false,
          categoryGap: 0.3,
        }),
      );
    });
  });
  const wrap = document.createElement('div');
  wrap.style.cssText = 'height:100%;overflow:auto;padding:8px;box-sizing:border-box;color-scheme:dark;scrollbar-width:thin';
  wrap.append(table);
  el.append(wrap);
  return () => {
    charts.forEach((c) => c.destroy());
    wrap.remove();
  };
}
