import { theme } from './theme';
import { Bar, ChartType } from './types';
import { withAlpha } from './utils';
import { PaneView } from './view';

/** lightweight-charts' optimal candle body width (bitmap pixels). */
export function optimalBarWidth(barSpacing: number, pr: number): number {
  const from = 2.5;
  const to = 4;
  if (barSpacing >= from && barSpacing <= to) return Math.floor(3 * pr);
  const coeff = 1 - (0.2 * Math.atan(Math.max(to, barSpacing) - to)) / (Math.PI * 0.5);
  const res = Math.floor(barSpacing * coeff * pr);
  const scaled = Math.floor(barSpacing * pr);
  return Math.max(Math.floor(pr), Math.min(res, scaled));
}

export function heikinAshi(src: Bar[], out: Bar[], from: number): Bar[] {
  out.length = Math.min(out.length, from);
  for (let i = out.length; i < src.length; i++) {
    const b = src[i];
    const close = (b.open + b.high + b.low + b.close) / 4;
    const open = i === 0 ? (b.open + b.close) / 2 : (out[i - 1].open + out[i - 1].close) / 2;
    out.push({ time: b.time, open, close, high: Math.max(b.high, open, close), low: Math.min(b.low, open, close), volume: b.volume });
  }
  return out;
}

export interface SeriesColors {
  up: string;
  down: string;
  wickUp: string;
  wickDown: string;
  borderUp: string;
  borderDown: string;
  border: boolean;
  line: string;
}

/** Series colors from the theme currently being rendered. */
export function seriesColorsFromTheme(): SeriesColors {
  return {
    up: theme.up,
    down: theme.down,
    wickUp: theme.wickUp,
    wickDown: theme.wickDown,
    borderUp: theme.borderUp,
    borderDown: theme.borderDown,
    border: theme.candleBorder,
    line: theme.line,
  };
}

export function drawSeries(v: PaneView, type: ChartType, bars: Bar[], colors: SeriesColors = seriesColorsFromTheme()): void {
  const from = Math.max(0, v.from - 1);
  const to = Math.min(bars.length - 1, v.to + 1);
  if (to < from) return;
  switch (type) {
    case 'candles':
    case 'heikin':
      drawCandles(v, bars, from, to, colors, false);
      break;
    case 'hollow':
      drawCandles(v, bars, from, to, colors, true);
      break;
    case 'bars':
      drawOhlcBars(v, bars, from, to, colors);
      break;
    case 'line':
    case 'step':
      drawLineSeries(v, bars, from, to, colors.line, type === 'step');
      break;
    case 'area':
      drawArea(v, bars, from, to, colors.line);
      break;
    case 'baseline':
      drawBaseline(v, bars, from, to, colors);
      break;
  }
}

function bitmapScope(v: PaneView, fn: (ctx: CanvasRenderingContext2D) => void): void {
  const ctx = v.ctx;
  ctx.save();
  ctx.setTransform(1, 0, 0, 1, Math.round(v.rect.x * v.dpr), Math.round(v.rect.y * v.dpr));
  fn(ctx);
  ctx.restore();
}

function drawCandles(v: PaneView, bars: Bar[], from: number, to: number, c: SeriesColors, hollow: boolean): void {
  const pr = v.dpr;
  const spacing = v.ts.barSpacing;
  let bw = optimalBarWidth(spacing, pr);
  const ww = Math.max(1, Math.min(Math.floor(pr), bw));
  if (bw >= 2 && (bw % 2) !== (ww % 2)) bw--;
  const wickOff = Math.floor(ww * 0.5);
  const border = Math.max(1, Math.floor(pr));
  const thin = spacing * pr < 2.5;
  const isUp = (i: number): boolean => {
    const b = bars[i];
    return hollow ? b.close >= (i > 0 ? bars[i - 1].close : b.open) : b.close >= b.open;
  };
  const px = (p: number): number => Math.round(v.ps.priceToY(p) * pr);

  bitmapScope(v, (ctx) => {
    // 1) wicks (split around the body so hollow bodies stay empty)
    for (const up of [true, false]) {
      ctx.fillStyle = thin ? (up ? c.up : c.down) : up ? c.wickUp : c.wickDown;
      for (let i = from; i <= to; i++) {
        if (isUp(i) !== up) continue;
        const b = bars[i];
        const x = Math.round(v.ts.indexToX(i) * pr);
        const yo = px(b.open);
        const yc = px(b.close);
        const yh = px(b.high);
        const yl = px(b.low);
        const top = Math.min(yo, yc);
        const bottom = Math.max(yo, yc);
        const wl = x - wickOff;
        if (thin) {
          ctx.fillRect(wl, Math.min(yh, top), ww, Math.max(yl, bottom) - Math.min(yh, top) + 1);
          continue;
        }
        if (top > yh) ctx.fillRect(wl, yh, ww, top - yh);
        if (yl > bottom) ctx.fillRect(wl, bottom + 1, ww, yl - bottom);
      }
    }
    if (thin) return;
    // 2) bodies (+ optional border)
    for (const up of [true, false]) {
      const bodyColor = up ? c.up : c.down;
      const borderColor = up ? c.borderUp : c.borderDown;
      for (let i = from; i <= to; i++) {
        if (isUp(i) !== up) continue;
        const b = bars[i];
        const x = Math.round(v.ts.indexToX(i) * pr);
        const yo = px(b.open);
        const yc = px(b.close);
        const top = Math.min(yo, yc);
        const bottom = Math.max(yo, yc);
        const left = x - Math.floor(bw * 0.5);
        const h = bottom - top + 1;
        const outline = (hollow && b.close > b.open) || c.border;
        const canOutline = bw > border * 2 + 1 && h > border * 2;
        if (outline && canOutline) {
          ctx.fillStyle = hollow && b.close > b.open ? bodyColor : borderColor;
          ctx.fillRect(left, top, bw, border);
          ctx.fillRect(left, bottom - border + 1, bw, border);
          ctx.fillRect(left, top, border, h);
          ctx.fillRect(left + bw - border, top, border, h);
          if (!(hollow && b.close > b.open)) {
            ctx.fillStyle = bodyColor;
            ctx.fillRect(left + border, top + border, bw - border * 2, h - border * 2);
          }
        } else {
          ctx.fillStyle = c.border ? borderColor : bodyColor;
          ctx.fillRect(left, top, bw, h);
        }
      }
    }
  });
}

function drawOhlcBars(v: PaneView, bars: Bar[], from: number, to: number, c: SeriesColors): void {
  const pr = v.dpr;
  const spacing = v.ts.barSpacing;
  const thick = Math.max(1, Math.min(Math.floor(pr * Math.max(1, spacing / 12)), Math.floor(spacing * pr * 0.3) || 1));
  const tick = Math.max(Math.floor(pr), Math.floor(optimalBarWidth(spacing, pr) / 2));
  const off = Math.floor(thick / 2);
  bitmapScope(v, (ctx) => {
    for (const pass of [0, 1]) {
      ctx.fillStyle = pass === 0 ? c.up : c.down;
      for (let i = from; i <= to; i++) {
        const b = bars[i];
        const up = b.close >= (i > 0 ? bars[i - 1].close : b.open);
        if ((pass === 0) !== up) continue;
        const x = Math.round(v.ts.indexToX(i) * pr);
        const yo = Math.round(v.ps.priceToY(b.open) * pr);
        const yc = Math.round(v.ps.priceToY(b.close) * pr);
        const yh = Math.round(v.ps.priceToY(b.high) * pr);
        const yl = Math.round(v.ps.priceToY(b.low) * pr);
        ctx.fillRect(x - off, yh, thick, Math.max(yl - yh + 1, thick));
        if (spacing * pr >= 3) {
          ctx.fillRect(x - off - tick, yo - off, tick, thick);
          ctx.fillRect(x - off + thick, yc - off, tick, thick);
        }
      }
    }
  });
}

function tracePath(ctx: CanvasRenderingContext2D, v: PaneView, bars: Bar[], from: number, to: number, step: boolean): void {
  let prevY = 0;
  for (let i = from; i <= to; i++) {
    const x = v.ts.indexToX(i);
    const y = v.ps.priceToY(bars[i].close);
    if (i === from) ctx.moveTo(x, y);
    else if (step) {
      ctx.lineTo(x, prevY);
      ctx.lineTo(x, y);
    } else ctx.lineTo(x, y);
    prevY = y;
  }
}

function drawLineSeries(v: PaneView, bars: Bar[], from: number, to: number, color: string, step: boolean): void {
  const ctx = v.ctx;
  ctx.save();
  ctx.lineWidth = 2;
  ctx.lineJoin = 'round';
  ctx.lineCap = 'round';
  ctx.strokeStyle = color;
  ctx.beginPath();
  tracePath(ctx, v, bars, from, to, step);
  ctx.stroke();
  ctx.restore();
}

function drawArea(v: PaneView, bars: Bar[], from: number, to: number, color: string): void {
  const ctx = v.ctx;
  ctx.save();
  const grad = ctx.createLinearGradient(0, 0, 0, v.height);
  grad.addColorStop(0, withAlpha(color, 0.28));
  grad.addColorStop(1, withAlpha(color, 0.02));
  ctx.beginPath();
  tracePath(ctx, v, bars, from, to, false);
  ctx.lineTo(v.ts.indexToX(to), v.height);
  ctx.lineTo(v.ts.indexToX(from), v.height);
  ctx.closePath();
  ctx.fillStyle = grad;
  ctx.fill();
  ctx.lineWidth = 2;
  ctx.lineJoin = 'round';
  ctx.strokeStyle = color;
  ctx.beginPath();
  tracePath(ctx, v, bars, from, to, false);
  ctx.stroke();
  ctx.restore();
}

function drawBaseline(v: PaneView, bars: Bar[], from: number, to: number, c: SeriesColors): void {
  const ctx = v.ctx;
  const baseY = v.height / 2;
  for (const side of [0, 1]) {
    const color = side === 0 ? c.up : c.down;
    ctx.save();
    ctx.beginPath();
    if (side === 0) ctx.rect(0, 0, v.width, baseY);
    else ctx.rect(0, baseY, v.width, v.height - baseY);
    ctx.clip();
    const grad = ctx.createLinearGradient(0, side === 0 ? 0 : v.height, 0, baseY);
    grad.addColorStop(0, withAlpha(color, 0.28));
    grad.addColorStop(1, withAlpha(color, 0.05));
    ctx.beginPath();
    tracePath(ctx, v, bars, from, to, false);
    ctx.lineTo(v.ts.indexToX(to), baseY);
    ctx.lineTo(v.ts.indexToX(from), baseY);
    ctx.closePath();
    ctx.fillStyle = grad;
    ctx.fill();
    ctx.lineWidth = 2;
    ctx.lineJoin = 'round';
    ctx.strokeStyle = color;
    ctx.beginPath();
    tracePath(ctx, v, bars, from, to, false);
    ctx.stroke();
    ctx.restore();
  }
  ctx.save();
  ctx.strokeStyle = withAlpha(theme.muted, 0.6);
  ctx.setLineDash([4, 4]);
  ctx.lineWidth = 1;
  ctx.beginPath();
  const y = Math.round(baseY) + 0.5;
  ctx.moveTo(0, y);
  ctx.lineTo(v.width, y);
  ctx.stroke();
  ctx.restore();
}
