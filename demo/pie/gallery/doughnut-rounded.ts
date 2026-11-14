import { createPieChart } from 'openchartscandle/pie';

// Donut com cantos arredondados e bordas largas; sem etiquetas, e o nome e o valor aparecem ao centro ao passar o rato.
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
    cornerRadius: 10,
    borderWidth: 3,
    labels: { show: false },
    legend: { position: 'top', values: false },
    center: { title: 'Visitas' },
  });
  return () => chart.destroy();
}
