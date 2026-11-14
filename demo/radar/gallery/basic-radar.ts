import { createRadarChart } from 'openchartscandle/radar';

// O radar mais simples: o orçamento e o gasto real de seis departamentos, cada eixo com o seu máximo.
export function mount(el: HTMLElement): () => void {
  const chart = createRadarChart(el, {
    indicators: [
      { name: 'Vendas', max: 6500 },
      { name: 'Administração', max: 16000 },
      { name: 'TI', max: 30000 },
      { name: 'Apoio ao cliente', max: 38000 },
      { name: 'Desenvolvimento', max: 52000 },
      { name: 'Marketing', max: 25000 },
    ],
    series: [
      { name: 'Orçamento', data: [4200, 3000, 20000, 35000, 50000, 18000] },
      { name: 'Gasto real', data: [5000, 14000, 28000, 26000, 42000, 21000] },
    ],
    legend: { position: 'top' },
    valueFormatter: (v) => `${v.toLocaleString('pt-PT')} €`,
  });
  return () => chart.destroy();
}
