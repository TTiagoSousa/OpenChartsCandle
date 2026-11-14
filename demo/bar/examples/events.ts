import { createBarChart } from 'openchartscandle/bar';
import { QUARTERS, h } from '../data';

// Eventos e API: hover, click e toggle; e os métodos setValue(), updateSeries(), toggle(),
// highlight(), setOptions() e screenshot().
export function mount(el: HTMLElement): () => void {
  const host = h('div', { class: 'ex-fill' });
  const log = h('div', { class: 'ex-log' });
  const bar = h('div', { class: 'ex-toolbar' });
  el.append(bar, h('div', { class: 'ex-row' }, host, h('div', { class: 'ex-side' }, h('div', { class: 'ex-label', text: 'Eventos' }), log)));

  const chart = createBarChart(host, {
    categories: QUARTERS,
    series: [
      { name: 'Norte', data: [42, 48, 51, 57] },
      { name: 'Centro', data: [35, 39, 44, 41] },
      { name: 'Sul', data: [28, 31, 36, 40] },
    ],
    labels: { show: true },
    valueFormatter: (v) => `${v} k€`,
  });

  const write = (text: string): void => {
    log.prepend(h('div', {}, h('span', { class: 'ex-muted', text: `${new Date().toLocaleTimeString()} ` }), text));
    while (log.childElementCount > 40) log.lastChild?.remove();
  };
  const offs = [
    chart.on('hover', (c) => c && write(`hover: ${c.category} (total ${c.total})`)),
    chart.on('click', (d) => write(`click: ${d.series.name} · ${d.category} = ${d.value}`)),
    chart.on('toggle', (e) => write(`${e.hidden ? 'escondida' : 'mostrada'}: ${e.id}`)),
  ];

  let horizontal = false;
  bar.append(
    h('button', { class: 'ex-btn', text: 'T4 Norte aleatório', onclick: () => chart.setValue('Norte', 3, Math.round(30 + Math.random() * 50)) }),
    h('button', { class: 'ex-btn', text: 'Sul +20%', onclick: () => chart.updateSeries('Sul', { data: chart.series.find((s) => s.name === 'Sul')!.data.map((v) => Math.round((typeof v === 'number' ? v : 0) * 1.2)) }) }),
    h('button', { class: 'ex-btn', text: 'Esconder/mostrar Centro', onclick: () => chart.toggle('Centro') }),
    h('button', { class: 'ex-btn', text: 'Destacar Norte', onclick: () => chart.highlight('Norte') }),
    h('button', { class: 'ex-btn', text: 'Limpar destaque', onclick: () => chart.highlight(null) }),
    h('button', { class: 'ex-btn', text: 'Rodar', onclick: () => chart.setOptions({ orientation: (horizontal = !horizontal) ? 'horizontal' : 'vertical' }) }),
    h('button', {
      class: 'ex-btn',
      text: 'PNG',
      onclick: () => {
        const a = document.createElement('a');
        a.href = chart.screenshot();
        a.download = 'barras.png';
        a.click();
      },
    }),
  );

  return () => {
    offs.forEach((off) => off());
    chart.destroy();
  };
}
