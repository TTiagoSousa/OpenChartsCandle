import { font, theme } from './theme';
import { withAlpha } from './utils';
import type { PaneView } from './view';

/** A position with an entry and (optionally) an exit, drawn like a strategy tester. */
export interface Trade {
  id?: string;
  side: 'long' | 'short';
  entryTime: number;
  entryPrice: number;
  /** Omit while the trade is open: the chart shows live P&L against the last price. */
  exitTime?: number;
  exitPrice?: number;
  /** Quantity, shown in the label and used for absolute P&L */
  qty?: number;
  /** Text of the entry label. Default "Long" / "Short" */
  label?: string;
  /** Text of the exit label. Default: P&L % */
  exitLabel?: string;
}

/** Free-form marker (signal, note, fill…). */
export interface Marker {
  time: number;
  price: number;
  shape?: 'arrowUp' | 'arrowDown' | 'circle' | 'square';
  color?: string;
  text?: string;
}

/**
 * What is drawn for each trade. `entries` / `exits` turn the markers on or off;
 * `lines` is the dashed line from entry to exit (with the P&L in the middle).
 */
export interface TradeDisplay {
  entries: boolean;
  exits: boolean;
  lines: boolean;
}

/** Where a trade was clicked: its entry or its exit marker. */
export type TradePoint = 'entry' | 'exit';

export interface TradeClickEvent {
  trade: Trade;
  point: TradePoint;
}

/** Screen area of a drawn entry/exit marker (pane coordinates), used for clicks. */
export interface TradeHit {
  trade: Trade;
  point: TradePoint;
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface TradeColors {
  long: string;
  short: string;
  profit: string;
  loss: string;
}

export interface TradeStats {
  total: number;
  closed: number;
  open: number;
  wins: number;
  losses: number;
  /** % of closed trades with profit */
  winRate: number;
  /** Sum of P&L % of all trades (open ones at the last price) */
  pnlPct: number;
  /** Sum of absolute P&L (qty × price difference) */
  pnl: number;
}

const toSec = (t: number): number => (t > 1e11 ? Math.floor(t / 1000) : t);

export function tradePnl(t: Trade, lastPrice: number): { abs: number; pct: number } {
  const exit = t.exitPrice ?? lastPrice;
  const diff = (exit - t.entryPrice) * (t.side === 'long' ? 1 : -1);
  return { abs: diff * (t.qty ?? 1), pct: (diff / t.entryPrice) * 100 };
}

export function tradeStats(trades: Trade[], lastPrice: number): TradeStats {
  let wins = 0;
  let losses = 0;
  let pnl = 0;
  let pnlPct = 0;
  let closed = 0;
  for (const t of trades) {
    const r = tradePnl(t, lastPrice);
    pnl += r.abs;
    pnlPct += r.pct;
    if (t.exitPrice === undefined) continue;
    closed++;
    if (r.abs > 0) wins++;
    else losses++;
  }
  return { total: trades.length, closed, open: trades.length - closed, wins, losses, winRate: closed ? (wins / closed) * 100 : 0, pnlPct, pnl };
}

/** x of the bar that contains `time` in the current timeframe (10:37 → the 10:00 bar on 1h). */
function snapX(v: PaneView, time: number): number {
  return v.ts.indexToX(v.data.indexAt(toSec(time)));
}

function arrow(ctx: CanvasRenderingContext2D, x: number, y: number, up: boolean, color: string, size = 7): void {
  ctx.fillStyle = color;
  ctx.beginPath();
  if (up) {
    ctx.moveTo(x, y);
    ctx.lineTo(x - size, y + size * 1.3);
    ctx.lineTo(x - size * 0.35, y + size * 1.3);
    ctx.lineTo(x - size * 0.35, y + size * 2.2);
    ctx.lineTo(x + size * 0.35, y + size * 2.2);
    ctx.lineTo(x + size * 0.35, y + size * 1.3);
    ctx.lineTo(x + size, y + size * 1.3);
  } else {
    ctx.moveTo(x, y);
    ctx.lineTo(x - size, y - size * 1.3);
    ctx.lineTo(x - size * 0.35, y - size * 1.3);
    ctx.lineTo(x - size * 0.35, y - size * 2.2);
    ctx.lineTo(x + size * 0.35, y - size * 2.2);
    ctx.lineTo(x + size * 0.35, y - size * 1.3);
    ctx.lineTo(x + size, y - size * 1.3);
  }
  ctx.closePath();
  ctx.fill();
}

function bubble(ctx: CanvasRenderingContext2D, text: string, x: number, y: number, bg: string, below: boolean): { x: number; y: number; w: number; h: number } {
  ctx.font = font(11, '600');
  const w = ctx.measureText(text).width + 10;
  const h = 17;
  const left = Math.round(x - w / 2);
  const top = Math.round(below ? y : y - h);
  ctx.fillStyle = bg;
  ctx.beginPath();
  ctx.roundRect(left, top, w, h, 3);
  ctx.fill();
  ctx.fillStyle = '#ffffff';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(text, left + w / 2, top + h / 2 + 0.5);
  return { x: left, y: top, w, h };
}

/** Ring drawn around the entry/exit of the selected trade. */
function ring(ctx: CanvasRenderingContext2D, x: number, y: number, color: string): void {
  ctx.strokeStyle = color;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(x, y, 7, 0, Math.PI * 2);
  ctx.stroke();
  ctx.fillStyle = withAlpha(color, 0.25);
  ctx.beginPath();
  ctx.arc(x, y, 12, 0, Math.PI * 2);
  ctx.fill();
}

/** Bounding box of a marker: the point, the arrow and its label. */
function hitBox(trade: Trade, point: TradePoint, x: number, y: number, up: boolean, label: { x: number; y: number; w: number; h: number } | null): TradeHit {
  let top = up ? y - 6 : y - 6 - 7 * 2.2;
  let bottom = up ? y + 6 + 7 * 2.2 : y + 6;
  let left = x - 9;
  let right = x + 9;
  if (label) {
    top = Math.min(top, label.y);
    bottom = Math.max(bottom, label.y + label.h);
    left = Math.min(left, label.x);
    right = Math.max(right, label.x + label.w);
  }
  return { trade, point, x: left, y: top, w: right - left, h: bottom - top };
}

const pct = (p: number): string => `${p >= 0 ? '+' : '−'}${Math.abs(p).toFixed(2)}%`;

/**
 * Draw trades on the main pane (context already translated to the pane).
 * Returns the clickable areas of the entries/exits that were drawn.
 */
export function drawTrades(v: PaneView, trades: Trade[], colors: TradeColors, display: TradeDisplay = { entries: true, exits: true, lines: true }, selectedId: string | null = null): TradeHit[] {
  const hits: TradeHit[] = [];
  const bars = v.bars;
  const last = bars[bars.length - 1];
  if (!last || (!display.entries && !display.exits)) return hits;
  const ctx = v.ctx;
  const lastX = v.ts.indexToX(bars.length - 1);
  // the connector only makes sense with both ends visible
  const lines = display.lines && display.entries && display.exits;
  for (const t of trades) {
    const xe = snapX(v, t.entryTime);
    const open = t.exitTime === undefined || t.exitPrice === undefined;
    const xx = open ? lastX : snapX(v, t.exitTime!);
    if (Math.max(xe, xx) < -40 || Math.min(xe, xx) > v.width + 40) continue;
    const ye = v.priceToY(t.entryPrice);
    const yx = v.priceToY(open ? last.close : t.exitPrice!);
    const { abs, pct: p } = tradePnl(t, last.close);
    const win = abs >= 0;
    const pnlColor = win ? colors.profit : colors.loss;
    const sideColor = t.side === 'long' ? colors.long : colors.short;
    const isLong = t.side === 'long';
    const selected = selectedId !== null && t.id === selectedId;

    ctx.save();
    // connector entry -> exit (or -> last price while open)
    if (lines) {
      ctx.strokeStyle = withAlpha(pnlColor, selected ? 1 : 0.85);
      ctx.lineWidth = selected ? 2.5 : 1.5;
      ctx.setLineDash([5, 4]);
      ctx.beginPath();
      ctx.moveTo(xe, ye);
      ctx.lineTo(xx, yx);
      ctx.stroke();
    }
    if (open && display.entries) {
      // entry price level while the position is open
      ctx.strokeStyle = withAlpha(sideColor, 0.7);
      ctx.lineWidth = 1;
      ctx.setLineDash([2, 3]);
      const y = Math.round(ye) + 0.5;
      ctx.beginPath();
      ctx.moveTo(xe, y);
      ctx.lineTo(v.width, y);
      ctx.stroke();
    }
    ctx.setLineDash([]);

    // entry: arrow pointing to the entry price, label on the outside
    if (display.entries) {
      if (selected) ring(ctx, xe, ye, sideColor);
      ctx.fillStyle = sideColor;
      ctx.beginPath();
      ctx.arc(xe, ye, 2.5, 0, Math.PI * 2);
      ctx.fill();
      arrow(ctx, xe, isLong ? ye + 5 : ye - 5, isLong, sideColor);
      const qty = t.qty !== undefined ? ` ${t.qty}` : '';
      const lb = bubble(ctx, `${t.label ?? (isLong ? 'Long' : 'Short')}${qty}`, xe, isLong ? ye + 24 : ye - 24, sideColor, isLong);
      hits.push(hitBox(t, 'entry', xe, ye, isLong, lb));
    }

    // exit
    if (!open && display.exits) {
      if (selected) ring(ctx, xx, yx, pnlColor);
      ctx.fillStyle = pnlColor;
      ctx.beginPath();
      ctx.arc(xx, yx, 2.5, 0, Math.PI * 2);
      ctx.fill();
      arrow(ctx, xx, isLong ? yx - 5 : yx + 5, !isLong, pnlColor);
      let lb: { x: number; y: number; w: number; h: number } | null = null;
      if (lines) {
        // P&L in the middle of the connector, so it never hides behind the next entry label
        const mx = (xe + xx) / 2;
        const my = (ye + yx) / 2;
        if (Math.abs(xx - xe) > 46) bubble(ctx, t.exitLabel ?? pct(p), mx, my - 8, withAlpha(pnlColor, 0.9), true);
      } else {
        // without the line the P&L sits to the right of the exit arrow, clear of the next entry's label
        const text = t.exitLabel ?? pct(p);
        ctx.font = font(11, '600');
        const w = ctx.measureText(text).width + 10;
        lb = bubble(ctx, text, xx + 9 + w / 2, isLong ? yx - 3.5 : yx + 3.5, withAlpha(pnlColor, 0.9), !isLong);
      }
      hits.push(hitBox(t, 'exit', xx, yx, !isLong, lb));
    } else if (open && display.entries) {
      bubble(ctx, `${isLong ? 'Long' : 'Short'} aberto ${pct(p)}`, Math.min(v.width - 70, lastX + 60), yx - 12, pnlColor, false);
    }
    ctx.restore();
  }
  return hits;
}

export function drawMarkers(v: PaneView, markers: Marker[]): void {
  const ctx = v.ctx;
  for (const m of markers) {
    const x = snapX(v, m.time);
    if (x < -20 || x > v.width + 20) continue;
    const y = v.priceToY(m.price);
    const color = m.color ?? theme.accent;
    const shape = m.shape ?? 'circle';
    ctx.save();
    ctx.fillStyle = color;
    if (shape === 'arrowUp' || shape === 'arrowDown') arrow(ctx, x, y, shape === 'arrowUp', color, 6);
    else if (shape === 'square') ctx.fillRect(x - 4, y - 4, 8, 8);
    else {
      ctx.beginPath();
      ctx.arc(x, y, 4, 0, Math.PI * 2);
      ctx.fill();
    }
    if (m.text) {
      const below = shape === 'arrowUp';
      const off = shape === 'arrowUp' ? 22 : shape === 'arrowDown' ? -22 : -8;
      ctx.font = font(11, '600');
      ctx.fillStyle = color;
      ctx.textAlign = 'center';
      ctx.textBaseline = below ? 'top' : 'bottom';
      ctx.fillText(m.text, x, y + off);
    }
    ctx.restore();
  }
}
