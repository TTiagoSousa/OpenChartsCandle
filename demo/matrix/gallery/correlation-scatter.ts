import { createMatrixChart, type MatrixCell, type MatrixRect } from 'openchartscandle/matrix';
import { heatmapCorrelation } from 'openchartscandle/heatmap';
import { ASSETS, assetReturns } from '../data';

// Uma matriz de dispersão: em baixo, os retornos de cada par de ativos (um ponto por dia) com a reta de
// regressão; na diagonal, o histograma de cada ativo; em cima, a correlação com a cor do valor.
// Tudo desenhado com renderCell, que é rápido mesmo com milhares de pontos.
export function mount(el: HTMLElement): () => void {
  const idx = [0, 2, 3, 4, 5];
  const names = idx.map((i) => ASSETS[i]);
  const all = assetReturns(300);
  const ret = idx.map((i) => all[i]);
  const corr = heatmapCorrelation(ret);
  const ext = ret.map((s) => Math.max(...s.map(Math.abs)) || 1);

  const scatter = (ctx: CanvasRenderingContext2D, r: MatrixRect, a: number, b: number, color: string, progress: number): void => {
    const pad = 4;
    const X = (v: number): number => r.x + r.w / 2 + (v / ext[a]) * (r.w / 2 - pad);
    const Y = (v: number): number => r.y + r.h / 2 - (v / ext[b]) * (r.h / 2 - pad);
    ctx.fillStyle = color;
    ctx.globalAlpha *= 0.55;
    const n = Math.round(ret[a].length * progress);
    const s = Math.max(1.2, Math.min(2.4, r.w / 60));
    for (let t = 0; t < n; t++) ctx.fillRect(X(ret[a][t]) - s / 2, Y(ret[b][t]) - s / 2, s, s);
    // least squares line
    const xs = ret[a];
    const ys = ret[b];
    const mx = xs.reduce((p, v) => p + v, 0) / xs.length;
    const my = ys.reduce((p, v) => p + v, 0) / ys.length;
    let sxy = 0;
    let sxx = 0;
    xs.forEach((x, i) => {
      sxy += (x - mx) * (ys[i] - my);
      sxx += (x - mx) ** 2;
    });
    const k = sxx ? sxy / sxx : 0;
    ctx.globalAlpha = 1;
    ctx.strokeStyle = '#ffb74d';
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    ctx.moveTo(X(-ext[a]), Y(my + k * (-ext[a] - mx)));
    ctx.lineTo(X(ext[a]), Y(my + k * (ext[a] - mx)));
    ctx.stroke();
  };

  const histogram = (ctx: CanvasRenderingContext2D, r: MatrixRect, a: number, progress: number): void => {
    const bins = new Array<number>(15).fill(0);
    for (const v of ret[a]) bins[Math.min(14, Math.floor(((v / ext[a] + 1) / 2) * 15))]++;
    const max = Math.max(...bins);
    const bw = (r.w - 8) / bins.length;
    ctx.fillStyle = '#5b8def';
    bins.forEach((c, i) => {
      const h = (c / max) * (r.h - 22) * progress;
      ctx.fillRect(r.x + 4 + i * bw + 0.5, r.y + r.h - 4 - h, Math.max(1, bw - 1), h);
    });
  };

  const data: MatrixCell[] = [];
  names.forEach((_, y) =>
    names.forEach((name, x) => {
      if (x === y) data.push({ coord: [x, y], text: name, label: { verticalAlign: 'top', fontWeight: 600, fontSize: 11 }, render: (ctx, r, _c, api) => histogram(ctx, r, x, api.progress) });
      else if (x < y) data.push({ coord: [x, y], value: corr[y][x], label: { show: false }, render: (ctx, r, _c, api) => scatter(ctx, r, x, y, '#4fc3f7', api.progress) });
      else data.push({ coord: [x, y], value: corr[y][x], label: { fontSize: 13, fontWeight: 600 } });
    }),
  );
  const chart = createMatrixChart(el, {
    x: { data: names, show: false },
    y: { data: names, show: false },
    data,
    gap: 3,
    cellAspect: 1,
    visualMap: {
      min: -1,
      max: 1,
      colors: ['#1848cc', '#5b8def', '#2a2e39', '#ef5350', '#b71c1c'],
      show: false,
      // only the upper triangle gets the color
      dimension: (c) => (c.x > c.y ? (c.value as number) : null),
    },
    itemStyle: { color: '#1a1e2b' },
    valueFormatter: (v) => v.toFixed(2),
    tooltip: { formatter: (c) => (c.x === c.y ? `<b>${c.xName}</b><br/>Histograma dos retornos` : `<b>${c.yName} × ${c.xName}</b><br/>Correlação: ${(c.value as number).toFixed(2)}`) },
  });
  return () => chart.destroy();
}
