import { createGraphChart } from 'openchartscandle/graph';
import { PT_CITIES, PT_OUTLINE, PT_ROADS } from '../data';

// Um grafo sobre um mapa: as maiores cidades de Portugal continental (tamanho = população) e as principais
// autoestradas que as ligam. Os nós estão em longitude e latitude (eixos escondidos) e o mapa é desenhado
// no `underlay` com api.toPixel, por isso acompanha o zoom e o pan. Contorno, populações e ligações aproximados.
export function mount(el: HTMLElement): () => void {
  const chart = createGraphChart(el, {
    nodes: PT_CITIES.map(([name, lon, lat, pop]) => ({ id: name, x: lon, y: lat, value: pop })),
    links: PT_ROADS.map(([source, target]) => ({ source, target })),
    axes: { x: { show: false, min: -9.9, max: -5.9 }, y: { show: false, min: 36.8, max: 42.3 } },
    aspect: 1 / Math.cos((39.6 * Math.PI) / 180),
    symbolSize: [7, 24],
    colors: ['#ffb300'],
    label: { show: true, fontSize: 10, hideOverlap: true },
    edge: { color: 'rgba(255, 179, 0, 0.55)', width: 2 },
    underlay: (ctx, api) => {
      ctx.beginPath();
      PT_OUTLINE.forEach(([lon, lat], i) => {
        const p = api.toPixel(lon, lat);
        if (i) ctx.lineTo(p.x, p.y);
        else ctx.moveTo(p.x, p.y);
      });
      ctx.closePath();
      ctx.fillStyle = '#1c2a44';
      ctx.fill();
      ctx.strokeStyle = '#3d5a8a';
      ctx.lineWidth = 1.2;
      ctx.stroke();
    },
    tooltip: {
      formatter: (p) => {
        if (p.type === 'node') return `<b>${p.name}</b><br>${p.value} mil habitantes<br>${p.degree} ligações`;
        const road = PT_ROADS[p.index];
        return `<b>${road[2]}</b><br>${road[0]} — ${road[1]}`;
      },
    },
  });
  return () => chart.destroy();
}
