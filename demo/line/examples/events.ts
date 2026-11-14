import { createLineChart } from 'openchartscandle/line';
import { MONTHS, costs, h, profit, revenue } from '../data';

// Eventos e API: hover, click, toggle e zoom; e os métodos highlight(), toggle(), addSeries(),
// removeSeries(), updateSeries() e screenshot().
export function mount(el: HTMLElement): () => void {
  const host = h('div', { class: 'ex-fill' });
  const log = h('div', { class: 'ex-log' });
  const bar = h('div', { class: 'ex-toolbar' });
  el.append(bar, h('div', { class: 'ex-row' }, host, h('div', { class: 'ex-side' }, h('div', { class: 'ex-label', text: 'Eventos' }), log)));

  const chart = createLineChart(host, {
    series: [
      { name: 'Receita', data: revenue },
      { name: 'Custos', data: costs },
    ],
    categories: MONTHS,
    points: true,
    zoom: true,
    valueFormatter: (v) => `${v} M€`,
  });

  const write = (text: string): void => {
    log.prepend(h('div', {}, h('span', { class: 'ex-muted', text: `${new Date().toLocaleTimeString()} ` }), text));
    while (log.childElementCount > 40) log.lastChild?.remove();
  };
  const offs = [
    chart.on('hover', (c) => c && write(`hover: ${c.label} (${c.points.map((p) => `${p.series.name} ${p.y}`).join(', ')})`)),
    chart.on('click', (c) => write(`click: ${c.label}`)),
    chart.on('toggle', (e) => write(`${e.hidden ? 'escondida' : 'mostrada'}: ${e.id}`)),
    chart.on('zoom', (r) => write(r ? `zoom: ${r.from.toFixed(1)} → ${r.to.toFixed(1)}` : 'zoom reposto')),
  ];

  let lucro = false;
  bar.append(
    h('button', { class: 'ex-btn', text: '+/− série Lucro', onclick: () => {
      lucro = !lucro;
      if (lucro) chart.addSeries({ name: 'Lucro', data: profit, color: '#089981', area: true });
      else chart.removeSeries('Lucro');
    } }),
    h('button', { class: 'ex-btn', text: 'Destacar Receita', onclick: () => chart.highlight('Receita') }),
    h('button', { class: 'ex-btn', text: 'Limpar destaque', onclick: () => chart.highlight(null) }),
    h('button', { class: 'ex-btn', text: 'Esconder/mostrar Custos', onclick: () => chart.toggle('Custos') }),
    h('button', { class: 'ex-btn', text: 'Custos +10%', onclick: () => chart.updateSeries('Custos', { data: (chart.series.find((s) => s.name === 'Custos')!.data as number[]).map((v) => Math.round(v * 1.1)) }) }),
    h('button', {
      class: 'ex-btn',
      text: 'PNG',
      onclick: () => {
        const a = document.createElement('a');
        a.href = chart.screenshot();
        a.download = 'linhas.png';
        a.click();
      },
    }),
  );

  return () => {
    offs.forEach((off) => off());
    chart.destroy();
  };
}
