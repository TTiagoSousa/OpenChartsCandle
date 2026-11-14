import { createMatrixChart, type MatrixCell } from 'openchartscandle/matrix';
import { ELEMENT_CATEGORIES, elements, type Element } from '../data';

// A tabela periódica numa matriz 18 × 10: 118 elementos nas suas células, buracos escondidos (emptyCells:
// 'hide'), lantanídeos e actinídeos numa linha à parte e uma célula grande unida em cima que mostra o elemento
// debaixo do rato. As cores são um visualMap por categorias: um click na legenda apaga uma categoria. Em ecrãs
// estreitos uma regra `media` esconde a legenda.
export function mount(el: HTMLElement): () => void {
  const els = elements();
  let shown: Element = els[25];
  const colorOf = (cat: string): string => ELEMENT_CATEGORIES.find((c) => c.name === cat)!.color;
  const data: MatrixCell[] = els.map((e) => ({
    coord: [e.col, e.row],
    id: e.symbol,
    value: e.category,
    data: e,
    label: { show: false },
    render: (ctx, r, _c, api) => {
      const fs = Math.min(r.h * 0.42, r.w * 0.42);
      if (fs < 4) return;
      ctx.fillStyle = '#ffffff';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.font = `600 ${fs}px ${api.theme.font}`;
      ctx.fillText(e.symbol, r.x + r.w / 2, r.y + r.h * (r.h > 24 ? 0.6 : 0.52));
      if (r.h > 24) {
        ctx.font = `${Math.max(7, fs * 0.42)}px ${api.theme.font}`;
        ctx.textAlign = 'left';
        ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
        ctx.fillText(String(e.z), r.x + 3, r.y + Math.max(6, fs * 0.38));
      }
    },
  }));
  // the f-block markers in group 3
  data.push({ coord: [2, 5], text: '57–71', value: 'Lantanídeos', silent: true, label: { fontSize: 9, color: '#ffffff' } });
  data.push({ coord: [2, 6], text: '89–103', value: 'Actinídeos', silent: true, label: { fontSize: 9, color: '#ffffff' } });
  // a big merged cell over the empty top of the table
  data.push({
    coord: [
      [2, 11],
      [0, 2],
    ],
    id: 'detail',
    silent: true,
    itemStyle: { color: 'transparent' },
    label: { show: false },
    render: (ctx, r, _c, api) => {
      const e = shown;
      const pad = Math.min(r.h * 0.14, 14);
      const s = r.h - 2 * pad;
      if (s < 10) return;
      const x = r.x + r.w * 0.1;
      ctx.fillStyle = colorOf(e.category);
      ctx.beginPath();
      ctx.roundRect(x, r.y + pad, s, s, 4);
      ctx.fill();
      ctx.fillStyle = '#ffffff';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.font = `600 ${s * 0.42}px ${api.theme.font}`;
      ctx.fillText(e.symbol, x + s / 2, r.y + pad + s * 0.58);
      ctx.font = `${s * 0.16}px ${api.theme.font}`;
      ctx.fillText(String(e.z), x + s / 2, r.y + pad + s * 0.17);
      ctx.textAlign = 'left';
      ctx.fillStyle = api.theme.text;
      const fs = Math.max(9, Math.min(18, r.h * 0.2));
      ctx.font = `600 ${fs}px ${api.theme.font}`;
      ctx.fillText(e.name, x + s + 10, r.y + r.h * 0.38);
      ctx.font = `${fs * 0.72}px ${api.theme.font}`;
      ctx.fillStyle = api.theme.muted;
      ctx.fillText(`${e.category} · período ${e.period}`, x + s + 10, r.y + r.h * 0.64);
    },
  });
  const visualMap = { pieces: ELEMENT_CATEGORIES.map((c) => ({ value: c.name, color: c.color, label: c.name })), position: 'bottom' as const };
  const chart = createMatrixChart(el, {
    x: { data: Array.from({ length: 18 }, (_, i) => String(i + 1)), label: { fontSize: 9 }, levelSize: 16 },
    y: { data: ['1', '2', '3', '4', '5', '6', '7', { value: ' ', size: '0.3fr' }, '6*', '7*'], label: { fontSize: 9, align: 'center' }, levelSize: 20 },
    data,
    emptyCells: 'hide',
    gap: 2,
    padding: 6,
    emphasis: 'cell',
    visualMap,
    // small screens: no legend, the table gets the room
    media: [{ query: { maxWidth: 520 }, option: { visualMap: { ...visualMap, show: false } } }],
    tooltip: {
      formatter: (c) => {
        const e = (c.data as MatrixCell).data as Element;
        return `<b>${e.z} · ${e.name} (${e.symbol})</b><br/>${e.category}<br/>Grupo ${e.col + 1} · período ${e.period}`;
      },
    },
  });
  chart.on('hover', (c) => {
    const e = c?.kind === 'body' ? ((c.data as MatrixCell | undefined)?.data as Element | undefined) : undefined;
    if (e && e !== shown) {
      shown = e;
      chart.refresh();
    }
  });
  return () => chart.destroy();
}
