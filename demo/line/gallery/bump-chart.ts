import { createLineChart } from 'openchartscandle/line';

// Ranking ano a ano: o 1.º lugar fica em cima (yAxis.inverse) e cada linha tem o nome no fim.
const YEARS = ['2019', '2020', '2021', '2022', '2023', '2024', '2025'];
const RANKS: Record<string, number[]> = {
  Bitcoin: [1, 1, 2, 1, 1, 1, 1],
  Ethereum: [2, 3, 1, 2, 2, 3, 2],
  Solana: [6, 6, 3, 5, 4, 2, 3],
  BNB: [3, 2, 4, 3, 3, 4, 4],
  XRP: [4, 4, 5, 4, 6, 5, 5],
  Cardano: [5, 5, 6, 6, 5, 6, 6],
};

export function mount(el: HTMLElement): () => void {
  const chart = createLineChart(el, {
    categories: YEARS,
    series: Object.entries(RANKS).map(([name, data]) => ({ name, data, endLabel: true })),
    curve: 'smooth',
    points: { size: 5 },
    yAxis: { inverse: true, min: 1, max: 6, ticks: 6, format: (v) => `${v}.º` },
    legend: { show: false },
    tooltip: { sort: true },
    valueFormatter: (v) => `${v}.º lugar`,
  });
  return () => chart.destroy();
}
