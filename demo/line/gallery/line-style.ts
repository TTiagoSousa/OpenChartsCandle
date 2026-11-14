import { createLineChart } from 'openchartscandle/line';

// Estilo da linha e dos pontos: linha tracejada, grossa e com sombra; pontos em triângulo
// amarelos com borda vermelha.
export function mount(el: HTMLElement): () => void {
  const chart = createLineChart(el, {
    categories: ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom'],
    series: [
      {
        name: 'Visitas',
        data: [120, 200, 150, 80, 70, 110, 130],
        color: '#5470c6',
        width: 4,
        dash: [10, 6],
        shadow: { color: 'rgba(84,112,198,0.6)', blur: 12, offsetY: 8 },
        points: { shape: 'triangle', size: 9, color: '#ffeb3b', borderColor: '#ee6666', borderWidth: 3 },
      },
    ],
    legend: { show: false },
    yAxis: { beginAtZero: true },
  });
  return () => chart.destroy();
}
