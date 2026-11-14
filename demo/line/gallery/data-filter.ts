import { createLineChart, type LineSeries } from 'openchartscandle/line';

// Uma tabela de dados (como vem do backend) filtrada no cliente: uma série por país,
// só os anos a partir de 1950. Cada linha mostra o nome no fim.
interface Row {
  country: string;
  year: number;
  income: number;
}

const COUNTRIES = ['Finlândia', 'França', 'Alemanha', 'Islândia', 'Noruega', 'Polónia', 'Rússia', 'Reino Unido'];
const BASE = [2900, 4400, 3800, 3600, 4700, 2300, 2600, 6300];
const GROWTH = [0.031, 0.026, 0.028, 0.03, 0.032, 0.029, 0.018, 0.021];

// table: one row per country and year since 1900
const rows: Row[] = COUNTRIES.flatMap((country, c) =>
  Array.from({ length: 116 }, (_, k) => {
    const year = 1900 + k;
    const shock = year >= 1939 && year <= 1945 ? 0.75 : 1; // war years
    const wave = 1 + 0.04 * Math.sin(k / 3 + c);
    return { country, year, income: Math.round(BASE[c] * Math.pow(1 + GROWTH[c], k / 1.6) * shock * wave) };
  }),
);

export function mount(el: HTMLElement): () => void {
  // the "transform": filter + map per country
  const series: LineSeries[] = COUNTRIES.map((country) => ({
    name: country,
    data: rows.filter((r) => r.country === country && r.year >= 1950).map((r) => ({ x: String(r.year), y: r.income })),
    width: 1.6,
    endLabel: { format: (name, v) => `${name} ${Math.round(v / 1000)}k` },
  }));
  const chart = createLineChart(el, {
    series,
    xType: 'category',
    categories: Array.from({ length: 66 }, (_, k) => String(1950 + k)),
    legend: { show: false },
    tooltip: { sort: true },
    yAxis: { title: 'Rendimento por pessoa' },
    valueFormatter: (v) => `$${v.toLocaleString('pt-PT')}`,
  });
  return () => chart.destroy();
}
