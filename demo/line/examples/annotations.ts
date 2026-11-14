import { createLineChart } from 'openchartscandle/line';
import { usd, walk } from '../data';

// Anotações: linhas horizontais de referência (alvo, stop), uma faixa (zona de compra)
// e marcadores verticais (eventos).
export function mount(el: HTMLElement): () => void {
  const data = walk(21, 150, 3100, 0.025, 0.0012);
  const ys = data.map((p) => p.y as number);
  const max = Math.max(...ys);
  const min = Math.min(...ys);
  const chart = createLineChart(el, {
    series: [{ name: 'ETH', data, color: '#7e57c2', area: { opacity: 0.15 } }],
    legend: { show: false },
    valueFormatter: usd,
    annotations: {
      y: [
        { value: Math.round(max * 1.03), label: 'Alvo', color: '#089981' },
        { value: Math.round(min * 0.97), label: 'Stop', color: '#f23645' },
      ],
      bands: [{ from: Math.round(min), to: Math.round(min + (max - min) * 0.2), label: 'Zona de compra', color: '#2962ff' }],
      x: [
        { value: data[40].x, label: 'Atualização da rede', color: '#ff9800' },
        { value: data[110].x, label: 'Anúncio ETF', color: '#ff9800' },
      ],
    },
  });

  return () => chart.destroy();
}
