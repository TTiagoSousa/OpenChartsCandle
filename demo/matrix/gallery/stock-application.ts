import { createLineChart } from 'openchartscandle/line';
import { createMatrixChart, type MatrixCell } from 'openchartscandle/matrix';
import { DOWN, UP, drawBars, drawCandles, watchlist, type Quote } from '../data';

// Uma watchlist feita com uma matriz: uma linha por ação e colunas agrupadas (cotação, gráficos, 52 semanas).
// A tendência de 40 dias é um gráfico de linhas da família line em modo sparkline dentro da célula; o volume,
// as velas e o intervalo de 52 semanas são desenhados com renderCell. Um click no ticker seleciona a linha.
export function mount(el: HTMLElement): () => void {
  const quotes = watchlist();
  const money = (v: number): string => v.toLocaleString('pt-PT', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const data: MatrixCell[] = [];
  quotes.forEach((q: Quote) => {
    const up = q.change >= 0;
    const col = up ? UP : DOWN;
    data.push({ coord: ['Nome', q.ticker], value: q.name, label: { align: 'left', color: '#9598a1' } });
    data.push({ coord: ['Preço', q.ticker], value: q.price, text: money(q.price), label: { align: 'right', fontWeight: 600 } });
    data.push({
      coord: ['Var.', q.ticker],
      value: q.change,
      text: `${up ? '+' : ''}${q.change.toFixed(2)}%`,
      color: up ? 'rgba(8, 153, 129, 0.18)' : 'rgba(242, 54, 69, 0.18)',
      label: { color: col, align: 'right', fontWeight: 600 },
    });
    data.push({
      coord: ['40 dias', q.ticker],
      value: q.closes,
      mount: (cellEl) => {
        const c = createLineChart(cellEl, { series: [{ name: q.ticker, data: q.closes, color: col }], sparkline: true, area: { opacity: 0.2, gradient: true }, background: 'transparent' });
        return () => c.destroy();
      },
    });
    data.push({ coord: ['Volume', q.ticker], value: q.volumes, render: (ctx, r) => drawBars(ctx, r, q.volumes, 'rgba(120, 123, 134, 0.6)', { highlight: col, pad: 5 }) });
    data.push({ coord: ['Velas', q.ticker], value: q.candles, render: (ctx, r) => drawCandles(ctx, r, q.candles, 5) });
    data.push({
      coord: ['Intervalo', q.ticker],
      value: q.price,
      text: '',
      render: (ctx, r, _c, api) => {
        const pad = 8;
        const y = r.y + r.h / 2;
        const w = r.w - 2 * pad;
        if (w < 10) return;
        const t = (q.price - q.low52) / (q.high52 - q.low52);
        ctx.fillStyle = 'rgba(120, 123, 134, 0.35)';
        ctx.fillRect(r.x + pad, y - 2, w, 4);
        const g = ctx.createLinearGradient(r.x + pad, 0, r.x + pad + w, 0);
        g.addColorStop(0, DOWN);
        g.addColorStop(1, UP);
        ctx.fillStyle = g;
        ctx.fillRect(r.x + pad, y - 2, w * t * api.progress, 4);
        ctx.fillStyle = api.theme.text;
        ctx.beginPath();
        ctx.arc(r.x + pad + w * t * api.progress, y, 4, 0, Math.PI * 2);
        ctx.fill();
        if (r.h > 34) {
          ctx.font = `10px ${api.theme.font}`;
          ctx.fillStyle = api.theme.muted;
          ctx.textBaseline = 'top';
          ctx.textAlign = 'left';
          ctx.fillText(money(q.low52), r.x + pad, y + 6);
          ctx.textAlign = 'right';
          ctx.fillText(money(q.high52), r.x + r.w - pad, y + 6);
        }
      },
    });
  });
  const chart = createMatrixChart(el, {
    title: { text: 'Watchlist', subtext: 'Dados inventados', align: 'left' },
    x: {
      data: ['Nome', { value: 'Cotação', children: ['Preço', 'Var.'] }, { value: 'Gráficos', children: ['40 dias', 'Volume', 'Velas'] }, { value: '52 semanas', children: ['Intervalo'] }],
      cellSize: ['1.1fr', '0.9fr', '0.8fr', '1.4fr', '1fr', '1fr', '1.3fr'],
      levelSize: 22,
    },
    y: { data: quotes.map((q) => q.ticker), label: { fontWeight: 600 } },
    corner: { text: 'Ticker' },
    data,
    select: 'single',
    emphasis: 'row',
    mountPadding: 3,
    tooltip: {
      formatter: (c) => {
        const q = quotes.find((x) => x.ticker === c.yName)!;
        return `<b>${q.ticker} · ${q.name}</b><br/>${money(q.price)} (${q.change >= 0 ? '+' : ''}${q.change.toFixed(2)}%)<br/>52 sem.: ${money(q.low52)} – ${money(q.high52)}`;
      },
    },
  });
  return () => chart.destroy();
}
