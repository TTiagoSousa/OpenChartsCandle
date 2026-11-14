import { createLineChart } from 'openchartscandle/line';

// Previsão com intervalo de confiança: a faixa (band) vai do limite inferior ao superior
// e alarga com o tempo; o tooltip mostra o valor e o intervalo.
const n = 60;
const forecast = Array.from({ length: n }, (_, i) => +(100 + i * 0.8 + 6 * Math.sin(i / 5)).toFixed(1));
const spread = forecast.map((_, i) => 2 + i * 0.35);
const days = Array.from({ length: n }, (_, i) => `D+${i + 1}`);

export function mount(el: HTMLElement): () => void {
  const chart = createLineChart(el, {
    categories: days,
    series: [
      {
        name: 'Previsão',
        data: forecast,
        color: '#2962ff',
        band: {
          lower: forecast.map((v, i) => +(v - spread[i]).toFixed(1)),
          upper: forecast.map((v, i) => +(v + spread[i]).toFixed(1)),
          opacity: 0.22,
        },
      },
    ],
    curve: 'smooth',
    legend: { show: false },
    valueFormatter: (v) => v.toFixed(1),
  });
  return () => chart.destroy();
}
