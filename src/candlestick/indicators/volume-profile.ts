import type { Bar } from '../core/types';

export interface VPRow {
  lo: number;
  hi: number;
  up: number;
  down: number;
}

export interface VPResult {
  rows: VPRow[];
  poc: number;
  vaLow: number;
  vaHigh: number;
  max: number;
  total: number;
}

/** Add a bar's volume to the rows it spans (uniform intrabar assumption), split into up and down. */
function spread(rows: VPRow[], lo: number, step: number, b: Bar): void {
  const n = rows.length;
  const up = b.close >= b.open;
  const span = b.high - b.low;
  if (span <= 0) {
    const r = Math.max(0, Math.min(n - 1, Math.floor((b.close - lo) / step)));
    if (up) rows[r].up += b.volume;
    else rows[r].down += b.volume;
    return;
  }
  const r0 = Math.max(0, Math.floor((b.low - lo) / step));
  const r1 = Math.min(n - 1, Math.floor((b.high - lo) / step));
  for (let r = r0; r <= r1; r++) {
    const ov = Math.min(b.high, rows[r].hi) - Math.max(b.low, rows[r].lo);
    if (ov <= 0) continue;
    const v = (b.volume * ov) / span;
    if (up) rows[r].up += v;
    else rows[r].down += v;
  }
}

/** The row with most volume and the value area around it: rows added on the side with more volume until `vaPct`. */
function valueArea(rows: VPRow[], vaPct: number): Pick<VPResult, 'poc' | 'vaLow' | 'vaHigh' | 'max' | 'total'> {
  const n = rows.length;
  let poc = 0;
  let max = 0;
  let total = 0;
  rows.forEach((r, i) => {
    const t = r.up + r.down;
    total += t;
    if (t > max) {
      max = t;
      poc = i;
    }
  });
  let vaLow = poc;
  let vaHigh = poc;
  let acc = max;
  while (acc < total * vaPct && (vaLow > 0 || vaHigh < n - 1)) {
    const below = vaLow > 0 ? rows[vaLow - 1].up + rows[vaLow - 1].down : -1;
    const above = vaHigh < n - 1 ? rows[vaHigh + 1].up + rows[vaHigh + 1].down : -1;
    if (above >= below) {
      vaHigh++;
      acc += above;
    } else {
      vaLow--;
      acc += below;
    }
  }
  return { poc, vaLow, vaHigh, max, total };
}

/** Most rows a profile gets with a row size in price (`rowStep`): a bigger range makes the rows bigger. */
const MAX_ROWS = 2000;

/**
 * Distribute each bar's volume over the price rows it spans (uniform intrabar assumption). `rowCount` rows
 * over the range, or, with `rowStep` > 0, rows of that size in price aligned to multiples of it (TradingView's
 * "Ticks por linha": `rowStep` = ticks × tick size).
 */
export function computeVolumeProfile(bars: Bar[], from: number, to: number, rowCount: number, vaPct = 0.7, rowStep = 0): VPResult | null {
  from = Math.max(0, from);
  to = Math.min(bars.length - 1, to);
  if (to < from) return null;
  let lo = Infinity;
  let hi = -Infinity;
  for (let i = from; i <= to; i++) {
    if (bars[i].low < lo) lo = bars[i].low;
    if (bars[i].high > hi) hi = bars[i].high;
  }
  if (!isFinite(lo) || !isFinite(hi)) return null;
  let n: number;
  let step: number;
  if (rowStep > 0) {
    lo = Math.floor(lo / rowStep + 1e-9) * rowStep;
    n = Math.max(1, Math.ceil((hi - lo) / rowStep - 1e-9));
    if (lo + n * rowStep <= hi) n++; // the high on a row's edge goes in the row above
    step = rowStep;
    if (n > MAX_ROWS) {
      n = MAX_ROWS;
      step = (hi - lo) / n;
    }
  } else {
    if (!(hi > lo)) return null;
    n = Math.max(1, Math.round(rowCount));
    step = (hi - lo) / n;
  }
  const rows: VPRow[] = [];
  for (let r = 0; r < n; r++) rows.push({ lo: lo + r * step, hi: lo + (r + 1) * step, up: 0, down: 0 });
  for (let i = from; i <= to; i++) spread(rows, lo, step, bars[i]);
  return { rows, ...valueArea(rows, vaPct) };
}

/**
 * The developing POC and value area: for each bar `from`..`to`, the POC (middle of its row), VAH (top of the
 * value area) and VAL (bottom) of the bars from `from` up to it, on the rows of the session's profile `vp`.
 */
export function developingProfile(bars: Bar[], from: number, to: number, vp: VPResult, vaPct = 0.7): { poc: number[]; vah: number[]; val: number[] } {
  const rows = vp.rows.map((r) => ({ lo: r.lo, hi: r.hi, up: 0, down: 0 }));
  const lo = rows[0].lo;
  const step = rows[0].hi - rows[0].lo;
  const poc: number[] = [];
  const vah: number[] = [];
  const val: number[] = [];
  for (let i = from; i <= to; i++) {
    spread(rows, lo, step, bars[i]);
    const va = valueArea(rows, vaPct);
    poc.push((rows[va.poc].lo + rows[va.poc].hi) / 2);
    vah.push(rows[va.vaHigh].hi);
    val.push(rows[va.vaLow].lo);
  }
  return { poc, vah, val };
}

export const VP_COLORS = {
  up: 'rgba(41, 98, 255, 0.55)',
  down: 'rgba(251, 192, 45, 0.55)',
  upOut: 'rgba(41, 98, 255, 0.22)',
  downOut: 'rgba(251, 192, 45, 0.22)',
  poc: '#f23645',
};

/** Draw horizontal histogram rows. `anchorX` is where bars start; `dir` 1 = grow right, -1 = grow left. */
export function drawProfile(
  ctx: CanvasRenderingContext2D,
  vp: VPResult,
  priceToY: (p: number) => number,
  anchorX: number,
  maxWidth: number,
  dir: 1 | -1,
  pocFromX: number,
  pocToX: number,
): void {
  vp.rows.forEach((r, i) => {
    const y1 = priceToY(r.hi);
    const y2 = priceToY(r.lo);
    const top = Math.min(y1, y2) + 0.5;
    const h = Math.max(1, Math.abs(y2 - y1) - 1);
    const inVA = i >= vp.vaLow && i <= vp.vaHigh;
    const wUp = (r.up / vp.max) * maxWidth;
    const wDn = (r.down / vp.max) * maxWidth;
    ctx.fillStyle = inVA ? VP_COLORS.up : VP_COLORS.upOut;
    if (dir === 1) ctx.fillRect(anchorX, top, wUp, h);
    else ctx.fillRect(anchorX - wUp, top, wUp, h);
    ctx.fillStyle = inVA ? VP_COLORS.down : VP_COLORS.downOut;
    if (dir === 1) ctx.fillRect(anchorX + wUp, top, wDn, h);
    else ctx.fillRect(anchorX - wUp - wDn, top, wDn, h);
  });
  const pr = vp.rows[vp.poc];
  const y = Math.round(priceToY((pr.lo + pr.hi) / 2)) + 0.5;
  ctx.strokeStyle = VP_COLORS.poc;
  ctx.lineWidth = 1;
  ctx.setLineDash([]);
  ctx.beginPath();
  ctx.moveTo(pocFromX, y);
  ctx.lineTo(pocToX, y);
  ctx.stroke();
}
