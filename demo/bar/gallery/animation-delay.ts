import { createBarChart, type BarChart } from 'openchartscandle/bar';

// Animação com atraso: cada coluna começa 10 ms depois da anterior (animation.stagger).
const cats = Array.from({ length: 100 }, (_, i) => `A${i}`);
const a = cats.map((_, i) => +((Math.sin(i / 5) * (i / 5 - 10) + i / 6) * 5).toFixed(1));
const b = cats.map((_, i) => +((Math.cos(i / 5) * (i / 5 - 10) + i / 6) * 5).toFixed(1));

export function mount(el: HTMLElement): () => void {
  el.style.position = 'relative';
  const box = document.createElement('div');
  box.style.cssText = 'position:absolute;inset:0';
  const btn = document.createElement('button');
  btn.className = 'ex-btn';
  btn.textContent = 'Repetir';
  btn.style.cssText = 'position:absolute;right:16px;top:8px;z-index:2';
  el.append(box, btn);
  let chart: BarChart;
  const create = (): void => {
    chart = createBarChart(box, {
      categories: cats,
      series: [
        { name: 'Barra 1', data: a },
        { name: 'Barra 2', data: b },
      ],
      barGap: 0,
      categoryGap: 0.2,
      radius: 1,
      animation: { duration: 600, stagger: 10 },
      legend: { position: 'top', align: 'start' },
    });
  };
  create();
  btn.addEventListener('click', () => {
    chart.destroy();
    create();
  });
  return () => {
    chart.destroy();
    box.remove();
    btn.remove();
  };
}
