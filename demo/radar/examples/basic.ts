import { createRadarChart, type RadarSeries } from 'openchartscandle/radar';
import { seeded, withToolbar } from '../data';

// Radar com dois fundos de investimento em seis indicadores (0–10, dados gerados). Passa o rato para ver os
// valores, clica na legenda para esconder um fundo, e "Novos dados" troca os valores com setSeries() animado.
const INDICATORS = ['Retorno', 'Estabilidade', 'Liquidez', 'Diversificação', 'Custos baixos', 'ESG'].map((name) => ({ name, max: 10 }));

export function mount(el: HTMLElement): () => void {
  const rnd = seeded(4);
  const values = (): number[] => INDICATORS.map(() => Math.round((3 + rnd() * 7) * 10) / 10);
  const series = (): RadarSeries[] => [
    { name: 'Fundo Ações', data: values(), area: true },
    { name: 'Fundo Obrigações', data: values(), area: true },
  ];
  const button = document.createElement('button');
  button.className = 'ex-btn';
  button.textContent = 'Novos dados';
  const info = document.createElement('span');
  info.className = 'ex-label';
  info.textContent = 'Clica num fundo.';
  const chart = createRadarChart(withToolbar(el, button, info), {
    title: { text: 'Fundos de investimento', subtext: 'Pontuação de 0 a 10 (dados gerados)', align: 'left' },
    indicators: INDICATORS,
    series: series(),
    splitArea: true,
    axisLabel: true,
    legend: { position: 'right' },
  });
  button.addEventListener('click', () => chart.setSeries(series()));
  chart.on('click', (p) => (info.textContent = `${p.name}: média ${(p.value.reduce<number>((a, b) => a + (b ?? 0), 0) / p.value.length).toFixed(1)}`));
  return () => chart.destroy();
}
