import { createPieChart } from 'openchartscandle/pie';

// Etiquetas encostadas às margens (alignTo: 'edge') com duas linhas: o nome a negrito e as horas por baixo.
// As etiquetas afastam-se umas das outras sozinhas e as linhas ajustam-se até ao texto.
const DATA = [
  { label: 'Dormir', value: 7.6 },
  { label: 'Trabalho e reuniões', value: 7.9 },
  { label: 'Deslocações', value: 1.2 },
  { label: 'Refeições e cozinha', value: 1.8 },
  { label: 'Exercício', value: 0.7 },
  { label: 'Família e amigos', value: 2.1 },
  { label: 'Ecrãs (séries, redes sociais)', value: 1.6 },
  { label: 'Leitura', value: 0.5 },
  { label: 'Tarefas de casa', value: 0.6 },
];

export function mount(el: HTMLElement): () => void {
  const chart = createPieChart(el, {
    title: { text: 'Um dia típico', subtext: 'Horas por atividade' },
    data: DATA,
    scale: 0.92,
    legend: { show: false },
    valueFormatter: (v) => `${v.toFixed(1)} h`,
    labels: {
      position: 'outside',
      alignTo: 'edge',
      edgeDistance: 12,
      radialLength: 14,
      lineLength: 0,
      minPercent: 0,
      rich: (s) => [[{ text: s.label, fontWeight: 700 }], [{ text: `${s.value.toFixed(1)} horas`, fontWeight: 400, fontSize: 11, color: '#9598a1' }]],
    },
  });
  return () => chart.destroy();
}
