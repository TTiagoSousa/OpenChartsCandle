import { createBarChart } from 'openchartscandle/bar';

// Grupos de pilhas: séries com o mesmo `stack` empilham juntas; chaves diferentes ficam lado a lado.
export function mount(el: HTMLElement): () => void {
  const chart = createBarChart(el, {
    categories: ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom'],
    series: [
      { name: 'Direto', data: [320, 332, 301, 334, 390, 330, 320], stack: 'Direto' },
      { name: 'Email', data: [120, 132, 101, 134, 90, 230, 210], stack: 'Anúncios' },
      { name: 'Anúncios', data: [220, 182, 191, 234, 290, 330, 310], stack: 'Anúncios' },
      { name: 'Vídeo', data: [150, 232, 201, 154, 190, 330, 410], stack: 'Anúncios' },
      { name: 'Pesquisa', data: [862, 1018, 964, 1026, 1679, 1600, 1570], stack: 'Pesquisa' },
      { name: 'Google', data: [620, 732, 701, 734, 1090, 1130, 1120], stack: 'Motores' },
      { name: 'Bing', data: [120, 132, 101, 134, 290, 230, 220], stack: 'Motores' },
      { name: 'Outros', data: [62, 82, 64, 70, 90, 110, 120], stack: 'Motores' },
    ],
    stacked: true,
    barGap: 2,
    legend: { position: 'top', align: 'center' },
  });
  return () => chart.destroy();
}
