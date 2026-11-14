import { createCustomChart, type CustomElement } from 'openchartscandle/custom';
import { parliament } from '../data';

// Do parlamento à pizza e de volta: cada lugar é um elemento com id próprio. No parlamento é um círculo
// num hemiciclo; na pizza é uma fatia fina do setor do seu partido. A cada 3 s os lugares transformam-se
// de uma forma na outra (morphing). Clica para trocar já.
export function mount(el: HTMLElement): () => void {
  const parties = parliament();
  const total = parties.reduce((s, p) => s + p[1], 0);
  let pie = false;

  /** Seat centers of a hemicycle, left to right, with the seat radius. */
  const hemicycle = (cx: number, cy: number, R: number): { pts: [number, number][]; r: number } => {
    const rows = 8;
    const r0 = R * 0.38;
    const gap = (R - r0) / (rows - 1);
    const lens = Array.from({ length: rows }, (_, i) => r0 + i * gap);
    const sum = lens.reduce((a, b) => a + b, 0);
    const counts = lens.map((l) => Math.floor((l / sum) * total));
    let rest = total - counts.reduce((a, b) => a + b, 0);
    for (let i = rows - 1; rest > 0; i = (i - 1 + rows) % rows, rest--) counts[i]++;
    const seats: { a: number; x: number; y: number }[] = [];
    lens.forEach((rr, i) => {
      const n = counts[i];
      for (let j = 0; j < n; j++) {
        const a = Math.PI + (n === 1 ? 0.5 : j / (n - 1)) * Math.PI;
        seats.push({ a, x: cx + rr * Math.cos(a), y: cy + rr * Math.sin(a) });
      }
    });
    seats.sort((p, q) => p.a - q.a);
    return { pts: seats.map((s) => [s.x, s.y]), r: gap * 0.38 };
  };

  const chart = createCustomChart(el, {
    coordinateSystem: 'none',
    animation: { duration: 1000, easing: 'cubicInOut' },
    series: [
      {
        name: 'Parlamento',
        data: parties,
        dimensions: ['Partido', 'Lugares'],
        encode: { itemName: 0, tooltip: [1] },
        emphasis: { style: { opacity: 1 }, focus: 'self' },
        renderItem: (p, api) => {
          const R = api.rect;
          const first = parties.slice(0, p.dataIndex).reduce((s, q) => s + q[1], 0);
          const n = Number(api.value(1));
          const color = String(parties[p.dataIndex][2]);
          const seats: CustomElement[] = [];
          if (pie) {
            const cx = R.x + R.width / 2;
            const cy = R.y + R.height / 2;
            const r = Math.min(R.width, R.height) * 0.44;
            const da = (Math.PI * 2) / total;
            for (let k = 0; k < n; k++) {
              const a = -Math.PI / 2 + (first + k) * da;
              seats.push({ type: 'sector', id: `s${first + k}`, shape: { cx, cy, r, r0: 0, startAngle: a, endAngle: a + da }, style: { fill: color, stroke: color, lineWidth: 0.6 } });
            }
          } else {
            const Rr = Math.min(R.width / 2 - 8, R.height * 0.92) * 0.94;
            const { pts, r } = hemicycle(R.x + R.width / 2, R.y + R.height / 2 + Rr / 2, Rr);
            for (let k = 0; k < n; k++) {
              const [x, y] = pts[first + k];
              seats.push({ type: 'circle', id: `s${first + k}`, shape: { cx: x, cy: y, r }, style: { fill: color, stroke: color, lineWidth: 0.6 } });
            }
          }
          return { type: 'group', children: seats };
        },
      },
    ],
    graphic: ({ rect, theme }) =>
      pie
        ? null
        : { type: 'text', id: 'total', x: rect.x + rect.width / 2, y: rect.y + rect.height * 0.5 + (Math.min(rect.width / 2 - 8, rect.height * 0.92) * 0.94) / 2 - 2, style: { text: `${total} lugares`, fill: theme.text, fontSize: 13, fontWeight: 600, align: 'center', verticalAlign: 'bottom' } },
  });
  const flip = (): void => {
    pie = !pie;
    chart.refresh(true);
  };
  const timer = window.setInterval(flip, 3000);
  el.addEventListener('click', flip);
  return () => {
    clearInterval(timer);
    el.removeEventListener('click', flip);
    chart.destroy();
  };
}
