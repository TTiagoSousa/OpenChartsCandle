import { createRadarChart } from 'openchartscandle/radar';
import { AQI_INDICATORS, airQuality } from '../data';

// Qualidade do ar de um mês em três cidades: um polígono por dia (31 por cidade), finos e transparentes, num
// radar circular com faixas. Clica numa cidade da legenda para a esconder. Dados gerados.
export function mount(el: HTMLElement): () => void {
  const city = (name: string, color: string, level: number, seed: number) => ({
    name,
    color,
    width: 1,
    area: { opacity: 0.04 },
    points: false as const,
    data: airQuality(level, seed).map((value, i) => ({ name: `${name}, dia ${i + 1}`, value })),
  });
  const chart = createRadarChart(el, {
    background: '#161627',
    title: { text: 'Qualidade do ar', subtext: 'Um polígono por dia de outubro' },
    indicators: AQI_INDICATORS,
    shape: 'circle',
    splitNumber: 5,
    splitArea: { colors: ['rgba(238,197,102,0.04)', 'rgba(238,197,102,0.1)'] },
    splitLine: { color: 'rgba(238,197,102,0.3)' },
    axisLine: { color: 'rgba(238,197,102,0.3)' },
    axisName: { color: 'rgb(238,197,102)' },
    series: [city('Lisboa', '#f9713c', 1.1, 3), city('Porto', '#b3e4a1', 0.8, 5), city('Coimbra', '#4cabce', 0.55, 7)],
    legend: { position: 'bottom' },
  });
  return () => chart.destroy();
}
