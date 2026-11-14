import { createPieChart } from 'openchartscandle/pie';

// De onde vêm as visitas de um site: pizza simples com título, legenda à esquerda e etiquetas por fora.
export function mount(el: HTMLElement): () => void {
  const chart = createPieChart(el, {
    title: { text: 'Origem das visitas de um site', subtext: 'Dados fictícios' },
    data: [
      { label: 'Motores de pesquisa', value: 1048 },
      { label: 'Direto', value: 735 },
      { label: 'Email', value: 580 },
      { label: 'Anúncios de parceiros', value: 484 },
      { label: 'Anúncios em vídeo', value: 300 },
    ],
    scale: 0.85,
    labels: { position: 'outside', content: 'label' },
    legend: { position: 'left', values: false, align: 'start' },
    shadow: { blur: 10 },
  });
  return () => chart.destroy();
}
