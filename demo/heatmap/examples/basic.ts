import { createHeatmapChart, heatmapCorrelation } from 'openchartscandle/heatmap';
import { ASSETS, assetReturns, select, withToolbar } from '../data';

// Matriz de correlação de oito ativos a partir de retornos diários (dados gerados): verde quando andam juntos,
// vermelho quando andam ao contrário. Passa o rato para ver a linha e a coluna, clica numa célula, e muda a
// janela de dias para recalcular com heatmapCorrelation().
const names = ASSETS.map(([n]) => n);

export function mount(el: HTMLElement): () => void {
  let seed = 3;
  let days = 120;
  const matrix = (): number[][] => heatmapCorrelation(assetReturns(days, seed));
  const button = document.createElement('button');
  button.className = 'ex-btn';
  button.textContent = 'Novos dados';
  const info = document.createElement('span');
  info.className = 'ex-label';
  info.textContent = 'Clica numa célula.';
  const pick = select(
    'Janela',
    [
      ['30 dias', 30],
      ['120 dias', 120],
      ['1 ano', 250],
    ],
    days,
    (d) => {
      days = d;
      chart.setMatrix(matrix());
    },
  );
  const chart = createHeatmapChart(withToolbar(el, pick, button, info), {
    title: { text: 'Correlação dos retornos diários', subtext: 'Coeficiente de Pearson (dados gerados)', align: 'left' },
    xAxis: { data: names },
    yAxis: { data: names, inverse: true },
    matrix: matrix(),
    square: true,
    cell: { gap: 2, radius: 3 },
    label: { format: (v) => v.toFixed(2) },
    valueFormatter: (v) => v.toFixed(2),
    emphasis: 'cross',
    visualMap: { min: -1, max: 1, colors: ['#f23645', '#f7f7f7', '#089981'], position: 'right', format: (v) => v.toFixed(1) },
  });
  button.addEventListener('click', () => {
    seed++;
    chart.setMatrix(matrix(), true);
  });
  chart.on('click', (c) => (info.textContent = `${c.yName} × ${c.xName}: ${c.value?.toFixed(2)}`));
  return () => chart.destroy();
}
