import { createParallelChart } from 'openchartscandle/parallel';

// O gráfico de coordenadas paralelas mais simples: seis meses de três fundos, uma linha por mês e um eixo por
// medida. Arrasta ao longo de um eixo para selecionar um intervalo; um clique no eixo limpa a seleção.
export function mount(el: HTMLElement): () => void {
  const months = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun'];
  const fund = (name: string, rows: number[][]) => ({ name, data: rows.map((r, i) => ({ name: `${name}, ${months[i]}`, value: [months[i], ...r] })) });
  const chart = createParallelChart(el, {
    axes: [
      { name: 'Mês', type: 'category', data: months },
      { name: 'Retorno %' },
      { name: 'Volatilidade %' },
      { name: 'Sharpe' },
      { name: 'Drawdown %', inverse: true },
      { name: 'Ações %', min: 0, max: 100 },
    ],
    series: [
      fund('Conservador', [[0.4, 3.1, 0.9, 0.8, 20], [0.2, 2.8, 0.6, 1.1, 22], [-0.3, 3.6, 0.2, 1.9, 18], [0.6, 2.9, 1.1, 0.6, 21], [0.5, 3.0, 1.0, 0.7, 24], [0.3, 2.7, 0.8, 0.9, 20]]),
      fund('Equilibrado', [[1.1, 7.8, 0.8, 2.4, 50], [0.6, 8.6, 0.5, 3.1, 52], [-1.4, 10.2, 0.1, 5.2, 48], [1.6, 7.4, 1.0, 1.8, 55], [0.9, 8.1, 0.7, 2.6, 50], [1.3, 7.2, 0.9, 2.0, 53]]),
      fund('Agressivo', [[2.6, 16.5, 0.7, 6.1, 85], [-0.8, 19.8, 0.2, 9.4, 90], [-3.9, 24.1, -0.2, 14.6, 88], [4.2, 15.2, 1.1, 4.8, 92], [1.8, 17.7, 0.6, 7.3, 86], [3.1, 14.9, 0.9, 5.5, 90]]),
    ],
    lineWidth: 2,
    opacity: 0.9,
    legend: { position: 'top' },
  });
  return () => chart.destroy();
}
