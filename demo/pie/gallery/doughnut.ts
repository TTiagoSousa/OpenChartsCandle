import { createPieChart } from 'openchartscandle/pie';

// Donut simples: centro vazio que mostra a fatia debaixo do rato, legenda em cima.
export function mount(el: HTMLElement): () => void {
  const chart = createPieChart(el, {
    data: [
      { label: 'Motores de pesquisa', value: 1048 },
      { label: 'Direto', value: 735 },
      { label: 'Email', value: 580 },
      { label: 'Anúncios de parceiros', value: 484 },
      { label: 'Anúncios em vídeo', value: 300 },
    ],
    innerRadius: 0.57,
    labels: { show: false },
    legend: { position: 'top', values: false },
    center: { value: '', title: '' },
  });
  return () => chart.destroy();
}
