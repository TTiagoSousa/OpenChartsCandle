import type { LinePoint } from 'openchartscandle/line';

/** Sample data for the line examples. */

/** Deterministic pseudo-random generator, so the examples look the same on every load. */
export function rng(seed: number): () => number {
  let s = seed >>> 0;
  return () => {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = Math.imul(s ^ (s >>> 15), s | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const DAY = 86400;

/** Daily random-walk series ending today. */
export function walk(seed: number, days: number, start: number, vol = 0.02, drift = 0.0005): LinePoint[] {
  const r = rng(seed);
  const today = Math.floor(Date.now() / 1000 / DAY) * DAY;
  let v = start;
  const out: LinePoint[] = [];
  for (let i = days - 1; i >= 0; i--) {
    v *= 1 + drift + (r() - 0.5) * 2 * vol;
    out.push({ x: today - i * DAY, y: +v.toFixed(2) });
  }
  return out;
}

/** Same series rebased to % change since the first point (to compare assets). */
export function rebase(points: LinePoint[]): LinePoint[] {
  const first = points[0].y ?? 1;
  return points.map((p) => ({ x: p.x, y: p.y === null ? null : +(((p.y - first) / first) * 100).toFixed(2) }));
}

export const MONTHS = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];

export const revenue = [42, 48, 51, 49, 58, 63, 61, 67, 72, 70, 78, 86];
export const costs = [30, 33, 35, 36, 38, 41, 43, 44, 46, 48, 49, 52];
export const profit = revenue.map((v, i) => v - costs[i]);

export const usd = (v: number): string => v.toLocaleString('pt-PT', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 });

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
