import { createCustomChart } from 'openchartscandle/custom';
import { raceSeries } from '../data';

// Corrida em espiral: o retorno acumulado de cinco ativos ao longo de 24 meses. Cada ativo corre na sua pista
// de uma espiral (as pistas entrelaçam-se), a distância percorrida é o valor e a classificação fica ao lado.
// Com live: true o renderItem corre a cada frame e interpola entre meses com api.time; no fim recomeça.
export function mount(el: HTMLElement): () => void {
  const assets = raceSeries();
  const steps = assets[0].values.length;
  const all = assets.flatMap((a) => a.values);
  const lo = Math.min(0, ...all);
  const hi = Math.max(...all);
  const turns = 2.2;
  const STEP = 700;
  const at = (a: { values: number[] }, t: number): number => {
    const i = Math.min(steps - 1, Math.floor(t));
    const f = Math.min(1, t - i);
    const b = a.values[Math.min(steps - 1, i + 1)];
    return a.values[i] + (b - a.values[i]) * (f * f * (3 - 2 * f));
  };
  const chart = createCustomChart(el, {
    coordinateSystem: 'none',
    live: true,
    legend: false,
    series: [
      {
        name: 'Corrida',
        data: assets.map((a) => a.name),
        tooltip: (p) => `<b>${p.value[0]}</b>`,
        emphasis: { disabled: true },
        renderItem: (p, api) => {
          const R = api.rect;
          const n = assets.length;
          // ranking on the left, spiral on the right
          const listW = Math.min(150, R.width * 0.34);
          const cx = R.x + listW + (R.width - listW) / 2;
          const cy = R.y + R.height / 2;
          const Rmax = Math.min(R.width - listW, R.height) / 2 - 6;
          const r0 = Rmax * 0.12;
          const lane = (Rmax - r0) / ((turns + 1) * n);
          const cycle = (steps + 4) * STEP;
          const t = Math.min(steps - 1, (api.time % cycle) / STEP);
          const a = assets[p.dataIndex];
          const v = at(a, t);
          const theta = Math.max(0.02, ((v - lo) / (hi - lo)) * turns * Math.PI * 2);
          const radius = (th: number): number => r0 + p.dataIndex * lane + (th / (Math.PI * 2)) * n * lane;
          const pt = (th: number): [number, number] => [cx + radius(th) * Math.cos(th - Math.PI / 2), cy + radius(th) * Math.sin(th - Math.PI / 2)];
          const pts: [number, number][] = [];
          for (let th = 0; th < theta; th += 0.05) pts.push(pt(th));
          const [hx, hy] = pt(theta);
          pts.push([hx, hy]);
          const rank = assets.map((b) => at(b, t)).filter((x) => x > v).length;
          const fs = R.height > 300 ? 13 : 11;
          const top = R.y + 26;
          return {
            type: 'group',
            children: [
              { type: 'polyline', shape: { points: pts }, style: { stroke: a.color, lineWidth: Math.max(1.5, lane * 0.75), lineCap: 'round', lineJoin: 'round', strokeOpacity: 0.9 } },
              { type: 'circle', shape: { cx: hx, cy: hy, r: Math.max(2.5, lane * 0.7) }, style: { fill: '#ffffff', stroke: a.color, lineWidth: 1.5 } },
              // ranking list: the row of each asset follows its rank
              { type: 'rect', x: R.x + 4, y: top + rank * (fs + 9), shape: { x: 0, y: 0, width: 4, height: fs + 2 }, style: { fill: a.color } },
              { type: 'text', x: R.x + 14, y: top + rank * (fs + 9) + (fs + 2) / 2, silent: true, style: { text: `${a.name}`, fill: api.theme.text, fontSize: fs, verticalAlign: 'middle' } },
              { type: 'text', x: R.x + listW - 6, y: top + rank * (fs + 9) + (fs + 2) / 2, silent: true, style: { text: `${v >= 0 ? '+' : ''}${v.toFixed(1)}%`, fill: a.color, fontSize: fs, fontWeight: 600, align: 'right', verticalAlign: 'middle' } },
              p.dataIndex === 0 ? { type: 'text', x: R.x + 4, y: R.y + 4, silent: true, style: { text: `Mês ${Math.floor(t) + 1} de ${steps}`, fill: api.theme.muted, fontSize: 12, fontWeight: 600 } } : null,
            ],
          };
        },
      },
    ],
  });
  return () => chart.destroy();
}
