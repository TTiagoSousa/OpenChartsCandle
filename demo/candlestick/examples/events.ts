import { createTerminal } from 'openchartscandle/candlestick';
import { datafeed, h } from '../data';

// Eventos: o painel da direita mostra a vela debaixo do cursor (crosshairMoved)
// e um registo do que acontece no gráfico (desenhos, seleção, zoom, indicadores).
export function mount(el: HTMLElement): () => void {
  const ohlc = h('div', { class: 'ex-ohlc' });
  const log = h('div', { class: 'ex-log' });
  const host = h('div', { class: 'ex-fill' });
  el.append(h('div', { class: 'ex-row' }, host, h('div', { class: 'ex-side' }, h('div', { class: 'ex-label', text: 'Vela debaixo do cursor' }), ohlc, h('div', { class: 'ex-label', text: 'Eventos' }), log)));

  const terminal = createTerminal(host, { datafeed, symbol: 'SIMNDX', timeframe: '5', watchlist: false, bottomBar: false, compact: true, storageKey: null });
  const chart = terminal.chart;

  const write = (text: string): void => {
    const time = new Date().toLocaleTimeString();
    log.prepend(h('div', {}, h('span', { class: 'ex-muted', text: `${time} ` }), text));
    while (log.childElementCount > 60) log.lastChild?.remove();
  };

  const showBar = (i: number | null): void => {
    const b = chart.bars[i ?? chart.bars.length - 1];
    if (!b) return;
    const f = (x: number) => chart.fmt(x);
    const up = b.close >= b.open;
    ohlc.replaceChildren(
      ...[
        ['Hora', new Date(b.time * 1000).toLocaleString()],
        ['Abertura', f(b.open)],
        ['Máximo', f(b.high)],
        ['Mínimo', f(b.low)],
        ['Fecho', f(b.close)],
        ['Volume', b.volume.toFixed(2)],
      ].map(([k, v]) => h('div', { class: 'ex-kv' }, h('span', { text: k }), h('strong', { class: k === 'Fecho' ? (up ? 'up' : 'down') : '', text: v }))),
    );
  };

  let zoomTimer = 0;
  const offs = [
    chart.crosshairMoved.on(showBar),
    chart.drawings.changed.on(() => write(`desenhos alterados (${chart.drawings.drawings.length} no gráfico)`)),
    chart.drawings.selection.on((d) => write(d ? `selecionado: ${d.title}` : 'seleção limpa')),
    chart.drawings.toolChanged.on((t) => t && write(`ferramenta ativa: ${t}`)),
    chart.indicatorsChanged.on(() => write(`indicadores: ${chart.indicators.map((i) => i.title()).join(', ') || 'nenhum'}`)),
    chart.viewChanged.on(() => {
      clearTimeout(zoomTimer); // agrupa eventos de zoom/scroll seguidos
      zoomTimer = window.setTimeout(() => write(`vista: ${chart.ts.barSpacing.toFixed(1)} px por vela`), 300);
    }),
    chart.drawingDblClick.on((d) => write(`duplo clique em ${d.title}`)),
  ];
  void terminal.ready.then(() => {
    showBar(null);
    write('pronto — desenha, faz zoom ou passa o rato pelo gráfico');
  });

  return () => {
    offs.forEach((off) => off());
    clearTimeout(zoomTimer);
    terminal.destroy();
  };
}
