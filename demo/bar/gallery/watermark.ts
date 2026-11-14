import { createBarChart } from 'openchartscandle/bar';
import { createPieChart } from 'openchartscandle/pie';

// Downloads por biblioteca: barras à esquerda com uma marca de água desenhada com `graphic`
// e a mesma divisão numa pizza à direita.
const DATA: [string, number][] = [
  ['React', 3420],
  ['Vue', 2210],
  ['Angular', 1830],
  ['Svelte', 1120],
  ['Solid', 640],
  ['Preact', 510],
  ['Lit', 380],
  ['Qwik', 240],
];

export function mount(el: HTMLElement): () => void {
  el.style.display = 'flex';
  const left = document.createElement('div');
  const right = document.createElement('div');
  left.style.cssText = 'flex:3;min-width:0;height:100%';
  right.style.cssText = 'flex:2;min-width:0;height:100%';
  el.append(left, right);
  const bars = createBarChart(left, {
    orientation: 'horizontal',
    categories: DATA.map((d) => d[0]),
    series: [{ name: 'Downloads (k)', data: DATA.map((d) => d[1]) }],
    sort: 'desc',
    labels: { show: true },
    legend: { show: false },
    graphic: (ctx, api) => {
      // repeated rotated text across the whole canvas
      ctx.font = `700 16px ${api.theme.font}`;
      ctx.fillStyle = 'rgba(255,255,255,0.05)';
      ctx.textAlign = 'center';
      for (let y = 30; y < api.height + 60; y += 70)
        for (let x = (y / 70) % 2 ? 60 : 0; x < api.width + 120; x += 160) {
          ctx.save();
          ctx.translate(x, y);
          ctx.rotate(-0.4);
          ctx.fillText('openchartscandle', 0, 0);
          ctx.restore();
        }
    },
  });
  const pie = createPieChart(right, { data: DATA.map(([label, value]) => ({ label, value })), innerRadius: 0.5, legend: { show: false } });
  return () => {
    bars.destroy();
    pie.destroy();
    left.remove();
    right.remove();
    el.style.display = '';
  };
}
