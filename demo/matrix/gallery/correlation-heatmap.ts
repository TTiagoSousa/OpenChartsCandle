import { heatmapCorrelation } from 'openchartscandle/heatmap';
import { createMatrixChart } from 'openchartscandle/matrix';
import { ASSETS, assetReturns } from '../data';

// Correlação entre os retornos diários de oito ativos (dados inventados a partir de fatores comuns).
// Células quadradas, cor de -1 (azul) a 1 (vermelho) com o valor por dentro e a barra de cores à direita.
// O rato acende a linha e a coluna do par.
export function mount(el: HTMLElement): () => void {
  const corr = heatmapCorrelation(assetReturns());
  const chart = createMatrixChart(el, {
    x: { data: ASSETS, label: { fontSize: 11 } },
    y: { data: ASSETS, label: { fontSize: 11 } },
    data: corr.map((row) => row.map((v) => +v.toFixed(2))),
    cellAspect: 1,
    gap: 2,
    visualMap: { min: -1, max: 1, colors: ['#1848cc', '#5b8def', '#2a2e39', '#ef5350', '#b71c1c'], formatter: (v) => v.toFixed(1) },
    label: { fontSize: 11 },
    valueFormatter: (v) => v.toFixed(2),
    tooltip: { formatter: (c) => `<b>${c.yName} × ${c.xName}</b><br/>Correlação: ${(c.value as number).toFixed(2)}` },
  });
  return () => chart.destroy();
}
