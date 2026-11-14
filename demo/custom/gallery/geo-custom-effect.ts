import { createCustomChart, type CustomElement } from 'openchartscandle/custom';
import { PORTUGAL } from '../data';

// Substituto do "GEO SVG with Customized Effect" (não há família de mapas): o contorno de Portugal continental,
// aproximado à mão, é um caminho SVG (type: 'path'), e um renderItem com live: true anima o efeito: ondas a sair
// de cada sede de bolsa / banco e um "pacote" a percorrer a rota Braga → Porto → Coimbra → Lisboa → Faro.
export function mount(el: HTMLElement): () => void {
  const cities: [string, number, number][] = [
    ['Braga', -8.43, 41.55],
    ['Porto', -8.61, 41.15],
    ['Coimbra', -8.43, 40.2],
    ['Lisboa', -9.14, 38.72],
    ['Évora', -7.91, 38.57],
    ['Faro', -7.93, 37.02],
  ];
  const route = ['Braga', 'Porto', 'Coimbra', 'Lisboa', 'Faro'].map((n) => cities.find((c) => c[0] === n)!);
  const lon0 = -9.6;
  const lon1 = -6.1;
  const lat0 = 36.9;
  const lat1 = 42.2;
  const k = Math.cos((39.5 * Math.PI) / 180);
  const chart = createCustomChart(el, {
    coordinateSystem: 'none',
    live: true,
    grid: { top: 8, bottom: 8, left: 8, right: 8 },
    series: [
      {
        name: 'Cidades',
        data: cities,
        dimensions: ['Cidade', 'Longitude', 'Latitude'],
        encode: { itemName: 0, tooltip: [1, 2] },
        renderItem: (p, api) => {
          const R = api.rect;
          const s = Math.min(R.width / ((lon1 - lon0) * k), R.height / (lat1 - lat0));
          const ox = R.x + (R.width - (lon1 - lon0) * k * s) / 2;
          const oy = R.y + (R.height - (lat1 - lat0) * s) / 2;
          const proj = (lon: number, lat: number): [number, number] => [ox + (lon - lon0) * k * s, oy + (lat1 - lat) * s];
          const t = api.time / 1000;
          const out: CustomElement[] = [];
          if (p.dataIndex === 0) {
            // the outline (as an SVG path string) and the route, drawn once
            const d = PORTUGAL.map(([lo, la], i) => `${i ? 'L' : 'M'}${proj(lo, la).map((v) => v.toFixed(1)).join(' ')}`).join(' ') + ' Z';
            out.push({ type: 'path', shape: { pathData: d }, style: { fill: { type: 'linear', x: 0, y: 0, x2: 1, y2: 1, stops: [[0, 'rgba(41,98,255,0.28)'], [1, 'rgba(0,188,212,0.12)']] }, stroke: 'rgba(130,177,255,0.7)', lineWidth: 1.2 }, silent: true });
            const pts = route.map((c) => proj(c[1], c[2]));
            out.push({ type: 'polyline', shape: { points: pts }, style: { stroke: 'rgba(255,193,7,0.45)', lineWidth: 1.5, lineDash: [4, 4] }, silent: true });
            // moving packet along the route
            const lens = pts.slice(1).map((q, i) => Math.hypot(q[0] - pts[i][0], q[1] - pts[i][1]));
            const total = lens.reduce((a, b) => a + b, 0);
            let dist = ((t * 0.18) % 1) * total;
            let i = 0;
            while (i < lens.length - 1 && dist > lens[i]) dist -= lens[i++];
            const f = dist / lens[i];
            const x = pts[i][0] + (pts[i + 1][0] - pts[i][0]) * f;
            const y = pts[i][1] + (pts[i + 1][1] - pts[i][1]) * f;
            out.push({ type: 'circle', shape: { cx: x, cy: y, r: 4 }, style: { fill: '#ffc107', shadowBlur: 12, shadowColor: '#ffc107' }, silent: true });
          }
          const [x, y] = proj(Number(api.value(1)), Number(api.value(2)));
          for (let w = 0; w < 3; w++) {
            const ph = (t / 2 + w / 3 + p.dataIndex * 0.13) % 1;
            out.push({ type: 'circle', shape: { cx: x, cy: y, r: 3 + ph * 16 }, style: { stroke: '#00e5ff', lineWidth: 1.5, opacity: 1 - ph }, silent: true });
          }
          out.push({ type: 'circle', shape: { cx: x, cy: y, r: 3.5 }, style: { fill: '#00e5ff' } });
          out.push({ type: 'text', x: x + 8, y, style: { text: api.value(0), fill: api.theme.text, fontSize: 11, verticalAlign: 'middle', stroke: api.theme.background, lineWidth: 3 }, silent: true });
          return { type: 'group', children: out };
        },
      },
    ],
  });
  return () => chart.destroy();
}
