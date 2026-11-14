import { createPieChart } from 'openchartscandle/pie';

// Texturas sobre as cores (patterns: true): riscas, pontos, xadrez… Ajudam quem não distingue
// bem as cores e quando o gráfico é impresso a preto e branco.
export function mount(el: HTMLElement): () => void {
  const chart = createPieChart(el, {
    title: 'Texturas nas fatias',
    data: [
      { label: 'Motores de pesquisa', value: 1048 },
      { label: 'Direto', value: 735 },
      { label: 'Email', value: 580 },
      { label: 'Anúncios de parceiros', value: 484 },
      { label: 'Anúncios em vídeo', value: 300 },
    ],
    patterns: true,
    scale: 0.9,
    labels: { position: 'outside', content: 'label' },
    legend: { position: 'bottom', values: false },
  });
  return () => chart.destroy();
}
