import { createBarChart } from 'openchartscandle/bar';

// Barras horizontais empilhadas com o valor ao centro de cada segmento.
export function mount(el: HTMLElement): () => void {
  const chart = createBarChart(el, {
    orientation: 'horizontal',
    categories: ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom'],
    series: [
      { name: 'Direto', data: [320, 302, 301, 334, 390, 330, 320] },
      { name: 'Email', data: [120, 132, 101, 134, 90, 230, 210] },
      { name: 'Anúncios', data: [220, 182, 191, 234, 290, 330, 310] },
      { name: 'Vídeo', data: [150, 212, 201, 154, 190, 330, 410] },
      { name: 'Pesquisa', data: [820, 832, 901, 934, 1290, 1330, 1320] },
    ],
    stacked: true,
    labels: { show: true, position: 'center' },
    legend: { position: 'top', align: 'center' },
  });
  return () => chart.destroy();
}
