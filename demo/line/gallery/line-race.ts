import { createLineChart, type LineSeries } from 'openchartscandle/line';

// Corrida de linhas: um ano novo a cada 120 ms com appendPoint(); cada linha leva o nome
// e o valor atual no fim (endLabel). No fim recomeça.
const COUNTRIES = ['Finlândia', 'França', 'Alemanha', 'Islândia', 'Noruega', 'Polónia', 'Rússia', 'Reino Unido'];
const BASE = [5200, 6800, 5900, 6100, 7400, 3600, 3900, 8100];
const GROWTH = [0.026, 0.021, 0.024, 0.027, 0.031, 0.026, 0.013, 0.018];
const income = (c: number, year: number): number => {
  const k = year - 1950;
  return Math.round(BASE[c] * Math.pow(1 + GROWTH[c], k) * (1 + 0.05 * Math.sin(k / 4 + c)));
};

export function mount(el: HTMLElement): () => void {
  const series = (): LineSeries[] =>
    COUNTRIES.map((name, c) => ({
      name,
      data: [{ x: 1950, y: income(c, 1950) }],
      width: 2,
      endLabel: { format: (n, v) => `${n}  $${Math.round(v).toLocaleString('pt-PT')}` },
    }));
  const chart = createLineChart(el, {
    series: series(),
    xType: 'number',
    xAxis: { format: (x) => String(Math.round(x)) },
    yAxis: { format: (v) => `$${Math.round(v / 1000)}k` },
    legend: { show: false },
    tooltip: { sort: true },
    animation: false,
    valueFormatter: (v) => `$${Math.round(v).toLocaleString('pt-PT')}`,
  });
  let year = 1950;
  const timer = window.setInterval(() => {
    year++;
    if (year > 2020) {
      year = 1950;
      chart.setSeries(series());
      return;
    }
    COUNTRIES.forEach((name, c) => chart.appendPoint(name, { x: year, y: income(c, year) }));
  }, 120);
  return () => {
    clearInterval(timer);
    chart.destroy();
  };
}
