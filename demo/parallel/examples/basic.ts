import { createParallelChart, type ParallelOptions } from 'openchartscandle/parallel';
import { STOCK_AXES, choice, h, select, stocks, withToolbar } from '../data';

// 400 empresas (geradas) em sete dimensões, coloridas pelo valor de uma delas (visualMap). Arrasta ao longo de
// um eixo para selecionar um intervalo; vários eixos juntam as condições; arrasta dentro da seleção para a
// mover e clica no eixo para a limpar. Arrasta o nome de um eixo para o mudar de lugar. Os botões mudam o
// layout e a dimensão das cores com setOptions().
export function mount(el: HTMLElement): () => void {
  const list = stocks(400, 5);
  const info = h('span', { class: 'ex-label' });
  const dims: [string, number][] = STOCK_AXES.slice(0, 6).map((a, i) => [a.name, i]);
  const visualMap = (dimension: number): ParallelOptions['visualMap'] => ({ dimension, colors: ['#2962ff', '#00bcd4', '#8bc34a', '#ffc107', '#f23645'] });
  const host = withToolbar(
    el,
    choice('Layout', [['Horizontal', 'horizontal'], ['Vertical', 'vertical']] as [string, 'horizontal' | 'vertical'][], 'horizontal', (layout) => chart.setOptions({ layout })),
    select('Cor por', dims, 4, (d) => chart.setOptions({ visualMap: visualMap(d) }, false)),
    choice('Linhas', [['Retas', false], ['Curvas', true]] as [string, boolean][], false, (smooth) => chart.setOptions({ smooth }, false)),
    h('button', { class: 'ex-btn', text: 'Limpar seleção', onclick: () => chart.clearBrush() }),
    info,
  );
  const chart = createParallelChart(host, {
    axes: STOCK_AXES,
    series: [{ name: 'Empresas', data: list.map((s) => ({ name: `${s.name} · ${s.sector}`, value: s.value })) }],
    visualMap: visualMap(4),
    lineWidth: 1,
    opacity: 0.5,
    valueFormatter: (v, axis) => (typeof v === 'number' ? v.toLocaleString('pt-PT', { maximumFractionDigits: 2 }) + (axis.name.endsWith('%') ? ' %' : '') : v),
  });
  const show = (count: number, total: number): void => void (info.textContent = `${count} de ${total} selecionadas`);
  chart.on('brush', (e) => show(e.count, e.total));
  chart.setBrush([{ axis: 4, from: 15, to: 80 }]);
  return () => chart.destroy();
}
