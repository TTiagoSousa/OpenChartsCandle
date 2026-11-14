import { createLineChart } from 'openchartscandle/line';

// Consumo de eletricidade num dia: a linha fica vermelha nas horas de pico (pieces)
// e as faixas verticais marcam os picos da manhã e da noite (annotations.xBands).
const HOURS = ['00:00', '01:15', '02:30', '03:45', '05:00', '06:15', '07:30', '08:45', '10:00', '11:15', '12:30', '13:45', '15:00', '16:15', '17:30', '18:45', '20:00', '21:15', '22:30', '23:45'];
const WATTS = [300, 280, 250, 260, 270, 300, 550, 500, 400, 390, 380, 390, 400, 500, 600, 750, 800, 700, 600, 400];

export function mount(el: HTMLElement): () => void {
  const chart = createLineChart(el, {
    categories: HOURS,
    series: [
      {
        name: 'Consumo',
        data: WATTS,
        color: '#089981',
        width: 2.5,
        pieces: [
          { from: '06:15', to: '08:45', color: '#f23645' },
          { from: '16:15', to: '21:15', color: '#f23645' },
        ],
      },
    ],
    curve: 'smooth',
    legend: { show: false },
    yAxis: { format: (v) => `${v} W`, beginAtZero: true },
    annotations: {
      xBands: [
        { from: '07:30', to: '10:00', label: 'Pico da manhã', color: '#ff9800' },
        { from: '17:30', to: '21:15', label: 'Pico da noite', color: '#ff9800' },
      ],
    },
    valueFormatter: (v) => `${v} W`,
  });
  return () => chart.destroy();
}
