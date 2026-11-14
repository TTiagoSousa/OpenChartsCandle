import { createPieChart, type PieChart, type PieDatum } from 'openchartscandle/pie';
import { cells } from '../data';

// Partir um conjunto de dados em várias pizzas: as mesmas linhas (produto, ano, vendas)
// são filtradas por ano, uma pizza por ano. As cores ficam iguais em todas.
const ROWS: [product: string, year: number, sales: number][] = [
  ['Café', 2023, 43], ['Chá', 2023, 25], ['Chocolate', 2023, 18], ['Sumos', 2023, 14],
  ['Café', 2024, 47], ['Chá', 2024, 22], ['Chocolate', 2024, 21], ['Sumos', 2024, 19],
  ['Café', 2025, 39], ['Chá', 2025, 30], ['Chocolate', 2025, 27], ['Sumos', 2025, 24],
];
const COLORS: Record<string, string> = { Café: '#795548', Chá: '#089981', Chocolate: '#ff9800', Sumos: '#e91e63' };

/** the rows of one year as pie data */
const byYear = (year: number): PieDatum[] => ROWS.filter((r) => r[1] === year).map(([label, , value]) => ({ label, value, color: COLORS[label] }));

export function mount(el: HTMLElement): () => void {
  const years = [...new Set(ROWS.map((r) => r[1]))];
  const hosts = cells(el, years.length);
  const charts: PieChart[] = years.map((year, i) =>
    createPieChart(hosts[i], {
      title: { text: String(year), subtext: `${byYear(year).reduce((s, d) => s + d.value, 0)} mil vendas` },
      data: byYear(year),
      innerRadius: 0.35,
      center: { show: false },
      labels: { content: 'label-percent', position: 'inside', minPercent: 6 },
      legend: { position: 'bottom', values: false, fontSize: 11 },
    }),
  );
  return () => charts.forEach((c) => c.destroy());
}
