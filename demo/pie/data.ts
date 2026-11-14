import type { PieDatum } from 'openchartscandle/pie';

/** Sample datasets used by the pie examples. */

export const portfolio: PieDatum[] = [
  { label: 'Ações EUA', value: 42500 },
  { label: 'Ações Europa', value: 18200 },
  { label: 'Obrigações', value: 15800 },
  { label: 'Cripto', value: 9600 },
  { label: 'Ouro', value: 6100 },
  { label: 'Liquidez', value: 4300 },
];

export const marketShare: PieDatum[] = [
  { label: 'Binance', value: 38.2 },
  { label: 'Coinbase', value: 14.6 },
  { label: 'OKX', value: 11.9 },
  { label: 'Bybit', value: 10.4 },
  { label: 'Kraken', value: 6.8 },
  { label: 'Bitget', value: 5.1 },
  { label: 'KuCoin', value: 3.9 },
  { label: 'Gate', value: 2.6 },
  { label: 'HTX', value: 2.2 },
  { label: 'MEXC', value: 1.7 },
  { label: 'Bitfinex', value: 1.3 },
  { label: 'Gemini', value: 0.8 },
  { label: 'Outras', value: 0.5 },
];

export const sectors: PieDatum[] = [
  { label: 'Tecnologia', value: 31 },
  { label: 'Saúde', value: 13 },
  { label: 'Financeiro', value: 12 },
  { label: 'Consumo', value: 10 },
  { label: 'Indústria', value: 9 },
  { label: 'Comunicações', value: 8 },
  { label: 'Energia', value: 5 },
  { label: 'Imobiliário', value: 4 },
  { label: 'Materiais', value: 3 },
  { label: 'Utilities', value: 3 },
  { label: 'Outros', value: 2 },
];

export const monthlyVolume: PieDatum[] = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'].map((label, i) => ({
  label,
  value: Math.round(40 + 35 * Math.sin(i / 2) + i * 4),
}));

export const eur = (v: number): string => v.toLocaleString('pt-PT', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 });

/** Small DOM helper used by the examples. */
export function h<K extends keyof HTMLElementTagNameMap>(
  tag: K,
  props: { class?: string; text?: string; style?: string; onclick?: () => void } = {},
  ...children: (Node | string | null)[]
): HTMLElementTagNameMap[K] {
  const e = document.createElement(tag);
  if (props.class) e.className = props.class;
  if (props.text) e.textContent = props.text;
  if (props.style) e.setAttribute('style', props.style);
  if (props.onclick) e.addEventListener('click', props.onclick);
  for (const c of children) if (c !== null) e.append(c);
  return e;
}

/** Toolbar with buttons where only one is active at a time. */
export function choice<T>(label: string, items: [string, T][], initial: T, onPick: (v: T) => void): HTMLElement {
  const wrap = h('div', { class: 'ex-choice' }, h('span', { class: 'ex-label', text: label }));
  const buttons = items.map(([text, value]) => {
    const b = h('button', { class: `ex-btn${value === initial ? ' is-on' : ''}`, text });
    b.addEventListener('click', () => {
      buttons.forEach((x) => x.classList.remove('is-on'));
      b.classList.add('is-on');
      onPick(value);
    });
    return b;
  });
  wrap.append(...buttons);
  return wrap;
}

/** Split a gallery box into a grid of cells, each the host of one chart. */
export function cells(el: HTMLElement, n: number, columns = n, gap = 8): HTMLElement[] {
  const grid = document.createElement('div');
  grid.style.cssText = `display:grid;grid-template-columns:repeat(${columns},minmax(0,1fr));grid-auto-rows:minmax(0,1fr);gap:${gap}px;height:100%;box-sizing:border-box`;
  el.append(grid);
  return Array.from({ length: n }, () => {
    const c = document.createElement('div');
    c.style.cssText = 'min-width:0;min-height:0;position:relative';
    grid.append(c);
    return c;
  });
}
