import { createBarChart } from 'openchartscandle/bar';

// Corrida de rendimentos por país de 1950 a 2020: top 10, cor por país e o ano grande ao fundo.
const COUNTRIES = ['Noruega', 'Suíça', 'EUA', 'Islândia', 'Alemanha', 'França', 'Reino Unido', 'Japão', 'Itália', 'Espanha', 'Portugal', 'Polónia'];
const BASE = [7400, 9800, 9600, 6100, 5900, 6800, 8100, 3000, 4500, 3500, 2900, 3600];
const GROWTH = [0.031, 0.019, 0.02, 0.027, 0.024, 0.021, 0.018, 0.038, 0.024, 0.029, 0.03, 0.026];
const COLORS = ['#5470c6', '#91cc75', '#fac858', '#ee6666', '#73c0de', '#3ba272', '#fc8452', '#9a60b4', '#ea7ccc', '#2962ff', '#089981', '#f23645'];
const income = (c: number, year: number): number => Math.round(BASE[c] * Math.pow(1 + GROWTH[c], year - 1950) * (1 + 0.05 * Math.sin((year - 1950) / 4 + c)));

export function mount(el: HTMLElement): () => void {
  let year = 1950;
  const series = () => [{ name: 'Rendimento', data: COUNTRIES.map((_, c) => ({ value: income(c, year), color: COLORS[c] })) }];
  const chart = createBarChart(el, {
    orientation: 'horizontal',
    categories: COUNTRIES,
    series: series(),
    sort: 'desc',
    limit: 10,
    labels: { show: true, position: 'outside', format: (v) => `$${Math.round(v).toLocaleString('pt-PT')}` },
    animation: { duration: 900 },
    legend: { show: false },
    valueFormatter: (v) => `$${Math.round(v).toLocaleString('pt-PT')}`,
    graphic: (ctx, api) => {
      ctx.font = `800 64px ${api.theme.font}`;
      ctx.fillStyle = 'rgba(255,255,255,0.08)';
      ctx.textAlign = 'right';
      ctx.textBaseline = 'bottom';
      ctx.fillText(String(year), api.plot.x + api.plot.w - 10, api.plot.y + api.plot.h - 6);
    },
  });
  const timer = window.setInterval(() => {
    year = year >= 2020 ? 1950 : year + 1;
    chart.setData(COUNTRIES, series());
  }, 1000);
  return () => {
    clearInterval(timer);
    chart.destroy();
  };
}
