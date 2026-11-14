import { createTerminal } from 'openchartscandle/candlestick';
import { datafeed, h } from '../data';

// Cores das velas (corpo, pavio, contorno), fundo e grelha — e mudanças ao vivo com applyTheme().
const PALETTES = {
  Neon: { bg: '#0b1020', grid: 'transparent', up: '#0b1020', down: '#ff4d8d', borderUp: '#00e0c6', wickUp: '#00e0c6', borderDown: '#ff4d8d', wickDown: '#ff4d8d', candleBorder: true, accent: '#00e0c6' },
  Clássico: { bg: '#131722', grid: 'rgba(42,46,57,0.55)', up: '#089981', down: '#f23645', wickUp: '#089981', wickDown: '#f23645', borderUp: '#089981', borderDown: '#f23645', candleBorder: false, accent: '#2962ff' },
  'Preto e branco': { bg: '#000000', grid: 'rgba(255,255,255,0.06)', up: '#ffffff', down: '#000000', wickUp: '#9e9e9e', wickDown: '#9e9e9e', borderUp: '#ffffff', borderDown: '#ffffff', candleBorder: true, accent: '#ffffff' },
  Oceano: { bg: '#071a2b', grid: 'rgba(80,140,200,0.12)', up: '#4fc3f7', down: '#ffb74d', wickUp: '#4fc3f7', wickDown: '#ffb74d', borderUp: '#4fc3f7', borderDown: '#ffb74d', candleBorder: false, accent: '#4fc3f7' },
};

export function mount(el: HTMLElement): () => void {
  const host = h('div', { class: 'ex-fill' });
  const bar = h('div', { class: 'ex-toolbar' }, h('span', { class: 'ex-label', text: 'Paleta:' }));
  el.append(bar, host);

  const terminal = createTerminal(host, {
    datafeed,
    symbol: 'SIMSOL',
    timeframe: '5',
    minimal: true,
    legend: true,
    storageKey: null,
    theme: PALETTES.Neon,
  });

  for (const [name, theme] of Object.entries(PALETTES)) {
    bar.append(h('button', { class: 'ex-btn', text: name, onclick: () => terminal.applyTheme(theme) }));
  }

  return () => terminal.destroy();
}
