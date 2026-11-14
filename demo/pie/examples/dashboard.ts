import { createTerminal } from 'openchartscandle/candlestick';
import { createPieChart } from 'openchartscandle/pie';
import { datafeed } from '../../candlestick/data';
import { eur, h, portfolio, sectors } from '../data';

// Dashboard que junta famílias: pizzas da carteira ao lado de um gráfico de velas.
// Clicar numa fatia da carteira muda o símbolo do gráfico de velas.
const SYMBOL_OF: Record<string, string> = { 'Ações EUA': 'SIMNDX', 'Ações Europa': 'ACME', Cripto: 'SIMBTC', Ouro: 'XAUSIM', Obrigações: 'EURSIM', Liquidez: 'EURSIM' };

export function mount(el: HTMLElement): () => void {
  const card = (title: string, body: HTMLElement): HTMLElement => h('section', { class: 'ex-dash-card' }, h('h3', { text: title }), body);
  const pie1 = h('div', { class: 'ex-dash-body' });
  const pie2 = h('div', { class: 'ex-dash-body' });
  const candles = h('div', { class: 'ex-dash-body ex-dash-body--tall' });
  el.append(
    h('div', { class: 'ex-scroll' },
      h('div', { class: 'ex-dash' },
        card('Carteira por classe (clica numa fatia)', pie1),
        card('Exposição por setor', pie2),
        h('section', { class: 'ex-dash-card ex-dash-card--wide' }, h('h3', { text: 'Ativo selecionado' }), candles),
      ),
    ),
  );

  const allocation = createPieChart(pie1, { data: portfolio, innerRadius: 0.6, padAngle: 1, cornerRadius: 3, valueFormatter: eur, legend: { position: 'right', values: false }, labels: { show: false }, theme: { background: '#161a25' } });
  const exposure = createPieChart(pie2, { data: sectors, sort: 'desc', groupBelow: 5, valueFormatter: (v) => `${v}%`, legend: { position: 'right', values: false }, labels: { position: 'inside' }, theme: { background: '#161a25' } });
  const terminal = createTerminal(candles, { datafeed, symbol: 'SIMNDX', timeframe: '15', minimal: true, legend: true, compact: true, mouseWheel: false, storageKey: null, theme: { bg: '#161a25' } });

  const off = allocation.on('select', (s) => {
    const sym = s && SYMBOL_OF[s.label];
    if (sym) void terminal.setSymbol(sym);
  });

  return () => {
    off();
    allocation.destroy();
    exposure.destroy();
    terminal.destroy();
  };
}
