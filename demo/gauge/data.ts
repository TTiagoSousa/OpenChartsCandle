/** Helpers for the gauge examples (DOM helpers shared with the line examples). */
export { choice, h } from '../line/data';

/** Grid of labelled cells, each with a fixed-height host for one gauge. */
export function gaugeGrid(el: HTMLElement, titles: string[], height = 240, className = 'pc-demo-card--dark'): HTMLElement[] {
  const grid = document.createElement('div');
  grid.className = 'pc-demo-grid gc-demo-grid';
  const scroll = document.createElement('div');
  scroll.className = 'ex-scroll pc-demo-bg';
  scroll.append(grid);
  el.append(scroll);
  return titles.map((t) => {
    const card = document.createElement('section');
    card.className = `pc-demo-card ${className}`;
    const h3 = document.createElement('h3');
    h3.textContent = t;
    const body = document.createElement('div');
    body.style.height = `${height}px`;
    card.append(h3, body);
    grid.append(card);
    return body;
  });
}
