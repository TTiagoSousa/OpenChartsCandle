import { parseColor } from '../core/utils';
import { h } from './dom';

const GRAYS = ['#ffffff', '#d1d4dc', '#b2b5be', '#9598a1', '#787b86', '#5d606b', '#434651', '#2a2e39', '#131722', '#000000'];
const HUES = ['#f23645', '#ff9800', '#ffeb3b', '#4caf50', '#089981', '#00bcd4', '#2962ff', '#673ab7', '#9c27b0', '#e91e63'];
const MIX = [0.8, 0.6, 0.4, 0.2, 0, -0.2, -0.4];

function mix(hex: string, k: number): string {
  const { r, g, b } = parseColor(hex);
  const t = k > 0 ? 255 : 0;
  const a = Math.abs(k);
  const f = (c: number): number => Math.round(c + (t - c) * a);
  return '#' + [f(r), f(g), f(b)].map((x) => x.toString(16).padStart(2, '0')).join('');
}

export function rgba(hex: string, alpha: number): string {
  const { r, g, b } = parseColor(hex);
  return alpha >= 1 ? '#' + [r, g, b].map((x) => Math.round(x).toString(16).padStart(2, '0')).join('') : `rgba(${r},${g},${b},${+alpha.toFixed(2)})`;
}

/** TradingView-like palette with opacity slider. */
export function colorPicker(initial: string, onChange: (color: string) => void, withOpacity = true): HTMLElement {
  const init = parseColor(initial);
  let alpha = init.a;
  let base = '#' + [init.r, init.g, init.b].map((x) => Math.round(x).toString(16).padStart(2, '0')).join('');
  const root = h('div', { class: 'tc-color-picker' });
  const grid = h('div', { class: 'tc-color-picker__grid' });
  const all: string[] = [...GRAYS];
  for (const k of MIX) for (const hue of HUES) all.push(mix(hue, k));
  const swatches: HTMLElement[] = [];
  const refresh = (): void => {
    swatches.forEach((s) => s.classList.toggle('is-active', s.dataset.c === base.toLowerCase()));
    slider.style.setProperty('--c', base);
    pct.textContent = `${Math.round(alpha * 100)}%`;
  };
  for (const c of all) {
    const s = h('button', { class: 'tc-color-picker__swatch', style: `background:${c}`, 'data-c': c.toLowerCase() });
    s.addEventListener('click', () => {
      base = c;
      refresh();
      onChange(rgba(base, alpha));
    });
    swatches.push(s);
    grid.append(s);
  }
  root.append(grid);
  const slider = h('input', { type: 'range', min: 0, max: 100, value: Math.round(alpha * 100), class: 'tc-color-picker__opacity' }) as HTMLInputElement;
  const pct = h('span', { class: 'tc-color-picker__pct' });
  slider.addEventListener('input', () => {
    alpha = Number(slider.value) / 100;
    refresh();
    onChange(rgba(base, alpha));
  });
  if (withOpacity) root.append(h('div', { class: 'tc-color-picker__row' }, h('span', { class: 'tc-color-picker__label' }, 'Opacidade'), slider, pct));
  refresh();
  return root;
}
