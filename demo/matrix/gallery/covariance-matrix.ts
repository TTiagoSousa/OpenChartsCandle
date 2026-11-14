import { createMatrixChart, type MatrixCell } from 'openchartscandle/matrix';
import { ASSETS, assetReturns, covariance } from '../data';

// Covariância dos retornos diários (%²) de seis ativos. Só o triângulo de baixo tem números (a matriz é
// simétrica); o de cima mostra um círculo desenhado com renderCell. A diagonal é a variância. A cor e o círculo
// usam a covariância dividida pelos desvios-padrão (a correlação), senão o Bitcoin apagava o resto.
export function mount(el: HTMLElement): () => void {
  const names = ASSETS.slice(0, 6);
  const cov = covariance(assetReturns().slice(0, 6));
  const norm = (x: number, y: number): number => cov[y][x] / Math.sqrt(cov[x][x] * cov[y][y]);
  const data: MatrixCell[] = [];
  cov.forEach((row, y) =>
    row.forEach((v, x) => {
      const upper = x > y;
      data.push({
        coord: [x, y],
        value: +v.toFixed(3),
        // the upper triangle: no text, a circle instead
        label: upper ? { show: false } : undefined,
        itemStyle: upper ? { color: 'transparent' } : x === y ? { borderColor: '#787b86' } : undefined,
        render: upper
          ? (ctx, r, _cell, api) => {
              const k = norm(x, y);
              const rad = Math.sqrt(Math.abs(k)) * Math.min(r.w, r.h) * 0.45 * api.progress;
              ctx.fillStyle = api.colorOf(k);
              ctx.beginPath();
              ctx.arc(r.x + r.w / 2, r.y + r.h / 2, Math.max(0, rad), 0, Math.PI * 2);
              ctx.fill();
            }
          : undefined,
      });
    }),
  );
  const chart = createMatrixChart(el, {
    title: { text: 'Matriz de covariância', subtext: 'Retornos diários, %² (dados inventados)', align: 'left' },
    x: { data: names, label: { fontSize: 11 } },
    y: { data: names, label: { fontSize: 11 } },
    data,
    gap: 2,
    cellAspect: 1.4,
    visualMap: {
      min: -1,
      max: 1,
      colors: ['#1848cc', '#5b8def', '#3a3f4d', '#ef5350', '#b71c1c'],
      text: ['+1', '−1'],
      dimension: (c) => norm(c.x, c.y),
    },
    valueFormatter: (v) => v.toFixed(2),
    label: { fontSize: 11 },
  });
  return () => chart.destroy();
}
