import { createPieChart } from 'openchartscandle/pie';

// Etiquetas especiais com texto rico (labels.rich): ícone, nome, dias e a percentagem numa caixa da cor da fatia.
const WEATHER = [
  { label: 'Sol', icon: '☀️', value: 165, color: '#ff9800' },
  { label: 'Nublado', icon: '☁️', value: 112, color: '#78909c' },
  { label: 'Chuva', icon: '🌧️', value: 68, color: '#2962ff' },
  { label: 'Trovoada', icon: '⛈️', value: 12, color: '#7e57c2' },
  { label: 'Nevoeiro', icon: '🌫️', value: 8, color: '#26a69a' },
];

export function mount(el: HTMLElement): () => void {
  const icon = new Map(WEATHER.map((w) => [w.label, w.icon]));
  const chart = createPieChart(el, {
    title: { text: 'O tempo num ano', subtext: 'Dias por estado do tempo' },
    data: WEATHER.map(({ label, value, color }) => ({ label, value, color })),
    innerRadius: 0.35,
    scale: 0.82,
    center: { title: 'dias' },
    legend: { position: 'bottom', values: false },
    labels: {
      position: 'outside',
      minPercent: 0,
      lineLength: 14,
      rich: (s) => [
        [{ text: `${icon.get(s.label)} `, fontSize: 18 }, { text: s.label, fontWeight: 700, fontSize: 13 }],
        [
          { text: `${s.value} dias `, fontWeight: 400, fontSize: 11, color: '#9598a1' },
          { text: `${s.percent.toFixed(0)}%`, background: s.color, color: '#fff', fontSize: 11, fontWeight: 700, padding: 3 },
        ],
      ],
    },
  });
  return () => chart.destroy();
}
