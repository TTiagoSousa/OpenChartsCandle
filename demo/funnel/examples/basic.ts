import { createFunnelChart, type FunnelOptions } from 'openchartscandle/funnel';
import { choice, h, withToolbar } from '../../scatter/data';
import { signupFunnel } from '../data';

// O funil de abertura de conta de uma corretora (dados inventados). Os botões mudam a ordem, a orientação e
// as etiquetas com setOptions(); "Novo mês" troca os valores com setData() animado. Clica numa etapa.
export function mount(el: HTMLElement): () => void {
  const info = h('span', { class: 'ex-label', text: 'Clica numa etapa.' });
  const month = (): ReturnType<typeof signupFunnel> =>
    signupFunnel().map((it, i) => ({ ...it, value: Math.round(it.value * (i ? 0.75 + Math.random() * 0.5 : 1)) }));
  const shapes: [string, FunnelOptions][] = [
    ['Funil', { sort: 'descending', orient: 'vertical' }],
    ['Pirâmide', { sort: 'ascending', orient: 'vertical' }],
    ['Horizontal', { sort: 'descending', orient: 'horizontal' }],
  ];
  const labels: [string, FunnelOptions['label']][] = [
    ['Por fora', { position: 'outside' }],
    ['Por dentro', { position: 'inside' }],
  ];
  const host = withToolbar(
    el,
    choice('Forma', shapes, shapes[0][1], (o) => chart.setOptions(o)),
    choice('Etiquetas', labels, labels[0][1], (label) => chart.setOptions({ label })),
    h('button', { class: 'ex-btn', text: 'Novo mês', onclick: () => chart.setData(month()) }),
    info,
  );
  const chart = createFunnelChart(host, {
    data: signupFunnel(),
    gap: 3,
    minSize: '12%',
    legend: { position: 'right' },
  });
  chart.on('click', (p) => (info.textContent = `${p.name}: ${p.value.toLocaleString('pt-PT')} · ${p.percentOfFirst.toFixed(1)}% das visitas`));
  return () => chart.destroy();
}
