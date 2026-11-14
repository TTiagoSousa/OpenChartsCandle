import { SimDatafeed } from './simulator';

/**
 * The data source used by all examples: a market simulator implementing the
 * library's `Datafeed` interface. In your app this would be Binance, your database, etc.
 */
export const datafeed = new SimDatafeed();

export { SIM_SYMBOLS } from './simulator';
export { PAGED_BLOCK, PAGED_SYMBOLS, PagedDatafeed } from './paged';
export { smaCrossTrades } from './strategy';
export { DEMO_SYMBOL, button, chartOptions, choice, externalTrades, inCard, makeBars, seeded, sma, withBar } from './gallery';

/** Small DOM helper used by the examples. */
export function h<K extends keyof HTMLElementTagNameMap>(
  tag: K,
  props: { class?: string; text?: string; style?: string; onclick?: () => void; title?: string } = {},
  ...children: (Node | string | null)[]
): HTMLElementTagNameMap[K] {
  const e = document.createElement(tag);
  if (props.class) e.className = props.class;
  if (props.text) e.textContent = props.text;
  if (props.style) e.setAttribute('style', props.style);
  if (props.title) e.title = props.title;
  if (props.onclick) e.addEventListener('click', props.onclick);
  for (const c of children) if (c !== null) e.append(c);
  return e;
}
