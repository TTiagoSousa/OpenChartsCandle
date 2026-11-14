import { createPieChart } from 'openchartscandle/pie';

// Espaço entre fatias (padAngle, em graus) com cantos redondos: cada fatia fica separada das vizinhas.
export function mount(el: HTMLElement): () => void {
  const chart = createPieChart(el, {
    data: [
      { label: 'Motores de pesquisa', value: 1048 },
      { label: 'Direto', value: 735 },
      { label: 'Email', value: 580 },
      { label: 'Anúncios de parceiros', value: 484 },
      { label: 'Anúncios em vídeo', value: 300 },
    ],
    innerRadius: 0.55,
    padAngle: 5,
    cornerRadius: 8,
    borderWidth: 0,
    labels: { show: false },
    legend: { position: 'top', values: false },
    center: { title: 'Visitas' },
  });
  return () => chart.destroy();
}
