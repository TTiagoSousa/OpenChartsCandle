import { createLineChart, type LineChart, type LinePoint } from 'openchartscandle/line';

// Curvas de animação (easing): uma mini linha por função, em grelha, com o preset sparkline.
const EASINGS: Record<string, (t: number) => number> = {
  linear: (t) => t,
  quadraticIn: (t) => t * t,
  quadraticOut: (t) => t * (2 - t),
  quadraticInOut: (t) => (t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t),
  cubicIn: (t) => t ** 3,
  cubicOut: (t) => --t * t * t + 1,
  cubicInOut: (t) => (t < 0.5 ? 4 * t ** 3 : (t - 1) * (2 * t - 2) * (2 * t - 2) + 1),
  sinusoidalInOut: (t) => 0.5 * (1 - Math.cos(Math.PI * t)),
  exponentialIn: (t) => (t === 0 ? 0 : 1024 ** (t - 1)),
  exponentialOut: (t) => (t === 1 ? 1 : 1 - 2 ** (-10 * t)),
  circularInOut: (t) => ((t *= 2) < 1 ? -0.5 * (Math.sqrt(1 - t * t) - 1) : 0.5 * (Math.sqrt(1 - (t -= 2) * t) + 1)),
  elasticOut: (t) => (t === 0 || t === 1 ? t : 2 ** (-10 * t) * Math.sin(((t - 0.1) * 2 * Math.PI) / 0.4) + 1),
  backIn: (t) => t * t * (2.70158 * t - 1.70158),
  backOut: (t) => --t * t * (2.70158 * t + 1.70158) + 1,
  bounceOut: (t) =>
    t < 1 / 2.75 ? 7.5625 * t * t : t < 2 / 2.75 ? 7.5625 * (t -= 1.5 / 2.75) * t + 0.75 : t < 2.5 / 2.75 ? 7.5625 * (t -= 2.25 / 2.75) * t + 0.9375 : 7.5625 * (t -= 2.625 / 2.75) * t + 0.984375,
  bounceInOut: (t) => {
    const out = (u: number): number => EASINGS.bounceOut(u);
    return t < 0.5 ? (1 - out(1 - t * 2)) * 0.5 : out(t * 2 - 1) * 0.5 + 0.5;
  },
};

export function mount(el: HTMLElement): () => void {
  const grid = document.createElement('div');
  grid.style.cssText = 'display:grid;grid-template-columns:repeat(auto-fill,minmax(150px,1fr));gap:10px;height:100%;overflow:auto;padding:10px;box-sizing:border-box;color-scheme:dark;scrollbar-width:thin';
  el.append(grid);
  const charts: LineChart[] = Object.entries(EASINGS).map(([name, f], i) => {
    const cell = document.createElement('div');
    cell.style.cssText = 'display:flex;flex-direction:column;min-height:110px';
    const title = document.createElement('div');
    title.textContent = name;
    title.style.cssText = 'font-size:11px;opacity:.75;margin-bottom:2px';
    const box = document.createElement('div');
    box.style.flex = '1';
    cell.append(title, box);
    grid.append(cell);
    const data: LinePoint[] = Array.from({ length: 61 }, (_, k) => ({ x: k / 60, y: +f(k / 60).toFixed(4) }));
    return createLineChart(box, {
      series: [{ name, data, width: 1.5, area: { opacity: 0.12 } }],
      colors: [['#2962ff', '#ff9800', '#089981', '#f23645', '#9c27b0', '#00bcd4'][i % 6]],
      xType: 'number',
      sparkline: true,
      yAxis: { show: false, grid: true, min: -0.4, max: 1.4, ticks: 2 },
      tooltip: { show: false },
    });
  });
  return () => {
    charts.forEach((c) => c.destroy());
    grid.remove();
  };
}
