import { font, theme } from '../core/theme';
import type { Point } from '../core/types';
import { distToLine, distToSegment, formatDuration, formatVolume, withAlpha } from '../core/utils';
import type { PaneView } from '../core/view';
import { computeVolumeProfile, drawProfile } from '../indicators/volume-profile';
import {
  AxisMarks, DrawState, Drawing, DrawingOptions, FIB_DEFAULTS, Handle, SettingField, applyStroke, bands,
  drawArrowHead, drawLabel, extendSegment, hLine, roundRect, strokeLine, vLine,
} from './base';

// ---------- helpers ----------

export function snapTime(v: PaneView, x: number): number {
  return v.data.indexToTime(Math.round(v.ts.xToIndex(x)));
}

/** Constrain p relative to anchor to multiples of 45° in screen space. */
export function snapAngle(v: PaneView, anchor: Point, p: Point): Point {
  const a = v.toXY(anchor);
  const b = v.toXY(p);
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const step = Math.PI / 4;
  const ang = Math.round(Math.atan2(dy, dx) / step) * step;
  const len = Math.hypot(dx, dy);
  const x = a.x + Math.cos(ang) * len;
  const y = a.y + Math.sin(ang) * len;
  const horizontal = Math.abs(Math.sin(ang)) < 1e-6;
  const vertical = Math.abs(Math.cos(ang)) < 1e-6;
  return {
    time: vertical ? anchor.time : snapTime(v, x),
    price: horizontal ? anchor.price : v.yToPrice(y),
  };
}

function idx(v: PaneView, t: number): number {
  return v.data.timeToIndex(t);
}

function priceOnLine(v: PaneView, a: Point, b: Point, t: number): number {
  const ia = idx(v, a.time);
  const ib = idx(v, b.time);
  if (ib === ia) return a.price;
  return a.price + ((b.price - a.price) * (idx(v, t) - ia)) / (ib - ia);
}

function lineText(ctx: CanvasRenderingContext2D, d: Drawing, x1: number, y1: number, x2: number, y2: number): void {
  if (!d.opts.text) return;
  let ang = Math.atan2(y2 - y1, x2 - x1);
  if (ang > Math.PI / 2) ang -= Math.PI;
  if (ang < -Math.PI / 2) ang += Math.PI;
  ctx.save();
  ctx.translate((x1 + x2) / 2, (y1 + y2) / 2);
  ctx.rotate(ang);
  ctx.font = font(d.opts.fontSize);
  ctx.fillStyle = d.opts.textColor || d.opts.color;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'bottom';
  ctx.fillText(d.opts.text, 0, -4);
  ctx.restore();
}

const pctFmt = (x: number): string => (x >= 0 ? '' : '−') + Math.abs(x).toFixed(2) + '%';
const signFmt = (s: string, x: number): string => (x >= 0 ? s : '−' + s.replace('-', ''));

function fillEnabledField(): SettingField[] {
  return [
    { key: 'fill', label: 'Fundo', type: 'fill' },
  ];
}

// ---------- lines ----------

export class TrendLine extends Drawing {
  readonly type: string = 'trendline';
  readonly title: string = 'Linha de tendência';
  readonly pointsNeeded = 2;
  arrow = false;

  settings(): SettingField[] {
    return [
      ...super.settings(),
      { key: 'extendLeft', label: 'Estender à esquerda', type: 'bool' },
      { key: 'extendRight', label: 'Estender à direita', type: 'bool' },
      { key: 'showLabels', label: 'Mostrar estatísticas', type: 'bool' },
      { key: 'text', label: 'Texto', type: 'text' },
    ];
  }
  protected defaults(): Partial<DrawingOptions> {
    return { showLabels: false };
  }

  draw(v: PaneView, s: DrawState): void {
    if (this.points.length < 2) return;
    const ctx = v.ctx;
    const a = v.toXY(this.points[0]);
    const b = v.toXY(this.points[1]);
    const [x1, y1, x2, y2] = extendSegment(a.x, a.y, b.x, b.y, v.width, v.height, this.opts.extendLeft, this.opts.extendRight);
    applyStroke(ctx, this.opts.color, this.opts.width, this.opts.dash);
    strokeLine(ctx, x1, y1, x2, y2);
    if (this.arrow) {
      applyStroke(ctx, this.opts.color, this.opts.width);
      drawArrowHead(ctx, a.x, a.y, b.x, b.y, this.opts.width);
    }
    lineText(ctx, this, a.x, a.y, b.x, b.y);
    if (this.opts.showLabels || (s.creating && this.type === 'infoline')) this.drawStats(v, a, b);
  }

  protected drawStats(v: PaneView, a: { x: number; y: number }, b: { x: number; y: number }): void {
    const [p0, p1] = this.points;
    const dp = p1.price - p0.price;
    const bars = Math.round(idx(v, p1.time) - idx(v, p0.time));
    const ang = (Math.atan2(-(b.y - a.y), b.x - a.x) * 180) / Math.PI;
    const text = `${signFmt(v.fmt(Math.abs(dp)), dp)} (${pctFmt((dp / p0.price) * 100)})\n${bars} barras, ${formatDuration(p1.time - p0.time)}\n∠ ${ang.toFixed(2)}°`;
    drawLabel(v.ctx, text, b.x + 12, b.y, { bg: withAlpha(theme.bg, 0.92), color: theme.textStrong, size: 12, align: 'left' });
  }

  distance(v: PaneView, x: number, y: number): number {
    if (this.points.length < 2) return Infinity;
    const a = v.toXY(this.points[0]);
    const b = v.toXY(this.points[1]);
    return distToLine(x, y, a.x, a.y, b.x, b.y, this.opts.extendLeft, this.opts.extendRight);
  }

  moveHandle(index: number, p: Point, v: PaneView, shift: boolean): void {
    const other = this.points[1 - index];
    this.points[index] = shift && other ? snapAngle(v, other, p) : { ...p };
  }
}

export class Ray extends TrendLine {
  readonly type = 'ray';
  readonly title = 'Raio';
  protected defaults(): Partial<DrawingOptions> {
    return { extendRight: true, showLabels: false };
  }
}

export class ExtendedLine extends TrendLine {
  readonly type = 'extended';
  readonly title = 'Linha estendida';
  protected defaults(): Partial<DrawingOptions> {
    return { extendRight: true, extendLeft: true, showLabels: false };
  }
}

export class InfoLine extends TrendLine {
  readonly type = 'infoline';
  readonly title = 'Linha de informação';
  protected defaults(): Partial<DrawingOptions> {
    return { showLabels: true };
  }
}

export class ArrowLine extends TrendLine {
  readonly type = 'arrow';
  readonly title = 'Seta';
  arrow = true;
}

export class HorizontalLine extends Drawing {
  readonly type: string = 'hline';
  readonly title: string = 'Linha horizontal';
  readonly pointsNeeded = 1;
  protected ray = false;

  protected defaults(): Partial<DrawingOptions> {
    return { width: 1 };
  }
  settings(): SettingField[] {
    return [...super.settings(), { key: 'showPrice', label: 'Etiqueta de preço', type: 'bool' }, { key: 'text', label: 'Texto', type: 'text' }];
  }
  private x(v: PaneView): number {
    return this.ray ? v.timeToX(this.points[0].time) : 0;
  }
  draw(v: PaneView): void {
    const ctx = v.ctx;
    const y = v.priceToY(this.points[0].price);
    applyStroke(ctx, this.opts.color, this.opts.width, this.opts.dash);
    hLine(ctx, v, this.x(v), v.width, y, this.opts.width);
    if (this.opts.text) {
      ctx.save();
      ctx.font = font(this.opts.fontSize);
      ctx.fillStyle = this.opts.textColor || this.opts.color;
      ctx.textBaseline = 'bottom';
      ctx.textAlign = 'right';
      ctx.fillText(this.opts.text, v.width - 8, y - 4);
      ctx.restore();
    }
  }
  handles(v: PaneView): Handle[] {
    const y = v.priceToY(this.points[0].price);
    const x = this.ray ? v.timeToX(this.points[0].time) : Math.min(Math.max(v.timeToX(this.points[0].time), 24), v.width - 24);
    return [{ x, y, cursor: 'ns-resize' }];
  }
  distance(v: PaneView, x: number, y: number): number {
    if (x < this.x(v) - 6) return Infinity;
    return Math.abs(y - v.priceToY(this.points[0].price));
  }
  moveHandle(_i: number, p: Point): void {
    this.points[0] = this.ray ? { ...p } : { time: this.points[0]?.time ?? p.time, price: p.price };
  }
  setCreationPoint(_i: number, p: Point): void {
    this.points[0] = { ...p };
  }
  axisMarks(): AxisMarks {
    return {
      prices: [{ price: this.points[0].price, color: this.opts.color, persistent: this.opts.showPrice }],
      times: this.ray ? [this.points[0].time] : [],
    };
  }
}

export class HorizontalRay extends HorizontalLine {
  readonly type = 'hray';
  readonly title = 'Raio horizontal';
  protected ray = true;
}

export class VerticalLine extends Drawing {
  readonly type = 'vline';
  readonly title = 'Linha vertical';
  readonly pointsNeeded = 1;
  protected defaults(): Partial<DrawingOptions> {
    return { width: 1 };
  }
  draw(v: PaneView): void {
    const ctx = v.ctx;
    applyStroke(ctx, this.opts.color, this.opts.width, this.opts.dash);
    vLine(ctx, v, v.timeToX(this.points[0].time), 0, v.height, this.opts.width);
  }
  handles(v: PaneView): Handle[] {
    const x = v.timeToX(this.points[0].time);
    return [{ x, y: Math.min(Math.max(v.priceToY(this.points[0].price), 24), v.height - 24), cursor: 'ew-resize' }];
  }
  distance(v: PaneView, x: number): number {
    return Math.abs(x - v.timeToX(this.points[0].time));
  }
  axisMarks(): AxisMarks {
    return { prices: [], times: [this.points[0].time] };
  }
}

export class CrossLine extends Drawing {
  readonly type = 'crossline';
  readonly title = 'Linha cruzada';
  readonly pointsNeeded = 1;
  protected defaults(): Partial<DrawingOptions> {
    return { width: 1 };
  }
  draw(v: PaneView): void {
    const ctx = v.ctx;
    const { x, y } = v.toXY(this.points[0]);
    applyStroke(ctx, this.opts.color, this.opts.width, this.opts.dash);
    vLine(ctx, v, x, 0, v.height, this.opts.width);
    hLine(ctx, v, 0, v.width, y, this.opts.width);
  }
  distance(v: PaneView, x: number, y: number): number {
    const p = v.toXY(this.points[0]);
    return Math.min(Math.abs(x - p.x), Math.abs(y - p.y));
  }
  axisMarks(): AxisMarks {
    return { prices: [{ price: this.points[0].price, color: this.opts.color, persistent: true }], times: [this.points[0].time] };
  }
}

export class ParallelChannel extends Drawing {
  readonly type = 'channel';
  readonly title = 'Canal paralelo';
  readonly pointsNeeded = 3;
  protected defaults(): Partial<DrawingOptions> {
    return { fill: withAlpha(theme.accent, 0.12), width: 2 };
  }
  settings(): SettingField[] {
    return [
      ...super.settings(),
      ...fillEnabledField(),
      { key: 'extendLeft', label: 'Estender à esquerda', type: 'bool' },
      { key: 'extendRight', label: 'Estender à direita', type: 'bool' },
    ];
  }
  private offset(): number {
    return this.points.length > 2 ? this.points[2].price - this.points[0].price : 0;
  }
  private lines(v: PaneView): { a: { x: number; y: number }; b: { x: number; y: number }; c: { x: number; y: number }; d: { x: number; y: number } } {
    const [p0, p1] = this.points;
    const off = this.offset();
    const a = v.toXY(p0);
    const b = v.toXY(p1);
    const c = { x: a.x, y: v.priceToY(p0.price + off) };
    const d = { x: b.x, y: v.priceToY(p1.price + off) };
    return { a, b, c, d };
  }
  draw(v: PaneView): void {
    if (this.points.length < 2) return;
    const ctx = v.ctx;
    const { a, b, c, d } = this.lines(v);
    const eL = this.opts.extendLeft;
    const eR = this.opts.extendRight;
    const l1 = extendSegment(a.x, a.y, b.x, b.y, v.width, v.height, eL, eR);
    const l2 = extendSegment(c.x, c.y, d.x, d.y, v.width, v.height, eL, eR);
    if (this.points.length > 2 && this.opts.fillEnabled) {
      ctx.fillStyle = this.opts.fill;
      ctx.beginPath();
      ctx.moveTo(l1[0], l1[1]);
      ctx.lineTo(l1[2], l1[3]);
      ctx.lineTo(l2[2], l2[3]);
      ctx.lineTo(l2[0], l2[1]);
      ctx.closePath();
      ctx.fill();
    }
    applyStroke(ctx, this.opts.color, this.opts.width, this.opts.dash);
    strokeLine(ctx, l1[0], l1[1], l1[2], l1[3]);
    if (this.points.length > 2) {
      strokeLine(ctx, l2[0], l2[1], l2[2], l2[3]);
      const m = extendSegment((a.x + c.x) / 2, (a.y + c.y) / 2, (b.x + d.x) / 2, (b.y + d.y) / 2, v.width, v.height, eL, eR);
      applyStroke(ctx, withAlpha(this.opts.color, 0.7), 1, 'dashed');
      strokeLine(ctx, m[0], m[1], m[2], m[3]);
    }
  }
  handles(v: PaneView): Handle[] {
    if (this.points.length < 2) return this.points.map((p) => v.toXY(p));
    const { a, b, c, d } = this.lines(v);
    const hs: Handle[] = [a, b];
    if (this.points.length > 2) hs.push(c, d, { x: (c.x + d.x) / 2, y: (c.y + d.y) / 2 }, { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 });
    return hs;
  }
  distance(v: PaneView, x: number, y: number): number {
    if (this.points.length < 2) return Infinity;
    const { a, b, c, d } = this.lines(v);
    const eL = this.opts.extendLeft;
    const eR = this.opts.extendRight;
    return Math.min(distToLine(x, y, a.x, a.y, b.x, b.y, eL, eR), this.points.length > 2 ? distToLine(x, y, c.x, c.y, d.x, d.y, eL, eR) : Infinity);
  }
  insideFill(v: PaneView, x: number, y: number): boolean {
    if (this.points.length < 3 || !this.opts.fillEnabled) return false;
    const { a, b, c, d } = this.lines(v);
    const minX = Math.min(a.x, b.x);
    const maxX = Math.max(a.x, b.x);
    if (x < minX || x > maxX || maxX === minX) return false;
    const t = (x - a.x) / (b.x - a.x);
    const y1 = a.y + (b.y - a.y) * t;
    const y2 = c.y + (d.y - c.y) * t;
    return y >= Math.min(y1, y2) && y <= Math.max(y1, y2);
  }
  setCreationPoint(index: number, p: Point, v: PaneView, shift: boolean): void {
    if (index < 2) {
      this.points[index] = index === 1 && shift ? snapAngle(v, this.points[0], p) : { ...p };
      if (index === 1 && this.points.length > 2) this.points.length = 2;
      return;
    }
    const dp = p.price - priceOnLine(v, this.points[0], this.points[1], p.time);
    this.points[2] = { time: this.points[0].time, price: this.points[0].price + dp };
  }
  moveHandle(index: number, p: Point, v: PaneView, shift: boolean): void {
    const off = this.offset();
    if (index === 0 || index === 1) {
      this.points[index] = shift ? snapAngle(v, this.points[1 - index], p) : { ...p };
      if (this.points.length > 2) this.points[2] = { time: this.points[0].time, price: this.points[0].price + off };
    } else if (index === 2 || index === 3 || index === 4) {
      const dp = p.price - priceOnLine(v, this.points[0], this.points[1], p.time);
      this.points[2] = { time: this.points[0].time, price: this.points[0].price + dp };
    } else if (index === 5) {
      // move base line keeping upper line fixed
      const upper0 = this.points[0].price + off;
      const dp = p.price - priceOnLine(v, this.points[0], this.points[1], p.time);
      this.points[0] = { ...this.points[0], price: this.points[0].price + dp };
      this.points[1] = { ...this.points[1], price: this.points[1].price + dp };
      this.points[2] = { time: this.points[0].time, price: upper0 };
    }
  }
}

// ---------- fibonacci ----------

abstract class FibBase extends Drawing {
  protected defaults(): Partial<DrawingOptions> {
    return { levels: FIB_DEFAULTS.map((l) => ({ ...l })), width: 1, color: '#787b86', fillEnabled: true, showLabels: true, showPrice: true, extendLeft: false, extendRight: false };
  }
  settings(): SettingField[] {
    return [
      { key: 'color', label: 'Linha de tendência', type: 'color' },
      { key: 'width', label: 'Espessura dos níveis', type: 'width' },
      { key: 'fillEnabled', label: 'Fundo', type: 'bool' },
      { key: 'showLabels', label: 'Etiquetas de nível', type: 'bool' },
      { key: 'showPrice', label: 'Preços', type: 'bool' },
      { key: 'extendLeft', label: 'Estender à esquerda', type: 'bool' },
      { key: 'extendRight', label: 'Estender à direita', type: 'bool' },
      { key: 'levels', label: 'Níveis', type: 'levels' },
    ];
  }

  protected abstract levelPrice(level: number): number;
  protected abstract span(v: PaneView): [number, number];

  protected drawLevels(v: PaneView): void {
    const ctx = v.ctx;
    let [x1, x2] = this.span(v);
    if (this.opts.extendLeft) x1 = 0;
    if (this.opts.extendRight) x2 = v.width;
    const levels = this.opts.levels.filter((l) => l.enabled).sort((a, b) => a.value - b.value);
    if (this.opts.fillEnabled) {
      for (let i = 0; i < levels.length - 1; i++) {
        const ya = v.priceToY(this.levelPrice(levels[i].value));
        const yb = v.priceToY(this.levelPrice(levels[i + 1].value));
        ctx.fillStyle = withAlpha(levels[i + 1].color, 0.12);
        ctx.fillRect(x1, Math.min(ya, yb), x2 - x1, Math.abs(yb - ya));
      }
    }
    for (const l of levels) {
      const price = this.levelPrice(l.value);
      const y = v.priceToY(price);
      applyStroke(ctx, l.color, this.opts.width, 'solid');
      hLine(ctx, v, x1, x2, y, this.opts.width);
      if (this.opts.showLabels || this.opts.showPrice) {
        const parts: string[] = [];
        if (this.opts.showLabels) parts.push(String(l.value));
        if (this.opts.showPrice) parts.push(this.opts.showLabels ? `(${v.fmt(price)})` : v.fmt(price));
        ctx.save();
        ctx.font = font(12);
        ctx.fillStyle = l.color;
        ctx.textAlign = 'right';
        ctx.textBaseline = 'middle';
        ctx.fillText(parts.join(' '), Math.min(x1, x2) - 6, y);
        ctx.restore();
      }
    }
  }

  distance(v: PaneView, x: number, y: number): number {
    let [x1, x2] = this.span(v);
    if (this.opts.extendLeft) x1 = 0;
    if (this.opts.extendRight) x2 = v.width;
    let best = Infinity;
    for (const l of this.opts.levels) {
      if (!l.enabled) continue;
      const ly = v.priceToY(this.levelPrice(l.value));
      best = Math.min(best, distToSegment(x, y, x1, ly, x2, ly));
    }
    const pts = this.points.map((p) => v.toXY(p));
    for (let i = 0; i < pts.length - 1; i++) best = Math.min(best, distToSegment(x, y, pts[i].x, pts[i].y, pts[i + 1].x, pts[i + 1].y));
    return best;
  }

  insideFill(v: PaneView, x: number, y: number): boolean {
    if (!this.opts.fillEnabled) return false;
    const [x1, x2] = this.span(v);
    const ys = this.opts.levels.filter((l) => l.enabled).map((l) => v.priceToY(this.levelPrice(l.value)));
    return x >= Math.min(x1, x2) && x <= Math.max(x1, x2) && y >= Math.min(...ys) && y <= Math.max(...ys);
  }

  axisMarks(v: PaneView): AxisMarks {
    void v;
    return { prices: this.points.map((p) => ({ price: p.price })), times: this.points.map((p) => p.time), ...bands(this.points) };
  }
}

export class FibRetracement extends FibBase {
  readonly type = 'fib';
  readonly title = 'Retração de Fibonacci';
  readonly pointsNeeded = 2;
  protected levelPrice(level: number): number {
    const [p0, p1] = this.points;
    return p1.price + (p0.price - p1.price) * level;
  }
  protected span(v: PaneView): [number, number] {
    const a = v.timeToX(this.points[0].time);
    const b = v.timeToX(this.points[1].time);
    return [Math.min(a, b), Math.max(a, b)];
  }
  draw(v: PaneView): void {
    if (this.points.length < 2) return;
    this.drawLevels(v);
    const a = v.toXY(this.points[0]);
    const b = v.toXY(this.points[1]);
    applyStroke(v.ctx, withAlpha(this.opts.color, 0.9), 1, 'dashed');
    strokeLine(v.ctx, a.x, a.y, b.x, b.y);
  }
}

export class FibExtension extends FibBase {
  readonly type = 'fibext';
  readonly title = 'Extensão de Fibonacci baseada em tendência';
  readonly pointsNeeded = 3;
  protected defaults(): Partial<DrawingOptions> {
    const d = super.defaults();
    return { ...d, levels: (d.levels ?? []).map((l) => ({ ...l, enabled: [0, 0.382, 0.618, 1, 1.272, 1.618, 2, 2.618].includes(l.value) })) };
  }
  protected levelPrice(level: number): number {
    const [p0, p1, p2] = this.points;
    const base = p2 ?? p1;
    return base.price + (p1.price - p0.price) * level;
  }
  protected span(v: PaneView): [number, number] {
    const x1 = v.timeToX(this.points[1].time);
    const x2 = v.timeToX((this.points[2] ?? this.points[1]).time);
    const x0 = v.timeToX(this.points[0].time);
    const left = Math.min(x1, x2);
    const right = Math.max(x2, left + Math.max(Math.abs(x1 - x0), 40));
    return [left, right];
  }
  draw(v: PaneView): void {
    if (this.points.length < 2) return;
    if (this.points.length > 2) this.drawLevels(v);
    const pts = this.points.map((p) => v.toXY(p));
    applyStroke(v.ctx, withAlpha(this.opts.color, 0.9), 1, 'dashed');
    v.ctx.beginPath();
    pts.forEach((p, i) => (i ? v.ctx.lineTo(p.x, p.y) : v.ctx.moveTo(p.x, p.y)));
    v.ctx.stroke();
  }
}

export class FibChannel extends Drawing {
  readonly type = 'fibchannel';
  readonly title = 'Canal de Fibonacci';
  readonly pointsNeeded = 3;
  protected defaults(): Partial<DrawingOptions> {
    return { levels: FIB_DEFAULTS.filter((l) => l.value <= 1.618).map((l) => ({ ...l })), width: 1, color: '#787b86', fillEnabled: true };
  }
  settings(): SettingField[] {
    return [{ key: 'width', label: 'Espessura', type: 'width' }, { key: 'fillEnabled', label: 'Fundo', type: 'bool' }, { key: 'levels', label: 'Níveis', type: 'levels' }];
  }
  private off(): number {
    return this.points.length > 2 ? this.points[2].price - this.points[0].price : 0;
  }
  draw(v: PaneView): void {
    if (this.points.length < 2) return;
    const ctx = v.ctx;
    const a = v.toXY(this.points[0]);
    const b = v.toXY(this.points[1]);
    if (this.points.length < 3) {
      applyStroke(ctx, '#787b86', 1);
      strokeLine(ctx, a.x, a.y, b.x, b.y);
      return;
    }
    const off = this.off();
    const levels = this.opts.levels.filter((l) => l.enabled).sort((x, y) => x.value - y.value);
    const seg = (lv: number): number[] => {
      const ya = v.priceToY(this.points[0].price + off * lv);
      const yb = v.priceToY(this.points[1].price + off * lv);
      return extendSegment(a.x, ya, b.x, yb, v.width, v.height, false, true);
    };
    if (this.opts.fillEnabled) {
      for (let i = 0; i < levels.length - 1; i++) {
        const s1 = seg(levels[i].value);
        const s2 = seg(levels[i + 1].value);
        ctx.fillStyle = withAlpha(levels[i + 1].color, 0.1);
        ctx.beginPath();
        ctx.moveTo(s1[0], s1[1]);
        ctx.lineTo(s1[2], s1[3]);
        ctx.lineTo(s2[2], s2[3]);
        ctx.lineTo(s2[0], s2[1]);
        ctx.closePath();
        ctx.fill();
      }
    }
    for (const l of levels) {
      const s = seg(l.value);
      applyStroke(ctx, l.color, this.opts.width);
      strokeLine(ctx, s[0], s[1], s[2], s[3]);
      drawLabel(ctx, String(l.value), s[0] - 6, s[1], { color: l.color, align: 'right' });
    }
  }
  handles(v: PaneView): Handle[] {
    const hs = this.points.slice(0, 2).map((p) => v.toXY(p));
    if (this.points.length > 2) hs.push({ x: v.timeToX(this.points[0].time), y: v.priceToY(this.points[2].price) });
    return hs;
  }
  distance(v: PaneView, x: number, y: number): number {
    if (this.points.length < 2) return Infinity;
    const a = v.toXY(this.points[0]);
    const b = v.toXY(this.points[1]);
    let best = distToLine(x, y, a.x, a.y, b.x, b.y, false, true);
    const off = this.off();
    for (const l of this.opts.levels) {
      if (!l.enabled) continue;
      const ya = v.priceToY(this.points[0].price + off * l.value);
      const yb = v.priceToY(this.points[1].price + off * l.value);
      best = Math.min(best, distToLine(x, y, a.x, ya, b.x, yb, false, true));
    }
    return best;
  }
  setCreationPoint(index: number, p: Point, v: PaneView): void {
    if (index < 2) {
      this.points[index] = { ...p };
      return;
    }
    const dp = p.price - priceOnLine(v, this.points[0], this.points[1], p.time);
    this.points[2] = { time: this.points[0].time, price: this.points[0].price + dp };
  }
  moveHandle(index: number, p: Point, v: PaneView): void {
    const off = this.off();
    if (index < 2) {
      this.points[index] = { ...p };
      if (this.points.length > 2) this.points[2] = { time: this.points[0].time, price: this.points[0].price + off };
    } else this.setCreationPoint(2, p, v);
  }
}

// ---------- shapes ----------

export class Rectangle extends Drawing {
  readonly type = 'rect';
  readonly title = 'Retângulo';
  readonly pointsNeeded = 2;
  protected defaults(): Partial<DrawingOptions> {
    return { color: '#9c27b0', fill: withAlpha('#9c27b0', 0.2), width: 1 };
  }
  settings(): SettingField[] {
    return [
      { key: 'color', label: 'Borda', type: 'color' },
      { key: 'width', label: 'Espessura', type: 'width' },
      { key: 'dash', label: 'Estilo', type: 'dash' },
      ...fillEnabledField(),
      { key: 'extendLeft', label: 'Estender à esquerda', type: 'bool' },
      { key: 'extendRight', label: 'Estender à direita', type: 'bool' },
      { key: 'text', label: 'Texto', type: 'text' },
    ];
  }
  protected box(v: PaneView): { x1: number; y1: number; x2: number; y2: number } {
    const a = v.toXY(this.points[0]);
    const b = v.toXY(this.points[1]);
    let x1 = Math.min(a.x, b.x);
    let x2 = Math.max(a.x, b.x);
    if (this.opts.extendLeft) x1 = -10;
    if (this.opts.extendRight) x2 = v.width + 10;
    return { x1, x2, y1: Math.min(a.y, b.y), y2: Math.max(a.y, b.y) };
  }
  draw(v: PaneView): void {
    if (this.points.length < 2) return;
    const ctx = v.ctx;
    const { x1, y1, x2, y2 } = this.box(v);
    if (this.opts.fillEnabled) {
      ctx.fillStyle = this.opts.fill;
      ctx.fillRect(x1, y1, x2 - x1, y2 - y1);
    }
    applyStroke(ctx, this.opts.color, this.opts.width, this.opts.dash);
    const w = this.opts.width;
    const sx1 = Math.round(x1 * v.dpr) / v.dpr + (w % 2 ? 0.5 / v.dpr : 0);
    const sy1 = Math.round(y1 * v.dpr) / v.dpr + (w % 2 ? 0.5 / v.dpr : 0);
    const sx2 = Math.round(x2 * v.dpr) / v.dpr + (w % 2 ? 0.5 / v.dpr : 0);
    const sy2 = Math.round(y2 * v.dpr) / v.dpr + (w % 2 ? 0.5 / v.dpr : 0);
    ctx.strokeRect(sx1, sy1, sx2 - sx1, sy2 - sy1);
    if (this.opts.text) {
      ctx.save();
      ctx.beginPath();
      ctx.rect(x1, y1, x2 - x1, y2 - y1);
      ctx.clip();
      drawLabel(ctx, this.opts.text, (x1 + x2) / 2, (y1 + y2) / 2, { color: this.opts.textColor || this.opts.color, size: this.opts.fontSize, align: 'center' });
      ctx.restore();
    }
  }
  handles(v: PaneView): Handle[] {
    if (this.points.length < 2) return this.points.map((p) => v.toXY(p));
    const a = v.toXY(this.points[0]);
    const b = v.toXY(this.points[1]);
    const mx = (a.x + b.x) / 2;
    const my = (a.y + b.y) / 2;
    const diag1 = (a.x - b.x) * (a.y - b.y) > 0 ? 'nwse-resize' : 'nesw-resize';
    const diag2 = diag1 === 'nwse-resize' ? 'nesw-resize' : 'nwse-resize';
    return [
      { x: a.x, y: a.y, cursor: diag1 },
      { x: b.x, y: b.y, cursor: diag1 },
      { x: b.x, y: a.y, cursor: diag2 },
      { x: a.x, y: b.y, cursor: diag2 },
      { x: mx, y: a.y, cursor: 'ns-resize' },
      { x: mx, y: b.y, cursor: 'ns-resize' },
      { x: a.x, y: my, cursor: 'ew-resize' },
      { x: b.x, y: my, cursor: 'ew-resize' },
    ];
  }
  distance(v: PaneView, x: number, y: number): number {
    if (this.points.length < 2) return Infinity;
    const { x1, y1, x2, y2 } = this.box(v);
    return Math.min(
      distToSegment(x, y, x1, y1, x2, y1),
      distToSegment(x, y, x1, y2, x2, y2),
      distToSegment(x, y, x1, y1, x1, y2),
      distToSegment(x, y, x2, y1, x2, y2),
    );
  }
  insideFill(v: PaneView, x: number, y: number): boolean {
    if (this.points.length < 2 || !this.opts.fillEnabled) return false;
    const { x1, y1, x2, y2 } = this.box(v);
    return x >= x1 && x <= x2 && y >= y1 && y <= y2;
  }
  moveHandle(index: number, p: Point): void {
    const [a, b] = this.points;
    switch (index) {
      case 0: this.points[0] = { ...p }; break;
      case 1: this.points[1] = { ...p }; break;
      case 2: this.points[1] = { time: p.time, price: b.price }; this.points[0] = { time: a.time, price: p.price }; break;
      case 3: this.points[0] = { time: p.time, price: a.price }; this.points[1] = { time: b.time, price: p.price }; break;
      case 4: this.points[0] = { time: a.time, price: p.price }; break;
      case 5: this.points[1] = { time: b.time, price: p.price }; break;
      case 6: this.points[0] = { time: p.time, price: a.price }; break;
      case 7: this.points[1] = { time: p.time, price: b.price }; break;
    }
  }
}

export class Ellipse extends Drawing {
  readonly type = 'ellipse';
  readonly title = 'Elipse';
  readonly pointsNeeded = 2;
  protected defaults(): Partial<DrawingOptions> {
    return { color: '#f23645', fill: withAlpha('#f23645', 0.18), width: 1 };
  }
  settings(): SettingField[] {
    return [...super.settings(), ...fillEnabledField()];
  }
  private geom(v: PaneView): { cx: number; cy: number; rx: number; ry: number } {
    const a = v.toXY(this.points[0]);
    const b = v.toXY(this.points[1]);
    return { cx: (a.x + b.x) / 2, cy: (a.y + b.y) / 2, rx: Math.abs(b.x - a.x) / 2, ry: Math.abs(b.y - a.y) / 2 };
  }
  draw(v: PaneView): void {
    if (this.points.length < 2) return;
    const ctx = v.ctx;
    const { cx, cy, rx, ry } = this.geom(v);
    ctx.beginPath();
    ctx.ellipse(cx, cy, Math.max(rx, 0.5), Math.max(ry, 0.5), 0, 0, Math.PI * 2);
    if (this.opts.fillEnabled) {
      ctx.fillStyle = this.opts.fill;
      ctx.fill();
    }
    applyStroke(ctx, this.opts.color, this.opts.width, this.opts.dash);
    ctx.stroke();
  }
  handles(v: PaneView): Handle[] {
    if (this.points.length < 2) return this.points.map((p) => v.toXY(p));
    const { cx, cy, rx, ry } = this.geom(v);
    return [
      { x: cx - rx, y: cy, cursor: 'ew-resize' },
      { x: cx + rx, y: cy, cursor: 'ew-resize' },
      { x: cx, y: cy - ry, cursor: 'ns-resize' },
      { x: cx, y: cy + ry, cursor: 'ns-resize' },
    ];
  }
  distance(v: PaneView, x: number, y: number): number {
    if (this.points.length < 2) return Infinity;
    const { cx, cy, rx, ry } = this.geom(v);
    if (rx < 1 || ry < 1) return Infinity;
    const dx = (x - cx) / rx;
    const dy = (y - cy) / ry;
    const r = Math.hypot(dx, dy);
    return Math.abs(r - 1) * Math.min(rx, ry);
  }
  insideFill(v: PaneView, x: number, y: number): boolean {
    if (this.points.length < 2 || !this.opts.fillEnabled) return false;
    const { cx, cy, rx, ry } = this.geom(v);
    return ((x - cx) / rx) ** 2 + ((y - cy) / ry) ** 2 <= 1;
  }
  moveHandle(index: number, p: Point, v: PaneView): void {
    if (this.points.length < 2) {
      this.points[index] = { ...p };
      return;
    }
    const a = this.points[0];
    const b = this.points[1];
    const leftIsA = v.timeToX(a.time) <= v.timeToX(b.time);
    const topIsA = v.priceToY(a.price) <= v.priceToY(b.price);
    if (index === 0) (leftIsA ? a : b).time = p.time;
    if (index === 1) (leftIsA ? b : a).time = p.time;
    if (index === 2) (topIsA ? a : b).price = p.price;
    if (index === 3) (topIsA ? b : a).price = p.price;
  }
  setCreationPoint(index: number, p: Point): void {
    this.points[index] = { ...p };
  }
}

export class Triangle extends Drawing {
  readonly type = 'triangle';
  readonly title = 'Triângulo';
  readonly pointsNeeded = 3;
  protected defaults(): Partial<DrawingOptions> {
    return { color: '#ff9800', fill: withAlpha('#ff9800', 0.18), width: 1 };
  }
  settings(): SettingField[] {
    return [...super.settings(), ...fillEnabledField()];
  }
  draw(v: PaneView): void {
    const ctx = v.ctx;
    const pts = this.points.map((p) => v.toXY(p));
    ctx.beginPath();
    pts.forEach((p, i) => (i ? ctx.lineTo(p.x, p.y) : ctx.moveTo(p.x, p.y)));
    ctx.closePath();
    if (this.opts.fillEnabled && pts.length > 2) {
      ctx.fillStyle = this.opts.fill;
      ctx.fill();
    }
    applyStroke(ctx, this.opts.color, this.opts.width, this.opts.dash);
    ctx.stroke();
  }
  distance(v: PaneView, x: number, y: number): number {
    const pts = this.points.map((p) => v.toXY(p));
    let best = Infinity;
    for (let i = 0; i < pts.length; i++) {
      const a = pts[i];
      const b = pts[(i + 1) % pts.length];
      best = Math.min(best, distToSegment(x, y, a.x, a.y, b.x, b.y));
    }
    return best;
  }
  insideFill(v: PaneView, x: number, y: number): boolean {
    if (this.points.length < 3 || !this.opts.fillEnabled) return false;
    const [a, b, c] = this.points.map((p) => v.toXY(p));
    const s = (p1: { x: number; y: number }, p2: { x: number; y: number }): number => (x - p2.x) * (p1.y - p2.y) - (p1.x - p2.x) * (y - p2.y);
    const d1 = s(a, b);
    const d2 = s(b, c);
    const d3 = s(c, a);
    return !((d1 < 0 || d2 < 0 || d3 < 0) && (d1 > 0 || d2 > 0 || d3 > 0));
  }
}

export class Brush extends Drawing {
  readonly type = 'brush';
  readonly title = 'Pincel';
  readonly pointsNeeded = 0;
  protected defaults(): Partial<DrawingOptions> {
    return { color: '#2962ff', width: 2, fillEnabled: false };
  }
  draw(v: PaneView): void {
    const ctx = v.ctx;
    const pts = this.points.map((p) => v.toXY(p));
    if (pts.length < 2) return;
    applyStroke(ctx, this.opts.color, this.opts.width, this.opts.dash);
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(pts[0].x, pts[0].y);
    for (let i = 1; i < pts.length - 1; i++) {
      const mx = (pts[i].x + pts[i + 1].x) / 2;
      const my = (pts[i].y + pts[i + 1].y) / 2;
      ctx.quadraticCurveTo(pts[i].x, pts[i].y, mx, my);
    }
    const l = pts[pts.length - 1];
    ctx.lineTo(l.x, l.y);
    if (this.opts.fillEnabled) {
      ctx.fillStyle = this.opts.fill;
      ctx.fill();
    }
    ctx.stroke();
  }
  handles(): Handle[] {
    return [];
  }
  distance(v: PaneView, x: number, y: number): number {
    const pts = this.points.map((p) => v.toXY(p));
    let best = Infinity;
    for (let i = 0; i < pts.length - 1; i++) best = Math.min(best, distToSegment(x, y, pts[i].x, pts[i].y, pts[i + 1].x, pts[i + 1].y));
    return best;
  }
  axisMarks(): AxisMarks {
    return { prices: [], times: [], ...bands(this.points) };
  }
}

export class PathTool extends Drawing {
  readonly type = 'path';
  readonly title = 'Caminho';
  readonly pointsNeeded = -1;
  protected defaults(): Partial<DrawingOptions> {
    return { color: '#2962ff', width: 2 };
  }
  draw(v: PaneView): void {
    const ctx = v.ctx;
    const pts = this.points.map((p) => v.toXY(p));
    if (pts.length < 2) return;
    applyStroke(ctx, this.opts.color, this.opts.width, this.opts.dash);
    ctx.beginPath();
    pts.forEach((p, i) => (i ? ctx.lineTo(p.x, p.y) : ctx.moveTo(p.x, p.y)));
    ctx.stroke();
    const a = pts[pts.length - 2];
    const b = pts[pts.length - 1];
    applyStroke(ctx, this.opts.color, this.opts.width);
    drawArrowHead(ctx, a.x, a.y, b.x, b.y, this.opts.width);
  }
  distance(v: PaneView, x: number, y: number): number {
    const pts = this.points.map((p) => v.toXY(p));
    let best = Infinity;
    for (let i = 0; i < pts.length - 1; i++) best = Math.min(best, distToSegment(x, y, pts[i].x, pts[i].y, pts[i + 1].x, pts[i + 1].y));
    return best;
  }
}

export class TextNote extends Drawing {
  readonly type = 'text';
  readonly title = 'Texto';
  readonly pointsNeeded = 1;
  protected defaults(): Partial<DrawingOptions> {
    return { text: 'Texto', textColor: '#d1d4dc', color: '#2962ff', fontSize: 16, fillEnabled: false, fill: withAlpha('#2962ff', 0.25) };
  }
  settings(): SettingField[] {
    return [
      { key: 'textColor', label: 'Cor do texto', type: 'color' },
      { key: 'fontSize', label: 'Tamanho', type: 'number', min: 8, max: 72 },
      { key: 'fillEnabled', label: 'Fundo', type: 'bool' },
      { key: 'fill', label: 'Cor de fundo', type: 'fill' },
      { key: 'text', label: 'Texto', type: 'text' },
    ];
  }
  private box(v: PaneView): { x: number; y: number; w: number; h: number } {
    const ctx = v.ctx;
    ctx.save();
    ctx.font = font(this.opts.fontSize);
    const lines = (this.opts.text || ' ').split('\n');
    const w = Math.max(...lines.map((l) => ctx.measureText(l).width)) + 12;
    ctx.restore();
    const h = lines.length * Math.round(this.opts.fontSize * 1.3) + 8;
    const p = v.toXY(this.points[0]);
    return { x: p.x, y: p.y - h, w, h };
  }
  draw(v: PaneView, s: DrawState): void {
    const ctx = v.ctx;
    const b = this.box(v);
    if (this.opts.fillEnabled) {
      ctx.fillStyle = this.opts.fill;
      roundRect(ctx, b.x, b.y, b.w, b.h, 4);
      ctx.fill();
    }
    if (s.selected || s.hovered) {
      ctx.save();
      ctx.strokeStyle = withAlpha(theme.accent, s.selected ? 0.9 : 0.5);
      ctx.setLineDash([]);
      ctx.lineWidth = 1;
      roundRect(ctx, Math.round(b.x) + 0.5, Math.round(b.y) + 0.5, b.w, b.h, 4);
      ctx.stroke();
      ctx.restore();
    }
    ctx.save();
    ctx.font = font(this.opts.fontSize);
    ctx.fillStyle = this.opts.textColor;
    ctx.textBaseline = 'middle';
    const lh = Math.round(this.opts.fontSize * 1.3);
    (this.opts.text || '').split('\n').forEach((l, i) => ctx.fillText(l, b.x + 6, b.y + 4 + lh * i + lh / 2));
    ctx.restore();
  }
  handles(v: PaneView): Handle[] {
    return [v.toXY(this.points[0])];
  }
  distance(v: PaneView, x: number, y: number): number {
    const b = this.box(v);
    return x >= b.x && x <= b.x + b.w && y >= b.y && y <= b.y + b.h ? 0 : Infinity;
  }
}

// ---------- measuring ----------

abstract class RangeBase extends Drawing {
  readonly pointsNeeded = 2;
  protected defaults(): Partial<DrawingOptions> {
    return { color: theme.accent, fill: withAlpha(theme.accent, 0.2), width: 1 };
  }
  distance(v: PaneView, x: number, y: number): number {
    return this.insideFill(v, x, y) ? 0 : Infinity;
  }
  insideFill(v: PaneView, x: number, y: number): boolean {
    if (this.points.length < 2) return false;
    const a = v.toXY(this.points[0]);
    const b = v.toXY(this.points[1]);
    return x >= Math.min(a.x, b.x) - 4 && x <= Math.max(a.x, b.x) + 4 && y >= Math.min(a.y, b.y) - 4 && y <= Math.max(a.y, b.y) + 4;
  }
  protected stats(v: PaneView): { dp: number; pct: number; ticks: number; bars: number; dt: number; vol: number } {
    const [p0, p1] = this.points;
    const dp = p1.price - p0.price;
    const i0 = Math.round(v.data.timeToIndex(p0.time));
    const i1 = Math.round(v.data.timeToIndex(p1.time));
    let vol = 0;
    for (let i = Math.max(0, Math.min(i0, i1)); i <= Math.min(v.bars.length - 1, Math.max(i0, i1)); i++) vol += v.bars[i].volume;
    return { dp, pct: (dp / p0.price) * 100, ticks: Math.round(dp / v.tick), bars: i1 - i0, dt: p1.time - p0.time, vol };
  }
  protected color(v: PaneView): string {
    const s = this.stats(v);
    return s.dp >= 0 ? theme.accent : theme.down;
  }
}

export class PriceRange extends RangeBase {
  readonly type = 'pricerange';
  readonly title = 'Intervalo de preço';
  draw(v: PaneView): void {
    if (this.points.length < 2) return;
    const ctx = v.ctx;
    const a = v.toXY(this.points[0]);
    const b = v.toXY(this.points[1]);
    const st = this.stats(v);
    const col = st.dp >= 0 ? theme.accent : theme.down;
    const x1 = Math.min(a.x, b.x);
    const x2 = Math.max(a.x, b.x);
    ctx.fillStyle = withAlpha(col, 0.2);
    ctx.fillRect(x1, Math.min(a.y, b.y), x2 - x1, Math.abs(b.y - a.y));
    applyStroke(ctx, col, 1);
    hLine(ctx, v, x1, x2, a.y, 1);
    hLine(ctx, v, x1, x2, b.y, 1);
    const mx = (x1 + x2) / 2;
    vLine(ctx, v, mx, a.y, b.y, 1);
    drawArrowHead(ctx, mx, a.y, mx, b.y, 1);
    const text = `${signFmt(v.fmt(Math.abs(st.dp)), st.dp)} (${pctFmt(st.pct)}) ${st.ticks}`;
    const below = b.y > a.y;
    drawLabel(ctx, text, mx, b.y + (below ? 8 : -8), { bg: col, color: '#fff', align: 'center', baseline: below ? 'top' : 'bottom' });
  }
}

export class DateRange extends RangeBase {
  readonly type = 'daterange';
  readonly title = 'Intervalo de data';
  draw(v: PaneView): void {
    if (this.points.length < 2) return;
    const ctx = v.ctx;
    const a = v.toXY(this.points[0]);
    const b = v.toXY(this.points[1]);
    const st = this.stats(v);
    const col = st.bars >= 0 ? theme.accent : theme.down;
    const y1 = Math.min(a.y, b.y);
    const y2 = Math.max(a.y, b.y);
    ctx.fillStyle = withAlpha(col, 0.2);
    ctx.fillRect(Math.min(a.x, b.x), y1, Math.abs(b.x - a.x), y2 - y1);
    applyStroke(ctx, col, 1);
    vLine(ctx, v, a.x, y1, y2, 1);
    vLine(ctx, v, b.x, y1, y2, 1);
    const my = (y1 + y2) / 2;
    hLine(ctx, v, a.x, b.x, my, 1);
    drawArrowHead(ctx, a.x, my, b.x, my, 1);
    const text = `${st.bars} barras, ${formatDuration(st.dt)}\nVol ${formatVolume(st.vol)}`;
    drawLabel(ctx, text, (a.x + b.x) / 2, y2 + 8, { bg: col, color: '#fff', align: 'center', baseline: 'top' });
  }
}

export class DatePriceRange extends RangeBase {
  readonly type = 'datepricerange';
  readonly title = 'Intervalo de data e preço';
  draw(v: PaneView): void {
    if (this.points.length < 2) return;
    const ctx = v.ctx;
    const a = v.toXY(this.points[0]);
    const b = v.toXY(this.points[1]);
    const st = this.stats(v);
    const col = st.dp >= 0 ? theme.accent : theme.down;
    ctx.fillStyle = withAlpha(col, 0.2);
    ctx.fillRect(Math.min(a.x, b.x), Math.min(a.y, b.y), Math.abs(b.x - a.x), Math.abs(b.y - a.y));
    applyStroke(ctx, col, 1);
    const mx = (a.x + b.x) / 2;
    const my = (a.y + b.y) / 2;
    vLine(ctx, v, mx, a.y, b.y, 1);
    drawArrowHead(ctx, mx, a.y, mx, b.y, 1);
    hLine(ctx, v, a.x, b.x, my, 1);
    drawArrowHead(ctx, a.x, my, b.x, my, 1);
    const text = `${signFmt(v.fmt(Math.abs(st.dp)), st.dp)} (${pctFmt(st.pct)}) ${st.ticks}\n${st.bars} barras, ${formatDuration(st.dt)}\nVol ${formatVolume(st.vol)}`;
    const below = b.y > a.y;
    drawLabel(ctx, text, mx, (below ? Math.max(a.y, b.y) : Math.min(a.y, b.y)) + (below ? 8 : -8), {
      bg: col, color: '#fff', align: 'center', baseline: below ? 'top' : 'bottom',
    });
  }
}

// ---------- positions ----------

export class Position extends Drawing {
  readonly pointsNeeded = 1;
  readonly type: string;
  readonly title: string;
  constructor(public readonly long: boolean, opts?: Partial<DrawingOptions>) {
    super(opts);
    this.type = long ? 'long' : 'short';
    this.title = long ? 'Posição comprada' : 'Posição vendida';
  }
  protected defaults(): Partial<DrawingOptions> {
    return { width: 1, accountSize: 1000, riskPct: 1 };
  }
  settings(): SettingField[] {
    return [
      { key: 'accountSize', label: 'Tamanho da conta', type: 'number', min: 1, max: 1e9 },
      { key: 'riskPct', label: 'Risco (%)', type: 'number', min: 0.01, max: 100, step: 0.1 },
    ];
  }
  init(v: PaneView): void {
    const e = this.points[0];
    const range = v.yToPrice(0) - v.yToPrice(v.height);
    const d = Math.abs(range) * 0.06;
    const end = v.data.indexToTime(v.data.timeToIndex(e.time) + Math.max(12, Math.round(80 / v.ts.barSpacing)));
    const dir = this.long ? 1 : -1;
    this.points[1] = { time: end, price: e.price + dir * d * 2 };
    this.points[2] = { time: end, price: e.price - dir * d };
  }
  setCreationPoint(index: number, p: Point, v: PaneView): void {
    if (index === 0) {
      this.points[0] = { ...p };
      this.init(v);
    }
  }
  private geo(v: PaneView): { x1: number; x2: number; ye: number; yt: number; ys: number } {
    const [e, t, s] = this.points;
    return { x1: v.timeToX(e.time), x2: v.timeToX(t.time), ye: v.priceToY(e.price), yt: v.priceToY(t.price), ys: v.priceToY(s.price) };
  }
  draw(v: PaneView, st: DrawState): void {
    if (this.points.length < 3) return;
    const ctx = v.ctx;
    const [e, t, s] = this.points;
    const { x1, x2, ye, yt, ys } = this.geo(v);
    const left = Math.min(x1, x2);
    const w = Math.abs(x2 - x1);
    ctx.fillStyle = withAlpha(theme.up, 0.2);
    ctx.fillRect(left, Math.min(ye, yt), w, Math.abs(yt - ye));
    ctx.fillStyle = withAlpha(theme.down, 0.2);
    ctx.fillRect(left, Math.min(ye, ys), w, Math.abs(ys - ye));

    // live progress (price travelled since entry)
    const bars = v.bars;
    const ie = Math.ceil(v.data.timeToIndex(e.time));
    const iEnd = Math.floor(v.data.timeToIndex(t.time));
    let lastIdx = Math.min(bars.length - 1, iEnd);
    let closed: 'target' | 'stop' | null = null;
    if (ie <= lastIdx && ie >= 0) {
      for (let i = ie; i <= lastIdx; i++) {
        const b = bars[i];
        const hitT = this.long ? b.high >= t.price : b.low <= t.price;
        const hitS = this.long ? b.low <= s.price : b.high >= s.price;
        if (hitS || hitT) {
          closed = hitS ? 'stop' : 'target';
          lastIdx = i;
          break;
        }
      }
      const cur = closed === 'target' ? t.price : closed === 'stop' ? s.price : bars[lastIdx].close;
      const xc = v.ts.indexToX(lastIdx);
      const yc = v.priceToY(cur);
      const win = this.long ? cur >= e.price : cur <= e.price;
      ctx.fillStyle = withAlpha(win ? theme.up : theme.down, 0.25);
      ctx.fillRect(left, Math.min(ye, yc), Math.max(0, Math.min(xc, left + w) - left), Math.abs(yc - ye));
      applyStroke(ctx, withAlpha(theme.textStrong, 0.6), 1, 'dashed');
      strokeLine(ctx, x1, ye, Math.min(xc, left + w), yc);
    }

    applyStroke(ctx, '#787b86', 1);
    hLine(ctx, v, left, left + w, ye, 1);
    applyStroke(ctx, theme.up, 1);
    hLine(ctx, v, left, left + w, yt, 1);
    applyStroke(ctx, theme.down, 1);
    hLine(ctx, v, left, left + w, ys, 1);

    const tgt = t.price - e.price;
    const stp = s.price - e.price;
    const rr = Math.abs(tgt / (stp || 1e-12));
    const account = Number(this.opts.accountSize) || 1000;
    const riskAmt = (account * (Number(this.opts.riskPct) || 1)) / 100;
    const qty = riskAmt / Math.abs(stp || 1e-12);
    const tickN = (x: number): number => Math.round(Math.abs(x) / v.tick);
    const showFull = st.selected || st.hovered || st.creating;
    const cx = left + w / 2;
    const tText = showFull
      ? `Alvo: ${v.fmt(Math.abs(tgt))} (${pctFmt(Math.abs(tgt / e.price) * 100)}) ${tickN(tgt)}, Valor: ${(qty * Math.abs(tgt)).toFixed(2)}`
      : `Alvo: ${v.fmt(t.price)}`;
    const sText = showFull
      ? `Stop: ${v.fmt(Math.abs(stp))} (${pctFmt(Math.abs(stp / e.price) * 100)}) ${tickN(stp)}, Valor: ${(qty * Math.abs(stp)).toFixed(2)}`
      : `Stop: ${v.fmt(s.price)}`;
    const tAbove = yt < ye;
    drawLabel(ctx, tText, cx, yt + (tAbove ? -6 : 6), { bg: theme.up, color: '#fff', align: 'center', baseline: tAbove ? 'bottom' : 'top' });
    drawLabel(ctx, sText, cx, ys + (tAbove ? 6 : -6), { bg: theme.down, color: '#fff', align: 'center', baseline: tAbove ? 'top' : 'bottom' });
    if (showFull) {
      let pnl = '';
      if (ie <= lastIdx && ie >= 0) {
        const cur = closed === 'target' ? t.price : closed === 'stop' ? s.price : bars[lastIdx].close;
        const diff = (cur - e.price) * (this.long ? 1 : -1);
        pnl = `${closed ? 'P&L fechado' : 'P&L aberto'}: ${diff >= 0 ? '' : '−'}${Math.abs(diff * qty).toFixed(2)}, `;
      }
      const centerText = `${pnl}Qtd: ${qty < 1 ? qty.toFixed(4) : qty.toFixed(2)}\nRisco/Retorno: ${rr.toFixed(2)}`;
      drawLabel(ctx, centerText, cx, ye, { bg: withAlpha('#4c525e', 0.95), color: '#fff', align: 'center' });
    }
  }
  handles(v: PaneView): Handle[] {
    if (this.points.length < 3) return [];
    const { x1, x2, ye, yt, ys } = this.geo(v);
    return [
      { x: x1, y: ye, cursor: 'move' },
      { x: x1, y: yt, cursor: 'ns-resize' },
      { x: x1, y: ys, cursor: 'ns-resize' },
      { x: x2, y: ye, cursor: 'ew-resize' },
    ];
  }
  moveHandle(index: number, p: Point, v: PaneView): void {
    const [e, t, s] = this.points;
    const dir = this.long ? 1 : -1;
    if (index === 0) {
      // keep target/stop on the correct side
      const width = v.data.timeToIndex(t.time) - v.data.timeToIndex(e.time);
      this.points[0] = { ...p };
      const end = v.data.indexToTime(v.data.timeToIndex(p.time) + width);
      this.points[1] = { time: end, price: dir * (t.price - p.price) > 0 ? t.price : p.price + dir * Math.abs(t.price - e.price) };
      this.points[2] = { time: end, price: dir * (p.price - s.price) > 0 ? s.price : p.price - dir * Math.abs(s.price - e.price) };
    } else if (index === 1) {
      if (dir * (p.price - e.price) > 0) t.price = p.price;
    } else if (index === 2) {
      if (dir * (e.price - p.price) > 0) s.price = p.price;
    } else if (index === 3) {
      if (v.data.timeToIndex(p.time) > v.data.timeToIndex(e.time)) {
        t.time = p.time;
        s.time = p.time;
      }
    }
  }
  distance(v: PaneView, x: number, y: number): number {
    return this.insideFill(v, x, y) ? 0 : Infinity;
  }
  insideFill(v: PaneView, x: number, y: number): boolean {
    if (this.points.length < 3) return false;
    const { x1, x2, yt, ys } = this.geo(v);
    return x >= Math.min(x1, x2) && x <= Math.max(x1, x2) && y >= Math.min(yt, ys) && y <= Math.max(yt, ys);
  }
  axisMarks(): AxisMarks {
    const [e, t, s] = this.points;
    return {
      prices: [
        { price: t.price, color: theme.up },
        { price: e.price, color: '#787b86' },
        { price: s.price, color: theme.down },
      ],
      times: [e.time, t.time],
    };
  }
  toJSON(): ReturnType<Drawing['toJSON']> {
    return super.toJSON();
  }
}

// ---------- volume-based ----------

export class FixedRangeVP extends Drawing {
  readonly type = 'frvp';
  readonly title = 'Perfil de volume de intervalo fixo';
  readonly pointsNeeded = 2;
  protected defaults(): Partial<DrawingOptions> {
    return { rows: 24, widthPct: 40, va: 70, extendPoc: false };
  }
  settings(): SettingField[] {
    return [
      { key: 'rows', label: 'Número de linhas', type: 'number', min: 4, max: 300 },
      { key: 'widthPct', label: 'Largura (%)', type: 'number', min: 5, max: 100 },
      { key: 'va', label: 'Value Area (%)', type: 'number', min: 10, max: 100 },
      { key: 'extendPoc', label: 'Estender POC à direita', type: 'bool' },
    ];
  }
  private range(v: PaneView): [number, number] {
    const a = Math.round(v.data.timeToIndex(this.points[0].time));
    const b = Math.round(v.data.timeToIndex(this.points[1].time));
    return [Math.min(a, b), Math.max(a, b)];
  }
  draw(v: PaneView, s: DrawState): void {
    if (this.points.length < 2) return;
    const ctx = v.ctx;
    const [i0, i1] = this.range(v);
    const vp = computeVolumeProfile(v.bars, i0, i1, Number(this.opts.rows) || 24, (Number(this.opts.va) || 70) / 100);
    const x0 = v.ts.indexToX(i0) - v.ts.barSpacing / 2;
    const x1 = v.ts.indexToX(i1) + v.ts.barSpacing / 2;
    if (!vp) return;
    const top = v.priceToY(vp.rows[vp.rows.length - 1].hi);
    const bottom = v.priceToY(vp.rows[0].lo);
    ctx.fillStyle = withAlpha(theme.accent, s.selected ? 0.08 : 0.04);
    ctx.fillRect(x0, top, x1 - x0, bottom - top);
    applyStroke(ctx, withAlpha(theme.accent, 0.5), 1, 'solid');
    vLine(ctx, v, x0, top, bottom, 1);
    vLine(ctx, v, x1, top, bottom, 1);
    const maxW = ((x1 - x0) * (Number(this.opts.widthPct) || 40)) / 100;
    drawProfile(ctx, vp, (p) => v.priceToY(p), x0, maxW, 1, x0, this.opts.extendPoc ? v.width : x1);
  }
  distance(v: PaneView, x: number, y: number): number {
    if (this.points.length < 2) return Infinity;
    const [i0, i1] = this.range(v);
    const x0 = v.ts.indexToX(i0) - v.ts.barSpacing / 2;
    const x1 = v.ts.indexToX(i1) + v.ts.barSpacing / 2;
    const vp = computeVolumeProfile(v.bars, i0, i1, 4);
    if (!vp) return Infinity;
    const top = v.priceToY(vp.rows[vp.rows.length - 1].hi);
    const bottom = v.priceToY(vp.rows[0].lo);
    return x >= x0 && x <= x1 && y >= top && y <= bottom ? 0 : Infinity;
  }
}

export class AnchoredVwap extends Drawing {
  readonly type = 'avwap';
  readonly title = 'VWAP ancorado';
  readonly pointsNeeded = 1;
  private cache: { key: string; xs: number[]; ys: number[] } | null = null;
  protected defaults(): Partial<DrawingOptions> {
    return { color: '#2962ff', width: 2 };
  }
  private series(v: PaneView): { i: number; val: number }[] {
    const start = Math.max(0, Math.round(v.data.timeToIndex(this.points[0].time)));
    const out: { i: number; val: number }[] = [];
    let pv = 0;
    let vol = 0;
    const end = Math.min(v.bars.length - 1, v.to + 1);
    for (let i = start; i <= end; i++) {
      const b = v.bars[i];
      const tp = (b.high + b.low + b.close) / 3;
      pv += tp * b.volume;
      vol += b.volume;
      if (i >= v.from - 1) out.push({ i, val: vol > 0 ? pv / vol : tp });
    }
    return out;
  }
  draw(v: PaneView): void {
    const s = this.series(v);
    const ctx = v.ctx;
    applyStroke(ctx, this.opts.color, this.opts.width, this.opts.dash);
    ctx.beginPath();
    s.forEach((p, k) => {
      const x = v.ts.indexToX(p.i);
      const y = v.priceToY(p.val);
      if (k) ctx.lineTo(x, y);
      else ctx.moveTo(x, y);
    });
    ctx.stroke();
    this.cache = { key: '', xs: s.map((p) => v.ts.indexToX(p.i)), ys: s.map((p) => v.priceToY(p.val)) };
  }
  handles(v: PaneView): Handle[] {
    const i = Math.round(v.data.timeToIndex(this.points[0].time));
    const b = v.bars[Math.max(0, Math.min(v.bars.length - 1, i))];
    const tp = b ? (b.high + b.low + b.close) / 3 : this.points[0].price;
    return [{ x: v.timeToX(this.points[0].time), y: v.priceToY(tp) }];
  }
  distance(_v: PaneView, x: number, y: number): number {
    const c = this.cache;
    if (!c) return Infinity;
    let best = Infinity;
    for (let k = 0; k < c.xs.length - 1; k++) best = Math.min(best, distToSegment(x, y, c.xs[k], c.ys[k], c.xs[k + 1], c.ys[k + 1]));
    return best;
  }
  axisMarks(): AxisMarks {
    return { prices: [], times: [this.points[0].time] };
  }
}
