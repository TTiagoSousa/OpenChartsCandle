import { createScatterChart, scatterGradientAt } from 'openchartscandle/scatter';

// Mapa coroplético com pontos por cima: as cinco regiões de Portugal continental pintadas pelo PIB
// por pessoa e as maiores cidades como bolhas (tamanho = população). O mapa é desenhado no `underlay`
// com longitude e latitude como x e y. Contornos e valores aproximados.
const OUTLINE: [number, number][] = [
  [-8.87, 41.87], [-8.65, 42.05], [-8.2, 42.13], [-8.08, 42.03], [-7.6, 41.87], [-7.2, 41.98], [-6.6, 41.96], [-6.2, 41.6],
  [-6.45, 41.3], [-6.8, 41.05], [-6.93, 40.6], [-6.85, 40.25], [-7.0, 39.67], [-7.5, 39.66], [-7.3, 39.45], [-7.03, 39.1],
  [-7.15, 38.8], [-7.3, 38.45], [-7.0, 38.05], [-7.45, 37.6], [-7.42, 37.18], [-7.9, 36.98], [-8.5, 37.1], [-8.99, 37.02],
  [-8.8, 37.4], [-8.85, 37.95], [-8.9, 38.45], [-9.2, 38.65], [-9.5, 38.72], [-9.4, 39.1], [-9.08, 39.6], [-8.88, 40.15],
  [-8.75, 40.6], [-8.67, 41.15], [-8.78, 41.6],
];
type Pt = [number, number];
/** a half-plane: the points on the left of the line a → b */
type Side = [Pt, Pt];

/** Sutherland–Hodgman: cut a polygon by a half-plane. */
function clip(poly: Pt[], [a, b]: Side): Pt[] {
  const inside = (p: Pt): boolean => (b[0] - a[0]) * (p[1] - a[1]) - (b[1] - a[1]) * (p[0] - a[0]) >= 0;
  const cross = (p: Pt, q: Pt): Pt => {
    const d1 = (b[0] - a[0]) * (p[1] - a[1]) - (b[1] - a[1]) * (p[0] - a[0]);
    const d2 = (b[0] - a[0]) * (q[1] - a[1]) - (b[1] - a[1]) * (q[0] - a[0]);
    const t = d1 / (d1 - d2);
    return [p[0] + (q[0] - p[0]) * t, p[1] + (q[1] - p[1]) * t];
  };
  const out: Pt[] = [];
  poly.forEach((p, i) => {
    const q = poly[(i + 1) % poly.length];
    if (inside(p)) out.push(p);
    if (inside(p) !== inside(q)) out.push(cross(p, q));
  });
  return out;
}

// boundaries (approximate), each line from west to east: "above" = left of a → b
const L1: Side = [[-10, 41.02], [-6, 40.82]];
const L2: Side = [[-10, 39.0], [-6, 39.68]];
const L3: Side = [[-10, 37.4], [-6, 37.5]];
const flip = ([a, b]: Side): Side => [b, a];
const REGIONS: { name: string; value: number; cuts: Side[] }[] = [
  { name: 'Norte', value: 65, cuts: [L1] },
  { name: 'Centro', value: 67, cuts: [flip(L1), L2] },
  { name: 'Alentejo', value: 71, cuts: [flip(L2), L3] },
  { name: 'Algarve', value: 78, cuts: [flip(L3)] },
  // drawn on top of the Alentejo
  { name: 'Lisboa', value: 101, cuts: [flip(L2), [[-10, 38.4], [-6, 38.4]], [[-8.62, 30], [-8.62, 45]]] },
];
const COLORS = ['#163a5f', '#2f6fc4', '#8ec5ff'];
const CITIES: [string, number, number, number][] = [
  ['Lisboa', -9.14, 38.72, 545], ['Porto', -8.61, 41.15, 232], ['Vila Nova de Gaia', -8.6, 41.12, 304], ['Braga', -8.42, 41.55, 193],
  ['Amadora', -9.23, 38.75, 171], ['Guimarães', -8.3, 41.44, 156], ['Coimbra', -8.43, 40.2, 140], ['Leiria', -8.81, 39.74, 128],
  ['Setúbal', -8.89, 38.52, 123], ['Viseu', -7.91, 40.66, 99], ['Aveiro', -8.65, 40.64, 80], ['Faro', -7.93, 37.02, 64],
  ['Portimão', -8.54, 37.14, 59], ['Évora', -7.91, 38.57, 53], ['Castelo Branco', -7.49, 39.82, 52], ['Bragança', -6.76, 41.81, 34],
  ['Beja', -7.86, 38.02, 33],
];

export function mount(el: HTMLElement): () => void {
  const shapes = REGIONS.map((r) => ({ ...r, poly: r.cuts.reduce(clip, OUTLINE) }));
  const chart = createScatterChart(el, {
    series: [
      {
        name: 'Cidades',
        color: '#ffb300',
        opacity: 0.9,
        borderWidth: 1,
        borderColor: '#131722',
        labels: { position: 'right', fontSize: 10, color: '#d1d4dc' },
        data: CITIES.map(([name, lon, lat, pop]) => ({ x: lon, y: lat, values: [pop], name, size: 4 + Math.sqrt(pop) * 0.75, effect: pop > 300 })),
        effect: { scale: 2.2 },
      },
    ],
    dimensions: ['Longitude', 'Latitude', 'População (mil)'],
    xAxis: { show: false, min: -9.8, max: -6 },
    yAxis: { show: false, min: 36.9, max: 42.2 },
    aspect: 1 / Math.cos((39.6 * Math.PI) / 180),
    visualMap: { series: [], min: 60, max: 105, colors: COLORS, title: 'PIB (UE = 100)', interactive: false, position: 'left' },
    tooltip: { formatter: (p) => `<b>${p.name}</b><br>${p.values[2]} mil habitantes` },
    underlay: (ctx, api) => {
      for (const s of shapes) {
        ctx.beginPath();
        s.poly.forEach(([lon, lat], i) => {
          const { x, y } = api.point(lon, lat);
          if (i) ctx.lineTo(x, y);
          else ctx.moveTo(x, y);
        });
        ctx.closePath();
        ctx.fillStyle = scatterGradientAt(COLORS, (s.value - 60) / 45);
        ctx.fill();
        ctx.strokeStyle = 'rgba(19,23,34,0.9)';
        ctx.lineWidth = 1.2;
        ctx.stroke();
      }
      ctx.font = `600 11px ${api.theme.font}`;
      ctx.fillStyle = 'rgba(255,255,255,0.75)';
      ctx.textAlign = 'center';
      const at: Record<string, Pt> = { Norte: [-7.4, 41.5], Centro: [-7.6, 40.15], Alentejo: [-7.75, 38.2], Algarve: [-8.15, 37.25], Lisboa: [-9.05, 38.88] };
      for (const s of shapes) {
        const { x, y } = api.point(...at[s.name]);
        ctx.fillText(`${s.name} ${s.value}`, x, y);
      }
    },
  });
  return () => chart.destroy();
}
