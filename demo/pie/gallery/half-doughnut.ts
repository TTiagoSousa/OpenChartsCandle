import { createPieChart } from 'openchartscandle/pie';

// Meio donut: só a metade de cima (de -180° a 0°), com o total por cima da linha do centro.
export function mount(el: HTMLElement): () => void {
  const chart = createPieChart(el, {
    data: [
      { label: 'Motores de pesquisa', value: 1048 },
      { label: 'Direto', value: 735 },
      { label: 'Email', value: 580 },
      { label: 'Anúncios de parceiros', value: 484 },
      { label: 'Anúncios em vídeo', value: 300 },
    ],
    startAngle: -180,
    endAngle: 0,
    innerRadius: 0.55,
    labels: { show: false },
    legend: { position: 'top', values: false },
    center: { title: 'Visitas' },
  });
  return () => chart.destroy();
}
