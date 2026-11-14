import { createTerminal } from 'openchartscandle/candlestick';
import { datafeed, h } from '../data';

// Desenhos por código: chart.drawings.add(tipo, pontos, opções), exportar/importar JSON
// (para guardar no teu backend) e eventos de alteração.
export function mount(el: HTMLElement): () => void {
  const json = h('textarea', { class: 'ex-json' });
  json.spellcheck = false;
  const bar = h('div', { class: 'ex-toolbar' });
  const host = h('div', { class: 'ex-fill' });
  const side = h('div', { class: 'ex-side' }, h('div', { class: 'ex-label', text: 'JSON dos desenhos (toJSON / fromJSON)' }), json);
  el.append(bar, h('div', { class: 'ex-row' }, host, side));

  const terminal = createTerminal(host, { datafeed, symbol: 'SIMBTC', timeframe: '15', watchlist: false, bottomBar: false, compact: true, storageKey: null });
  const chart = terminal.chart;
  const dm = chart.drawings;

  const range = (n: number) => {
    const bars = chart.bars.slice(-n);
    let lo = bars[0];
    let hi = bars[0];
    for (const b of bars) {
      if (b.low < lo.low) lo = b;
      if (b.high > hi.high) hi = b;
    }
    return { lo, hi, first: bars[0], last: bars[bars.length - 1] };
  };

  bar.append(
    h('button', { class: 'ex-btn', text: 'Fibonacci (100 velas)', onclick: () => {
      const { lo, hi } = range(100);
      const [a, b] = lo.time < hi.time ? [lo, hi] : [hi, lo];
      dm.add('fib', [{ time: a.time, price: a === lo ? lo.low : hi.high }, { time: b.time, price: b === lo ? lo.low : hi.high }]);
    } }),
    h('button', { class: 'ex-btn', text: 'Máximo e mínimo', onclick: () => {
      const { lo, hi } = range(100);
      dm.add('hray', [{ time: hi.time, price: hi.high }], { color: '#f23645', text: 'Máximo' });
      dm.add('hray', [{ time: lo.time, price: lo.low }], { color: '#089981', text: 'Mínimo' });
    } }),
    h('button', { class: 'ex-btn', text: 'Tendência', onclick: () => {
      const { first, last } = range(60);
      dm.add('trendline', [{ time: first.time, price: first.close }, { time: last.time, price: last.close }], { color: '#ff9800', width: 2, extendRight: true });
    } }),
    h('button', { class: 'ex-btn', text: 'Perfil de volume', onclick: () => {
      const { first, last } = range(80);
      dm.add('frvp', [{ time: first.time, price: first.close }, { time: last.time, price: last.close }]);
    } }),
    h('button', { class: 'ex-btn', text: 'Posição long', onclick: () => {
      const { last } = range(30);
      dm.add('long', [
        { time: last.time, price: last.close },
        { time: last.time + 20 * chart.data.tf, price: last.close * 1.01 }, // alvo
        { time: last.time + 20 * chart.data.tf, price: last.close * 0.995 }, // stop
      ]);
    } }),
    h('span', { class: 'ex-sep' }),
    h('button', { class: 'ex-btn', text: 'Desfazer', onclick: () => dm.undo() }),
    h('button', { class: 'ex-btn', text: 'Limpar', onclick: () => dm.clearAll() }),
    h('button', { class: 'ex-btn', text: 'Importar JSON', onclick: () => {
      try {
        dm.fromJSON(JSON.parse(json.value));
      } catch {
        json.classList.add('is-error');
        setTimeout(() => json.classList.remove('is-error'), 800);
      }
    } }),
  );

  // sempre que um desenho muda, mostra o JSON (é isto que guardarias no backend)
  const show = (): void => {
    json.value = JSON.stringify(dm.toJSON(), null, 1);
  };
  const off = dm.changed.on(show);
  show();

  return () => {
    off();
    terminal.destroy();
  };
}
