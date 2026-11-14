import { createBarChart } from 'openchartscandle/bar';

// 100% com largura variável (Mekko): a altura dá a proporção e a largura o total de cada dia.
export function mount(el: HTMLElement): () => void {
  const chart = createBarChart(el, {
    categories: ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom'],
    series: [
      { name: 'Direto', data: [320, 302, 301, 334, 390, 330, 320] },
      { name: 'Email', data: [120, 132, 101, 134, 90, 230, 210] },
      { name: 'Anúncios', data: [220, 182, 191, 234, 290, 330, 310] },
      { name: 'Pesquisa', data: [420, 532, 701, 934, 1290, 1830, 820] },
    ],
    stacked: 'percent',
    widthBy: 'total',
    categoryGap: 0.04,
    radius: 0,
    labels: { show: true },
    legend: { position: 'top', align: 'center' },
  });
  return () => chart.destroy();
}
