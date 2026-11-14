import { font, theme } from '../core/theme';
import type { Point } from '../core/types';
import { uid, withAlpha } from '../core/utils';
import type { PaneView } from '../core/view';

export type LineDash = 'solid' | 'dashed' | 'dotted';

export interface DrawingOptions {
  color: string;
  width: number;
  dash: LineDash;
  fill: string; // rgba
  fillEnabled: boolean;
  extendLeft: boolean;
  extendRight: boolean;
  text: string;
  textColor: string;
  fontSize: number;
  showLabels: boolean;
  showPrice: boolean;
  levels: FibLevel[];
  [key: string]: unknown;
}

export interface FibLevel {
  value: number;
  color: string;
  enabled: boolean;
}

export const FIB_DEFAULTS: FibLevel[] = [
  { value: 0, color: '#787b86', enabled: true },
  { value: 0.236, color: '#f23645', enabled: true },
  { value: 0.382, color: '#ff9800', enabled: true },
  { value: 0.5, color: '#4caf50', enabled: true },
  { value: 0.618, color: '#089981', enabled: true },
  { value: 0.786, color: '#00bcd4', enabled: true },
  { value: 1, color: '#787b86', enabled: true },
  { value: 1.618, color: '#2962ff', enabled: true },
  { value: 2.618, color: '#f23645', enabled: true },
  { value: 3.618, color: '#9c27b0', enabled: true },
  { value: 4.236, color: '#e91e63', enabled: true },
  { value: 1.272, color: '#ff9800', enabled: false },
  { value: 1.414, color: '#f23645', enabled: false },
  { value: 2, color: '#089981', enabled: false },
];

export interface Handle {
  x: number;
  y: number;
  /** css cursor when hovering this handle */
  cursor?: string;
}

export interface HitResult {
  kind: 'handle' | 'body';
  index: number;
  cursor: string;
}

export interface DrawState {
  selected: boolean;
  hovered: boolean;
  creating: boolean;
}

export interface AxisMarks {
  prices: { price: number; color?: string; text?: string; persistent?: boolean }[];
  times: number[];
  priceBand?: [number, number];
  timeBand?: [number, number];
}

export interface SettingField {
  key: string;
  label: string;
  type: 'color' | 'width' | 'dash' | 'bool' | 'text' | 'number' | 'fill' | 'levels';
  min?: number;
  max?: number;
  step?: number;
}

export const HIT_TOLERANCE = 6;
export const HANDLE_RADIUS = 5.5;

export abstract class Drawing {
  id = uid('drw');
  points: Point[] = [];
  opts: DrawingOptions;
  locked = false;
  hidden = false;
  abstract readonly type: string;
  abstract readonly title: string;
  /** clicks needed to create; 0 = freehand drag, -1 = open-ended (finish with dbl-click / Enter) */
  abstract readonly pointsNeeded: number;

  constructor(opts?: Partial<DrawingOptions>) {
    this.opts = { ...defaultOptions(), ...this.defaults(), ...(opts ?? {}) } as DrawingOptions;
  }

  /** per-type default option overrides */
  protected defaults(): Partial<DrawingOptions> {
    return {};
  }

  /** fields shown in the settings dialog */
  settings(): SettingField[] {
    return [
      { key: 'color', label: 'Linha', type: 'color' },
      { key: 'width', label: 'Espessura', type: 'width' },
      { key: 'dash', label: 'Estilo', type: 'dash' },
    ];
  }

  /** Called once after first point is placed (for single-click tools needing extra anchors). */
  init(_v: PaneView): void {}

  /** Called on every creation pointer move with the in-progress points */
  abstract draw(v: PaneView, s: DrawState): void;

  handles(v: PaneView): Handle[] {
    return this.points.map((p) => v.toXY(p));
  }

  /** distance of (x,y) to the drawing body, or Infinity */
  abstract distance(v: PaneView, x: number, y: number): number;

  /** fill hit (e.g. inside rectangle) */
  insideFill(_v: PaneView, _x: number, _y: number): boolean {
    return false;
  }

  hitTest(v: PaneView, x: number, y: number, selected: boolean): HitResult | null {
    if (this.hidden) return null;
    if (selected) {
      const hs = this.handles(v);
      for (let i = hs.length - 1; i >= 0; i--) {
        if (Math.hypot(hs[i].x - x, hs[i].y - y) <= HANDLE_RADIUS + 3) {
          return { kind: 'handle', index: i, cursor: hs[i].cursor ?? 'pointer' };
        }
      }
    }
    if (this.distance(v, x, y) <= HIT_TOLERANCE || this.insideFill(v, x, y)) {
      return { kind: 'body', index: -1, cursor: 'pointer' };
    }
    return null;
  }

  /** Move a handle to a new (snapped) data point. */
  moveHandle(index: number, p: Point, _v: PaneView, _shift: boolean): void {
    if (index < this.points.length) this.points[index] = { ...p };
  }

  /** point being placed during creation (index into points) */
  setCreationPoint(index: number, p: Point, v: PaneView, shift: boolean): void {
    this.moveHandle(index, p, v, shift);
  }

  axisMarks(_v: PaneView): AxisMarks {
    const prices = this.points.map((p) => ({ price: p.price }));
    const times = this.points.map((p) => p.time);
    return { prices, times, ...bands(this.points) };
  }

  clone(): Drawing {
    const d = Object.create(Object.getPrototypeOf(this)) as Drawing;
    Object.assign(d, this);
    d.id = uid('drw');
    d.points = this.points.map((p) => ({ ...p }));
    d.opts = JSON.parse(JSON.stringify(this.opts));
    return d;
  }

  toJSON(): SerializedDrawing {
    return { type: this.type, id: this.id, points: this.points, opts: this.opts, locked: this.locked, hidden: this.hidden };
  }
}

export interface SerializedDrawing {
  type: string;
  id: string;
  points: Point[];
  opts: DrawingOptions;
  locked: boolean;
  hidden: boolean;
}

export function bands(points: Point[]): { priceBand?: [number, number]; timeBand?: [number, number] } {
  if (points.length < 2) return {};
  const ps = points.map((p) => p.price);
  const ts = points.map((p) => p.time);
  return { priceBand: [Math.min(...ps), Math.max(...ps)], timeBand: [Math.min(...ts), Math.max(...ts)] };
}

export function defaultOptions(): DrawingOptions {
  return {
    color: theme.accent,
    width: 2,
    dash: 'solid',
    fill: withAlpha(theme.accent, 0.2),
    fillEnabled: true,
    extendLeft: false,
    extendRight: false,
    text: '',
    textColor: theme.accent,
    fontSize: 14,
    showLabels: true,
    showPrice: true,
    levels: [],
  };
}

// ---------- rendering helpers ----------

export function dashArray(d: LineDash, width: number): number[] {
  if (d === 'dashed') return [Math.max(4, width * 3), Math.max(3, width * 2)];
  if (d === 'dotted') return [Math.max(1, width), Math.max(2, width * 1.6)];
  return [];
}

export function applyStroke(ctx: CanvasRenderingContext2D, color: string, width: number, dash: LineDash = 'solid'): void {
  ctx.strokeStyle = color;
  ctx.lineWidth = width;
  ctx.setLineDash(dashArray(dash, width));
  ctx.lineCap = dash === 'dotted' ? 'round' : 'butt';
  ctx.lineJoin = 'round';
}

/** Extend segment to pane borders in either direction. */
export function extendSegment(
  x1: number, y1: number, x2: number, y2: number, w: number, h: number, extL: boolean, extR: boolean,
): [number, number, number, number] {
  const dx = x2 - x1;
  const dy = y2 - y1;
  if (dx === 0 && dy === 0) return [x1, y1, x2, y2];
  const big = (Math.abs(w) + Math.abs(h) + Math.abs(x1) + Math.abs(x2) + Math.abs(y1) + Math.abs(y2)) * 4 + 10000;
  const len = Math.hypot(dx, dy);
  const ux = dx / len;
  const uy = dy / len;
  let ax = x1;
  let ay = y1;
  let bx = x2;
  let by = y2;
  if (extL) {
    ax = x1 - ux * big;
    ay = y1 - uy * big;
  }
  if (extR) {
    bx = x2 + ux * big;
    by = y2 + uy * big;
  }
  return [ax, ay, bx, by];
}

export function strokeLine(ctx: CanvasRenderingContext2D, x1: number, y1: number, x2: number, y2: number): void {
  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.lineTo(x2, y2);
  ctx.stroke();
}

/** crisp horizontal line at y */
export function hLine(ctx: CanvasRenderingContext2D, v: PaneView, x1: number, x2: number, y: number, width: number): void {
  const yy = snapPx(y, width, v.dpr);
  strokeLine(ctx, x1, yy, x2, yy);
}

export function vLine(ctx: CanvasRenderingContext2D, v: PaneView, x: number, y1: number, y2: number, width: number): void {
  const xx = snapPx(x, width, v.dpr);
  strokeLine(ctx, xx, y1, xx, y2);
}

export function snapPx(v: number, width: number, dpr: number): number {
  const px = Math.round(v * dpr);
  const w = Math.max(1, Math.round(width * dpr));
  return (w % 2 === 1 ? px + 0.5 : px) / dpr;
}

export function drawHandles(ctx: CanvasRenderingContext2D, hs: Handle[], color = theme.accent): void {
  ctx.save();
  ctx.setLineDash([]);
  for (const h of hs) {
    ctx.beginPath();
    ctx.arc(h.x, h.y, HANDLE_RADIUS, 0, Math.PI * 2);
    ctx.fillStyle = theme.handleFill;
    ctx.fill();
    ctx.lineWidth = 1.5;
    ctx.strokeStyle = color;
    ctx.stroke();
  }
  ctx.restore();
}

export function drawArrowHead(ctx: CanvasRenderingContext2D, x1: number, y1: number, x2: number, y2: number, width: number): void {
  const ang = Math.atan2(y2 - y1, x2 - x1);
  const size = 6 + width * 2.5;
  ctx.save();
  ctx.setLineDash([]);
  ctx.beginPath();
  ctx.moveTo(x2 - size * Math.cos(ang - Math.PI / 7), y2 - size * Math.sin(ang - Math.PI / 7));
  ctx.lineTo(x2, y2);
  ctx.lineTo(x2 - size * Math.cos(ang + Math.PI / 7), y2 - size * Math.sin(ang + Math.PI / 7));
  ctx.stroke();
  ctx.restore();
}

export interface LabelOpts {
  bg?: string;
  color?: string;
  size?: number;
  align?: CanvasTextAlign;
  baseline?: CanvasTextBaseline;
  padX?: number;
  padY?: number;
  radius?: number;
  bold?: boolean;
}

/** Text with optional rounded background. Returns box. */
export function drawLabel(
  ctx: CanvasRenderingContext2D, text: string, x: number, y: number, o: LabelOpts = {},
): { x: number; y: number; w: number; h: number } {
  const size = o.size ?? 12;
  ctx.save();
  ctx.font = font(size, o.bold ? '600' : '');
  ctx.setLineDash([]);
  const lines = text.split('\n');
  const padX = o.padX ?? (o.bg ? 8 : 0);
  const padY = o.padY ?? (o.bg ? 5 : 0);
  const lh = Math.round(size * 1.3);
  const tw = Math.max(...lines.map((l) => ctx.measureText(l).width));
  const w = tw + padX * 2;
  const h = lh * lines.length + padY * 2;
  const align = o.align ?? 'left';
  const baseline = o.baseline ?? 'middle';
  let bx = align === 'center' ? x - w / 2 : align === 'right' ? x - w : x;
  let by = baseline === 'middle' ? y - h / 2 : baseline === 'bottom' ? y - h : y;
  bx = Math.round(bx);
  by = Math.round(by);
  if (o.bg) {
    ctx.fillStyle = o.bg;
    roundRect(ctx, bx, by, w, h, o.radius ?? 3);
    ctx.fill();
  }
  ctx.fillStyle = o.color ?? theme.textStrong;
  ctx.textBaseline = 'middle';
  ctx.textAlign = 'center';
  lines.forEach((l, i) => ctx.fillText(l, bx + w / 2, by + padY + lh * i + lh / 2 + 0.5));
  ctx.restore();
  return { x: bx, y: by, w, h };
}

export function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number): void {
  const rr = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + rr, y);
  ctx.arcTo(x + w, y, x + w, y + h, rr);
  ctx.arcTo(x + w, y + h, x, y + h, rr);
  ctx.arcTo(x, y + h, x, y, rr);
  ctx.arcTo(x, y, x + w, y, rr);
  ctx.closePath();
}
