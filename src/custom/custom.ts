import { luminance, shade } from '../shared/color';
import { customFormatDate, customScale, type CustomScale } from './scale';
import {
  customCanMorph,
  customDrawLabel,
  customDrawNode,
  customFlatten,
  customHitTest,
  customLerpNode,
  customWithProps,
  type CustomNode,
  type DrawEnv,
} from './shapes';
import type {
  CustomAxis,
  CustomCoordInfo,
  CustomDragEvent,
  CustomEasing,
  CustomElement,
  CustomEvent,
  CustomEventParams,
  CustomOptions,
  CustomPaint,
  CustomPolarHelpers,
  CustomRenderApi,
  CustomRenderParams,
  CustomSeries,
  CustomStyle,
  CustomTheme,
} from './types';

const FONT = '-apple-system, BlinkMacSystemFont, "Trebuchet MS", Roboto, Ubuntu, sans-serif';

export const customDarkTheme: CustomTheme = {
  background: '#131722',
  text: '#d1d4dc',
  muted: '#787b86',
  grid: 'rgba(42, 46, 57, 0.75)',
  axis: '#363a45',
  tooltipBg: '#1e222d',
  tooltipText: '#d1d4dc',
  tooltipBorder: '#2a2e39',
  font: FONT,
};

export const customLightTheme: CustomTheme = {
  background: '#ffffff',
  text: '#131722',
  muted: '#787b86',
  grid: 'rgba(42, 46, 57, 0.08)',
  axis: '#d1d4dc',
  tooltipBg: '#ffffff',
  tooltipText: '#131722',
  tooltipBorder: '#e0e3eb',
  font: FONT,
};

export const CUSTOM_COLORS = ['#2962ff', '#ff9800', '#089981', '#f23645', '#9c27b0', '#00bcd4', '#e91e63', '#8bc34a', '#ffc107', '#607d8b'];

const esc = (s: string): string => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const clamp = (v: number, a: number, b: number): number => Math.min(b, Math.max(a, v));

const EASE: Record<CustomEasing, (t: number) => number> = {
  linear: (t) => t,
  cubicOut: (t) => 1 - (1 - t) ** 3,
  cubicInOut: (t) => (t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2),
  quadOut: (t) => 1 - (1 - t) * (1 - t),
  backOut: (t) => 1 + 2.70158 * (t - 1) ** 3 + 1.70158 * (t - 1) ** 2,
  elasticOut: (t) => (t === 0 || t === 1 ? t : 2 ** (-10 * t) * Math.sin((t * 10 - 0.75) * ((2 * Math.PI) / 3)) + 1),
};

/** Length in px or '%' of a total. */
function len(v: number | string | undefined, total: number, fallback: number): number {
  if (v === undefined) return fallback;
  if (typeof v === 'number') return v;
  const n = parseFloat(v);
  return v.trim().endsWith('%') ? (n / 100) * total : n;
}

type Dim = number | string;
type Rect = { x: number; y: number; width: number; height: number };

interface Transition {
  start: number;
  duration: number;
  maxDelay: number;
  from: Map<string, CustomNode>;
  leaving: CustomNode[];
}

/**
 * Custom series: every data item is drawn by a `renderItem(params, api)` function that returns shapes
 * (rect, circle, sector, polygon, path, text, group…) on a cartesian, polar or pixel coordinate system.
 * The chart draws them, hit-tests them (tooltip, hover, click, drag), and animates changes: elements with the
 * same id morph into each other (even a circle into a sector), new ones appear and removed ones fade.
 */
export class CustomChart {
  readonly root: HTMLElement;
  readonly canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private titleEl: HTMLElement;
  private bodyEl: HTMLElement;
  private plotEl: HTMLElement;
  private legendEl: HTMLElement;
  private tooltipEl: HTMLElement;
  private resetEl: HTMLButtonElement;
  private opts: CustomOptions;
  private theme!: CustomTheme;
  private width = 0;
  private height = 0;
  private dpr = 1;
  private rect: Rect = { x: 0, y: 0, width: 0, height: 0 };
  private sx: CustomScale | null = null;
  private sy: CustomScale | null = null;
  private sa: CustomScale | null = null;
  private sr: CustomScale | null = null;
  private polarGeo: { cx: number; cy: number; r0: number; r: number; start: number; dir: number } | null = null;
  private view: { x: [number, number] | null; y: [number, number] | null } = { x: null, y: null };
  private hidden = new Set<string>();
  private nodes: CustomNode[] = [];
  private drawn = new Map<string, CustomNode>();
  private drawnList: CustomNode[] = [];
  private leavingKeys = new Set<string>();
  private trans: Transition | null = null;
  private hover: { si: number; di: number; node: CustomNode } | null = null;
  private t0 = performance.now();
  private raf = 0;
  private handlers = new Map<CustomEvent, Set<(v: unknown) => void>>();
  private ro: ResizeObserver;
  private destroyed = false;
  private drag: { kind: 'item'; params: CustomEventParams; x0: number; y0: number; moved: boolean } | { kind: 'pan'; x0: number; y0: number; vx: [number, number] | null; vy: [number, number] | null } | null = null;
  private lastMouse: { x: number; y: number; cx: number; cy: number } | null = null;

  constructor(container: HTMLElement, options: CustomOptions) {
    this.opts = { ...options };
    this.root = container;
    container.classList.add('cu-root');
    this.titleEl = document.createElement('div');
    this.titleEl.className = 'cu-title';
    this.bodyEl = document.createElement('div');
    this.plotEl = document.createElement('div');
    this.plotEl.className = 'cu-plot';
    this.canvas = document.createElement('canvas');
    this.canvas.className = 'cu-canvas';
    this.canvas.setAttribute('role', 'img');
    this.ctx = this.canvas.getContext('2d')!;
    this.tooltipEl = document.createElement('div');
    this.tooltipEl.className = 'cu-tooltip';
    this.resetEl = document.createElement('button');
    this.resetEl.type = 'button';
    this.resetEl.className = 'cu-reset';
    this.resetEl.textContent = 'Repor zoom';
    this.resetEl.addEventListener('click', () => this.resetZoom(true));
    this.legendEl = document.createElement('ul');
    this.plotEl.append(this.canvas, this.tooltipEl, this.resetEl);
    this.bodyEl.append(this.plotEl, this.legendEl);
    container.append(this.titleEl, this.bodyEl);
    this.applyLook();
    this.renderLegend();
    this.bind();
    this.ro = new ResizeObserver(() => this.resize());
    this.ro.observe(this.plotEl);
    this.measure();
    this.rebuild(true);
  }

  // ------------------------------------------------------------------ public API

  /** Change options (series, axes, look…). Elements with the same id morph to their new shape. */
  setOptions(patch: Partial<CustomOptions>, animate = true): void {
    this.opts = { ...this.opts, ...patch };
    if (patch.xAxis || patch.yAxis || patch.coordinateSystem) this.view = { x: null, y: null };
    this.applyLook();
    this.renderLegend();
    this.rebuild(animate);
  }

  /** Replace the data of one series (default the first). */
  setData(data: unknown[], seriesIndex = 0, animate = true): void {
    const series = this.opts.series.slice();
    if (!series[seriesIndex]) return;
    series[seriesIndex] = { ...series[seriesIndex], data };
    this.opts = { ...this.opts, series };
    this.rebuild(animate);
  }

  /** Run renderItem again (e.g. after outside state changed), with or without a transition. */
  refresh(animate = false): void {
    this.rebuild(animate);
  }

  /** Show / hide a series by name. */
  toggle(name: string, hidden?: boolean): void {
    const h = hidden ?? !this.hidden.has(name);
    if (h) this.hidden.add(name);
    else this.hidden.delete(name);
    this.renderLegend();
    this.emit('toggle', { name, hidden: h });
    this.rebuild(true);
  }

  /** Zoom an axis to [min, max] (data values). */
  zoomTo(axis: 'x' | 'y', min: unknown, max: unknown, animate = true): void {
    const s = axis === 'x' ? this.sx : this.sy;
    if (!s) return;
    const a = s.toNumber(min);
    const b = s.toNumber(max);
    if (!Number.isFinite(a) || !Number.isFinite(b) || a === b) return;
    this.view[axis] = [Math.min(a, b), Math.max(a, b)];
    this.rebuild(animate);
    this.emitZoom();
  }

  resetZoom(animate = true): void {
    if (!this.view.x && !this.view.y) return;
    this.view = { x: null, y: null };
    this.rebuild(animate);
    this.emitZoom();
  }

  /** Data → px ([x, y] in cartesian, [angle, radius] in polar). */
  convertToPixel(values: unknown[]): [number, number] {
    return this.coord(values);
  }

  /** px → data ([x, y] or [angle, radius]); categories come back as their names. */
  convertFromPixel(p: [number, number]): [unknown, unknown] {
    const out = (s: CustomScale, n: number): unknown => (s.type === 'category' ? s.categories[clamp(Math.round(n), 0, s.categories.length - 1)] : n);
    if (this.sx && this.sy) return [out(this.sx, this.sx.invert(p[0])), out(this.sy, this.sy.invert(p[1]))];
    if (this.sa && this.sr && this.polarGeo) {
      const g = this.polarGeo;
      const a = Math.atan2(p[1] - g.cy, p[0] - g.cx);
      let t = ((a - g.start) * g.dir) / (Math.PI * 2);
      t = ((t % 1) + 1) % 1;
      return [out(this.sa, this.sa.invert(t)), out(this.sr, this.sr.invert(Math.hypot(p[0] - g.cx, p[1] - g.cy)))];
    }
    return [p[0], p[1]];
  }

  /** The grid (cartesian) or plot rectangle, px. */
  getRect(): Rect {
    return { ...this.rect };
  }

  on(event: 'hover', handler: (p: CustomEventParams | null) => void): () => void;
  on(event: 'click', handler: (p: CustomEventParams) => void): () => void;
  on(event: 'toggle', handler: (e: { name: string; hidden: boolean }) => void): () => void;
  on(event: 'zoom', handler: (e: { x: [number, number] | null; y: [number, number] | null }) => void): () => void;
  on(event: 'dragstart' | 'drag' | 'dragend', handler: (e: CustomDragEvent) => void): () => void;
  on(event: CustomEvent, handler: (v: never) => void): () => void {
    if (!this.handlers.has(event)) this.handlers.set(event, new Set());
    const h = handler as (v: unknown) => void;
    this.handlers.get(event)!.add(h);
    return () => this.handlers.get(event)?.delete(h);
  }

  resize(): void {
    if (this.destroyed) return;
    this.measure();
    this.rebuild(false);
  }

  screenshot(): string {
    this.frame();
    return this.canvas.toDataURL('image/png');
  }

  destroy(): void {
    this.destroyed = true;
    cancelAnimationFrame(this.raf);
    this.ro.disconnect();
    this.root.classList.remove('cu-root');
    this.titleEl.remove();
    this.bodyEl.remove();
  }

  // ------------------------------------------------------------------ look

  private emit(e: CustomEvent, v: unknown): void {
    this.handlers.get(e)?.forEach((h) => h(v));
  }

  private emitZoom(): void {
    this.emit('zoom', { x: this.view.x, y: this.view.y });
  }

  private applyLook(): void {
    const o = this.opts;
    const base = o.theme === 'light' ? customLightTheme : customDarkTheme;
    const t: CustomTheme = { ...base, ...(typeof o.theme === 'object' ? o.theme : {}) };
    if (o.background) t.background = o.background;
    this.theme = t;
    const vars: Record<string, string> = {
      '--cu-bg': t.background,
      '--cu-text': t.text,
      '--cu-muted': t.muted,
      '--cu-tt-bg': t.tooltipBg,
      '--cu-tt-text': t.tooltipText,
      '--cu-tt-border': t.tooltipBorder,
      '--cu-font': t.font,
    };
    for (const [k, v] of Object.entries(vars)) this.root.style.setProperty(k, v);
    const title = typeof o.title === 'string' ? { text: o.title } : o.title;
    this.titleEl.style.display = title ? '' : 'none';
    if (title) {
      this.titleEl.style.textAlign = title.align ?? 'left';
      this.titleEl.innerHTML = `<b>${esc(title.text)}</b>${title.subtext ? `<small>${esc(title.subtext)}</small>` : ''}`;
    }
  }

  private colorOf(si: number): string {
    const s = this.opts.series[si];
    const p = this.opts.colors ?? CUSTOM_COLORS;
    return s?.color ?? p[si % p.length];
  }

  private legendCfg(): { show: boolean; position: string; interactive: boolean } {
    const l = this.opts.legend;
    const o = typeof l === 'object' ? l : {};
    const named = this.opts.series.filter((s) => s.name && s.legend !== false).length;
    return { show: (typeof l === 'boolean' ? l : o.show) ?? named > 1, position: o.position ?? 'top', interactive: o.interactive ?? true };
  }

  private renderLegend(): void {
    const L = this.legendCfg();
    this.bodyEl.className = `cu-body cu-legend-${L.position}`;
    this.legendEl.className = 'cu-legend';
    this.legendEl.style.display = L.show ? '' : 'none';
    if (!L.show) return;
    const seen = new Set<string>();
    this.legendEl.innerHTML = this.opts.series
      .map((s, i) => {
        if (!s.name || s.legend === false || seen.has(s.name)) return '';
        seen.add(s.name);
        const h = this.hidden.has(s.name);
        return `<li class="cu-legend__item${L.interactive ? ' is-interactive' : ''}${h ? ' is-hidden' : ''}" data-name="${esc(s.name)}"><i class="cu-legend__marker" style="--c:${this.colorOf(i)}"></i><span>${esc(s.name)}</span></li>`;
      })
      .join('');
  }

  private measure(): void {
    const r = this.plotEl.getBoundingClientRect();
    this.dpr = window.devicePixelRatio || 1;
    this.width = Math.max(1, Math.floor(r.width));
    this.height = Math.max(1, Math.floor(r.height));
    this.canvas.width = Math.round(this.width * this.dpr);
    this.canvas.height = Math.round(this.height * this.dpr);
    this.canvas.style.width = `${this.width}px`;
    this.canvas.style.height = `${this.height}px`;
  }

  private font(size: number, weight: number | string = 400): string {
    return `${weight} ${size}px ${this.theme.font}`;
  }

  private textWidth(t: string, size = 11, weight: number | string = 400): number {
    this.ctx.font = this.font(size, weight);
    return this.ctx.measureText(t).width;
  }

  // ------------------------------------------------------------------ data access

  private visibleSeries(): number[] {
    return this.opts.series.map((_, i) => i).filter((i) => !(this.opts.series[i].name && this.hidden.has(this.opts.series[i].name!)));
  }

  private valueOf(s: CustomSeries, item: unknown, dim: Dim): unknown {
    if (item === null || item === undefined) return undefined;
    let arr: unknown[] | null = null;
    let obj: Record<string, unknown> | null = null;
    if (Array.isArray(item)) arr = item;
    else if (typeof item === 'object') {
      obj = item as Record<string, unknown>;
      if (Array.isArray(obj.value)) arr = obj.value as unknown[];
    } else if (dim === 0) return item;
    if (typeof dim === 'string') {
      const i = s.dimensions ? s.dimensions.indexOf(dim) : -1;
      if (i >= 0 && arr) return arr[i];
      return obj ? obj[dim] : undefined;
    }
    if (arr) return arr[dim];
    if (obj) {
      if (s.dimensions?.[dim] !== undefined) return obj[s.dimensions[dim]];
      if (dim === 0 && 'value' in obj) return obj.value;
    }
    return undefined;
  }

  private dimsOf(s: CustomSeries, key: 'x' | 'y' | 'angle' | 'radius'): Dim[] {
    const e = s.encode?.[key];
    if (e === undefined) return [key === 'x' || key === 'angle' ? 0 : 1];
    return Array.isArray(e) ? e : [e];
  }

  private axisValues(key: 'x' | 'y' | 'angle' | 'radius'): unknown[] {
    const out: unknown[] = [];
    for (const si of this.visibleSeries()) {
      const s = this.opts.series[si];
      if (s.excludeFromRange) continue;
      const dims = this.dimsOf(s, key);
      for (const item of s.data) for (const d of dims) out.push(this.valueOf(s, item, d));
    }
    return out;
  }

  // ------------------------------------------------------------------ layout

  private layout(): void {
    const W = this.width;
    const H = this.height;
    const cs = this.opts.coordinateSystem ?? 'cartesian';
    const g = this.opts.grid ?? {};
    this.sx = this.sy = this.sa = this.sr = null;
    this.polarGeo = null;
    if (cs === 'cartesian') {
      const xa = this.opts.xAxis ?? {};
      const ya = this.opts.yAxis ?? {};
      const xv = this.axisValues('x');
      const yv = this.axisValues('y');
      // provisional scales to measure the labels
      const py = customScale(ya, yv, [H, 0], this.view.y, ya.splitNumber ?? Math.max(2, Math.round(H / 60)));
      const showY = ya.show ?? true;
      const showX = xa.show ?? true;
      const yLabelW = showY ? Math.max(0, ...py.ticks().map((t) => this.textWidth(t.label))) : 0;
      const yNameMid = showY && ya.name && ya.nameLocation === 'middle';
      const yNameEnd = showY && ya.name && ya.nameLocation !== 'middle';
      const xNameRoom = showX && xa.name ? 18 : 0;
      let xLabelH = showX ? 22 : 0;
      // rotated labels hang to the left of their tick: room for the first one
      let rotLeft = 0;
      if (showX && xa.rotate) {
        const pxs = customScale(xa, xv, [0, W]);
        const ticks = pxs.ticks();
        const lw = Math.max(0, ...ticks.map((t) => this.textWidth(t.label)));
        const rad = (xa.rotate * Math.PI) / 180;
        xLabelH = Math.min(H * 0.4, Math.abs(Math.sin(rad)) * lw + 16);
        if (xa.rotate > 0 && ticks.length) {
          const first = this.textWidth(ticks[0].label) * Math.cos(rad);
          const n = Math.max(1, pxs.categories.length || ticks.length);
          rotLeft = first + 6 - (pxs.type === 'category' ? W / n / 2 : 0);
        }
      }
      const yRoom = showY ? yLabelW + 10 + (yNameMid ? 18 : 0) : 0;
      const left = len(g.left, W, Math.max(rotLeft, ya.opposite ? 14 : yRoom + 6));
      const right = len(g.right, W, ya.opposite ? yRoom + 6 : 16);
      const top = len(g.top, H, (yNameEnd ? 22 : 10) + (xa.opposite ? xLabelH + xNameRoom : 0));
      const bottom = len(g.bottom, H, xa.opposite ? 10 : xLabelH + xNameRoom + 6);
      this.rect = { x: left, y: top, width: Math.max(1, W - left - right), height: Math.max(1, H - top - bottom) };
      const R = this.rect;
      this.sx = customScale(xa, xv, [R.x, R.x + R.width], this.view.x, xa.splitNumber ?? Math.max(2, Math.round(R.width / 90)));
      this.sy = customScale(ya, yv, [R.y + R.height, R.y], this.view.y, ya.splitNumber ?? Math.max(2, Math.round(R.height / 55)));
    } else if (cs === 'polar') {
      const p = this.opts.polar ?? {};
      const cx = len(p.center?.[0] ?? '50%', W, W / 2);
      const cy = len(p.center?.[1] ?? '50%', H, H / 2);
      const half = Math.min(W, H) / 2;
      const rr = Array.isArray(p.radius) ? p.radius : [0, p.radius ?? Math.max(10, half - 30)];
      const r0 = len(rr[0], half, 0);
      const r = len(rr[1], half, half - 30);
      const aa = this.opts.angleAxis ?? {};
      const ra = this.opts.radiusAxis ?? {};
      this.sa = customScale({ ...aa, inverse: false }, this.axisValues('angle'), [0, 1], null, aa.splitNumber ?? 8);
      this.sr = customScale(ra, this.axisValues('radius'), [r0, r], null, ra.splitNumber ?? 4);
      this.polarGeo = { cx, cy, r0, r, start: (-(aa.startAngle ?? 90) * Math.PI) / 180, dir: (aa.clockwise ?? true) !== !!aa.inverse ? 1 : -1 };
      this.rect = { x: cx - r, y: cy - r, width: 2 * r, height: 2 * r };
    } else {
      const left = len(g.left, W, 0);
      const top = len(g.top, H, 0);
      this.rect = { x: left, y: top, width: Math.max(1, W - left - len(g.right, W, 0)), height: Math.max(1, H - top - len(g.bottom, H, 0)) };
    }
  }

  private angleOf(v: unknown): number {
    const g = this.polarGeo!;
    const t = this.sa!.map(v);
    return g.start + g.dir * t * Math.PI * 2;
  }

  private coord(values: unknown[]): [number, number] {
    if (this.sx && this.sy) return [this.sx.map(values[0]), this.sy.map(values[1])];
    if (this.sa && this.sr && this.polarGeo) {
      const a = this.angleOf(values[0]);
      const r = this.sr.map(values[1]);
      return [this.polarGeo.cx + r * Math.cos(a), this.polarGeo.cy + r * Math.sin(a)];
    }
    return [Number(values[0]) || 0, Number(values[1]) || 0];
  }

  private size(span: unknown[], at?: unknown[]): [number, number] {
    const one = (s: CustomScale | null, d: unknown, a: unknown, k: number): number => {
      const n = Number(d) || 0;
      if (!s) return n;
      if (s.type === 'category') return n * s.band() * k;
      const base = a === undefined ? (s.type === 'log' ? s.min : s.min) : s.toNumber(a);
      return Math.abs(s.mapNum(base + n) - s.mapNum(base)) * k;
    };
    if (this.sx && this.sy) return [one(this.sx, span[0], at?.[0], 1), one(this.sy, span[1], at?.[1], 1)];
    if (this.sa && this.sr) {
      const sa = this.sa;
      const da = sa.type === 'category' ? (Number(span[0]) || 0) * (sa.band() || 1 / Math.max(1, sa.max - sa.min)) : Math.abs(sa.mapNum(sa.min + (Number(span[0]) || 0)) - sa.mapNum(sa.min));
      return [da * Math.PI * 2, one(this.sr, span[1], at?.[1], 1)];
    }
    return [Number(span[0]) || 0, Number(span[1]) || 0];
  }

  private coordInfo(): CustomCoordInfo {
    const R = this.rect;
    if (this.polarGeo) {
      const g = this.polarGeo;
      return { type: 'polar', cx: g.cx, cy: g.cy, r0: g.r0, r: g.r, ...R };
    }
    return { type: this.sx ? 'cartesian' : 'none', ...R };
  }

  // ------------------------------------------------------------------ render (renderItem → nodes)

  private time(): number {
    return performance.now() - this.t0;
  }

  private progress(): number {
    if (!this.trans) return 1;
    return clamp((performance.now() - this.trans.start) / (this.trans.duration + this.trans.maxDelay || 1), 0, 1);
  }

  private polarHelpers(): CustomPolarHelpers | null {
    const g = this.polarGeo;
    if (!g || !this.sr) return null;
    const sr = this.sr;
    return {
      cx: g.cx,
      cy: g.cy,
      r0: g.r0,
      r: g.r,
      angle: (v) => this.angleOf(v),
      radius: (v) => sr.map(v),
      point: (a, r) => [g.cx + r * Math.cos(a), g.cy + r * Math.sin(a)],
    };
  }

  private makeApi(s: CustomSeries, si: number, cur: { i: number }): CustomRenderApi {
    const color = this.colorOf(si);
    const scaleOf = (axis: 'x' | 'y' | 'angle' | 'radius'): CustomScale | null => (axis === 'x' ? this.sx : axis === 'y' ? this.sy : axis === 'angle' ? this.sa : this.sr);
    const ctx = this.ctx;
    return {
      value: (dim, idx) => this.valueOf(s, s.data[idx ?? cur.i], dim),
      coord: (v) => this.coord(v),
      size: (span, at) => this.size(span, at),
      style: (extra) => ({ fill: color, ...(extra ?? {}) }),
      visual: () => color,
      barLayout: ({ count, gap = 0.2, categoryGap = 0.3 }) => {
        const cat = this.sx?.type === 'category' ? this.sx : this.sy?.type === 'category' ? this.sy : this.sx;
        const band = cat ? cat.band() || this.rect.width / 10 : 20;
        const usable = band * (1 - categoryGap);
        const w = usable / (count + (count - 1) * gap);
        return Array.from({ length: count }, (_, i) => ({ width: w, offset: -usable / 2 + w / 2 + i * w * (1 + gap) }));
      },
      scale: (axis, v) => {
        if (axis === 'angle' && this.polarGeo) return this.angleOf(v);
        return scaleOf(axis)?.map(v) ?? NaN;
      },
      categories: (axis) => scaleOf(axis)?.categories.slice() ?? [],
      rect: { ...this.rect },
      width: this.width,
      height: this.height,
      polar: this.polarHelpers(),
      ctx,
      progress: this.progress(),
      time: this.time(),
      theme: this.theme,
      view: { x: this.view.x, y: this.view.y },
      measureText: (t, fs = 12, fw = 400) => this.textWidth(t, fs, fw),
    };
  }

  private render(): CustomNode[] {
    const out: CustomNode[] = [];
    const series = this.opts.series;
    const order = this.visibleSeries().sort((a, b) => (series[a].z ?? 0) - (series[b].z ?? 0) || a - b);
    const coordSys = this.coordInfo();
    const time = this.time();
    const cs = this.opts.coordinateSystem ?? 'cartesian';
    for (const si of order) {
      const s = series[si];
      const cur = { i: 0 };
      const api = this.makeApi(s, si, cur);
      const clip = (s.clip ?? cs === 'cartesian') ? { ...this.rect } : null;
      const nodes: CustomNode[] = [];
      for (let i = 0; i < s.data.length; i++) {
        cur.i = i;
        const params: CustomRenderParams = {
          seriesIndex: si,
          seriesName: s.name ?? '',
          dataIndex: i,
          dataCount: s.data.length,
          data: s.data[i],
          color: this.colorOf(si),
          coordSys,
          time,
          hoverIndex: this.hover && this.hover.si === si ? this.hover.di : -1,
        };
        let el: CustomElement | null | undefined | false = null;
        try {
          el = s.renderItem(params, api);
        } catch (e) {
          console.error('[custom] renderItem failed', e);
        }
        customFlatten(el, { si, di: i, out: nodes, clip });
      }
      nodes.forEach((n, k) => (n.order = k));
      nodes.sort((a, b) => a.z - b.z || a.order - b.order);
      out.push(...nodes);
    }
    // graphic overlay (px, not hit)
    const gr = this.opts.graphic;
    if (gr) {
      const els = typeof gr === 'function' ? gr({ width: this.width, height: this.height, rect: { ...this.rect }, theme: this.theme, time, ctx: this.ctx }) : gr;
      const list = (Array.isArray(els) ? els : els ? [els] : []) as CustomElement[];
      const nodes: CustomNode[] = [];
      list.forEach((el, k) => customFlatten(el, { si: -1, di: k, out: nodes, clip: null }));
      for (const n of nodes) n.silent = true;
      out.push(...nodes);
    }
    return out;
  }

  private animCfg(): { duration: number; ease: (t: number) => number; delay?: (di: number, si: number) => number } {
    const a = this.opts.animation ?? true;
    if (a === false) return { duration: 0, ease: EASE.cubicOut };
    const o = typeof a === 'object' ? a : {};
    return { duration: o.duration ?? 700, ease: EASE[o.easing ?? 'cubicOut'] ?? EASE.cubicOut, delay: o.delay };
  }

  private rebuild(animate: boolean): void {
    if (this.destroyed) return;
    this.layout();
    this.resetEl.classList.toggle('is-visible', !!(this.view.x || this.view.y));
    const nodes = this.render();
    const cfg = this.animCfg();
    if (animate && cfg.duration > 0) {
      const keys = new Set(nodes.map((n) => n.key));
      const leaving: CustomNode[] = [];
      for (const [k, n] of this.drawn) if (!keys.has(k)) leaving.push(n);
      let maxDelay = 0;
      if (cfg.delay) for (const n of nodes) if (n.si >= 0) maxDelay = Math.max(maxDelay, cfg.delay(n.di, n.si) || 0);
      this.trans = { start: performance.now(), duration: cfg.duration, maxDelay, from: new Map(this.drawn), leaving };
    } else this.trans = null;
    this.nodes = nodes;
    if (this.hover && !nodes.some((n) => n.si === this.hover!.si && n.di === this.hover!.di)) this.hover = null;
    this.frame();
  }

  // ------------------------------------------------------------------ frame

  private schedule(): void {
    cancelAnimationFrame(this.raf);
    if (this.destroyed) return;
    this.raf = requestAnimationFrame(() => this.frame());
  }

  private frame(): void {
    if (this.destroyed) return;
    const live = !!this.opts.live;
    if (live) this.nodes = this.render();
    const states: CustomNode[] = [];
    this.leavingKeys.clear();
    const tr = this.trans;
    let running = false;
    if (tr) {
      const cfg = this.animCfg();
      const el = performance.now() - tr.start;
      const pAll = cfg.ease(clamp(el / tr.duration, 0, 1));
      const done = el >= tr.duration + tr.maxDelay;
      // leaving first (under the new ones)
      for (const n of tr.leaving) {
        if (done) continue;
        const target = customWithProps(n, n.leaveTo, { opacity: 0 });
        const st = customLerpNode(n, target, pAll);
        if (st.opacity > 0.003) {
          states.push(st);
          this.leavingKeys.add(st.key);
        }
      }
      for (const n of this.nodes) {
        if (done) {
          states.push(n);
          continue;
        }
        const d = cfg.delay && n.si >= 0 ? cfg.delay(n.di, n.si) || 0 : 0;
        const p = cfg.ease(clamp((el - d) / tr.duration, 0, 1));
        let from = tr.from.get(n.key);
        if (from && !customCanMorph(from, n)) {
          if (p < 1) {
            const st = { ...customLerpNode(from, customWithProps(from, from.leaveTo, { opacity: 0 }), p), key: `${from.key}\u0001old` };
            states.push(st);
            this.leavingKeys.add(st.key);
          }
          from = undefined;
        }
        const start = from ?? customWithProps(n, n.enterFrom, { opacity: 0 });
        states.push(p >= 1 ? n : customLerpNode(start, n, p));
      }
      if (done) this.trans = null;
      else running = true;
    } else states.push(...this.nodes);
    this.drawnList = states;
    this.drawn = new Map();
    for (const s of states) if (!this.leavingKeys.has(s.key)) this.drawn.set(s.key, s);
    // keep leaving nodes so a new transition continues their fade
    for (const s of states) if (this.leavingKeys.has(s.key) && !this.drawn.has(s.key)) this.drawn.set(s.key, s);
    this.draw();
    if (running || live) this.schedule();
  }

  // ------------------------------------------------------------------ drawing

  private draw(): void {
    const ctx = this.ctx;
    const t = this.theme;
    const d = this.dpr;
    ctx.setTransform(d, 0, 0, d, 0, 0);
    ctx.clearRect(0, 0, this.width, this.height);
    if (t.background !== 'transparent') {
      ctx.fillStyle = t.background;
      ctx.fillRect(0, 0, this.width, this.height);
    }
    if (this.sx && this.sy) this.drawCartesianGrid();
    if (this.polarGeo) this.drawPolarGrid();
    const env: DrawEnv = { dpr: d, family: t.font, text: t.text, onImage: () => this.frame() };
    const hover = this.hover;
    const series = this.opts.series;
    const hs = hover ? series[hover.si] : null;
    const focus = hs && !hs.emphasis?.disabled ? (hs.emphasis?.focus ?? 'none') : 'none';
    let clipKey = '';
    ctx.save();
    const setClip = (c: CustomNode['clip']): void => {
      const k = c ? `${c.x},${c.y},${c.width},${c.height}` : '';
      if (k === clipKey) return;
      ctx.restore();
      ctx.save();
      clipKey = k;
      if (c) {
        ctx.setTransform(d, 0, 0, d, 0, 0);
        ctx.beginPath();
        ctx.rect(c.x, c.y, c.width, c.height);
        ctx.clip();
      }
    };
    const labels: CustomNode[] = [];
    for (const n of this.drawnList) {
      setClip(n.clip);
      const isHover = !!hover && n.si === hover.si && n.di === hover.di && !this.leavingKeys.has(n.key) && (hs?.emphasis?.scope !== 'element' || n.key === hover.node.key);
      let node = n;
      if (focus !== 'none' && hover && n.si >= 0 && !isHover && (focus === 'self' || n.si !== hover.si)) node = { ...n, opacity: n.opacity * 0.22 };
      const style = isHover && !hs?.emphasis?.disabled ? this.emphasisStyle(n) : n.style;
      customDrawNode(ctx, node, env, style);
      if (n.label) labels.push(node);
    }
    ctx.restore();
    ctx.save();
    for (const n of labels) {
      if (n.clip) {
        ctx.restore();
        ctx.save();
        ctx.setTransform(d, 0, 0, d, 0, 0);
        ctx.beginPath();
        ctx.rect(n.clip.x, n.clip.y, n.clip.width, n.clip.height);
        ctx.clip();
      }
      customDrawLabel(ctx, n, env, (f) => this.readable(f));
    }
    ctx.restore();
    if (this.sx && this.sy) this.drawCartesianAxes();
    if (this.polarGeo) this.drawPolarLabels();
  }

  private readable(f: CustomPaint | undefined): string {
    if (typeof f !== 'string' || f === 'none' || f === 'transparent') return this.theme.text;
    return luminance(f) > 0.45 ? '#131722' : '#ffffff';
  }

  private emphasisStyle(n: CustomNode): CustomStyle {
    const se = this.opts.series[n.si]?.emphasis?.style;
    if (n.emphasis || se) return { ...n.style, ...(se ?? {}), ...(n.emphasis ?? {}) };
    const s = { ...n.style };
    if (typeof s.fill === 'string' && s.fill !== 'none' && s.fill !== 'transparent') s.fill = shade(s.fill, luminance(s.fill) > 0.6 ? -0.08 : 0.1);
    else if (typeof s.stroke === 'string' && s.stroke !== 'none') s.lineWidth = (s.lineWidth ?? 1) + 1;
    return s;
  }

  // ------------------------------------------------------------------ axes

  private axisLabelInterval(s: CustomScale, ax: CustomAxis, horizontal: boolean): number {
    if (ax.labelInterval !== undefined) return ax.labelInterval + 1;
    if (s.type !== 'category') return 1;
    const band = s.band() || 1;
    if (!horizontal) return Math.max(1, Math.ceil(16 / band));
    const rot = Math.abs(ax.rotate ?? 0);
    const w = rot > 30 ? 16 : Math.max(0, ...s.categories.map((c) => this.textWidth(c))) + 10;
    return Math.max(1, Math.ceil(w / band));
  }

  private drawCartesianGrid(): void {
    const ctx = this.ctx;
    const R = this.rect;
    const t = this.theme;
    const xa = this.opts.xAxis ?? {};
    const ya = this.opts.yAxis ?? {};
    const sx = this.sx!;
    const sy = this.sy!;
    ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
    const lines = (s: CustomScale, ax: CustomAxis, vertical: boolean): void => {
      const show = ax.show ?? true;
      const ticks = s.ticks();
      const isCat = s.type === 'category';
      // category: lines between the bands
      const pos = isCat ? Array.from({ length: s.categories.length + 1 }, (_, i) => s.mapNum(i - 0.5)) : ticks.map((k) => s.mapNum(k.value));
      if (ax.splitArea) {
        ctx.fillStyle = t.grid;
        for (let i = 0; i < pos.length - 1; i += 2) {
          const a = pos[i];
          const b = pos[i + 1];
          ctx.globalAlpha = 0.35;
          if (vertical) ctx.fillRect(Math.min(a, b), R.y, Math.abs(b - a), R.height);
          else ctx.fillRect(R.x, Math.min(a, b), R.width, Math.abs(b - a));
        }
        ctx.globalAlpha = 1;
      }
      const split = ax.splitLine ?? (show && !vertical && !isCat);
      if (!split) return;
      ctx.strokeStyle = t.grid;
      ctx.lineWidth = 1;
      ctx.beginPath();
      for (const p of pos) {
        if (vertical) {
          if (p < R.x - 0.5 || p > R.x + R.width + 0.5) continue;
          const x = Math.round(p) + 0.5;
          ctx.moveTo(x, R.y);
          ctx.lineTo(x, R.y + R.height);
        } else {
          if (p < R.y - 0.5 || p > R.y + R.height + 0.5) continue;
          const y = Math.round(p) + 0.5;
          ctx.moveTo(R.x, y);
          ctx.lineTo(R.x + R.width, y);
        }
      }
      ctx.stroke();
    };
    lines(sx, xa, true);
    lines(sy, ya, false);
  }

  private drawCartesianAxes(): void {
    const ctx = this.ctx;
    const R = this.rect;
    const t = this.theme;
    const xa = this.opts.xAxis ?? {};
    const ya = this.opts.yAxis ?? {};
    const sx = this.sx!;
    const sy = this.sy!;
    ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
    ctx.font = this.font(11);
    // x
    if (xa.show ?? true) {
      const top = !!xa.opposite;
      const y = top ? R.y : R.y + R.height;
      if (xa.axisLine ?? true) {
        ctx.strokeStyle = t.axis;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(R.x, Math.round(y) + 0.5);
        ctx.lineTo(R.x + R.width, Math.round(y) + 0.5);
        ctx.stroke();
      }
      const every = this.axisLabelInterval(sx, xa, true);
      const ticks = sx.ticks();
      let lastEnd = -Infinity;
      ctx.fillStyle = xa.color ?? t.muted;
      ticks.forEach((k, i) => {
        if (i % every) return;
        const x = sx.mapNum(k.value);
        if (x < R.x - 1 || x > R.x + R.width + 1) return;
        if (xa.axisTick) {
          ctx.strokeStyle = t.axis;
          ctx.beginPath();
          ctx.moveTo(Math.round(x) + 0.5, y);
          ctx.lineTo(Math.round(x) + 0.5, y + (top ? -4 : 4));
          ctx.stroke();
        }
        if (xa.rotate) {
          ctx.save();
          ctx.translate(x, y + (top ? -6 : 6));
          ctx.rotate((-xa.rotate * Math.PI) / 180);
          ctx.textAlign = xa.rotate > 0 ? 'right' : 'left';
          ctx.textBaseline = 'middle';
          ctx.fillText(k.label, 0, 0);
          ctx.restore();
          return;
        }
        const w = ctx.measureText(k.label).width;
        let lx = x;
        // keep the end labels inside the canvas
        lx = clamp(lx, w / 2 + 2, this.width - w / 2 - 2);
        if (sx.type !== 'category' && lx - w / 2 < lastEnd + 6) return;
        lastEnd = lx + w / 2;
        ctx.textAlign = 'center';
        ctx.textBaseline = top ? 'bottom' : 'top';
        ctx.fillStyle = k.major && sx.type === 'time' ? t.text : (xa.color ?? t.muted);
        ctx.fillText(k.label, lx, y + (top ? -6 : 6));
      });
      if (xa.name) {
        ctx.fillStyle = t.muted;
        ctx.font = this.font(11, 600);
        const mid = xa.nameLocation === 'middle';
        ctx.textAlign = mid ? 'center' : 'right';
        ctx.textBaseline = top ? 'bottom' : 'bottom';
        const ny = top ? R.y - 26 : this.height - 4;
        ctx.fillText(xa.name, mid ? R.x + R.width / 2 : R.x + R.width, ny);
        ctx.font = this.font(11);
      }
    }
    // y
    if (ya.show ?? true) {
      const right = !!ya.opposite;
      const x = right ? R.x + R.width : R.x;
      if (ya.axisLine ?? sy.type === 'category') {
        ctx.strokeStyle = t.axis;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(Math.round(x) + 0.5, R.y);
        ctx.lineTo(Math.round(x) + 0.5, R.y + R.height);
        ctx.stroke();
      }
      const every = this.axisLabelInterval(sy, ya, false);
      ctx.textAlign = right ? 'left' : 'right';
      ctx.textBaseline = 'middle';
      ctx.fillStyle = ya.color ?? t.muted;
      let last = Infinity;
      sy.ticks().forEach((k, i) => {
        if (i % every) return;
        const y = sy.mapNum(k.value);
        if (y < R.y - 1 || y > R.y + R.height + 1) return;
        if (Math.abs(y - last) < 13) return;
        last = y;
        if (ya.axisTick) {
          ctx.strokeStyle = t.axis;
          ctx.beginPath();
          ctx.moveTo(x, Math.round(y) + 0.5);
          ctx.lineTo(x + (right ? 4 : -4), Math.round(y) + 0.5);
          ctx.stroke();
        }
        ctx.fillText(k.label, x + (right ? 8 : -8), clamp(y, 7, this.height - 7));
      });
      if (ya.name) {
        ctx.fillStyle = t.muted;
        ctx.font = this.font(11, 600);
        if (ya.nameLocation === 'middle') {
          ctx.save();
          ctx.translate(right ? this.width - 6 : 8, R.y + R.height / 2);
          ctx.rotate(-Math.PI / 2);
          ctx.textAlign = 'center';
          ctx.textBaseline = 'top';
          ctx.fillText(ya.name, 0, 0);
          ctx.restore();
        } else {
          ctx.textAlign = right ? 'right' : 'left';
          ctx.textBaseline = 'bottom';
          ctx.fillText(ya.name, right ? this.width - 6 : 6, R.y - 8);
        }
      }
    }
  }

  private drawPolarGrid(): void {
    const ctx = this.ctx;
    const g = this.polarGeo!;
    const t = this.theme;
    const sa = this.sa!;
    const sr = this.sr!;
    const aa = this.opts.angleAxis ?? {};
    const ra = this.opts.radiusAxis ?? {};
    ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
    ctx.strokeStyle = t.grid;
    ctx.lineWidth = 1;
    if (ra.splitLine ?? (ra.show ?? true)) {
      const rs = sr.type === 'category' ? Array.from({ length: sr.categories.length + 1 }, (_, i) => sr.mapNum(i - 0.5)) : sr.ticks().map((k) => sr.mapNum(k.value));
      ctx.beginPath();
      for (const r of rs) {
        if (r <= 0.5) continue;
        ctx.moveTo(g.cx + r, g.cy);
        ctx.arc(g.cx, g.cy, r, 0, Math.PI * 2);
      }
      ctx.stroke();
    }
    if (aa.splitLine ?? (aa.show ?? true)) {
      const as = sa.type === 'category' ? Array.from({ length: sa.categories.length }, (_, i) => i - 0.5) : sa.ticks().map((k) => k.value);
      ctx.beginPath();
      for (const v of as) {
        const a = g.start + g.dir * sa.mapNum(v) * Math.PI * 2;
        ctx.moveTo(g.cx + g.r0 * Math.cos(a), g.cy + g.r0 * Math.sin(a));
        ctx.lineTo(g.cx + g.r * Math.cos(a), g.cy + g.r * Math.sin(a));
      }
      ctx.stroke();
    }
    if (aa.axisLine ?? (aa.show ?? true)) {
      ctx.strokeStyle = t.axis;
      ctx.beginPath();
      ctx.arc(g.cx, g.cy, g.r, 0, Math.PI * 2);
      ctx.stroke();
    }
  }

  private drawPolarLabels(): void {
    const ctx = this.ctx;
    const g = this.polarGeo!;
    const t = this.theme;
    const sa = this.sa!;
    const sr = this.sr!;
    const aa = this.opts.angleAxis ?? {};
    const ra = this.opts.radiusAxis ?? {};
    ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
    ctx.font = this.font(11);
    if (aa.show ?? true) {
      ctx.fillStyle = aa.color ?? t.muted;
      const ticks = sa.ticks().filter((k) => sa.type === 'category' || k.value < sa.max - 1e-9 || sa.mapNum(k.value) < 0.999);
      const every = sa.type === 'category' ? Math.max(1, Math.ceil(ticks.length / Math.max(4, (g.r * Math.PI * 2) / 46))) : 1;
      ticks.forEach((k, i) => {
        if (i % every) return;
        const a = g.start + g.dir * sa.mapNum(k.value) * Math.PI * 2;
        const x = g.cx + (g.r + 8) * Math.cos(a);
        const y = g.cy + (g.r + 8) * Math.sin(a);
        const c = Math.cos(a);
        const s = Math.sin(a);
        ctx.textAlign = Math.abs(c) < 0.3 ? 'center' : c > 0 ? 'left' : 'right';
        ctx.textBaseline = Math.abs(s) < 0.3 ? 'middle' : s > 0 ? 'top' : 'bottom';
        ctx.fillText(k.label, x, y);
      });
    }
    if (ra.show ?? true) {
      ctx.fillStyle = ra.color ?? t.muted;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      const a = g.start;
      const every = sr.type === 'category' ? Math.max(1, Math.ceil(16 / (sr.band() || 16))) : 1;
      sr.ticks().forEach((k, i) => {
        if (i % every) return;
        const r = sr.mapNum(k.value);
        if (r < 4 && sr.type !== 'category') return;
        const x = g.cx + r * Math.cos(a);
        const y = g.cy + r * Math.sin(a);
        ctx.strokeStyle = t.background === 'transparent' ? 'rgba(0,0,0,0.4)' : t.background;
        ctx.lineWidth = 3;
        ctx.strokeText(k.label, x + 2, y);
        ctx.fillText(k.label, x + 2, y);
      });
    }
  }

  // ------------------------------------------------------------------ interaction

  private hitTest(x: number, y: number): CustomNode | null {
    const measure = (txt: string, f: string): number => {
      this.ctx.font = f;
      return this.ctx.measureText(txt).width;
    };
    for (let i = this.drawnList.length - 1; i >= 0; i--) {
      const n = this.drawnList[i];
      if (n.si < 0 || n.silent || this.leavingKeys.has(n.key)) continue;
      if (this.opts.series[n.si]?.silent) continue;
      if (customHitTest(n, x, y, 3, measure, this.theme.font)) return n;
    }
    return null;
  }

  private params(n: CustomNode, x: number, y: number): CustomEventParams {
    const s = this.opts.series[n.si];
    const item = s.data[n.di];
    let value: unknown[];
    if (Array.isArray(item)) value = item;
    else if (item && typeof item === 'object' && Array.isArray((item as { value?: unknown }).value)) value = (item as { value: unknown[] }).value;
    else if (item && typeof item === 'object' && s.dimensions) value = s.dimensions.map((d) => (item as Record<string, unknown>)[d]);
    else value = [item];
    const nameDim = s.encode?.itemName;
    const nm = nameDim !== undefined ? this.valueOf(s, item, nameDim) : item && typeof item === 'object' && !Array.isArray(item) ? (item as { name?: unknown }).name : undefined;
    return { seriesIndex: n.si, seriesName: s.name ?? '', dataIndex: n.di, data: item, value, name: nm === undefined ? undefined : String(nm), color: this.colorOf(n.si), info: n.info, x, y };
  }

  private local(e: MouseEvent): { x: number; y: number } {
    const r = this.canvas.getBoundingClientRect();
    return { x: e.clientX - r.left, y: e.clientY - r.top };
  }

  private zoomAxes(): ('x' | 'y')[] {
    const z = this.opts.zoom;
    if (!z || !this.sx) return [];
    const a = typeof z === 'object' ? (z.axis ?? 'x') : 'x';
    return a === 'xy' ? ['x', 'y'] : [a];
  }

  private bind(): void {
    const c = this.canvas;
    c.addEventListener('pointermove', (e) => {
      const { x, y } = this.local(e);
      this.lastMouse = { x, y, cx: e.clientX, cy: e.clientY };
      if (this.drag) {
        this.onDragMove(x, y);
        return;
      }
      this.updateHover(x, y, e);
    });
    c.addEventListener('pointerleave', () => {
      if (this.drag) return;
      this.lastMouse = null;
      this.setHover(null);
      this.tooltipEl.classList.remove('is-visible');
    });
    c.addEventListener('pointerdown', (e) => {
      if (e.button !== 0) return;
      const { x, y } = this.local(e);
      const h = this.hitTest(x, y);
      if (h && h.draggable) {
        const p = this.params(h, x, y);
        this.drag = { kind: 'item', params: p, x0: x, y0: y, moved: false };
        c.setPointerCapture(e.pointerId);
        c.style.cursor = 'grabbing';
        this.tooltipEl.classList.remove('is-visible');
        this.emit('dragstart', { ...p, dx: 0, dy: 0, at: this.convertFromPixel([x, y]) });
        return;
      }
      const R = this.rect;
      if (this.zoomAxes().length && (this.view.x || this.view.y) && x >= R.x && x <= R.x + R.width && y >= R.y && y <= R.y + R.height) {
        this.drag = { kind: 'pan', x0: x, y0: y, vx: this.view.x, vy: this.view.y };
        c.setPointerCapture(e.pointerId);
        c.style.cursor = 'grabbing';
      }
    });
    const end = (e: PointerEvent): void => {
      const d = this.drag;
      if (!d) return;
      this.drag = null;
      if (c.hasPointerCapture(e.pointerId)) c.releasePointerCapture(e.pointerId);
      c.style.cursor = '';
      const { x, y } = this.local(e);
      if (d.kind === 'item') this.emit('dragend', { ...d.params, dx: x - d.x0, dy: y - d.y0, at: this.convertFromPixel([x, y]) });
      else this.emitZoom();
    };
    c.addEventListener('pointerup', end);
    c.addEventListener('pointercancel', end);
    c.addEventListener('click', (e) => {
      const { x, y } = this.local(e);
      const h = this.hitTest(x, y);
      if (h) this.emit('click', this.params(h, x, y));
    });
    c.addEventListener(
      'wheel',
      (e) => {
        const axes = this.zoomAxes();
        if (!axes.length) return;
        const { x, y } = this.local(e);
        const R = this.rect;
        if (x < R.x || x > R.x + R.width || y < R.y || y > R.y + R.height) return;
        e.preventDefault();
        const k = Math.exp(e.deltaY * 0.0015);
        for (const ax of axes) {
          const s = ax === 'x' ? this.sx! : this.sy!;
          const full = s.fullMax - s.fullMin;
          const [a, b] = this.view[ax] ?? [s.fullMin, s.fullMax];
          const at = s.invert(ax === 'x' ? x : y);
          const zc = this.opts.zoom;
          const minSpan = (typeof zc === 'object' && zc.minSpan) || (s.type === 'category' ? 1 : full / 1000);
          const span = Math.min(full, Math.max(minSpan, (b - a) * k));
          const ratio = (at - a) / (b - a || 1);
          let v0 = at - span * ratio;
          v0 = clamp(v0, s.fullMin, s.fullMax - span);
          this.view[ax] = span >= full - 1e-9 ? null : [v0, v0 + span];
        }
        this.tooltipEl.classList.remove('is-visible');
        this.rebuild(false);
        this.emitZoom();
      },
      { passive: false },
    );
    c.addEventListener('dblclick', () => {
      if (this.zoomAxes().length) this.resetZoom(true);
    });
    this.legendEl.addEventListener('click', (e) => {
      const li = (e.target as HTMLElement).closest<HTMLElement>('.cu-legend__item');
      if (!li || !this.legendCfg().interactive) return;
      this.toggle(li.dataset.name!);
    });
  }

  private onDragMove(x: number, y: number): void {
    const d = this.drag!;
    if (d.kind === 'item') {
      d.moved = true;
      this.emit('drag', { ...d.params, dx: x - d.x0, dy: y - d.y0, at: this.convertFromPixel([x, y]) });
      return;
    }
    for (const ax of this.zoomAxes()) {
      const v = ax === 'x' ? d.vx : d.vy;
      const s = ax === 'x' ? this.sx! : this.sy!;
      if (!v) continue;
      const px = ax === 'x' ? x - d.x0 : y - d.y0;
      const range = s.range[1] - s.range[0];
      const dv = (-px / (range || 1)) * (v[1] - v[0]);
      const span = v[1] - v[0];
      const v0 = clamp(v[0] + dv, s.fullMin, s.fullMax - span);
      this.view[ax] = [v0, v0 + span];
    }
    this.rebuild(false);
  }

  private setHover(n: CustomNode | null): void {
    const prev = this.hover;
    const same = (!prev && !n) || (prev && n && prev.si === n.si && prev.di === n.di);
    this.hover = n ? { si: n.si, di: n.di, node: n } : null;
    if (same) {
      if (prev && n && prev.node.key !== n.key && this.opts.series[n.si]?.emphasis?.scope === 'element') this.draw();
      return;
    }
    this.emit('hover', n && this.lastMouse ? this.params(n, this.lastMouse.x, this.lastMouse.y) : null);
    // renderItem may use params.hoverIndex: render again, no transition
    if (!this.trans && !this.opts.live) {
      this.nodes = this.render();
      this.frame();
    } else if (!this.opts.live) this.draw();
  }

  private updateHover(x: number, y: number, e: PointerEvent): void {
    const h = this.hitTest(x, y);
    this.setHover(h);
    const R = this.rect;
    const inPlot = x >= R.x && x <= R.x + R.width && y >= R.y && y <= R.y + R.height;
    this.canvas.style.cursor = h ? (h.cursor ?? (h.draggable ? 'grab' : 'pointer')) : this.zoomAxes().length && (this.view.x || this.view.y) && inPlot ? 'grab' : '';
    this.showTooltip(h, e);
  }

  private fmtValue(v: unknown, s: CustomScale | null): string {
    if (v === null || v === undefined) return '–';
    if (typeof v === 'number') {
      if (s?.type === 'time') return customFormatDate(v);
      return this.opts.valueFormatter ? this.opts.valueFormatter(v) : v.toLocaleString('pt-PT', { maximumFractionDigits: 4 });
    }
    if (v instanceof Date) return customFormatDate(v.getTime());
    return String(v);
  }

  private tooltipHtml(p: CustomEventParams): string {
    const s = this.opts.series[p.seriesIndex];
    const dims: Dim[] = s.encode?.tooltip ?? (s.dimensions ? s.dimensions.map((_, i) => i) : p.value.map((_, i) => i).slice(0, 8));
    const axisOfDim = (d: Dim): CustomScale | null => {
      for (const [k, sc] of [
        ['x', this.sx],
        ['y', this.sy],
        ['angle', this.sa],
        ['radius', this.sr],
      ] as const)
        if (sc && this.dimsOf(s, k).includes(d)) return sc;
      return null;
    };
    const head = p.name ?? s.name ?? '';
    const rows = dims
      .map((d) => {
        const v = this.valueOf(s, p.data, d);
        if (v === undefined) return '';
        const name = typeof d === 'string' ? d : (s.dimensions?.[d] ?? `Valor ${d + 1}`);
        if (typeof v === 'object' && !(v instanceof Date)) return '';
        return `<div class="cu-tooltip__row"><span>${esc(name)}</span><b>${esc(this.fmtValue(v, axisOfDim(d)))}</b></div>`;
      })
      .join('');
    return (
      (p.name && s.name ? `<div class="cu-tooltip__sub">${esc(s.name)}</div>` : '') +
      (head ? `<div class="cu-tooltip__head"><i class="cu-tooltip__dot" style="background:${p.color}"></i>${esc(head)}</div>` : '') +
      rows
    );
  }

  private showTooltip(h: CustomNode | null, e: PointerEvent): void {
    const tt = this.opts.tooltip ?? true;
    const el = this.tooltipEl;
    const s = h ? this.opts.series[h.si] : null;
    if (!h || !s || tt === false || (typeof tt === 'object' && tt.show === false) || s.tooltip === false) {
      el.classList.remove('is-visible');
      return;
    }
    const { x, y } = this.local(e);
    const p = this.params(h, x, y);
    const html = typeof s.tooltip === 'function' ? s.tooltip(p) : typeof tt === 'object' && tt.formatter ? tt.formatter(p) : this.tooltipHtml(p);
    if (!html) {
      el.classList.remove('is-visible');
      return;
    }
    el.innerHTML = html;
    el.classList.add('is-visible');
    const w = el.offsetWidth;
    const hh = el.offsetHeight;
    const left = x + 14 + w > this.width ? x - 14 - w : x + 14;
    const top = clamp(y + 14 + hh > this.height ? y - 14 - hh : y + 14, 0, Math.max(0, this.height - hh));
    el.style.transform = `translate(${Math.max(0, left)}px, ${top}px)`;
  }
}

export function createCustomChart(container: HTMLElement, options: CustomOptions): CustomChart {
  return new CustomChart(container, options);
}
