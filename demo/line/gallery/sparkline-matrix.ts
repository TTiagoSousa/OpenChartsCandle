import { createLineChart, type LineChart } from 'openchartscandle/line';

// Mini linhas (sparkline) numa matriz: ativos nas linhas, métricas nas colunas.
// Cada célula é um gráfico com o preset `sparkline: true` e fundo transparente.
const ASSETS = ['BTC', 'ETH', 'SOL', 'BNB', 'XRP', 'ADA'];
const METRICS = ['Preço', 'Volume', 'Volatilidade', 'Funding'];

function series(seed: number, drift: number): number[] {
  let s = seed;
  const rand = (): number => ((s = (s * 16807) % 2147483647) / 2147483647);
  let v = 100;
  return Array.from({ length: 30 }, () => (v = Math.max(5, v * (1 + drift + (rand() - 0.5) * 0.08))));
}

export function mount(el: HTMLElement): () => void {
  const table = document.createElement('table');
  table.style.cssText = 'width:100%;height:100%;border-collapse:collapse;font-size:12px';
  const head = table.insertRow();
  for (const h of ['', ...METRICS]) {
    const th = document.createElement('th');
    th.textContent = h;
    th.style.cssText = 'text-align:left;padding:6px 8px;opacity:.7;font-weight:600;border-bottom:1px solid rgba(255,255,255,.08)';
    head.append(th);
  }
  const charts: LineChart[] = [];
  ASSETS.forEach((asset, r) => {
    const row = table.insertRow();
    const name = row.insertCell();
    name.textContent = asset;
    name.style.cssText = 'padding:6px 8px;font-weight:700;width:60px;border-bottom:1px solid rgba(255,255,255,.05)';
    METRICS.forEach((_, c) => {
      const cell = row.insertCell();
      cell.style.cssText = 'padding:4px 8px;border-bottom:1px solid rgba(255,255,255,.05)';
      const box = document.createElement('div');
      box.style.height = '42px';
      cell.append(box);
      const data = series(r * 10 + c + 1, (r - c) * 0.004);
      const up = data[data.length - 1] >= data[0];
      charts.push(
        createLineChart(box, {
          series: [{ name: `${asset} · ${METRICS[c]}`, data, color: up ? '#089981' : '#f23645', width: 1.5, area: { opacity: 0.18 } }],
          sparkline: true,
          background: 'transparent',
          animation: false,
          valueFormatter: (v) => v.toFixed(1),
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
