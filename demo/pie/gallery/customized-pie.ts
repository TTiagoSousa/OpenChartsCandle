import { createPieChart } from 'openchartscandle/pie';

// Pizza personalizada: rosa por raio, cor mais clara quanto maior o valor, linhas curvas,
// fundo escuro e animação em que cada fatia cresce do centro com um salto (elástico) e atraso aleatório.
const DATA = [
  { label: 'Anúncios em vídeo', value: 235 },
  { label: 'Anúncios de parceiros', value: 274 },
  { label: 'Email', value: 310 },
  { label: 'Direto', value: 335 },
  { label: 'Motores de pesquisa', value: 400 },
];

export function mount(el: HTMLElement): () => void {
  const min = Math.min(...DATA.map((d) => d.value));
  const max = Math.max(...DATA.map((d) => d.value));
  const chart = createPieChart(el, {
    title: { text: 'Pizza personalizada', color: '#ccc' },
    // brighter for bigger values (like a lightness visual map)
    data: DATA.map((d) => ({ ...d, color: `hsl(357, 58%, ${18 + ((d.value - min) / (max - min)) * 42}%)` })),
    background: '#2c343c',
    theme: { text: 'rgba(255,255,255,0.35)', line: 'rgba(255,255,255,0.3)' },
    rose: 'radius',
    sort: 'asc',
    scale: 0.8,
    borderWidth: 0,
    shadow: { color: 'rgba(0,0,0,0.5)', blur: 40, offsetY: 0 },
    labels: { position: 'outside', content: 'label', lineSmooth: true, alignTo: 'none', fontWeight: 400, lineLength: 20 },
    legend: { show: false },
    animation: { type: 'scale', easing: 'elastic', stagger: 'random', duration: 1200 },
  });
  return () => chart.destroy();
}
