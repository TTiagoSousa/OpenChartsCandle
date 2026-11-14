import { createRadarChart } from 'openchartscandle/radar';

// Três radares no mesmo gráfico, cada série no seu (radar: 0, 1, 2): dois telemóveis, as notas de um aluno e
// a chuva de cada mês em duas cidades (aproximada).
const MONTHS = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];

export function mount(el: HTMLElement): () => void {
  const chart = createRadarChart(el, {
    radars: [
      { title: 'Telemóveis', indicators: ['Marca', 'Ecrã', 'Câmara', 'Bateria', 'Preço'].map((name) => ({ name, max: 100 })), center: [17, 50], radius: 52 },
      { title: 'Aluno', indicators: ['Matemática', 'Português', 'Inglês', 'Física', 'História'].map((name) => ({ name, max: 20 })), center: [50, 50], radius: 52, shape: 'circle' },
      { title: 'Chuva (mm)', indicators: MONTHS.map((name) => ({ name, max: 160 })), center: [83, 50], radius: 52, splitArea: true, axisName: { fontSize: 10 } },
    ],
    series: [
      { name: 'Telemóvel A', radar: 0, data: [85, 90, 92, 70, 40], area: true },
      { name: 'Telemóvel B', radar: 0, data: [60, 75, 70, 90, 85], area: true },
      { name: '1.º período', radar: 1, data: [14, 16, 17, 12, 15], area: { opacity: 0.35 } },
      { name: 'Lisboa', radar: 2, data: [100, 90, 60, 65, 45, 15, 5, 7, 30, 95, 125, 130], area: true, points: false },
      { name: 'Porto', radar: 2, data: [150, 125, 110, 110, 90, 40, 20, 30, 70, 140, 155, 160], area: true, points: false },
    ],
    legend: { position: 'bottom' },
    valueFormatter: (v, ind) => (MONTHS.includes(ind.name) ? `${v} mm` : String(v)),
  });
  return () => chart.destroy();
}
