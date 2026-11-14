import { font, theme } from './theme';
import { withAlpha } from './utils';
import type { PaneView } from './view';

/**
 * A vertical line (only `from`) or a shaded zone (`from` → `to`) on the time axis: the start of a
 * simulation, the warm-up of the indicators, excluded periods, sessions…
 * Times are unix seconds or milliseconds. Each edge snaps to the bar that contains it, in any timeframe.
 */
export interface TimeRange {
  /** To change or remove it later. Default: generated. */
  id?: string;
  /** Start: where the line is, or the first instant of the zone. */
  from: number;
  /** End of the zone (exclusive). Omit for a line. */
  to?: number;
  /** Default: the theme's accent color. */
  color?: string;
  /** Text at the bottom of the main pane, next to the line or inside the zone. */
  label?: string;
  /** Line style (and the edges of a zone with `border`). Default 'dashed' for lines. */
  lineStyle?: 'solid' | 'dashed' | 'dotted';
  /** Line width in px. Default 1. */
  lineWidth?: number;
  /** Fill opacity of a zone, 0–1. Default 0.12. */
  opacity?: number;
  /** Draw the edges of a zone. Default false. */
  border?: boolean;
  /** Also in the indicator panes below the chart. Default true. */
  allPanes?: boolean;
}

const toSec = (t: number): number => (t > 1e11 ? Math.floor(t / 1000) : t);
const DASH: Record<string, number[]> = { solid: [], dashed: [6, 4], dotted: [1, 3] };

/** Left edge (x) of the bar that contains `t`. */
function edgeX(v: PaneView, t: number): number {
  return v.ts.indexToX(v.data.indexAt(t)) - v.ts.barSpacing / 2;
}

function vline(v: PaneView, x: number, color: string, style: string, width: number): void {
  const ctx = v.ctx;
  const xx = (Math.round(x * v.dpr) + (Math.round(width * v.dpr) % 2 ? 0.5 : 0)) / v.dpr;
  ctx.save();
  ctx.strokeStyle = color;
  ctx.lineWidth = width;
  ctx.setLineDash(DASH[style] ?? []);
  ctx.beginPath();
  ctx.moveTo(xx, 0);
  ctx.lineTo(xx, v.height);
  ctx.stroke();
  ctx.restore();
}

/** Zones and lines behind the bars. `main` also draws the labels. */
export function drawTimeRanges(v: PaneView, ranges: TimeRange[], main: boolean): void {
  if (!v.data.length) return;
  const ctx = v.ctx;
  const placed: { a: number; b: number; y: number }[] = [];
  for (const r of ranges) {
    if (!main && r.allPanes === false) continue;
    const color = r.color ?? theme.accent;
    const width = r.lineWidth ?? 1;
    const x1 = edgeX(v, toSec(r.from));
    let x2 = x1;
    if (r.to !== undefined) {
      const to = toSec(r.to);
      if (to <= toSec(r.from)) continue;
      // right edge of the bar that contains the last instant of the zone
      x2 = v.ts.indexToX(v.data.indexAt(to - 1e-6)) + v.ts.barSpacing / 2;
    }
    if (x2 < -2 || x1 > v.width + 2) continue;
    if (r.to === undefined) vline(v, x1, color, r.lineStyle ?? 'dashed', width);
    else {
      ctx.fillStyle = withAlpha(color, r.opacity ?? 0.12);
      ctx.fillRect(x1, 0, x2 - x1, v.height);
      if (r.border) {
        vline(v, x1, color, r.lineStyle ?? 'solid', width);
        vline(v, x2, color, r.lineStyle ?? 'solid', width);
      }
    }
    if (!main || !r.label) continue;
    ctx.font = font(11, '600');
    const w = ctx.measureText(r.label).width + 10;
    // at the start of the zone or to the right of the line; a zone scrolled past the left edge keeps it inside
    let left = Math.max(2, x1 + 4);
    if (r.to !== undefined && x1 < 2) left = Math.min(left, x2 - w - 4);
    left = Math.min(left, v.width - w - 2);
    // at the bottom (the legend is at the top), stacked upwards when they would overlap
    let top = v.height - 24;
    while (placed.some((p) => left < p.b && left + w > p.a && p.y === top)) top -= 22;
    placed.push({ a: left, b: left + w, y: top });
    ctx.fillStyle = withAlpha(color, 0.9);
    ctx.beginPath();
    ctx.roundRect(left, top, w, 18, 3);
    ctx.fill();
    ctx.fillStyle = '#ffffff';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.fillText(r.label, left + 5, top + 9.5);
  }
}
