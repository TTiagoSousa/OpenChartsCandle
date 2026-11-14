import { createLineChart } from 'openchartscandle/line';

export function mount(el: HTMLElement): () => void {
  const chart = createLineChart(el, {
    categories: ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom'],
    series: [
      { name: 'Email', data: [120, 132, 101, 134, 90, 230, 210] },
      { name: 'Anúncios', data: [220, 182, 191, 234, 290, 330, 310] },
      { name: 'Vídeo', data: [150, 232, 201, 154, 190, 330, 410] },
      { name: 'Direto', data: [320, 332, 301, 334, 390, 330, 320] },
      { name: 'Pesquisa', data: [820, 932, 901, 934, 1290, 1330, 1320] },
    ],
    // each line sits on top of the previous one; area: false keeps only the lines
    stacked: true,
    area: false,
    points: true,
  });
  return () => chart.destroy();
}
