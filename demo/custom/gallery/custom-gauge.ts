import { createCustomChart, type CustomElement } from 'openchartscandle/custom';

// Um velocímetro feito à mão com uma série própria: o arco de fundo, o arco do valor (um setor de anel com
// gradiente), as marcas, a agulha e o número. A cada 2 s chega um valor novo do "índice de medo e ganância"
// e o arco e a agulha deslizam até lá: com live: true o renderItem corre a cada frame e usa api.time para
// a animação (uma mola), em vez da transição automática.
export function mount(el: HTMLElement): () => void {
  let value = 62;
  let shown = 0;
  let speed = 0;
  let last = 0;
  const a0 = Math.PI * 0.75;
  const span = Math.PI * 1.5;
  const label = (v: number): string => (v < 25 ? 'Medo extremo' : v < 45 ? 'Medo' : v < 55 ? 'Neutro' : v < 75 ? 'Ganância' : 'Ganância extrema');
  const chart = createCustomChart(el, {
    coordinateSystem: 'none',
    tooltip: false,
    live: true,
    series: [
      {
        name: 'Índice',
        data: [value],
        renderItem: (p, api) => {
          // spring toward the value
          const dt = Math.min(0.05, (api.time - last) / 1000 || 0);
          last = api.time;
          speed += ((Number(api.value(0)) - shown) * 60 - speed * 9) * dt;
          shown += speed * dt;
          const v = Math.max(0, Math.min(100, shown));
          const R = api.rect;
          const cx = R.x + R.width / 2;
          const cy = R.y + R.height * 0.56;
          const r = Math.min(R.width / 2, R.height * 0.5) * 0.92;
          const th = Math.max(8, r * 0.14);
          const a = a0 + (v / 100) * span;
          const ticks: CustomElement[] = Array.from({ length: 11 }, (_, i) => {
            const t = a0 + (i / 10) * span;
            const r1 = r - th - 4;
            const r2 = r1 - (i % 5 ? 5 : 9);
            return {
              type: 'group',
              children: [
                { type: 'line', shape: { x1: cx + Math.cos(t) * r1, y1: cy + Math.sin(t) * r1, x2: cx + Math.cos(t) * r2, y2: cy + Math.sin(t) * r2 }, style: { stroke: api.theme.muted, lineWidth: i % 5 ? 1 : 2 } },
                r > 70 && i % 5 === 0
                  ? { type: 'text', x: cx + Math.cos(t) * (r2 - 10), y: cy + Math.sin(t) * (r2 - 10), style: { text: i * 10, fill: api.theme.muted, fontSize: 10, align: 'center', verticalAlign: 'middle' } }
                  : null,
              ],
            };
          });
          return {
            type: 'group',
            children: [
              { type: 'sector', shape: { cx, cy, r, r0: r - th, startAngle: a0, endAngle: a0 + span }, style: { fill: 'rgba(120,123,134,0.18)' } },
              {
                type: 'sector',
                shape: { cx, cy, r, r0: r - th, startAngle: a0, endAngle: a },
                style: { fill: { type: 'linear', global: true, x: cx - r, y: cy, x2: cx + r, y2: cy, stops: [[0, '#f23645'], [0.5, '#ffc107'], [1, '#089981']] } },
              },
              ...ticks,
              {
                type: 'group',
                x: cx,
                y: cy,
                rotation: a,
                children: [
                  { type: 'polygon', shape: { points: [[-10, -3.5], [r - th - 12, 0], [-10, 3.5]] }, style: { fill: api.theme.text } },
                  { type: 'circle', shape: { cx: 0, cy: 0, r: 6 }, style: { fill: api.theme.text } },
                ],
              },
              { type: 'text', id: 'num', x: cx, y: cy + r * 0.42, style: { text: Math.round(v), fill: api.theme.text, fontSize: Math.max(18, r * 0.3), fontWeight: 700, align: 'center', verticalAlign: 'middle' } },
              { type: 'text', id: 'lbl', x: cx, y: cy + r * 0.42 + Math.max(16, r * 0.22), style: { text: label(v), fill: api.theme.muted, fontSize: 12, align: 'center', verticalAlign: 'middle' } },
            ],
          };
        },
      },
    ],
  });
  const timer = window.setInterval(() => {
    value = Math.max(3, Math.min(97, Math.round(value + (Math.random() - 0.5) * 50)));
    chart.setData([value], 0, false);
  }, 2000);
  return () => {
    clearInterval(timer);
    chart.destroy();
  };
}
