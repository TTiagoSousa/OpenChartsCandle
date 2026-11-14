import { createCustomChart, type CustomElement } from 'openchartscandle/custom';
import { WEEKDAYS_PT, moonPhase, monthWeather } from '../data';

// Calendário com ícones: o mês de outubro em Lisboa desenhado em píxeis por um renderItem (sem eixos).
// Cada dia tem o número, um ícone do tempo (sol, nuvens, chuva, trovoada), a máxima e a fase da lua.
// (A família calendar faz mapas de calor por dia; aqui é o renderItem que desenha tudo.)
export function mount(el: HTMLElement): () => void {
  const year = 2026;
  const month = 9;
  const first = (new Date(year, month, 1).getDay() + 6) % 7;
  const cloud = (x: number, y: number, s: number, fill: string): CustomElement => ({
    type: 'path',
    shape: { pathData: 'M6 18 a5 5 0 0 1 1-9.9 a7 7 0 0 1 13.4 1.4 a4.3 4.3 0 0 1 -0.4 8.5 z', x: x - s / 2, y: y - s / 2, width: s, height: s * 0.62 },
    style: { fill },
  });
  const icon = (kind: string, x: number, y: number, s: number): CustomElement => {
    const sun: CustomElement = {
      type: 'group',
      children: [
        ...Array.from({ length: 8 }, (_, i): CustomElement => {
          const a = (i * Math.PI) / 4;
          return { type: 'line', shape: { x1: x + Math.cos(a) * s * 0.34, y1: y + Math.sin(a) * s * 0.34, x2: x + Math.cos(a) * s * 0.48, y2: y + Math.sin(a) * s * 0.48 }, style: { stroke: '#ffc107', lineWidth: 1.5, lineCap: 'round' } };
        }),
        { type: 'circle', shape: { cx: x, cy: y, r: s * 0.24 }, style: { fill: '#ffc107' } },
      ],
    };
    if (kind === 'sol') return sun;
    if (kind === 'nuvens') return { type: 'group', children: [{ ...sun, x: s * 0.18, y: -s * 0.15, scaleX: 0.7, scaleY: 0.7, originX: x, originY: y } as CustomElement, cloud(x, y + s * 0.08, s * 0.9, '#b0bec5')] };
    const drops: CustomElement[] =
      kind === 'chuva'
        ? [-0.2, 0, 0.2].map((d): CustomElement => ({ type: 'line', shape: { x1: x + d * s, y1: y + s * 0.3, x2: x + d * s - 2, y2: y + s * 0.46 }, style: { stroke: '#4fc3f7', lineWidth: 1.5, lineCap: 'round' } }))
        : [{ type: 'polygon', shape: { points: [[x + 1, y + s * 0.2], [x - 3, y + s * 0.38], [x, y + s * 0.38], [x - 2, y + s * 0.52], [x + 4, y + s * 0.3], [x + 1, y + s * 0.3]] }, style: { fill: '#ffeb3b' } }];
    return { type: 'group', children: [cloud(x, y, s, kind === 'trovoada' ? '#78909c' : '#90a4ae'), ...drops] };
  };
  const moon = (d: Date, x: number, y: number, r: number): CustomElement => {
    const p = moonPhase(d);
    const k = Math.abs(Math.cos(2 * Math.PI * p)) * r;
    const waxing = p < 0.5;
    const crescent = p < 0.25 || p > 0.75;
    const side = waxing ? 1 : 0;
    const sweep = waxing ? (crescent ? 0 : 1) : crescent ? 1 : 0;
    return {
      type: 'group',
      children: [
        { type: 'circle', shape: { cx: x, cy: y, r }, style: { fill: '#2a2e39', stroke: '#4a4e59', lineWidth: 0.6 } },
        { type: 'path', shape: { pathData: `M${x} ${y - r} A${r} ${r} 0 0 ${side} ${x} ${y + r} A${Math.max(0.01, k)} ${r} 0 0 ${sweep} ${x} ${y - r} Z` }, style: { fill: '#eceff1' } },
      ],
    };
  };
  const chart = createCustomChart(el, {
    coordinateSystem: 'none',
    grid: { left: 6, right: 6, top: 22, bottom: 6 },
    series: [
      {
        name: 'Outubro 2026',
        data: monthWeather(year, month),
        dimensions: ['Dia', 'Tempo', 'Máxima (°C)'],
        encode: { tooltip: [1, 2] },
        tooltip: (p) => `<b>${p.value[0]} de outubro</b><br>${p.value[1]} · ${p.value[2]} °C`,
        renderItem: (p, api) => {
          const R = api.rect;
          const day = Number(api.value(0));
          const k = first + day - 1;
          const rows = Math.ceil((first + p.dataCount) / 7);
          const w = R.width / 7;
          const h = R.height / rows;
          const x = R.x + (k % 7) * w;
          const y = R.y + Math.floor(k / 7) * h;
          const s = Math.min(w, h);
          const small = s < 46;
          const weekend = k % 7 >= 5;
          return {
            type: 'group',
            children: [
              { type: 'rect', shape: { x: x + 1.5, y: y + 1.5, width: w - 3, height: h - 3, r: 4 }, style: { fill: weekend ? 'rgba(41,98,255,0.12)' : 'rgba(255,255,255,0.04)', stroke: 'rgba(255,255,255,0.08)' } },
              { type: 'text', x: x + 5, y: y + 4, style: { text: day, fill: weekend ? '#82b1ff' : api.theme.text, fontSize: small ? 9 : 11, fontWeight: 600 } },
              icon(String(api.value(1)), x + w / 2, y + h * 0.55, s * (small ? 0.42 : 0.38)),
              small ? null : { type: 'text', x: x + w - 5, y: y + h - 4, style: { text: `${api.value(2)}°`, fill: api.theme.muted, fontSize: 10, align: 'right', verticalAlign: 'bottom' } },
              moon(new Date(year, month, day, 21), x + w - (small ? 6 : 9), y + (small ? 6 : 9), small ? 3 : 4.5),
            ],
          };
        },
      },
    ],
    graphic: ({ rect, theme }) =>
      WEEKDAYS_PT.map((d, i) => ({ type: 'text', x: rect.x + (i + 0.5) * (rect.width / 7), y: rect.y - 6, style: { text: d, fill: theme.muted, fontSize: 11, align: 'center', verticalAlign: 'bottom' } })),
  });
  return () => chart.destroy();
}
