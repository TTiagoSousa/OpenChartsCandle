import { createScatterChart, type ScatterChart } from 'openchartscandle/scatter';
import { HOURS, WEEKDAYS, cells, punchCard } from '../data';

// Dispersão num só eixo: uma linha por dia com as horas, e o tamanho de cada círculo é o número
// de commits nessa hora. São sete gráficos pequenos, um por cima do outro. Dados gerados.
export function mount(el: HTMLElement): () => void {
  const data = punchCard();
  const max = Math.max(...data.map((d) => d[2]));
  const rows = cells(el, 7, 1, 0);
  // the last row also holds the hour labels
  rows[0].parentElement!.style.gridTemplateRows = 'repeat(6, minmax(0, 1fr)) minmax(0, 1.8fr)';
  const charts: ScatterChart[] = rows.map((cell, d) =>
    createScatterChart(cell, {
      series: [{ name: WEEKDAYS[d], data: data.filter((p) => p[1] === d).map(([hr, , v]) => [HOURS[hr], WEEKDAYS[d], v]), symbolSize: (v) => 2 + (Number(v[2]) / max) * 20, color: '#2962ff' }],
      dimensions: ['Hora', 'Dia', 'Commits'],
      xAxis: { categories: HOURS, show: d === 6, grid: false },
      yAxis: { categories: [WEEKDAYS[d]], grid: false },
      padding: 2,
    }),
  );
  return () => charts.forEach((c) => c.destroy());
}
