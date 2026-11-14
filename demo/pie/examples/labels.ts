import { createPieChart, type PieLabelContent } from 'openchartscandle/pie';
import { choice, h, marketShare } from '../data';

// Etiquetas: dentro das fatias, fora com linhas-guia (sem se sobreporem) ou automático
// (dentro quando cabe). O conteúdo pode ser %, valor, nome ou uma função tua.
export function mount(el: HTMLElement): () => void {
  const host = h('div', { class: 'ex-fill' });
  const bar = h('div', { class: 'ex-toolbar' });
  el.append(bar, host);

  let position: 'inside' | 'outside' | 'auto' = 'outside';
  let content: PieLabelContent = 'label-percent';
  const chart = createPieChart(host, {
    data: marketShare,
    innerRadius: 0.45,
    sort: 'desc',
    legend: { show: false },
    labels: { position, content, minPercent: 1 },
    valueFormatter: (v) => `${v}%`,
    center: { title: 'Quota de mercado', value: 'Exchanges' },
  });
  const apply = (): void => chart.setOptions({ labels: { position, content, minPercent: 1 } });

  bar.append(
    choice<'inside' | 'outside' | 'auto'>('Posição', [['Fora', 'outside'], ['Dentro', 'inside'], ['Auto', 'auto']], position, (p) => ((position = p), apply())),
    choice<PieLabelContent>(
      'Conteúdo',
      [
        ['Nome + %', 'label-percent'],
        ['%', 'percent'],
        ['Valor', 'value'],
        ['Nome', 'label'],
        ['Função', ((s) => `${s.label} · #${s.index + 1}`) as PieLabelContent],
      ],
      content,
      (c) => ((content = c), apply()),
    ),
  );

  return () => chart.destroy();
}
