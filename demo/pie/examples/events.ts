import { createPieChart, type PieSlice } from 'openchartscandle/pie';
import { eur, h, portfolio } from '../data';

// Eventos: hover, click, select (clique seleciona e afasta a fatia) e toggle (legenda).
// O painel mostra a fatia selecionada com detalhe; os botões usam a API (select, toggle, highlight).
export function mount(el: HTMLElement): () => void {
  const host = h('div', { class: 'ex-fill' });
  const detail = h('div', { class: 'ex-ohlc' }, h('span', { class: 'ex-muted', text: 'Clica numa fatia…' }));
  const log = h('div', { class: 'ex-log' });
  const bar = h('div', { class: 'ex-toolbar' });
  el.append(bar, h('div', { class: 'ex-row' }, host, h('div', { class: 'ex-side' }, h('div', { class: 'ex-label', text: 'Selecionada' }), detail, h('div', { class: 'ex-label', text: 'Eventos' }), log)));

  const chart = createPieChart(host, { data: portfolio, innerRadius: 0.55, valueFormatter: eur, legend: { position: 'bottom' } });

  const write = (text: string): void => {
    log.prepend(h('div', {}, h('span', { class: 'ex-muted', text: `${new Date().toLocaleTimeString()} ` }), text));
    while (log.childElementCount > 40) log.lastChild?.remove();
  };
  const showDetail = (s: PieSlice | null): void => {
    detail.replaceChildren(
      ...(s
        ? [
            ['Ativo', s.label],
            ['Valor', eur(s.value)],
            ['Peso', `${s.percent.toFixed(2)}%`],
            ['Posição', `${s.index + 1}º`],
          ].map(([k, v]) => h('div', { class: 'ex-kv' }, h('span', { text: k }), h('strong', { text: v })))
        : [h('span', { class: 'ex-muted', text: 'Nenhuma fatia selecionada' })]),
    );
  };

  const offs = [
    chart.on('hover', (s) => s && write(`hover: ${s.label}`)),
    chart.on('click', (s) => s && write(`click: ${s.label}`)),
    chart.on('select', (s) => {
      write(s ? `select: ${s.label}` : 'seleção limpa');
      showDetail(s);
    }),
    chart.on('toggle', (s) => s && write(`${s.hidden ? 'escondida' : 'mostrada'}: ${s.label}`)),
  ];

  bar.append(
    h('button', { class: 'ex-btn', text: 'Selecionar a maior', onclick: () => chart.select([...chart.slices].sort((a, b) => b.value - a.value)[0].id) }),
    h('button', { class: 'ex-btn', text: 'Limpar seleção', onclick: () => chart.select(null) }),
    h('button', { class: 'ex-btn', text: 'Destacar "Ouro"', onclick: () => chart.highlight('Ouro') }),
    h('button', { class: 'ex-btn', text: 'Esconder/mostrar "Liquidez"', onclick: () => chart.toggle('Liquidez') }),
    h('button', {
      class: 'ex-btn',
      text: 'PNG',
      onclick: () => {
        const a = document.createElement('a');
        a.href = chart.screenshot();
        a.download = 'pizza.png';
        a.click();
      },
    }),
  );

  return () => {
    offs.forEach((off) => off());
    chart.destroy();
  };
}
