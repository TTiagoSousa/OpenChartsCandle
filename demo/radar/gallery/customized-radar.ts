import { createRadarChart } from 'openchartscandle/radar';

// Dois radares personalizados no mesmo gráfico: à esquerda em polígono com os valores nos vértices; à direita
// circular, a começar no lado direito, com os nomes em caixas e uma área em gradiente.
export function mount(el: HTMLElement): () => void {
  const chart = createRadarChart(el, {
    radars: [
      {
        indicators: ['Velocidade', 'Força', 'Defesa', 'Técnica', 'Resistência'].map((name) => ({ name, max: 100 })),
        center: [25, 52],
        radius: 62,
        startAngle: 90,
        splitNumber: 4,
        splitArea: true,
        axisName: { color: '#fff', background: '#666', borderRadius: 3, padding: 3 },
      },
      {
        indicators: ['Ataque', 'Passe', 'Visão', 'Drible', 'Remate', 'Físico'].map((name) => ({ name, max: 100 })),
        center: [75, 52],
        radius: 62,
        shape: 'circle',
        startAngle: 0,
        splitNumber: 5,
        splitArea: { colors: ['rgba(41,98,255,0.05)', 'rgba(41,98,255,0.12)'] },
        splitLine: { color: 'rgba(41,98,255,0.4)', dash: [4, 4] },
        axisName: { color: '#ff9800', fontSize: 13, format: (n) => `【${n}】` },
      },
    ],
    series: [
      { name: 'Jogador A', radar: 0, data: [92, 64, 70, 85, 60], color: '#f23645', labels: true, points: { symbol: 'square', size: 4 } },
      { name: 'Jogador B', radar: 0, data: [60, 85, 88, 55, 78], color: '#089981', dash: [6, 4], points: { hollow: true } },
      { name: 'Jogador C', radar: 1, data: [88, 72, 80, 94, 86, 60], color: '#2962ff', area: { opacity: 0.6, gradient: true }, points: { symbol: 'diamond', size: 5 } },
    ],
    legend: { position: 'bottom' },
  });
  return () => chart.destroy();
}
