import { PARALLEL_COLORS, buildParallelScale, createParallelChart } from 'openchartscandle/parallel';
import { SECTORS, STOCK_AXES, stocks } from '../data';

// Uma matriz de dispersão (desenhada aqui num canvas simples) ligada a um gráfico de coordenadas paralelas:
// arrasta num eixo das paralelas e os pontos fora da seleção apagam-se em todas as células; na diagonal, o
// histograma da seleção. Empresas e números gerados.
export function mount(el: HTMLElement): () => void {
  const list = stocks(180, 9);
  const DIMS = [0, 2, 4]; // P/E, Beta, Retorno 1a %
  const BG = '#131722';
  el.style.cssText += ';display:flex;gap:0;background:' + BG;
  const left = document.createElement('div');
  left.style.cssText = 'flex:0 0 40%;min-width:0;min-height:0;position:relative';
  const right = document.createElement('div');
  right.style.cssText = 'flex:1;min-width:0;min-height:0;position:relative';
  const canvas = document.createElement('canvas');
  canvas.style.cssText = 'position:absolute;inset:0;width:100%;height:100%';
  left.append(canvas);
  el.append(left, right);

  // one series per sector; `rows[s][i]` = position in `list` of row i of series s
  const rows = SECTORS.map((s) => list.flatMap((st, i) => (st.sector === s ? [i] : [])));
  const chart = createParallelChart(right, {
    axes: STOCK_AXES,
    series: SECTORS.map((s, k) => ({ name: s, data: rows[k].map((i) => ({ name: list[i].name, value: list[i].value })) })),
    lineWidth: 1,
    opacity: 0.55,
    legend: { position: 'bottom' },
    padding: 10,
  });
  let selected: Set<number> | null = null;
  let hovered = -1;
  chart.on('hover', (e) => {
    hovered = e ? rows[e.seriesIndex][e.index] : -1;
    draw();
  });
  chart.on('brush', (e) => {
    selected = new Set(e.selected.flatMap((s) => s.indices.map((i) => rows[s.seriesIndex][i])));
    draw();
  });

  const color = (i: number): string => PARALLEL_COLORS[SECTORS.indexOf(list[i].sector) % PARALLEL_COLORS.length];
  const scales = DIMS.map((d) => buildParallelScale(STOCK_AXES[d], list.map((s) => s.value[d])));
  const ctx = canvas.getContext('2d')!;

  function draw(): void {
    const dpr = window.devicePixelRatio || 1;
    const W = left.clientWidth;
    const H = left.clientHeight;
    canvas.width = Math.round(W * dpr);
    canvas.height = Math.round(H * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.fillStyle = BG;
    ctx.fillRect(0, 0, W, H);
    const n = DIMS.length;
    const pad = 10;
    const gap = 6;
    const size = Math.max(10, Math.min((W - pad * 2 - gap * (n - 1)) / n, (H - pad * 2 - gap * (n - 1)) / n));
    const x0 = (W - size * n - gap * (n - 1)) / 2;
    const y0 = (H - size * n - gap * (n - 1)) / 2;
    const r = Math.max(1.4, Math.min(2.6, size / 55));
    const fs = Math.max(9, Math.min(12, size / 9));
    for (let row = 0; row < n; row++)
      for (let col = 0; col < n; col++) {
        const cx = x0 + col * (size + gap);
        const cy = y0 + row * (size + gap);
        ctx.strokeStyle = 'rgba(120, 123, 134, 0.35)';
        ctx.lineWidth = 1;
        ctx.strokeRect(cx + 0.5, cy + 0.5, size - 1, size - 1);
        const sx = scales[col];
        const sy = scales[row];
        if (row === col) {
          // histogram of the selection (all rows in grey behind)
          const bins = 12;
          const all = new Array(bins).fill(0);
          const sel = new Array(bins).fill(0);
          list.forEach((s, i) => {
            const t = sx.toT(s.value[DIMS[col]]);
            if (!Number.isFinite(t)) return;
            const b = Math.min(bins - 1, Math.floor(t * bins));
            all[b]++;
            if (!selected || selected.has(i)) sel[b]++;
          });
          const top = Math.max(...all) || 1;
          const bw = (size - 8) / bins;
          const hh = size - fs - 14;
          all.forEach((v, b) => {
            ctx.fillStyle = 'rgba(120, 123, 134, 0.25)';
            ctx.fillRect(cx + 4 + b * bw + 1, cy + size - 4 - (v / top) * hh, bw - 2, (v / top) * hh);
            ctx.fillStyle = 'rgba(41, 98, 255, 0.85)';
            ctx.fillRect(cx + 4 + b * bw + 1, cy + size - 4 - (sel[b] / top) * hh, bw - 2, (sel[b] / top) * hh);
          });
          ctx.fillStyle = '#d1d4dc';
          ctx.font = `600 ${fs}px -apple-system, BlinkMacSystemFont, "Trebuchet MS", Roboto, sans-serif`;
          ctx.textAlign = 'center';
          ctx.textBaseline = 'top';
          let name = STOCK_AXES[DIMS[col]].name;
          while (name.length > 2 && ctx.measureText(name).width > size - 6) name = name.slice(0, -2) + '…';
          ctx.fillText(name, cx + size / 2, cy + 5);
          continue;
        }
        const px = (i: number): [number, number] => [cx + 4 + sx.toT(list[i].value[DIMS[col]]) * (size - 8), cy + size - 4 - sy.toT(list[i].value[DIMS[row]]) * (size - 8)];
        // unselected first, in grey
        ctx.fillStyle = 'rgba(120, 123, 134, 0.22)';
        ctx.beginPath();
        list.forEach((_, i) => {
          if (!selected || selected.has(i)) return;
          const [x, y] = px(i);
          ctx.moveTo(x + r, y);
          ctx.arc(x, y, r, 0, Math.PI * 2);
        });
        ctx.fill();
        ctx.globalAlpha = 0.85;
        list.forEach((_, i) => {
          if (selected && !selected.has(i)) return;
          const [x, y] = px(i);
          ctx.fillStyle = color(i);
          ctx.beginPath();
          ctx.arc(x, y, r, 0, Math.PI * 2);
          ctx.fill();
        });
        ctx.globalAlpha = 1;
        if (hovered >= 0) {
          // the row under the mouse in the parallel chart
          const [x, y] = px(hovered);
          ctx.strokeStyle = '#ffffff';
          ctx.lineWidth = 1.5;
          ctx.beginPath();
          ctx.arc(x, y, r + 3, 0, Math.PI * 2);
          ctx.stroke();
        }
      }
  }

  // side by side in wide boxes, one above the other in tall ones
  const ro = new ResizeObserver(() => {
    el.style.flexDirection = el.clientWidth > el.clientHeight * 1.2 ? 'row' : 'column';
    draw();
  });
  ro.observe(el);
  ro.observe(left);
  // a first selection: high beta
  chart.setBrush([{ axis: 2, from: 1.2, to: 3 }]);
  return () => {
    ro.disconnect();
    chart.destroy();
  };
}
