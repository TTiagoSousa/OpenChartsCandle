import { createTreeChart, type TreeChartNode } from 'openchartscandle/tree';
import { marketsTree } from '../data';

// Duas árvores no mesmo gráfico, cada uma no seu espaço (left / right / top / bottom) e com o seu símbolo.
// A legenda esconde uma delas.
export function mount(el: HTMLElement): () => void {
  const branch = (name: string): TreeChartNode => marketsTree().children!.find((c) => c.name === name)!;
  const chart = createTreeChart(el, {
    trees: [
      { name: 'Ações', data: branch('Ações'), left: '1%', right: '50%', top: '4%', bottom: '4%', symbol: 'emptyCircle' },
      { name: 'Cripto e forex', data: { name: 'Alternativos', children: [branch('Cripto'), branch('Forex')] }, left: '52%', right: '1%', top: '12%', bottom: '12%', symbol: 'diamond', symbolSize: 8 },
    ],
    label: { fontSize: 11 },
  });
  return () => chart.destroy();
}
