import { createPieChart, type PieChart } from 'openchartscandle/pie';

// Pizzas sobre um mapa: a origem da eletricidade em algumas cidades de Portugal continental.
// O contorno é aproximado (longitude/latitude); cada pizza fica na posição da cidade e o tamanho segue o consumo.
const OUTLINE: [number, number][] = [
  [-8.87, 41.87], [-8.65, 42.05], [-8.2, 42.13], [-8.08, 42.03], [-7.6, 41.87], [-7.2, 41.98], [-6.6, 41.96], [-6.2, 41.6],
  [-6.45, 41.3], [-6.8, 41.05], [-6.93, 40.6], [-6.85, 40.25], [-7.0, 39.67], [-7.5, 39.66], [-7.3, 39.45], [-7.03, 39.1],
  [-7.15, 38.8], [-7.3, 38.45], [-7.0, 38.05], [-7.45, 37.6], [-7.42, 37.18], [-7.9, 36.98], [-8.5, 37.1], [-8.99, 37.02],
  [-8.8, 37.4], [-8.85, 37.95], [-8.9, 38.45], [-9.2, 38.65], [-9.5, 38.72], [-9.4, 39.1], [-9.08, 39.6], [-8.88, 40.15],
  [-8.75, 40.6], [-8.67, 41.15], [-8.78, 41.6],
];
const SOURCES = ['Hídrica', 'Eólica', 'Solar', 'Gás natural'];
const COLORS = ['#2962ff', '#26a69a', '#ffb300', '#ef5350'];
const CITIES: { name: string; lon: number; lat: number; mix: number[] }[] = [
  { name: 'Porto', lon: -8.61, lat: 41.15, mix: [38, 26, 9, 27] },
  { name: 'Braga', lon: -8.42, lat: 41.55, mix: [52, 22, 6, 20] },
  { name: 'Bragança', lon: -6.76, lat: 41.81, mix: [61, 27, 5, 7] },
  { name: 'Coimbra', lon: -8.43, lat: 40.2, mix: [33, 31, 12, 24] },
  { name: 'Viseu', lon: -7.91, lat: 40.66, mix: [36, 40, 10, 14] },
  { name: 'Lisboa', lon: -9.14, lat: 38.72, mix: [18, 22, 15, 45] },
  { name: 'Évora', lon: -7.91, lat: 38.57, mix: [12, 18, 52, 18] },
  { name: 'Faro', lon: -7.93, lat: 37.02, mix: [6, 20, 58, 16] },
];
const SIZE: Record<string, number> = { Porto: 1, Braga: 0.7, Bragança: 0.5, Coimbra: 0.65, Viseu: 0.55, Lisboa: 1.15, Évora: 0.6, Faro: 0.75 };

export function mount(el: HTMLElement): () => void {
  el.style.position = 'relative';
  const legend = document.createElement('div');
  legend.style.cssText = 'position:absolute;top:8px;left:0;right:0;display:flex;justify-content:center;gap:14px;font-size:12px;z-index:2';
  legend.innerHTML = SOURCES.map((s, i) => `<span><i style="display:inline-block;width:10px;height:10px;border-radius:2px;background:${COLORS[i]};margin-right:5px"></i>${s}</span>`).join('');
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.style.cssText = 'position:absolute;inset:0;width:100%;height:100%';
  el.append(svg, legend);
  const charts: PieChart[] = [];
  const hosts: HTMLElement[] = [];
  const draw = (): void => {
    const W = el.clientWidth;
    const H = el.clientHeight;
    // equirectangular projection, longitude squeezed by cos(latitude)
    const k = Math.cos((39.6 * Math.PI) / 180);
    const lons = OUTLINE.map((p) => p[0] * k);
    const lats = OUTLINE.map((p) => p[1]);
    const [x0, x1, y0, y1] = [Math.min(...lons), Math.max(...lons), Math.min(...lats), Math.max(...lats)];
    const s = Math.min((W - 40) / (x1 - x0), (H - 70) / (y1 - y0));
    const ox = (W - (x1 - x0) * s) / 2;
    const oy = 40 + (H - 50 - (y1 - y0) * s) / 2;
    const P = (lon: number, lat: number): [number, number] => [ox + (lon * k - x0) * s, oy + (y1 - lat) * s];
    svg.innerHTML = `<path d="M${OUTLINE.map((p) => P(...p).join(',')).join('L')}Z" fill="rgba(120,123,134,0.16)" stroke="rgba(120,123,134,0.6)" stroke-width="1.2"/>`;
    CITIES.forEach((c, i) => {
      const [x, y] = P(c.lon, c.lat);
      const d = Math.max(34, s * 0.75 * SIZE[c.name]);
      Object.assign(hosts[i].style, { left: `${x - d / 2}px`, top: `${y - d / 2}px`, width: `${d}px`, height: `${d}px` });
    });
  };
  CITIES.forEach((c) => {
    const host = document.createElement('div');
    host.style.cssText = 'position:absolute;z-index:1';
    hosts.push(host);
    el.append(host);
  });
  draw();
  CITIES.forEach((c, i) => {
    charts.push(
      createPieChart(hosts[i], {
        data: c.mix.map((value, j) => ({ label: SOURCES[j], value, color: COLORS[j] })),
        background: 'transparent',
        legend: { show: false },
        labels: { show: false },
        hoverOffset: 3,
        selectable: false,
        tooltip: { formatter: (s) => `<b>${c.name}</b><br>${s.label}: ${s.value}%` },
      }),
    );
  });
  const ro = new ResizeObserver(draw);
  ro.observe(el);
  return () => {
    ro.disconnect();
    charts.forEach((ch) => ch.destroy());
    hosts.forEach((h) => h.remove());
    svg.remove();
    legend.remove();
  };
}
